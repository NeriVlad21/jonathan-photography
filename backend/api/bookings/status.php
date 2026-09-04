<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$input = json_input();

$allowedStatuses = ['CONFIRMED', 'CANCELLED'];

$v = new Validator($input);
$v->required('id')
    ->required('status')
    ->inList('status', $allowedStatuses)
    ->boolTrue(
        'final_update',
        'Please confirm that this is the final booking status update.'
    );

if ($v->fails()) {
    json_error('Please choose a valid status.', 422, $v->errors());
}

$bookingId = (int) $input['id'];
$newStatus = strtoupper(trim((string) $input['status']));

$pdo = Database::connect();

try {
    $pdo->beginTransaction();

    // Lock the record so two admin requests cannot finalize it at once.
    $check = $pdo->prepare(
        'SELECT id, status, preferred_date FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE'
    );

    $check->execute([
        'id' => $bookingId
    ]);

    $existing = $check->fetch(PDO::FETCH_ASSOC);

    if (!$existing) {
        $pdo->rollBack();
        json_error('Booking not found.', 404);
    }

    $currentStatus = strtoupper((string) $existing['status']);

    if (in_array($currentStatus, ['CONFIRMED', 'CANCELLED'], true)) {
        $pdo->rollBack();
        json_error('This booking already has a final status and cannot be changed.', 409);
    }

    if ($newStatus === 'CONFIRMED') {
        if (empty($existing['preferred_date'])) {
            $pdo->rollBack();
            json_error('A preferred date is required before confirming this booking.', 422);
        }

        $conflict = $pdo->prepare(
            'SELECT id FROM calendar_events
             WHERE event_date = :preferred_date
               AND status = \'BOOKED\'
             LIMIT 1'
        );
        $conflict->execute([
            'preferred_date' => $existing['preferred_date']
        ]);

        if ($conflict->fetch()) {
            $pdo->rollBack();
            json_error('That date is already booked in the studio calendar.', 409);
        }
    }

    // NEW remains unchanged while the studio contacts the client. The only
    // persisted transition is the client's final response.
    $stmt = $pdo->prepare(
        'UPDATE bookings
         SET status = :status
         WHERE id = :id AND status = \'NEW\''
    );

    $stmt->execute([
        'status' => $newStatus,
        'id' => $bookingId
    ]);

    if ($stmt->rowCount() !== 1) {
        $pdo->rollBack();
        json_error('This booking could not be finalized because its status changed.', 409);
    }

    if ($newStatus === 'CONFIRMED') {
        $source = $pdo->prepare(
            'SELECT reference_code, name, email, phone, shoot_type, preferred_date, location, message
             FROM bookings WHERE id = :id LIMIT 1'
        );
        $source->execute(['id' => $bookingId]);
        $bookingSource = $source->fetch(PDO::FETCH_ASSOC);

        $calendar = $pdo->prepare(
            'INSERT INTO calendar_events
             (booking_id, reference_code, name, email, phone, shoot_type, event_date, location, notes, status)
             VALUES (:booking_id, :reference_code, :name, :email, :phone, :shoot_type, :event_date, :location, :notes, \'BOOKED\')'
        );
        $calendar->execute([
            'booking_id' => $bookingId,
            'reference_code' => 'CAL-' . $bookingSource['reference_code'],
            'name' => $bookingSource['name'],
            'email' => $bookingSource['email'],
            'phone' => $bookingSource['phone'],
            'shoot_type' => $bookingSource['shoot_type'],
            'event_date' => $bookingSource['preferred_date'],
            'location' => $bookingSource['location'],
            'notes' => $bookingSource['message']
        ]);
    }

    // Return updated record
    $result = $pdo->prepare(
        'SELECT id, status
         FROM bookings
         WHERE id = :id
         LIMIT 1'
    );

    $result->execute([
        'id' => $bookingId
    ]);

    $booking = $result->fetch(PDO::FETCH_ASSOC);

    $pdo->commit();

    $pdo = null;

    json_success([
        'id' => (int) $booking['id'],
        'status' => $booking['status'],
        'final' => true,
        'message' => 'Booking status finalized successfully.'
    ]);

} catch (Throwable $e) {

    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $pdo = null;

    json_error(
        'Unable to finalize booking status.',
        500
    );
}
