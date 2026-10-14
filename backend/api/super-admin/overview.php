<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../helpers/billing.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$superAdmin = require_super_admin();
$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

function current_owner(PDO $pdo): ?array
{
    $stmt = $pdo->query(
        "SELECT id, username, email, created_at, updated_at
         FROM admins
         WHERE role = 'OWNER' AND is_active = 1
         ORDER BY updated_at DESC, id DESC
         LIMIT 1"
    );
    return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
}

function verified_super_admin(PDO $pdo, int $id, string $password): bool
{
    $stmt = $pdo->prepare(
        "SELECT password_hash FROM admins
         WHERE id = :id AND role = 'SUPER_ADMIN' AND is_active = 1 LIMIT 1"
    );
    $stmt->execute(['id' => $id]);
    $hash = (string) ($stmt->fetchColumn() ?: '');
    return $hash !== '' && password_verify($password, $hash);
}

if ($method === 'GET') {
    refresh_fee_cycle_statuses($pdo);
    $owner = current_owner($pdo);
    $notificationEmail = (string) ($pdo->query(
        "SELECT setting_value FROM site_settings WHERE setting_key = 'booking_notification_email' LIMIT 1"
    )->fetchColumn() ?: ($owner['email'] ?? ''));
    $totalDue = (float) $pdo->query(
        "SELECT COALESCE(SUM(pfl.fee_amount), 0)
         FROM platform_fee_ledger pfl
         JOIN fee_cycles fc ON fc.id = pfl.cycle_id
         WHERE pfl.voided_at IS NULL AND pfl.archived_at IS NULL AND fc.archived_at IS NULL AND fc.status <> 'PAID'"
    )->fetchColumn();
    $overdueCycles = (int) $pdo->query(
        "SELECT COUNT(*) FROM fee_cycles WHERE archived_at IS NULL AND status = 'DUE'"
    )->fetchColumn();
    $openReports = (int) $pdo->query(
        "SELECT COUNT(*) FROM support_reports WHERE archived_at IS NULL AND status IN ('OPEN','IN_PROGRESS')"
    )->fetchColumn();
    $audit = $pdo->query(
        "SELECT l.id, l.action, l.metadata, l.created_at,
                actor.username AS actor_username, target.username AS target_username
         FROM admin_audit_log l
         LEFT JOIN admins actor ON actor.id = l.actor_admin_id
         LEFT JOIN admins target ON target.id = l.target_admin_id
         ORDER BY l.created_at DESC, l.id DESC LIMIT 12"
    )->fetchAll(PDO::FETCH_ASSOC);

    json_success([
        'owner' => $owner,
        'booking_notification_email' => $notificationEmail,
        'total_due' => round($totalDue, 2),
        'overdue_cycles' => $overdueCycles,
        'open_support_reports' => $openReports,
        'recent_audit' => $audit,
    ]);
}

if ($method !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_csrf();
$input = json_input();
$action = (string) ($input['action'] ?? '');
$password = (string) ($input['super_admin_password'] ?? '');

if ($password === '' || !verified_super_admin($pdo, (int) $superAdmin['id'], $password)) {
    json_error('Your Super Admin password is incorrect.', 422, [
        'super_admin_password' => 'Enter your current Super Admin password.',
    ]);
}

if ($action === 'notification_email') {
    $email = strtolower(clean_string($input['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) {
        json_error('Enter a valid booking-notification email address.', 422, ['email' => 'Enter a valid email address.']);
    }
    $pdo->prepare(
        "INSERT INTO site_settings (setting_key, setting_value)
         VALUES ('booking_notification_email', :email)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
    )->execute(['email' => $email]);
    record_admin_audit($pdo, (int) $superAdmin['id'], 'BOOKING_NOTIFICATION_EMAIL_UPDATED', null, ['email' => $email]);
    json_success(['booking_notification_email' => $email, 'message' => 'Booking notifications will now be sent to the new address.']);
}

if ($action === 'reset_owner_password') {
    $owner = current_owner($pdo);
    $newPassword = (string) ($input['new_password'] ?? '');
    $confirmation = (string) ($input['confirm_password'] ?? '');
    if (!$owner) json_error('No active owner account was found.', 404);
    if (strlen($newPassword) < 12 || strlen($newPassword) > 1024) {
        json_error('The new owner password must contain 12–1024 characters.', 422, ['new_password' => 'Use at least 12 characters.']);
    }
    if ($newPassword !== $confirmation) {
        json_error('The new owner passwords do not match.', 422, ['confirm_password' => 'Passwords must match.']);
    }
    $pdo->prepare('UPDATE admins SET password_hash = :hash, session_version = session_version + 1 WHERE id = :id')->execute([
        'hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        'id' => $owner['id'],
    ]);
    record_admin_audit($pdo, (int) $superAdmin['id'], 'OWNER_PASSWORD_RESET', (int) $owner['id']);
    json_success(['message' => 'The owner password was reset and existing owner sessions were signed out.']);
}

if ($action === 'transfer_ownership') {
    $username = clean_string($input['username'] ?? '');
    $email = strtolower(clean_string($input['email'] ?? ''));
    $newPassword = (string) ($input['new_password'] ?? '');
    $confirmation = (string) ($input['confirm_password'] ?? '');
    $updateNotification = boolean_input($input['use_as_notification_email'] ?? true);

    $errors = [];
    if (!preg_match('/^[A-Za-z0-9_.-]{3,60}$/', $username)) $errors['username'] = 'Use 3–60 letters, numbers, periods, underscores, or hyphens.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) $errors['email'] = 'Enter a valid email address.';
    if (strlen($newPassword) < 12 || strlen($newPassword) > 1024) $errors['new_password'] = 'Use 12–1024 characters.';
    if ($newPassword !== $confirmation) $errors['confirm_password'] = 'Passwords must match.';
    if ($updateNotification === null) $errors['use_as_notification_email'] = 'Choose whether this email receives booking notifications.';
    if ($errors) json_error('Please correct the ownership details.', 422, $errors);

    $duplicate = $pdo->prepare('SELECT id FROM admins WHERE username = :username OR email = :email LIMIT 1');
    $duplicate->execute(['username' => $username, 'email' => $email]);
    if ($duplicate->fetchColumn()) json_error('That username or email already belongs to an administrator account.', 409);

    $previousOwner = current_owner($pdo);
    try {
        $pdo->beginTransaction();
        $pdo->exec("UPDATE admins SET is_active = 0 WHERE role = 'OWNER' AND is_active = 1");
        $stmt = $pdo->prepare(
            "INSERT INTO admins (username, email, password_hash, role, is_active)
             VALUES (:username, :email, :hash, 'OWNER', 1)"
        );
        $stmt->execute([
            'username' => $username,
            'email' => $email,
            'hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        ]);
        $newOwnerId = (int) $pdo->lastInsertId();
        if ($updateNotification === 1) {
            $pdo->prepare(
                "INSERT INTO site_settings (setting_key, setting_value)
                 VALUES ('booking_notification_email', :email)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)"
            )->execute(['email' => $email]);
        }
        record_admin_audit($pdo, (int) $superAdmin['id'], 'OWNERSHIP_TRANSFERRED', $newOwnerId, [
            'previous_owner_id' => $previousOwner['id'] ?? null,
            'notification_email_updated' => $updateNotification === 1,
        ]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        log_server_error('OWNERSHIP_TRANSFER', $e);
        json_error('Ownership could not be transferred. No account changes were saved.', 500);
    }

    json_success([
        'owner' => ['id' => $newOwnerId, 'username' => $username, 'email' => $email],
        'message' => 'Ownership transferred. The previous owner account was deactivated and its records were retained.',
    ]);
}

json_error('Unknown Super Admin action.', 422);

