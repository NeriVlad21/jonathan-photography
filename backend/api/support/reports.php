<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';

$admin = require_admin();
$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if ($admin['role'] === 'SUPER_ADMIN') {
        // Archived reports are excluded unless the Super Admin explicitly asks for
        // them (Support Reports "Archived" filter); the default response is unchanged.
        $includeArchived = ($_GET['include_archived'] ?? '') === '1';
        $stmt = $pdo->query(
            "SELECT r.*, a.username AS submitted_by_username, a.email AS submitted_by_email
             FROM support_reports r
             JOIN admins a ON a.id = r.submitted_by_admin_id
             " . ($includeArchived ? '' : 'WHERE r.archived_at IS NULL') . "
             ORDER BY (r.archived_at IS NOT NULL), FIELD(r.status, 'OPEN','IN_PROGRESS','RESOLVED','CLOSED'),
                      FIELD(r.priority, 'URGENT','NORMAL'), r.created_at DESC"
        );
    } else {
        $stmt = $pdo->prepare(
            "SELECT r.*, a.username AS submitted_by_username, a.email AS submitted_by_email
             FROM support_reports r
             JOIN admins a ON a.id = r.submitted_by_admin_id
             WHERE r.submitted_by_admin_id = :admin_id AND r.archived_at IS NULL
             ORDER BY r.created_at DESC"
        );
        $stmt->execute(['admin_id' => $admin['id']]);
    }
    json_success(['reports' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
}

require_csrf();
$input = json_input();

if ($method === 'POST') {
    // Support reports are submitted by the studio Owner to the platform
    // operator; a Superadmin must not create reports in the Owner's name.
    $admin = require_owner();
    $v = new Validator($input);
    $v->required('subject', 'a subject')->string('subject', 'Subject')->maxLength('subject', 160)
      ->required('category', 'a category')->inList('category', ['TECHNICAL','BILLING','ACCOUNT','OTHER'])
      ->required('priority', 'a priority')->inList('priority', ['NORMAL','URGENT'])
      ->required('description', 'a description')->string('description', 'Description')->maxLength('description', 5000);
    if ($v->fails()) json_error('Please complete the support report.', 422, $v->errors());

    $subject = clean_string($input['subject']);
    $description = clean_string($input['description']);
    if (mb_strlen($description) < 20) {
        json_error('Please describe the problem in at least 20 characters.', 422, ['description' => 'Include what happened and what you were trying to do.']);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO support_reports (submitted_by_admin_id, subject, category, priority, description)
         VALUES (:admin, :subject, :category, :priority, :description)'
    );
    $stmt->execute([
        'admin' => $admin['id'], 'subject' => $subject,
        'category' => $input['category'], 'priority' => $input['priority'],
        'description' => $description,
    ]);
    $id = (int) $pdo->lastInsertId();
    $ownerStmt = $pdo->prepare('SELECT username, email FROM admins WHERE id = :id');
    $ownerStmt->execute(['id' => $admin['id']]);
    $owner = $ownerStmt->fetch(PDO::FETCH_ASSOC) ?: ['username' => $admin['username'], 'email' => ''];
    $report = ['id' => $id, 'subject' => $subject, 'category' => $input['category'], 'priority' => $input['priority'], 'description' => $description];
    $emailed = send_support_report_email($report, $owner);
    record_admin_audit($pdo, (int) $admin['id'], 'SUPPORT_REPORT_CREATED', (int) $admin['id'], ['report_id' => $id]);
    json_success([
        'report' => array_merge($report, ['status' => 'OPEN', 'submitted_by_username' => $owner['username'], 'submitted_by_email' => $owner['email'], 'created_at' => date('Y-m-d H:i:s')]),
        'notification_sent' => $emailed,
        'message' => $emailed
            ? 'Your report was sent to the Super Admin.'
            : 'Your report was saved. Email delivery is unavailable, but the Super Admin can still see it here.',
    ], 201);
}

if ($method === 'PUT') {
    require_super_admin();
    $v = new Validator($input);
    $v->required('id', 'a report id')->positiveInteger('id', 'report id')
      ->required('status', 'a status')->inList('status', ['OPEN','IN_PROGRESS','RESOLVED','CLOSED'])
      ->string('reply', 'Reply')->maxLength('reply', 5000);
    if ($v->fails()) json_error('Please check the support update.', 422, $v->errors());
    $id = positive_integer_input($input['id']);
    $status = (string) $input['status'];
    $reply = clean_string($input['reply'] ?? '');
    $stmt = $pdo->prepare(
        "UPDATE support_reports
         SET status = :status, super_admin_reply = :reply,
             resolved_at = CASE WHEN :status_value IN ('RESOLVED','CLOSED') THEN COALESCE(resolved_at, NOW()) ELSE NULL END
         WHERE id = :id"
    );
    $stmt->execute(['status' => $status, 'status_value' => $status, 'reply' => $reply === '' ? null : $reply, 'id' => $id]);
    if (!$stmt->rowCount()) json_error('Support report not found or no changes were made.', 404);
    record_admin_audit($pdo, (int) $admin['id'], 'SUPPORT_REPORT_UPDATED', null, ['report_id' => $id, 'status' => $status]);
    json_success(['id' => $id, 'status' => $status, 'super_admin_reply' => $reply, 'message' => 'Support report updated.']);
}

json_error('Method not allowed.', 405);

