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
$id = positive_integer_input($input['id'] ?? null);
if (!$id) json_error('Invalid booking id.', 422);
$pdo = Database::connect();
$stmt = $pdo->prepare('SELECT * FROM bookings WHERE id = :id');
$stmt->execute(['id' => $id]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$booking) json_error('Booking not found.', 404);
if (!$booking['down_payment_received_at'] || !$booking['confirmed_details']) json_error('Record a down payment before sending an invoice.', 409);
$booking['confirmed_details'] = json_decode((string) $booking['confirmed_details'], true, 512, JSON_THROW_ON_ERROR);
$sent = send_booking_invoice($booking);
if (!$sent) json_error('The invoice could not be sent. Please check the email configuration and try again.', 502);
$pdo->prepare('UPDATE bookings SET invoice_sent_at = NOW() WHERE id = :id')->execute(['id' => $id]);
json_success(['invoice_sent_at' => date('Y-m-d H:i:s'), 'message' => 'Invoice sent successfully.']);
