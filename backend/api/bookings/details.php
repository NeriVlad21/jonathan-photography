<?php
/**
 * GET /api/bookings/details.php?id=1
 * Admin only. Full booking record including add-on line items.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/oversight.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

$admin = require_admin();
$id = (int) ($_GET['id'] ?? 0);
if (!$id) json_error('Missing booking id.', 422);

$pdo = Database::connect();

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id');
$stmt->execute(['id' => $id]);
$booking = $stmt->fetch();
if (!$booking) json_error('Booking not found.', 404);

if (($admin['role'] ?? '') === 'SUPER_ADMIN') {
    $revealContact = filter_var($_GET['reveal_contact'] ?? false, FILTER_VALIDATE_BOOLEAN);
    log_superadmin_access($pdo, $admin, $revealContact ? 'CONTACT_REVEAL' : 'BOOKING', (string) $id, $revealContact ? 'REVEAL' : 'VIEW');
    if (!$revealContact) {
        $booking['email'] = mask_email_address((string) ($booking['email'] ?? ''));
        $booking['phone'] = mask_phone_number((string) ($booking['phone'] ?? ''));
        if (!empty($booking['facebook'])) $booking['facebook'] = 'Hidden until revealed';
        $booking['contact_masked'] = true;
    } else {
        $booking['contact_masked'] = false;
    }
}
$booking['flags'] = open_flags_for($pdo, 'BOOKING', $id);

$addons = $pdo->prepare('SELECT label, price FROM booking_addons WHERE booking_id = :id');
$addons->execute(['id' => $id]);
$booking['addons'] = $addons->fetchAll();

if ($booking['estimate_breakdown']) {
    $booking['estimate_breakdown'] = json_decode($booking['estimate_breakdown'], true);
}
if ($booking['confirmed_details']) {
    $booking['confirmed_details'] = json_decode($booking['confirmed_details'], true);
}
if ($booking['agreed_details']) {
    $booking['agreed_details'] = json_decode($booking['agreed_details'], true);
}

require_once __DIR__ . '/../../helpers/billing.php';
$booking['payments'] = booking_payments($pdo, $id);
$invoiceStmt = $pdo->prepare('SELECT id, invoice_type, invoice_number, revision_of_id, snapshot, sent_at, voided_at, created_at FROM invoices WHERE booking_id=:id ORDER BY created_at DESC, id DESC');
$invoiceStmt->execute(['id'=>$id]);
$booking['invoices'] = array_map(static function(array $invoice): array {
    $invoice['snapshot'] = json_decode((string)$invoice['snapshot'], true);
    return $invoice;
}, $invoiceStmt->fetchAll(PDO::FETCH_ASSOC));
$booking['total_paid'] = round(array_sum(array_map(fn($payment)=>(float)$payment['amount'], $booking['payments'])), 2);
$booking['financials'] = null;
$booking['balance_due'] = 0;
$booking['platform_fee'] = null;
if (is_array($booking['agreed_details'] ?? null)) {
    $money = booking_balance($pdo, $booking['agreed_details'], $id);
    $booking['financials'] = $money;
    $booking['balance_due'] = $money['balance_due'];
    $booking['platform_fee'] = ['rate' => $money['fee_rate'], 'amount' => $money['fee_amount'], 'responsibility' => $money['fee_responsibility'], 'settings' => billing_settings($pdo)];
} else {
    // Settings let the agreed-details form preview the fee before the first save.
    $booking['platform_fee'] = ['rate' => null, 'amount' => null, 'responsibility' => null, 'settings' => billing_settings($pdo)];
}
$ledgerStmt = $pdo->prepare('SELECT id, fee_rate, fee_amount, accrued_at, voided_at FROM platform_fee_ledger WHERE booking_id=:id');
$ledgerStmt->execute(['id'=>$id]);
$booking['platform_fee_record'] = $ledgerStmt->fetch(PDO::FETCH_ASSOC) ?: null;

json_success($booking);
