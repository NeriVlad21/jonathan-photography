<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$admin = require_admin();
$pdo = Database::connect();

function valid_calendar_date(string $value): bool
{
    $date = DateTime::createFromFormat('Y-m-d', $value);
    return $date && $date->format('Y-m-d') === $value;
}

if ($method === 'GET') {
    $start = (string) ($_GET['start'] ?? date('Y-m-01'));
    $end = (string) ($_GET['end'] ?? date('Y-m-t'));

    if (!valid_calendar_date($start) || !valid_calendar_date($end)) {
        json_error('Please provide a valid calendar range.', 422);
    }

    $startDate = new DateTime($start);
    $endDate = new DateTime($end);
    if ($endDate < $startDate || $startDate->diff($endDate)->days > 370) {
        json_error('Calendar ranges must be between 1 and 370 days.', 422);
    }

    // Self-heal legacy or interrupted synchronization so every dated
    // booking request has a linked calendar record.
    $sync = $pdo->prepare(
        'INSERT INTO calendar_events
            (booking_id, reference_code, name, email, phone, shoot_type, event_date, location, notes, status)
         SELECT b.id,
                CONCAT(CASE WHEN b.status = \'NEW\' THEN \'REQ-\' ELSE \'CAL-\' END, b.reference_code),
                b.name, b.email, b.phone, b.shoot_type, b.preferred_date, b.location, b.message,
                CASE
                    WHEN b.status = \'NEW\' THEN \'REQUESTED\'
                    WHEN b.status = \'CONFIRMED\' THEN \'BOOKED\'
                    ELSE \'CANCELLED\'
                END
         FROM bookings b
         LEFT JOIN calendar_events ce ON ce.booking_id = b.id
         WHERE ce.id IS NULL
           AND b.preferred_date BETWEEN :sync_start AND :sync_end
           AND b.status IN (\'NEW\', \'CONFIRMED\', \'CANCELLED\')'
    );
    $sync->execute(['sync_start' => $start, 'sync_end' => $end]);

    $refreshLinked = $pdo->prepare(
        'UPDATE calendar_events ce
         INNER JOIN bookings b ON b.id = ce.booking_id
         SET ce.reference_code = CONCAT(CASE WHEN b.status = \'NEW\' THEN \'REQ-\' ELSE \'CAL-\' END, b.reference_code),
             ce.name = b.name,
             ce.email = b.email,
             ce.phone = b.phone,
             ce.shoot_type = b.shoot_type,
             ce.event_date = b.preferred_date,
             ce.location = b.location,
             ce.notes = b.message,
             ce.status = CASE
                 WHEN b.status = \'NEW\' THEN \'REQUESTED\'
                 WHEN b.status = \'CONFIRMED\' THEN \'BOOKED\'
                 ELSE \'CANCELLED\'
             END
         WHERE b.preferred_date BETWEEN :refresh_start AND :refresh_end
           AND b.status IN (\'NEW\', \'CONFIRMED\', \'CANCELLED\')'
    );
    $refreshLinked->execute(['refresh_start' => $start, 'refresh_end' => $end]);

    $stmt = $pdo->prepare(
        'SELECT CONCAT(\'schedule-\', ce.id) AS id,
                ce.id AS calendar_event_id,
                ce.booking_id,
                ce.reference_code,
                ce.name,
                ce.email,
                ce.phone,
                ce.shoot_type,
                ce.event_date AS preferred_date,
                ce.location,
                ce.notes AS message,
                b.estimate_total,
                ce.status,
                ce.created_at,
                \'schedule\' AS source
         FROM calendar_events ce
         LEFT JOIN bookings b ON b.id = ce.booking_id
         WHERE ce.event_date BETWEEN :start AND :end
         ORDER BY ce.event_date ASC, ce.created_at ASC'
    );
    $stmt->execute(['start' => $start, 'end' => $end]);
    json_success($stmt->fetchAll(PDO::FETCH_ASSOC));
}

require_csrf();
$input = json_input();

if ($method === 'POST') {
    $bookingId = !empty($input['booking_id']) ? (int) $input['booking_id'] : null;
    $eventDate = trim((string) ($input['event_date'] ?? ''));
    $name = trim((string) ($input['name'] ?? ''));
    $shootType = trim((string) ($input['shoot_type'] ?? ''));
    $email = trim((string) ($input['email'] ?? ''));
    $phone = trim((string) ($input['phone'] ?? ''));
    $location = trim((string) ($input['location'] ?? ''));
    $notes = trim((string) ($input['notes'] ?? ''));

    if (!valid_calendar_date($eventDate)) {
        json_error('Please choose a valid event date.', 422, ['event_date' => 'A valid event date is required.']);
    }

    try {
        $pdo->beginTransaction();
        $booking = null;

        if ($bookingId) {
            $bookingStmt = $pdo->prepare(
                'SELECT id, reference_code, name, email, phone, shoot_type, location, message, status
                 FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE'
            );
            $bookingStmt->execute(['id' => $bookingId]);
            $booking = $bookingStmt->fetch(PDO::FETCH_ASSOC);

            if (!$booking) {
                $pdo->rollBack();
                json_error('The selected booking request no longer exists.', 404);
            }
            if (strtoupper((string) $booking['status']) === 'CANCELLED') {
                $pdo->rollBack();
                json_error('A cancelled request cannot be added to the booked schedule.', 409);
            }

            $name = $name ?: trim((string) $booking['name']);
            $email = $email ?: trim((string) $booking['email']);
            $phone = $phone ?: trim((string) $booking['phone']);
            $shootType = $shootType ?: trim((string) $booking['shoot_type']);
            $location = $location ?: trim((string) $booking['location']);
            $notes = $notes ?: trim((string) $booking['message']);
        }

        if ($name === '' || $shootType === '') {
            $pdo->rollBack();
            json_error('Client name and service are required.', 422);
        }

        $conflictSql =
            'SELECT id FROM calendar_events
             WHERE event_date = :event_date
               AND status IN (\'REQUESTED\', \'BOOKED\')';
        $conflictParams = ['event_date' => $eventDate];
        if ($bookingId) {
            $conflictSql .= ' AND (booking_id IS NULL OR booking_id <> :booking_id)';
            $conflictParams['booking_id'] = $bookingId;
        }
        $conflictSql .= ' LIMIT 1 FOR UPDATE';
        $conflict = $pdo->prepare($conflictSql);
        $conflict->execute($conflictParams);
        if ($conflict->fetch()) {
            $pdo->rollBack();
            json_error('That date is already booked in the studio calendar.', 409);
        }

        if ($bookingId) {
            $existing = $pdo->prepare('SELECT id FROM calendar_events WHERE booking_id = :booking_id LIMIT 1 FOR UPDATE');
            $existing->execute(['booking_id' => $bookingId]);
            $existingEventId = (int) ($existing->fetchColumn() ?: 0);
            if ($existingEventId > 0) {
                $updateEvent = $pdo->prepare(
                    'UPDATE calendar_events
                     SET name = :name, email = :email, phone = :phone,
                         shoot_type = :shoot_type, event_date = :event_date,
                         location = :location, notes = :notes, status = \'BOOKED\'
                     WHERE id = :id'
                );
                $updateEvent->execute([
                    'name' => $name,
                    'email' => $email !== '' ? $email : null,
                    'phone' => $phone !== '' ? $phone : null,
                    'shoot_type' => $shootType,
                    'event_date' => $eventDate,
                    'location' => $location !== '' ? $location : null,
                    'notes' => $notes !== '' ? $notes : null,
                    'id' => $existingEventId,
                ]);
                $pdo->prepare('UPDATE bookings SET status = \'CONFIRMED\', preferred_date = :event_date WHERE id = :id')
                    ->execute(['event_date' => $eventDate, 'id' => $bookingId]);
                $pdo->commit();
                json_success([
                    'id' => $existingEventId,
                    'reference_code' => $booking['reference_code'],
                    'message' => 'Booking request confirmed on the studio calendar.'
                ], 200);
            }
        }

        $reference = 'CAL-' . strtoupper(bin2hex(random_bytes(4)));
        $insert = $pdo->prepare(
            'INSERT INTO calendar_events
             (booking_id, reference_code, name, email, phone, shoot_type, event_date, location, notes, status)
             VALUES (:booking_id, :reference_code, :name, :email, :phone, :shoot_type, :event_date, :location, :notes, \'BOOKED\')'
        );
        $insert->execute([
            'booking_id' => $bookingId,
            'reference_code' => $reference,
            'name' => $name,
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
            'shoot_type' => $shootType,
            'event_date' => $eventDate,
            'location' => $location !== '' ? $location : null,
            'notes' => $notes !== '' ? $notes : null
        ]);

        if ($bookingId && strtoupper((string) $booking['status']) === 'NEW') {
            $update = $pdo->prepare(
                'UPDATE bookings SET status = \'CONFIRMED\', preferred_date = :event_date WHERE id = :id AND status = \'NEW\''
            );
            $update->execute(['event_date' => $eventDate, 'id' => $bookingId]);
        }

        $eventId = (int) $pdo->lastInsertId();
        $pdo->commit();
        json_success([
            'id' => $eventId,
            'reference_code' => $reference,
            'message' => 'Booked schedule added successfully.'
        ], 201);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        log_server_error('calendar event create', $e);
        json_error('Unable to add this booked schedule.', 500);
    }
}

if ($method === 'PUT') {
    $eventId = (int) ($input['id'] ?? 0);
    $status = strtoupper(trim((string) ($input['status'] ?? '')));
    if ($eventId < 1 || !in_array($status, ['BOOKED', 'CANCELLED'], true)) {
        json_error('Please provide a valid calendar event and status.', 422);
    }

    try {
        $pdo->beginTransaction();
        $eventStmt = $pdo->prepare(
            'SELECT id, booking_id, event_date, status FROM calendar_events WHERE id = :id LIMIT 1 FOR UPDATE'
        );
        $eventStmt->execute(['id' => $eventId]);
        $event = $eventStmt->fetch(PDO::FETCH_ASSOC);
        if (!$event) {
            $pdo->rollBack();
            json_error('Calendar event not found.', 404);
        }

        if ($status === 'BOOKED') {
            $conflict = $pdo->prepare(
                'SELECT id FROM calendar_events
                 WHERE event_date = :event_date
                   AND status IN (\'REQUESTED\', \'BOOKED\')
                   AND id <> :id
                 LIMIT 1 FOR UPDATE'
            );
            $conflict->execute(['event_date' => $event['event_date'], 'id' => $eventId]);
            if ($conflict->fetch()) {
                $pdo->rollBack();
                json_error('Another request or booking already occupies that date.', 409);
            }
        }

        $stmt = $pdo->prepare('UPDATE calendar_events SET status = :status WHERE id = :id');
        $stmt->execute(['status' => $status, 'id' => $eventId]);

        if (!empty($event['booking_id'])) {
            if ($status === 'BOOKED') {
                $bookingState = $pdo->prepare('SELECT status FROM bookings WHERE id = :id LIMIT 1 FOR UPDATE');
                $bookingState->execute(['id' => $event['booking_id']]);
                if (strtoupper((string) $bookingState->fetchColumn()) === 'CANCELLED') {
                    $pdo->rollBack();
                    json_error('A cancelled booking request cannot be restored from the calendar.', 409);
                }
            }
            $bookingStatus = $status === 'BOOKED' ? 'CONFIRMED' : 'CANCELLED';
            $pdo->prepare('UPDATE bookings SET status = :status WHERE id = :id')
                ->execute(['status' => $bookingStatus, 'id' => $event['booking_id']]);
        }

        $pdo->commit();
        json_success(['id' => $eventId, 'status' => $status]);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        log_server_error('calendar event status update', $e);
        json_error('Unable to update this calendar event.', 500);
    }
}

json_error('Method not allowed.', 405);
