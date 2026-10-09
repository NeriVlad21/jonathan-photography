<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/billing.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.', 405);
require_admin(); require_csrf();
$input = json_input();
$v = new Validator($input);
$v->required('id')->positiveInteger('id', 'booking id')->required('total')->required('date')->date('date', false)
  ->string('coverage', 'Coverage')->maxLength('coverage', 160)->string('location', 'Location')->maxLength('location', 200)
  ->string('notes', 'Notes')->maxLength('notes', 2000);
if ($v->fails()) json_error('Please correct the agreed booking details.', 422, $v->errors());
$id = positive_integer_input($input['id'] ?? null);
$total = money_input($input['total'] ?? null);
$hours = $input['hours'] ?? null;
if ($total === null || $total <= 0) json_error('Agreed price must be greater than zero.', 422);
if ($hours !== null && $hours !== '' && (!is_numeric($hours) || (float) $hours <= 0 || (float) $hours > 24)) json_error('Coverage hours must be between 0 and 24.', 422);
$addonsInput = $input['addons'] ?? [];
if (!is_array($addonsInput) || count($addonsInput) > 50) json_error('Add-ons must be a valid list.', 422);
$addons = [];
foreach ($addonsInput as $index => $addon) {
    if (!is_array($addon)) json_error('Each add-on must be valid.', 422);
    $label = clean_string($addon['label'] ?? '');
    $amount = money_input($addon['amount'] ?? 0);
    $quantity = positive_integer_input($addon['quantity'] ?? 1);
    if ($label === '' || mb_strlen($label) > 120 || $amount === null || $quantity < 1 || $quantity > 99) json_error('Please correct add-on ' . ($index + 1) . '.', 422);
    $addons[] = ['label' => $label, 'amount' => $amount, 'quantity' => $quantity];
}
$details = ['total' => $total, 'coverage' => clean_string($input['coverage'] ?? ''), 'hours' => $hours === null || $hours === '' ? null : round((float) $hours, 2), 'addons' => $addons, 'date' => (string) $input['date'], 'location' => clean_string($input['location'] ?? ''), 'notes' => clean_string($input['notes'] ?? '')];

$pdo = Database::connect();
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id=:id FOR UPDATE'); $stmt->execute(['id'=>$id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$booking) { $pdo->rollBack(); json_error('Booking not found.', 404); }
    if ($booking['status'] === 'CANCELLED') { $pdo->rollBack(); json_error('Cancelled bookings cannot be edited.', 409); }
    $paymentSummary = $pdo->prepare("SELECT COALESCE(SUM(amount),0) paid, MAX(payment_type='FINAL_PAYMENT') has_final FROM booking_payments WHERE booking_id=:id");
    $paymentSummary->execute(['id'=>$id]);
    $paymentState = $paymentSummary->fetch(PDO::FETCH_ASSOC);
    $paid = (float) ($paymentState['paid'] ?? 0);
    if ($total < $paid) { $pdo->rollBack(); json_error('Agreed total cannot be lower than payments already received.', 422); }
    if (!empty($paymentState['has_final']) && abs($total - $paid) > 0.009) { $pdo->rollBack(); json_error('The final payment is already recorded. The agreed total must continue to match the total received.', 409); }
    $conflict = $pdo->prepare("SELECT id FROM calendar_events WHERE event_date=:date AND (booking_id IS NULL OR booking_id<>:id) AND status IN ('REQUESTED','BOOKED') LIMIT 1");
    $conflict->execute(['date'=>$details['date'],'id'=>$id]);
    if ($conflict->fetch()) { $pdo->rollBack(); json_error('The agreed date conflicts with another active booking.', 409); }
    $pdo->prepare('UPDATE bookings SET agreed_details=:details, agreed_details_updated_at=NOW() WHERE id=:id')->execute(['details'=>json_encode($details, JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR),'id'=>$id]);
    $pdo->prepare('UPDATE calendar_events SET event_date=:date, location=:location, notes=:notes WHERE booking_id=:id')->execute(['date'=>$details['date'],'location'=>$details['location'],'notes'=>$details['notes'],'id'=>$id]);

    $booking['agreed_details'] = $details;
    $active = $pdo->prepare('SELECT id, invoice_type, payment_id FROM invoices WHERE booking_id=:id AND voided_at IS NULL ORDER BY id');
    $active->execute(['id'=>$id]);
    $revisions = [];
    foreach ($active->fetchAll(PDO::FETCH_ASSOC) as $old) {
        $pdo->prepare('UPDATE invoices SET voided_at=NOW() WHERE id=:id')->execute(['id'=>$old['id']]);
        $revisions[] = create_invoice_record($pdo, $booking, $old['invoice_type'], $old['payment_id'] ? (int)$old['payment_id'] : null, (int)$old['id']);
    }
    $fee = platform_fee_values($pdo, $total);
    $pdo->prepare('UPDATE platform_fee_ledger SET agreed_total=:total, fee_rate=:rate, fee_amount=:amount WHERE booking_id=:id AND voided_at IS NULL')->execute(['total'=>$total,'rate'=>$fee['rate'],'amount'=>$fee['amount'],'id'=>$id]);
    $pdo->commit();
    json_success(['agreed_details'=>$details,'agreed_details_updated_at'=>date('Y-m-d H:i:s'),'platform_fee'=>$fee,'revised_invoices'=>$revisions]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack(); log_server_error('BOOKING_AGREED_DETAILS',$e); json_error('Unable to save the agreed details.',500);
}
