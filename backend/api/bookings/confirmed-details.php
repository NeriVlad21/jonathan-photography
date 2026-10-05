<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.', 405);
require_admin();
require_csrf();
$input = json_input();

$v = new Validator($input);
$v->required('id')->positiveInteger('id', 'booking id')
  ->required('total')->required('date')->date('date', false)
  ->string('coverage', 'Coverage')->maxLength('coverage', 160)
  ->string('notes', 'Notes')->maxLength('notes', 2000);
if ($v->fails()) json_error('Please correct the confirmed booking details.', 422, $v->errors());

$id = positive_integer_input($input['id'] ?? null);
$total = money_input($input['total'] ?? null);
$hours = $input['hours'] ?? null;
if ($total === null || $total <= 0) json_error('Final agreed price must be greater than zero.', 422);
if ($hours !== null && $hours !== '' && (!is_numeric($hours) || (float) $hours <= 0 || (float) $hours > 24)) {
    json_error('Coverage hours must be between 0 and 24.', 422);
}
$addonsInput = $input['addons'] ?? [];
if (!is_array($addonsInput) || count($addonsInput) > 50) json_error('Add-ons must be a valid list.', 422);
$addons = [];
foreach ($addonsInput as $index => $addon) {
    if (!is_array($addon)) json_error('Each add-on must be valid.', 422);
    $label = clean_string($addon['label'] ?? '');
    $amount = money_input($addon['amount'] ?? 0);
    $quantity = positive_integer_input($addon['quantity'] ?? 1);
    if ($label === '' || mb_strlen($label) > 120 || $amount === null || $quantity < 1 || $quantity > 99) {
        json_error('Please correct add-on ' . ($index + 1) . '.', 422);
    }
    $addons[] = ['label' => $label, 'amount' => $amount, 'quantity' => $quantity];
}

$details = [
    'total' => $total,
    'coverage' => clean_string($input['coverage'] ?? ''),
    'hours' => $hours === null || $hours === '' ? null : round((float) $hours, 2),
    'addons' => $addons,
    'date' => (string) $input['date'],
    'notes' => clean_string($input['notes'] ?? ''),
];

$pdo = Database::connect();
try {
    $pdo->beginTransaction();
    $stmt = $pdo->prepare('SELECT id, status FROM bookings WHERE id = :id FOR UPDATE');
    $stmt->execute(['id' => $id]);
    $booking = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$booking) { $pdo->rollBack(); json_error('Booking not found.', 404); }
    if ($booking['status'] === 'CANCELLED') { $pdo->rollBack(); json_error('Cancelled bookings cannot be edited.', 409); }

    $conflict = $pdo->prepare("SELECT id FROM calendar_events WHERE event_date = :date AND (booking_id IS NULL OR booking_id <> :id) AND status IN ('REQUESTED','BOOKED') LIMIT 1");
    $conflict->execute(['date' => $details['date'], 'id' => $id]);
    if ($conflict->fetch()) { $pdo->rollBack(); json_error('The final date conflicts with another active booking.', 409); }

    $pdo->prepare('UPDATE bookings SET confirmed_details = :details, confirmed_details_updated_at = NOW() WHERE id = :id')
        ->execute(['details' => json_encode($details, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR), 'id' => $id]);
    $pdo->prepare('UPDATE calendar_events SET event_date = :date, notes = :notes WHERE booking_id = :id')
        ->execute(['date' => $details['date'], 'notes' => $details['notes'], 'id' => $id]);
    $pdo->commit();
    json_success(['confirmed_details' => $details, 'confirmed_details_updated_at' => date('Y-m-d H:i:s')]);
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    log_server_error('BOOKING_CONFIRMED_DETAILS', $e);
    json_error('Unable to save the confirmed details.', 500);
}
