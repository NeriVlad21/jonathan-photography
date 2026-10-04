<?php
/** DELETE /api/contacts/delete.php?id=1 — admin only */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$id = positive_integer_input($_GET['id'] ?? null);
if (!$id) json_error('Missing id.', 422);

$pdo = Database::connect();
$stmt = $pdo->prepare('DELETE FROM contact_platforms WHERE id = :id');
$stmt->execute(['id' => $id]);
if ($stmt->rowCount() < 1) json_error('Contact platform not found.', 404);
json_success(['deleted' => true]);
