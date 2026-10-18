<?php
/**
 * Read-only support-report details and exports.
 *
 *   GET ?id=N        one report with its status history.
 *                    Super Admin: any report. Owner: only reports they submitted.
 *   GET (no id)      filtered reports for the Super Admin (JSON or &format=csv):
 *                    q, status, priority, category, from, to (created date),
 *                    context=active|archived|all (default active).
 *   &purpose=pdf     records the export in the admin audit log.
 *
 * Status changes, replies, and archiving remain in reports.php / archives.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../helpers/export.php';
require_once __DIR__ . '/../../helpers/support_records.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$admin = require_admin();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed.', 405);
$pdo = Database::connect();
$isSuper = $admin['role'] === 'SUPER_ADMIN';
$purpose = strtolower(trim((string) ($_GET['purpose'] ?? 'view')));
if (!in_array($purpose, ['view', 'pdf', 'csv'], true)) $purpose = 'view';

// ------------------------------------------------------------- one report
$idParam = trim((string) ($_GET['id'] ?? ''));
if ($idParam !== '') {
    if (!preg_match('/^[1-9][0-9]{0,9}$/', $idParam)) json_error('Invalid report id.', 422, ['id' => 'Use a positive whole number.']);
    $id = (int) $idParam;
    $sql = SUPPORT_RECORD_SELECT . ' WHERE r.id = :id';
    $params = ['id' => $id];
    if (!$isSuper) { $sql .= ' AND r.submitted_by_admin_id = :owner'; $params['owner'] = (int) $admin['id']; }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) json_error('Support report not found.', 404);
    if ($purpose === 'pdf') {
        if (!$isSuper) json_error('You do not have permission to perform this action.', 403);
        record_admin_audit($pdo, (int) $admin['id'], 'SUPPORT_REPORT_EXPORTED', null, ['report_id' => $id, 'format' => 'pdf']);
    }
    json_success([
        'record' => map_support_record($row),
        'archived' => $row['archived_at'] !== null,
        'history' => support_history($pdo, $id),
        'generated_at' => date('Y-m-d H:i:s'),
    ]);
}

// ------------------------------------------------- filtered list / export
if (!$isSuper) json_error('You do not have permission to perform this action.', 403);
$format = strtolower(trim((string) ($_GET['format'] ?? 'json')));
if (!in_array($format, ['json', 'csv'], true)) json_error('Unsupported export format.', 422, ['format' => 'Use json or csv.']);
$context = strtolower(trim((string) ($_GET['context'] ?? 'active')));
if (!in_array($context, ['active', 'archived', 'all'], true)) json_error('Unknown report context.', 422, ['context' => 'Use active, archived, or all.']);
$status = export_enum_param('status', ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], 'support status');
$priority = export_enum_param('priority', ['NORMAL', 'URGENT'], 'priority');
$category = export_enum_param('category', ['TECHNICAL', 'BILLING', 'ACCOUNT', 'OTHER'], 'category');
[$from, $to] = export_date_range();
$q = export_search_param();

$where = [];
$params = [];
if ($context === 'active') $where[] = 'r.archived_at IS NULL';
if ($context === 'archived') $where[] = 'r.archived_at IS NOT NULL';
if ($status) { $where[] = 'r.status = :status'; $params['status'] = $status; }
if ($priority) { $where[] = 'r.priority = :priority'; $params['priority'] = $priority; }
if ($category) { $where[] = 'r.category = :category'; $params['category'] = $category; }
if ($q !== '') {
    $where[] = "(r.subject LIKE :q1 OR r.description LIKE :q2 OR r.category LIKE :q3 OR a.username LIKE :q4 OR CONCAT('SR-', LPAD(r.id, 6, '0')) LIKE :q5)";
    foreach (['q1', 'q2', 'q3', 'q4', 'q5'] as $key) $params[$key] = export_like($q);
}
if ($from) { $where[] = 'r.created_at >= :from'; $params['from'] = $from . ' 00:00:00'; }
if ($to) { $where[] = 'r.created_at <= :to'; $params['to'] = $to . ' 23:59:59'; }

$sql = SUPPORT_RECORD_SELECT . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
    . " ORDER BY (r.archived_at IS NOT NULL), FIELD(r.status, 'OPEN','IN_PROGRESS','RESOLVED','CLOSED'), FIELD(r.priority, 'URGENT','NORMAL'), r.created_at DESC"
    . ' LIMIT ' . (EXPORT_MAX_ROWS + 1);
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$truncated = count($rows) > EXPORT_MAX_ROWS;
$records = array_map('map_support_record', array_slice($rows, 0, EXPORT_MAX_ROWS));
$filters = ['q' => $q, 'status' => $status, 'priority' => $priority, 'category' => $category, 'from' => $from, 'to' => $to, 'context' => $context];

if ($format === 'csv' || $purpose === 'pdf') {
    record_admin_audit($pdo, (int) $admin['id'], 'SUPPORT_REPORTS_EXPORTED', null, ['format' => $format === 'csv' ? 'csv' : 'pdf', 'count' => count($records), 'filters' => $filters]);
}

if ($format === 'csv') {
    stream_csv(export_safe_filename('support-reports-' . $context . '-' . date('Y-m-d'), 'csv'),
        ['Reference', 'Subject', 'Category', 'Priority', 'Status', 'Archived', 'Submitted by', 'Created at', 'Updated at', 'Resolved at', 'Archived at', 'Description', 'Super Admin response'],
        array_map(static fn ($r) => [$r['reference'], $r['subject'], $r['category'], $r['priority'], $r['status'], $r['archived_at'] ? 'Yes' : 'No', $r['submitted_by_username'], $r['created_at'], $r['updated_at'], $r['resolved_at'], $r['archived_at'], $r['description'], $r['super_admin_reply']], $records));
}

json_success([
    'filters' => $filters,
    'count' => count($records),
    'truncated' => $truncated,
    'limit' => EXPORT_MAX_ROWS,
    'records' => $records,
    'generated_at' => date('Y-m-d H:i:s'),
]);
