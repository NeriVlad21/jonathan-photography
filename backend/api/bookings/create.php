<?php
/**
 * POST /api/bookings/create.php
 * Public endpoint — anyone can submit a booking request.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

$input = json_input();

$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$config = require __DIR__ . '/../../config/config.php';
if (!rate_limit_check('booking_create', $ip, $config['rate_limit']['booking_max_per_hour'])) {
    json_error('Too many booking requests from this connection. Please try again later.', 429);
}

if (honeypot_tripped($input)) {
    // Pretend success — don't tip off the bot.
    json_success(['saved' => true, 'reference' => 'JP-0000'], 201);
}

$v = new Validator($input);
$v->required('name', 'your full name')->maxLength('name', 160)
  ->required('email', 'your email address')->email('email')
  ->required('phone', 'your phone number')->maxLength('phone', 40)
  ->required('shoot_type', 'a shoot type')
  ->required('preferred_date', 'a preferred date')
  ->required('message', 'a short message');

$v->boolTrue('privacy_agreed', 'Please agree to the data privacy notice before continuing.');

if ($v->fails()) {
    json_error('Please fix the errors below.', 422, $v->errors());
}

$preferredDate = (string) $input['preferred_date'];
$parsedDate = DateTime::createFromFormat('Y-m-d', $preferredDate);
if (!$parsedDate || $parsedDate->format('Y-m-d') !== $preferredDate || $preferredDate < date('Y-m-d')) {
    json_error('Please choose an available date from today onward.', 422, [
        'preferred_date' => 'Choose an available future date.'
    ]);
}

$pdo = Database::connect();

// A booking request must originate from the estimator. Rebuild the estimate
// from active database prices so a caller cannot omit or alter the amount.
$submittedBreakdown = $input['estimate_breakdown'] ?? null;
$serviceId = (int) ($submittedBreakdown['service']['id'] ?? 0);
$hourId = (int) ($submittedBreakdown['hours']['id'] ?? 0);
$submittedAddons = $submittedBreakdown['addons'] ?? [];

if (!is_array($submittedBreakdown) || $serviceId < 1 || $hourId < 1 || !is_array($submittedAddons)) {
    json_error('Please build an estimate before submitting a booking request.', 422, [
        'estimate' => 'Return to the estimator and select a service and coverage time.'
    ]);
}

$serviceStmt = $pdo->prepare(
    'SELECT id, name, starting_price FROM services WHERE id = :id AND visible = 1 LIMIT 1'
);
$serviceStmt->execute(['id' => $serviceId]);
$service = $serviceStmt->fetch();

$hourStmt = $pdo->prepare(
    'SELECT id, label, hours, price FROM estimator_hours WHERE id = :id AND active = 1 LIMIT 1'
);
$hourStmt->execute(['id' => $hourId]);
$hour = $hourStmt->fetch();

if (!$service || !$hour) {
    json_error('One of the selected estimate options is no longer available.', 422, [
        'estimate' => 'Please return to the estimator and build an updated estimate.'
    ]);
}

$estimateTotal = (float) ($service['starting_price'] ?? 0) + (float) $hour['price'];
$canonicalAddons = [];
$seenAddonIds = [];
$addonStmt = $pdo->prepare(
    'SELECT id, label, description, price, is_quantity_based
     FROM estimator_addons WHERE id = :id AND active = 1 LIMIT 1'
);

foreach ($submittedAddons as $submittedAddon) {
    $addonId = (int) ($submittedAddon['id'] ?? 0);
    if ($addonId < 1 || isset($seenAddonIds[$addonId])) {
        continue;
    }

    $addonStmt->execute(['id' => $addonId]);
    $addon = $addonStmt->fetch();
    if (!$addon) {
        json_error('One of the selected add-ons is no longer available.', 422, [
            'estimate' => 'Please return to the estimator and build an updated estimate.'
        ]);
    }

    $quantity = !empty($addon['is_quantity_based'])
        ? max(1, min(24, (int) ($submittedAddon['quantity'] ?? 1)))
        : 1;
    $lineTotal = (float) $addon['price'] * $quantity;
    $estimateTotal += $lineTotal;
    $seenAddonIds[$addonId] = true;
    $canonicalAddons[] = [
        'id' => (int) $addon['id'],
        'label' => (string) $addon['label'],
        'description' => (string) ($addon['description'] ?? ''),
        'price' => (float) $addon['price'],
        'quantity' => $quantity,
        'total' => $lineTotal,
    ];
}

if ($estimateTotal <= 0) {
    json_error('The selected package does not have a valid estimate.', 422, [
        'estimate' => 'Please return to the estimator and choose a priced package.'
    ]);
}

$breakdown = [
    'service' => [
        'id' => (int) $service['id'],
        'name' => (string) $service['name'],
        'price' => (float) ($service['starting_price'] ?? 0),
    ],
    'hours' => [
        'id' => (int) $hour['id'],
        'label' => (string) $hour['label'],
        'hours' => (float) $hour['hours'],
        'price' => (float) $hour['price'],
    ],
    'addons' => $canonicalAddons,
    'total' => $estimateTotal,
];
$shootType = clean_string($service['name']);

$availability = $pdo->prepare(
    'SELECT COUNT(*) FROM calendar_events
     WHERE event_date = :preferred_date AND status IN (\'REQUESTED\', \'BOOKED\')'
);
$availability->execute(['preferred_date' => $preferredDate]);
if ((int) $availability->fetchColumn() > 0) {
    json_error('That date has just been booked. Please choose another available date.', 409, [
        'preferred_date' => 'This date is no longer available.'
    ]);
}

// Reference code like JP-7F3K2A — short, unique, safe to show to the client.
do {
    $reference = 'JP-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    $check = $pdo->prepare('SELECT COUNT(*) FROM bookings WHERE reference_code = :r');
    $check->execute(['r' => $reference]);
} while ((int) $check->fetchColumn() > 0);

try {
    // 1. Start the transaction safely inside the try block
    $pdo->beginTransaction();

    $stmt = $pdo->prepare(
        'INSERT INTO bookings
            (reference_code, name, email, phone, facebook, shoot_type, preferred_date,
             location, guest_count, message, estimate_total, estimate_breakdown,
             privacy_agreed, privacy_agreed_at, status)
         VALUES
            (:ref, :name, :email, :phone, :fb, :shoot, :date,
             :loc, :guests, :msg, :total, :breakdown,
             1, NOW(), \'NEW\')'
    );
    
    $stmt->execute([
        'ref'       => $reference,
        'name'      => clean_string($input['name']),
        'email'     => clean_string($input['email']),
        'phone'     => clean_string($input['phone']),
        'fb'        => clean_string($input['facebook'] ?? ''),
        'shoot'     => $shootType,
        'date'      => $preferredDate,
        'loc'       => clean_string($input['location'] ?? ''),
        'guests'    => clean_string($input['guest_count'] ?? ''),
        'msg'       => clean_string($input['message']),
        'total'     => $estimateTotal,
        'breakdown' => $breakdown ? json_encode($breakdown, JSON_UNESCAPED_SLASHES) : null,
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    $requestEvent = $pdo->prepare(
        'INSERT INTO calendar_events
         (booking_id, reference_code, name, email, phone, shoot_type, event_date, location, notes, status)
         VALUES (:booking_id, :reference_code, :name, :email, :phone, :shoot_type, :event_date, :location, :notes, \'REQUESTED\')'
    );
    $requestEvent->execute([
        'booking_id' => $bookingId,
        'reference_code' => 'REQ-' . $reference,
        'name' => clean_string($input['name']),
        'email' => clean_string($input['email']),
        'phone' => clean_string($input['phone']),
        'shoot_type' => $shootType,
        'event_date' => $preferredDate,
        'location' => clean_string($input['location'] ?? ''),
        'notes' => clean_string($input['message']),
    ]);

    if ($breakdown && !empty($breakdown['addons']) && is_array($breakdown['addons'])) {
        $addonStmt = $pdo->prepare('INSERT INTO booking_addons (booking_id, label, price) VALUES (:bid, :label, :price)');
        foreach ($breakdown['addons'] as $addon) {
            $addonStmt->execute([
                'bid'   => $bookingId,
                'label' => clean_string($addon['label'] ?? ''),
                'price' => (float) ($addon['total'] ?? 0),
            ]);
        }
    }

    // If this email previously priced an estimate, mark that lead as booked.
    $pdo->prepare('UPDATE estimator_leads SET booked = 1 WHERE email = :email')
        ->execute(['email' => clean_string($input['email'])]);

    // 2. Commit the transaction to unlock the database tables
    $pdo->commit();
    
    // 3. CRITICAL FIX: Kill the database connection NOW. 
    // Do not hold MariaDB hostage while SMTP takes 5 seconds to send an email!
    $pdo = null; 

} catch (Throwable $e) {
    // Safely rollback ONLY if a transaction was actually started
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    // Release connection on fail too
    $pdo = null;
    
    log_server_error('BOOKING_CREATE', $e);
    json_error('Something went wrong while saving your request. Please try again.', 500);
}

$booking = [
    'id'              => $bookingId,
    'reference_code'  => $reference,
    'name'            => clean_string($input['name']),
    'email'           => clean_string($input['email']),
    'phone'           => clean_string($input['phone']),
    'facebook'        => clean_string($input['facebook'] ?? ''),
    'shoot_type'      => $shootType,
    'preferred_date'  => $preferredDate,
    'location'        => clean_string($input['location'] ?? ''),
    'guest_count'     => clean_string($input['guest_count'] ?? ''),
    'message'         => clean_string($input['message']),
    'estimate_total'  => $estimateTotal,
    'estimate_breakdown' => $breakdown,
];

// This now happens safely in the background WITHOUT hogging a MySQL connection
send_booking_emails($booking);

json_success(['reference' => $reference, 'id' => $bookingId], 201);
