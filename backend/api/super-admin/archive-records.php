<?php
/**
 * Read-only access to archived records for the Super Admin.
 *
 *   GET ?entity=cycle|ledger|support&id=N            one archived record + related data
 *   GET ?entity=...&q=&status=&from=&to=             filtered archived records (JSON)
 *   GET ...&format=csv                               same filtered records as CSV
 *   &purpose=pdf|csv                                 records the export in the audit log
 *
 * Archive/restore actions stay in archives.php; nothing here mutates records.
 * Financial values come from stored ledger snapshots (agreed_total, fee_rate,
 * fee_amount) and invoice snapshots — never recalculated from current settings.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../helpers/export.php';
require_once __DIR__ . '/../../helpers/support_records.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$admin = require_super_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed.', 405);
$pdo = Database::connect();

$entity = strtolower(trim((string) ($_GET['entity'] ?? '')));
if (!in_array($entity, ['cycle', 'ledger', 'support'], true)) json_error('Choose an archive type: cycle, ledger, or support.', 422, ['entity' => 'Invalid archive type.']);
$format = strtolower(trim((string) ($_GET['format'] ?? 'json')));
if (!in_array($format, ['json', 'csv'], true)) json_error('Unsupported export format.', 422, ['format' => 'Use json or csv.']);
$purpose = strtolower(trim((string) ($_GET['purpose'] ?? 'view')));
if (!in_array($purpose, ['view', 'pdf', 'csv'], true)) $purpose = 'view';

$idParam = trim((string) ($_GET['id'] ?? ''));
$id = null;
if ($idParam !== '') {
    if (!preg_match('/^[1-9][0-9]{0,9}$/', $idParam)) json_error('Invalid record id.', 422, ['id' => 'Use a positive whole number.']);
    $id = (int) $idParam;
}

// ---------------------------------------------------------------- mappers
function archive_ref(string $prefix, $id): string { return sprintf('%s-%06d', $prefix, (int) $id); }
function ar_money($value): float { return round((float) $value, 2); }

function map_cycle(array $row): array
{
    $fees = ar_money($row['total_fees']);
    return [
        'id' => (int) $row['id'],
        'reference' => 'FC-' . (int) $row['id'],
        'cycle_start' => $row['cycle_start'],
        'cycle_end' => $row['cycle_end'],
        'due_date' => $row['due_date'],
        'status' => $row['status'],
        'paid_at' => $row['paid_at'],
        'payment_note' => $row['payment_note'],
        'entry_count' => (int) $row['entry_count'],
        'voided_count' => (int) $row['voided_count'],
        'total_agreed' => ar_money($row['total_agreed']),
        'total_fees' => $fees,
        'outstanding' => $row['status'] === 'PAID' ? 0.0 : $fees,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'archived_at' => $row['archived_at'],
        'archived_by' => $row['archived_by'],
    ];
}

function map_ledger(array $row): array
{
    $snapshot = json_decode((string) ($row['invoice_snapshot'] ?? ''), true);
    $fee = is_array($snapshot) ? ($snapshot['platform_fee'] ?? null) : null;
    return [
        'id' => (int) $row['id'],
        'reference' => archive_ref('FEE', $row['id']),
        'booking_reference' => $row['reference_code'],
        'client_name' => $row['name'],
        'service' => $row['shoot_type'],
        'invoice_number' => $row['invoice_number'],
        'invoice_type' => $row['invoice_type'],
        'agreed_total' => ar_money($row['agreed_total']),
        'fee_rate' => (float) $row['fee_rate'],
        'fee_amount' => ar_money($row['fee_amount']),
        'fee_charged_to_client' => is_array($fee) && array_key_exists('charged_to_client', $fee) ? (bool) $fee['charged_to_client'] : null,
        'fee_responsibility' => is_array($fee) ? ($fee['responsibility'] ?? null) : null,
        'cycle_id' => (int) $row['cycle_id'],
        'cycle_reference' => 'FC-' . (int) $row['cycle_id'],
        'cycle_start' => $row['cycle_start'],
        'cycle_end' => $row['cycle_end'],
        'cycle_status' => $row['cycle_status'],
        'cycle_paid_at' => $row['cycle_paid_at'],
        'status' => $row['voided_at'] ? 'VOIDED' : $row['cycle_status'],
        'accrued_at' => $row['accrued_at'],
        'voided_at' => $row['voided_at'],
        'updated_at' => $row['updated_at'],
        'archived_at' => $row['archived_at'],
        'archived_by' => $row['archived_by'],
    ];
}

// --------------------------------------------------------------- queries
$cycleSelect = "SELECT fc.*, ad.username archived_by,
        COALESCE(SUM(CASE WHEN pfl.voided_at IS NULL THEN pfl.fee_amount ELSE 0 END),0) total_fees,
        COALESCE(SUM(CASE WHEN pfl.voided_at IS NULL THEN pfl.agreed_total ELSE 0 END),0) total_agreed,
        COUNT(pfl.id) entry_count,
        COALESCE(SUM(CASE WHEN pfl.voided_at IS NOT NULL THEN 1 ELSE 0 END),0) voided_count
    FROM fee_cycles fc
    LEFT JOIN platform_fee_ledger pfl ON pfl.cycle_id = fc.id
    LEFT JOIN admins ad ON ad.id = fc.archived_by_admin_id";
$ledgerSelect = "SELECT pfl.*, b.reference_code, b.name, b.shoot_type, i.invoice_number, i.invoice_type, i.snapshot invoice_snapshot,
        fc.cycle_start, fc.cycle_end, fc.status cycle_status, fc.paid_at cycle_paid_at, ad.username archived_by
    FROM platform_fee_ledger pfl
    JOIN bookings b ON b.id = pfl.booking_id
    JOIN invoices i ON i.id = pfl.invoice_id
    JOIN fee_cycles fc ON fc.id = pfl.cycle_id
    LEFT JOIN admins ad ON ad.id = pfl.archived_by_admin_id";
$supportSelect = SUPPORT_RECORD_SELECT;

// ----------------------------------------------------------- single record
if ($id !== null) {
    if ($entity === 'cycle') {
        $stmt = $pdo->prepare("$cycleSelect WHERE fc.id = :id AND fc.archived_at IS NOT NULL GROUP BY fc.id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) json_error('Archived billing cycle not found.', 404);
        $record = map_cycle($row);
        $entries = $pdo->prepare("$ledgerSelect WHERE pfl.cycle_id = :id ORDER BY pfl.accrued_at, pfl.id");
        $entries->execute(['id' => $id]);
        $related = ['ledger' => array_map('map_ledger', $entries->fetchAll(PDO::FETCH_ASSOC))];
    } elseif ($entity === 'ledger') {
        $stmt = $pdo->prepare("$ledgerSelect WHERE pfl.id = :id AND pfl.archived_at IS NOT NULL");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) json_error('Archived fee record not found.', 404);
        $record = map_ledger($row);
        $related = [];
    } else {
        $stmt = $pdo->prepare("$supportSelect WHERE r.id = :id AND r.archived_at IS NOT NULL");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) json_error('Archived support report not found.', 404);
        $record = map_support_record($row);
        $related = ['history' => support_history($pdo, $id)];
    }
    if ($purpose === 'pdf') record_admin_audit($pdo, (int) $admin['id'], 'ARCHIVE_RECORD_EXPORTED', null, ['entity' => $entity, 'id' => $id, 'format' => 'pdf']);
    json_success(['entity' => $entity, 'archived' => true, 'record' => $record, 'related' => $related, 'generated_at' => date('Y-m-d H:i:s')]);
}

// ---------------------------------------------------------- filtered list
[$from, $to] = export_date_range();
$q = export_search_param();
$where = [];
$params = [];

if ($entity === 'cycle') {
    $status = export_enum_param('status', ['OPEN', 'DUE', 'PAID'], 'billing-cycle status');
    $where[] = 'fc.archived_at IS NOT NULL';
    if ($status) { $where[] = 'fc.status = :status'; $params['status'] = $status; }
    if ($q !== '') { $where[] = "(CONCAT('FC-', fc.id) LIKE :q1 OR fc.payment_note LIKE :q2 OR CAST(fc.cycle_start AS CHAR) LIKE :q3 OR CAST(fc.cycle_end AS CHAR) LIKE :q4)"; foreach (['q1', 'q2', 'q3', 'q4'] as $k) $params[$k] = export_like($q); }
    if ($from) { $where[] = 'fc.archived_at >= :from'; $params['from'] = $from . ' 00:00:00'; }
    if ($to) { $where[] = 'fc.archived_at <= :to'; $params['to'] = $to . ' 23:59:59'; }
    $sql = "$cycleSelect WHERE " . implode(' AND ', $where) . ' GROUP BY fc.id ORDER BY fc.archived_at DESC, fc.id DESC LIMIT ' . (EXPORT_MAX_ROWS + 1);
    $mapper = 'map_cycle';
} elseif ($entity === 'ledger') {
    $status = export_enum_param('status', ['OPEN', 'DUE', 'PAID', 'VOIDED'], 'fee-record status');
    $where[] = 'pfl.archived_at IS NOT NULL';
    if ($status === 'VOIDED') $where[] = 'pfl.voided_at IS NOT NULL';
    elseif ($status) { $where[] = 'pfl.voided_at IS NULL AND fc.status = :status'; $params['status'] = $status; }
    if ($q !== '') { $where[] = '(b.reference_code LIKE :q1 OR b.name LIKE :q2 OR i.invoice_number LIKE :q3 OR b.shoot_type LIKE :q4)'; foreach (['q1', 'q2', 'q3', 'q4'] as $k) $params[$k] = export_like($q); }
    if ($from) { $where[] = 'pfl.archived_at >= :from'; $params['from'] = $from . ' 00:00:00'; }
    if ($to) { $where[] = 'pfl.archived_at <= :to'; $params['to'] = $to . ' 23:59:59'; }
    $sql = "$ledgerSelect WHERE " . implode(' AND ', $where) . ' ORDER BY pfl.archived_at DESC, pfl.id DESC LIMIT ' . (EXPORT_MAX_ROWS + 1);
    $mapper = 'map_ledger';
} else {
    $status = export_enum_param('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], 'support status');
    $where[] = 'r.archived_at IS NOT NULL';
    if ($status) { $where[] = 'r.status = :status'; $params['status'] = $status; }
    if ($q !== '') { $where[] = '(r.subject LIKE :q1 OR r.description LIKE :q2 OR r.category LIKE :q3 OR a.username LIKE :q4)'; foreach (['q1', 'q2', 'q3', 'q4'] as $k) $params[$k] = export_like($q); }
    if ($from) { $where[] = 'r.archived_at >= :from'; $params['from'] = $from . ' 00:00:00'; }
    if ($to) { $where[] = 'r.archived_at <= :to'; $params['to'] = $to . ' 23:59:59'; }
    $sql = "$supportSelect WHERE " . implode(' AND ', $where) . ' ORDER BY r.archived_at DESC, r.id DESC LIMIT ' . (EXPORT_MAX_ROWS + 1);
    $mapper = 'map_support_record';
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$truncated = count($rows) > EXPORT_MAX_ROWS;
$records = array_map($mapper, array_slice($rows, 0, EXPORT_MAX_ROWS));

$totals = [];
if ($entity === 'cycle') {
    $totals = ['total_agreed' => ar_money(array_sum(array_column($records, 'total_agreed'))), 'total_fees' => ar_money(array_sum(array_column($records, 'total_fees'))), 'outstanding' => ar_money(array_sum(array_column($records, 'outstanding')))];
} elseif ($entity === 'ledger') {
    $active = array_filter($records, static fn ($r) => $r['voided_at'] === null);
    $totals = ['agreed_total' => ar_money(array_sum(array_column($active, 'agreed_total'))), 'fee_amount' => ar_money(array_sum(array_column($active, 'fee_amount'))), 'voided_excluded' => count($records) - count($active)];
}

$categoryTotals = $pdo->query(
    "SELECT (SELECT COUNT(*) FROM fee_cycles WHERE archived_at IS NOT NULL) cycle,
            (SELECT COUNT(*) FROM platform_fee_ledger WHERE archived_at IS NOT NULL) ledger,
            (SELECT COUNT(*) FROM support_reports WHERE archived_at IS NOT NULL) support"
)->fetch(PDO::FETCH_ASSOC);
$filters = ['q' => $q, 'status' => $status ?? null, 'from' => $from, 'to' => $to];

if ($format === 'csv' || $purpose === 'pdf') {
    record_admin_audit($pdo, (int) $admin['id'], 'ARCHIVE_EXPORTED', null, ['entity' => $entity, 'format' => $format === 'csv' ? 'csv' : 'pdf', 'count' => count($records), 'filters' => $filters]);
}

if ($format === 'csv') {
    $stamp = date('Y-m-d');
    if ($entity === 'cycle') {
        stream_csv(export_safe_filename("archived-billing-cycles-$stamp", 'csv'),
            ['Reference', 'Cycle start', 'Cycle end', 'Due date', 'Status', 'Paid on', 'Ledger entries', 'Voided entries', 'Agreed totals (PHP)', 'Platform fees (PHP)', 'Outstanding (PHP)', 'Payment note', 'Archived at', 'Archived by'],
            array_map(static fn ($r) => [$r['reference'], $r['cycle_start'], $r['cycle_end'], $r['due_date'], $r['status'], $r['paid_at'], $r['entry_count'], $r['voided_count'], $r['total_agreed'], $r['total_fees'], $r['outstanding'], $r['payment_note'], $r['archived_at'], $r['archived_by']], $records));
    }
    if ($entity === 'ledger') {
        stream_csv(export_safe_filename("archived-fee-ledger-$stamp", 'csv'),
            ['Reference', 'Booking', 'Client', 'Service', 'Invoice', 'Agreed total (PHP)', 'Fee rate', 'Platform fee (PHP)', 'Fee charged to client', 'Billing cycle', 'Status', 'Accrued at', 'Voided at', 'Archived at', 'Archived by'],
            array_map(static fn ($r) => [$r['reference'], $r['booking_reference'], $r['client_name'], $r['service'], $r['invoice_number'], $r['agreed_total'], $r['fee_rate'], $r['fee_amount'], $r['fee_charged_to_client'] === null ? '' : ($r['fee_charged_to_client'] ? 'Yes' : 'No'), $r['cycle_reference'], $r['status'], $r['accrued_at'], $r['voided_at'], $r['archived_at'], $r['archived_by']], $records));
    }
    stream_csv(export_safe_filename("archived-support-reports-$stamp", 'csv'),
        ['Reference', 'Subject', 'Category', 'Priority', 'Status', 'Submitted by', 'Created at', 'Resolved at', 'Archived at', 'Description', 'Super Admin response'],
        array_map(static fn ($r) => [$r['reference'], $r['subject'], $r['category'], $r['priority'], $r['status'], $r['submitted_by_username'], $r['created_at'], $r['resolved_at'], $r['archived_at'], $r['description'], $r['super_admin_reply']], $records));
}

json_success([
    'entity' => $entity,
    'filters' => $filters,
    'count' => count($records),
    'truncated' => $truncated,
    'limit' => EXPORT_MAX_ROWS,
    'total_in_category' => (int) $categoryTotals[$entity],
    'category_totals' => array_map('intval', $categoryTotals),
    'records' => $records,
    'totals' => $totals,
    'generated_at' => date('Y-m-d H:i:s'),
]);
