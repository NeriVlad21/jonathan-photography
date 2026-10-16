<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/billing.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.', 405);
require_owner(); require_csrf();
$input = json_input();
$v = new Validator($input);
$v->required('id')->positiveInteger('id', 'booking id')->required('total')->required('date')->date('date', false)
  ->string('coverage', 'Coverage')->maxLength('coverage', 160)->string('location', 'Location')->maxLength('location', 200)
  ->string('notes', 'Notes')->maxLength('notes', 2000)->boolean('pass_platform_fee_to_client');
if ($v->fails()) json_error('Please correct the agreed booking details.', 422, $v->errors());
$id = positive_integer_input($input['id'] ?? null);
$total = whole_peso_input($input['total'] ?? null);
$hours = $input['hours'] ?? null;
if ($total === null || $total <= 0) json_error('Enter the agreed price as a whole peso amount greater than zero.', 422, ['total' => 'Use a whole peso amount, e.g. 25000.']);
if ($hours !== null && $hours !== '' && (!is_numeric($hours) || (float) $hours <= 0 || (float) $hours > 24)) json_error('Coverage hours must be between 0 and 24.', 422);
$addonsInput = $input['addons'] ?? [];
if (!is_array($addonsInput) || count($addonsInput) > 50) json_error('Add-ons must be a valid list.', 422);
$addons = [];
foreach ($addonsInput as $index => $addon) {
    if (!is_array($addon)) json_error('Each add-on must be valid.', 422);
    $label = clean_string($addon['label'] ?? '');
    $amount = whole_peso_input($addon['amount'] ?? 0);
    $quantity = positive_integer_input($addon['quantity'] ?? 1);
    if ($label === '' || mb_strlen($label) > 120 || $amount === null || $quantity < 1 || $quantity > 99) json_error('Please correct add-on ' . ($index + 1) . '.', 422);
    $addons[] = ['label' => $label, 'amount' => $amount, 'quantity' => $quantity];
}
$pdo = Database::connect();
$settings = billing_settings($pdo);
$overrideSupplied = array_key_exists('pass_platform_fee_to_client', $input) && $input['pass_platform_fee_to_client'] !== null && $input['pass_platform_fee_to_client'] !== '';
$passFee = $overrideSupplied ? (bool) boolean_input($input['pass_platform_fee_to_client']) : (bool) $settings['pass_platform_fee_to_client_default'];
$feeResponsibility = $passFee ? 'CLIENT' : 'STUDIO';
$details = ['total' => $total, 'fee_responsibility' => $feeResponsibility, 'pass_platform_fee_to_client' => $passFee, 'uses_platform_fee_default' => !$overrideSupplied, 'coverage' => clean_string($input['coverage'] ?? ''), 'hours' => $hours === null || $hours === '' ? null : round((float) $hours, 2), 'addons' => $addons, 'date' => (string) $input['date'], 'location' => clean_string($input['location'] ?? ''), 'notes' => clean_string($input['notes'] ?? '')];
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT * FROM bookings WHERE id=:id FOR UPDATE'); $stmt->execute(['id'=>$id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$booking) { $pdo->rollBack(); json_error('Booking not found.', 404); }
    if (in_array($booking['status'], ['COMPLETED', 'CANCELLED'], true)) { $pdo->rollBack(); json_error('Completed or cancelled bookings cannot be edited.', 409); }
    $paymentSummary = $pdo->prepare("SELECT COALESCE(SUM(amount),0) paid, MAX(payment_type='FINAL_PAYMENT') has_final FROM booking_payments WHERE booking_id=:id");
    $paymentSummary->execute(['id'=>$id]);
    $paymentState = $paymentSummary->fetch(PDO::FETCH_ASSOC);
    $paid = (float) ($paymentState['paid'] ?? 0);
    // The fee and client total are always derived here from the configured
    // rates; any totals or fee amounts sent by the browser are ignored.
    $fee = platform_fee_values($pdo, (float) $total);
    $details['platform_fee'] = ['rate' => (float) $fee['rate'], 'amount' => whole_peso((float) $total * (float) $fee['rate'])];
    $money = booking_financials($pdo, $details);
    $details['client_total'] = $money['client_total'];
    $details['required_down_payment'] = $money['required_down_payment'];
    $clientTotal = $money['client_total'];
    // Changing the price or fee responsibility after payments follows the
    // invoice revision workflow below. Recorded payments are never changed:
    // before the final payment the client total must stay above what was
    // received (so a final payment can still settle it); after the final
    // payment it must keep matching the total received.
    if (!empty($paymentState['has_final']) && abs($clientTotal - $paid) > 0.009) { $pdo->rollBack(); json_error('The final payment is already recorded. The client total must continue to match the total received.', 409); }
    if (empty($paymentState['has_final']) && $paid > 0 && $clientTotal <= $paid) { $pdo->rollBack(); json_error('The client total must stay above the ₱' . number_format($paid) . ' already received so the final payment can be recorded.', 422); }
    $conflict = $pdo->prepare("SELECT id FROM calendar_events WHERE event_date=:date AND (booking_id IS NULL OR booking_id<>:id) AND status IN ('REQUESTED','BOOKED','COMPLETED') LIMIT 1");
    $conflict->execute(['date'=>$details['date'],'id'=>$id]);
    if ($conflict->fetch()) { $pdo->rollBack(); json_error('The agreed date conflicts with another active booking.', 409); }
    $pdo->prepare('UPDATE bookings SET agreed_details=:details, agreed_details_updated_at=NOW(), pass_platform_fee_to_client=:pass_fee WHERE id=:id')->execute(['details'=>json_encode($details, JSON_UNESCAPED_SLASHES|JSON_THROW_ON_ERROR),'pass_fee'=>$overrideSupplied ? (int)$passFee : null,'id'=>$id]);
    $pdo->prepare('UPDATE calendar_events SET event_date=:date, location=:location, notes=:notes WHERE booking_id=:id')->execute(['date'=>$details['date'],'location'=>$details['location'],'notes'=>$details['notes'],'id'=>$id]);

    $booking['agreed_details'] = $details;
    $active = $pdo->prepare('SELECT id, invoice_type, payment_id FROM invoices WHERE booking_id=:id AND voided_at IS NULL ORDER BY id');
    $active->execute(['id'=>$id]);
    $revisions = [];
    foreach ($active->fetchAll(PDO::FETCH_ASSOC) as $old) {
        $pdo->prepare('UPDATE invoices SET voided_at=NOW() WHERE id=:id')->execute(['id'=>$old['id']]);
        $revisions[] = create_invoice_record($pdo, $booking, $old['invoice_type'], $old['payment_id'] ? (int)$old['payment_id'] : null, (int)$old['id']);
    }
    // Keep an accrued (unsettled) fee in step with the new price. Fees in a
    // cycle already marked PAID are historical and are not rewritten.
    $pdo->prepare("UPDATE platform_fee_ledger pfl JOIN fee_cycles fc ON fc.id=pfl.cycle_id SET pfl.agreed_total=:total, pfl.fee_rate=:rate, pfl.fee_amount=:amount WHERE pfl.booking_id=:id AND pfl.voided_at IS NULL AND fc.status<>'PAID'")
        ->execute(['total'=>$total,'rate'=>$money['fee_rate'],'amount'=>$money['fee_amount'],'id'=>$id]);
    $pdo->commit();
    $balance = booking_balance($pdo, $details, (int) $id);
    json_success(['agreed_details'=>$details,'agreed_details_updated_at'=>date('Y-m-d H:i:s'),'platform_fee'=>['rate'=>$money['fee_rate'],'amount'=>$money['fee_amount'],'settings'=>$fee['settings']],'financials'=>$balance,'total_paid'=>$balance['total_paid'],'balance_due'=>$balance['balance_due'],'revised_invoices'=>$revisions]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack(); log_server_error('BOOKING_AGREED_DETAILS',$e); json_error('Unable to save the agreed details.',500);
}
