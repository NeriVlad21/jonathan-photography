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

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

require_admin();
$id = (int) ($_GET['id'] ?? 0);
if (!$id) json_error('Missing booking id.', 422);

$pdo = Database::connect();

$stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id');
$stmt->execute(['id' => $id]);
$booking = $stmt->fetch();
if (!$booking) json_error('Booking not found.', 404);

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
$agreedTotal = (float) ($booking['agreed_details']['total'] ?? 0);
$booking['total_paid'] = round(array_sum(array_map(fn($payment)=>(float)$payment['amount'], $booking['payments'])), 2);
$booking['balance_due'] = max(0, round($agreedTotal - $booking['total_paid'], 2));
$booking['platform_fee'] = $agreedTotal > 0 ? platform_fee_values($pdo, $agreedTotal) : null;
$ledgerStmt = $pdo->prepare('SELECT id, fee_rate, fee_amount, accrued_at, voided_at FROM platform_fee_ledger WHERE booking_id=:id');
$ledgerStmt->execute(['id'=>$id]);
$booking['platform_fee_record'] = $ledgerStmt->fetch(PDO::FETCH_ASSOC) ?: null;

json_success($booking);
