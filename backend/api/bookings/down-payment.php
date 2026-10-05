<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed.', 405);
require_admin();
require_csrf();
$input = json_input();
$v = new Validator($input);
$v->required('id')->positiveInteger('id', 'booking id')->required('amount')->required('date')->date('date', false)
  ->string('note', 'Note')->maxLength('note', 500);
if ($v->fails()) json_error('Please correct the down payment details.', 422, $v->errors());
$id = positive_integer_input($input['id'] ?? null);
$amount = money_input($input['amount'] ?? null);
if ($amount === null || $amount <= 0) json_error('Down payment amount must be greater than zero.', 422);

$pdo = Database::connect();
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$booking) { $pdo->rollBack(); json_error('Booking not found.', 404); }
    if ($booking['status'] !== 'CONFIRMED' || empty($booking['confirmed_details'])) {
        $pdo->rollBack(); json_error('Confirm the booking and save its final details before recording a down payment.', 409);
    }
    if ($booking['down_payment_received_at']) { $pdo->rollBack(); json_error('A down payment is already recorded for this booking.', 409); }
    $details = json_decode((string) $booking['confirmed_details'], true, 512, JSON_THROW_ON_ERROR);
    $total = (float) ($details['total'] ?? 0);
    if ($amount > $total) { $pdo->rollBack(); json_error('Down payment cannot exceed the final agreed price.', 422); }

    $pdo->prepare('UPDATE bookings SET down_payment_amount = :amount, down_payment_received_at = :received, down_payment_note = :note WHERE id = :id')
        ->execute(['amount' => $amount, 'received' => $input['date'], 'note' => clean_string($input['note'] ?? ''), 'id' => $id]);
    $pdo->commit();
    $booking['confirmed_details'] = $details;
    $booking['down_payment_amount'] = $amount;
    $booking['down_payment_received_at'] = $input['date'];
    $booking['down_payment_note'] = clean_string($input['note'] ?? '');
    $sent = send_booking_invoice($booking);
    if ($sent) {
        $pdo->prepare('UPDATE bookings SET invoice_sent_at = COALESCE(invoice_sent_at, NOW()) WHERE id = :id')->execute(['id' => $id]);
    }
    json_success([
        'down_payment_amount' => $amount,
        'down_payment_received_at' => $input['date'],
        'invoice_sent' => $sent,
        'message' => $sent ? 'Down payment recorded and invoice sent.' : 'Down payment recorded, but the invoice email could not be sent. You can resend it later.'
    ]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    log_server_error('BOOKING_DOWN_PAYMENT', $e);
    json_error('Unable to record the down payment.', 500);
}
