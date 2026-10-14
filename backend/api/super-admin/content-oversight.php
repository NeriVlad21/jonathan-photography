<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$admin = require_super_admin();
$pdo = Database::connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $contentStatement = $pdo->prepare(
        "SELECT setting_value, updated_at FROM site_settings WHERE setting_key = 'public_content_v1' LIMIT 1"
    );
    $contentStatement->execute();
    $contentRow = $contentStatement->fetch(PDO::FETCH_ASSOC);
    $content = $contentRow ? json_decode((string) $contentRow['setting_value'], true) : [];

    $warningStatement = $pdo->prepare(
        "SELECT entity_key, reason, updated_at
         FROM content_moderation
         WHERE entity_type = 'SITE_COPY' AND status = 'FLAGGED'
         ORDER BY updated_at DESC"
    );
    $warningStatement->execute();

    $warnings = [];
    foreach ($warningStatement->fetchAll(PDO::FETCH_ASSOC) as $warning) {
        $warnings[(string) $warning['entity_key']] = [
            'reason' => (string) $warning['reason'],
            'updated_at' => (string) $warning['updated_at'],
        ];
    }

    json_success([
        'content' => is_array($content) ? $content : [],
        'content_updated_at' => $contentRow['updated_at'] ?? null,
        'warnings' => $warnings,
        'sanitization_note' => 'This is a read-only copy of the owner\'s Website Content workspace. The Super Admin can issue or clear review warnings but cannot edit, hide, delete, or publish owner content.',
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.', 405);

require_csrf();
$input = json_input();
$validator = new Validator($input);
$validator
    ->required('entity_key')->string('entity_key')->maxLength('entity_key', 120)
    ->required('status')->inList('status', ['CLEAR', 'FLAGGED'])
    ->string('reason')->maxLength('reason', 500);

if ($validator->fails()) json_error('Please check the warning action.', 422, $validator->errors());

$key = clean_string($input['entity_key']);
$status = (string) $input['status'];
$reason = clean_string($input['reason'] ?? '');

$contentStatement = $pdo->prepare(
    "SELECT setting_value FROM site_settings WHERE setting_key = 'public_content_v1' LIMIT 1"
);
$contentStatement->execute();
$content = json_decode((string) ($contentStatement->fetchColumn() ?: '{}'), true);
if (!is_array($content) || !array_key_exists($key, $content)) {
    json_error('That website content section no longer exists.', 404);
}

if ($status === 'FLAGGED' && mb_strlen($reason) < 5) {
    json_error('Add a brief warning reason.', 422, ['reason' => 'Enter at least five characters.']);
}

if ($status === 'CLEAR') {
    $statement = $pdo->prepare(
        "DELETE FROM content_moderation WHERE entity_type = 'SITE_COPY' AND entity_key = :key"
    );
    $statement->execute(['key' => $key]);
} else {
    $statement = $pdo->prepare(
        "INSERT INTO content_moderation (entity_type, entity_key, status, reason, moderated_by_admin_id)
         VALUES ('SITE_COPY', :key, 'FLAGGED', :reason, :admin)
         ON DUPLICATE KEY UPDATE
            status = 'FLAGGED',
            reason = VALUES(reason),
            moderated_by_admin_id = VALUES(moderated_by_admin_id),
            updated_at = CURRENT_TIMESTAMP"
    );
    $statement->execute([
        'key' => $key,
        'reason' => $reason,
        'admin' => $admin['id'],
    ]);
}

record_admin_audit($pdo, (int) $admin['id'], 'SITE_CONTENT_WARNING_UPDATED', null, [
    'section' => $key,
    'status' => $status,
    'reason' => $reason,
]);

json_success([
    'entity_key' => $key,
    'moderation_status' => $status === 'CLEAR' ? null : 'FLAGGED',
    'moderation_reason' => $status === 'CLEAR' ? null : $reason,
    'message' => $status === 'CLEAR'
        ? 'The content warning was cleared.'
        : 'The owner was warned that this section requires review.',
]);
