<?php
/** DELETE /api/services/delete.php?id=1  — admin only */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$id = (int) ($_GET['id'] ?? 0);
if (!$id) json_error('Missing service id.', 422);

$pdo = Database::connect();
$pdo->prepare('DELETE FROM services WHERE id = :id')->execute(['id' => $id]);
json_success(['deleted' => true]);
