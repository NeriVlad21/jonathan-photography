<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_owner();
if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_error('Method not allowed.', 405);

$pdo = Database::connect();
$statement = $pdo->prepare(
    "SELECT entity_key, reason, updated_at
     FROM content_moderation
     WHERE entity_type = 'SITE_COPY' AND status = 'FLAGGED'
     ORDER BY updated_at DESC"
);
$statement->execute();

$warnings = [];
foreach ($statement->fetchAll(PDO::FETCH_ASSOC) as $warning) {
    $warnings[(string) $warning['entity_key']] = [
        'reason' => (string) $warning['reason'],
        'updated_at' => (string) $warning['updated_at'],
    ];
}

json_success(['warnings' => $warnings]);
