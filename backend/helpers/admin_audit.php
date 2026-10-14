<?php

declare(strict_types=1);

function record_admin_audit(
    PDO $pdo,
    int $actorAdminId,
    string $action,
    ?int $targetAdminId = null,
    array $metadata = []
): void {
    $stmt = $pdo->prepare(
        'INSERT INTO admin_audit_log (actor_admin_id, target_admin_id, action, metadata)
         VALUES (:actor, :target, :action, :metadata)'
    );
    $stmt->execute([
        'actor' => $actorAdminId,
        'target' => $targetAdminId,
        'action' => $action,
        'metadata' => $metadata === [] ? null : json_encode($metadata, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
    ]);
}

