<?php
/**
 * PUT /api/bookings/status.php
 * Body: { id, status: NEW|CONTACTED|CONFIRMED|DECLINED }
 * Admin only.
 */

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
$allowed = ['NEW', 'CONTACTED', 'CONFIRMED', 'DECLINED'];

$v = new Validator($input);
$v->required('id')->required('status')->inList('status', $allowed);
if ($v->fails()) json_error('Please choose a valid status.', 422, $v->errors());

$pdo = Database::connect();
$stmt = $pdo->prepare('UPDATE bookings SET status = :status WHERE id = :id');
$stmt->execute(['status' => $input['status'], 'id' => (int) $input['id']]);

$row = $pdo->prepare('SELECT id, status FROM bookings WHERE id = :id');
$row->execute(['id' => (int) $input['id']]);
$booking = $row->fetch();
if (!$booking) json_error('Booking not found.', 404);
json_success($booking);
