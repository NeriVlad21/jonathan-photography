<?php
/**
 * POST /api/bookings/create.php
 * Public endpoint — anyone can submit a booking request.
 *
 * Body: {
 *   name, email, phone, facebook,
 *   shoot_type, preferred_date, location, guest_count, message,
 *   estimate_total, estimate_breakdown: { hours, addons: [{label, price}] },
 *   privacy_agreed: true,
 *   website: ""   // honeypot — must stay empty
 * }
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
  ->required('message', 'a short message');

$v->boolTrue('privacy_agreed', 'Please agree to the data privacy notice before continuing.');

if ($v->fails()) {
    json_error('Please fix the errors below.', 422, $v->errors());
}

$pdo = Database::connect();

// Reference code like JP-7F3K2A — short, unique, safe to show to the client.
do {
    $reference = 'JP-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
    $check = $pdo->prepare('SELECT COUNT(*) FROM bookings WHERE reference_code = :r');
    $check->execute(['r' => $reference]);
} while ((int) $check->fetchColumn() > 0);

$estimateTotal = isset($input['estimate_total']) && $input['estimate_total'] !== ''
    ? (float) $input['estimate_total']
    : null;

$breakdown = $input['estimate_breakdown'] ?? null;

$pdo->beginTransaction();
try {
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
        'shoot'     => clean_string($input['shoot_type']),
        'date'      => $input['preferred_date'] ?: null,
        'loc'       => clean_string($input['location'] ?? ''),
        'guests'    => clean_string($input['guest_count'] ?? ''),
        'msg'       => clean_string($input['message']),
        'total'     => $estimateTotal,
        'breakdown' => $breakdown ? json_encode($breakdown, JSON_UNESCAPED_SLASHES) : null,
    ]);

    $bookingId = (int) $pdo->lastInsertId();

    if ($breakdown && !empty($breakdown['addons']) && is_array($breakdown['addons'])) {
        $addonStmt = $pdo->prepare('INSERT INTO booking_addons (booking_id, label, price) VALUES (:bid, :label, :price)');
        foreach ($breakdown['addons'] as $addon) {
            $addonStmt->execute([
                'bid'   => $bookingId,
                'label' => clean_string($addon['label'] ?? ''),
                'price' => (float) ($addon['price'] ?? 0),
            ]);
        }
    }

    // If this email previously priced an estimate, mark that lead as booked.
    $pdo->prepare('UPDATE estimator_leads SET booked = 1 WHERE email = :email')
        ->execute(['email' => clean_string($input['email'])]);

    $pdo->commit();
} catch (Throwable $e) {
    $pdo->rollBack();
    log_server_error('BOOKING_CREATE', $e);
    json_error('Something went wrong while saving your request. Please try again.', 500);
}

$booking = [
    'id'              => $bookingId,
    'reference_code'  => $reference,
    'name'            => clean_string($input['name']),
    'email'           => clean_string($input['email']),
    'shoot_type'      => clean_string($input['shoot_type']),
    'preferred_date'  => $input['preferred_date'] ?: null,
    'location'        => clean_string($input['location'] ?? ''),
    'estimate_total'  => $estimateTotal,
];

send_booking_emails($booking);

json_success(['reference' => $reference, 'id' => $bookingId], 201);
