<?php

declare(strict_types=1);

function log_superadmin_access(PDO $pdo, array $admin, string $resourceType, ?string $resourceId = null, string $action = 'VIEW', array $metadata = []): void
{
    if (($admin['role'] ?? '') !== 'SUPER_ADMIN') return;

    $allowedResources = ['BOOKING','CALENDAR','CALENDAR_EVENT','PORTFOLIO','PORTFOLIO_SHOOT','PORTFOLIO_IMAGE','LEDGER','LEDGER_EXPORT','CONTACT_REVEAL'];
    $allowedActions = ['VIEW','EXPORT','REVEAL'];
    if (!in_array($resourceType, $allowedResources, true) || !in_array($action, $allowedActions, true)) return;

    $config = require __DIR__ . '/../config/config.php';
    $secret = (string) ($config['app_secret'] ?? 'local-oversight-log');
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    $statement = $pdo->prepare(
        'INSERT INTO superadmin_access_log (superadmin_id, resource_type, resource_id, action, metadata, ip_hash)
         VALUES (:admin, :type, :resource, :action, :metadata, :ip_hash)'
    );
    $statement->execute([
        'admin' => (int) $admin['id'],
        'type' => $resourceType,
        'resource' => $resourceId,
        'action' => $action,
        'metadata' => $metadata ? json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) : null,
        'ip_hash' => hash_hmac('sha256', $ip, $secret),
    ]);
}

function mask_email_address(?string $email): string
{
    $email = trim((string) $email);
    if ($email === '' || !str_contains($email, '@')) return '';
    [$local, $domain] = explode('@', $email, 2);
    $visible = mb_substr($local, 0, min(2, mb_strlen($local)));
    return $visible . str_repeat('•', max(3, mb_strlen($local) - mb_strlen($visible))) . '@' . $domain;
}

function mask_phone_number(?string $phone): string
{
    $phone = trim((string) $phone);
    if ($phone === '') return '';
    $suffix = mb_substr($phone, -4);
    return str_repeat('•', max(4, mb_strlen($phone) - 4)) . $suffix;
}

function open_flags_for(PDO $pdo, string $entityType, int $entityId): array
{
    $statement = $pdo->prepare(
        "SELECT f.id, f.entity_type, f.entity_id, f.reason, f.status, f.resolution_note,
                f.created_at, f.resolved_at, a.username AS flagged_by_username,
                resolver.username AS resolved_by_username
         FROM entity_flags f
         JOIN admins a ON a.id = f.flagged_by
         LEFT JOIN admins resolver ON resolver.id = f.resolved_by
         WHERE f.entity_type = :type AND f.entity_id = :id
         ORDER BY (f.status = 'OPEN') DESC, f.created_at DESC"
    );
    $statement->execute(['type' => $entityType, 'id' => $entityId]);
    return $statement->fetchAll(PDO::FETCH_ASSOC);
}
