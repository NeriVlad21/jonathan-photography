<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_owner();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed.', 405);

$pdo = Database::connect();
$statement = $pdo->query(
    'SELECT l.id,l.resource_type,l.resource_id,l.action,l.metadata,l.created_at,a.username AS superadmin_username
     FROM superadmin_access_log l JOIN admins a ON a.id=l.superadmin_id
     ORDER BY l.created_at DESC LIMIT 500'
);
$rows = array_map(static function (array $row): array {
    $row['metadata'] = $row['metadata'] ? json_decode((string) $row['metadata'], true) : null;
    return $row;
}, $statement->fetchAll(PDO::FETCH_ASSOC));
json_success(['access_log' => $rows]);
