<?php
/**
 * Shared shape for platform support reports, used by the Support Reports and
 * Super Admin Archives endpoints so lists, details, PDFs, and CSVs agree.
 */

declare(strict_types=1);

const SUPPORT_RECORD_SELECT = "SELECT r.*, a.username submitted_by_username, a.email submitted_by_email, ad.username archived_by
    FROM support_reports r
    JOIN admins a ON a.id = r.submitted_by_admin_id
    LEFT JOIN admins ad ON ad.id = r.archived_by_admin_id";

function map_support_record(array $row): array
{
    return [
        'id' => (int) $row['id'],
        'reference' => sprintf('SR-%06d', (int) $row['id']),
        'subject' => $row['subject'],
        'category' => $row['category'],
        'priority' => $row['priority'],
        'status' => $row['status'],
        'description' => $row['description'],
        'super_admin_reply' => $row['super_admin_reply'],
        'submitted_by_username' => $row['submitted_by_username'],
        'submitted_by_email' => $row['submitted_by_email'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'resolved_at' => $row['resolved_at'],
        'archived_at' => $row['archived_at'],
        'archived_by' => $row['archived_by'],
    ];
}

/** Status history for one report, reconstructed from the admin audit log. */
function support_history(PDO $pdo, int $reportId): array
{
    $stmt = $pdo->prepare(
        "SELECT l.action, l.metadata, l.created_at, a.username actor
         FROM admin_audit_log l LEFT JOIN admins a ON a.id = l.actor_admin_id
         WHERE l.action IN ('SUPPORT_REPORT_CREATED','SUPPORT_REPORT_UPDATED','SUPPORT_REPORT_ARCHIVED','SUPPORT_REPORT_RESTORED')
           AND CAST(JSON_VALUE(l.metadata, '$.report_id') AS UNSIGNED) = :id
         ORDER BY l.created_at, l.id"
    );
    $stmt->execute(['id' => $reportId]);
    $labels = ['SUPPORT_REPORT_CREATED' => 'Submitted', 'SUPPORT_REPORT_UPDATED' => 'Status updated', 'SUPPORT_REPORT_ARCHIVED' => 'Archived', 'SUPPORT_REPORT_RESTORED' => 'Restored'];
    return array_map(static function (array $row) use ($labels): array {
        $meta = json_decode((string) ($row['metadata'] ?? ''), true) ?: [];
        return ['event' => $labels[$row['action']] ?? $row['action'], 'status' => $meta['status'] ?? null, 'actor' => $row['actor'], 'at' => $row['created_at']];
    }, $stmt->fetchAll(PDO::FETCH_ASSOC));
}
