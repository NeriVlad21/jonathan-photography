<?php
/**
 * Creates an administrator without placing a known password in SQL history.
 * Usage (PowerShell):
 *   $env:ADMIN_USERNAME='owner'; $env:ADMIN_EMAIL='owner@example.com';
 *   $env:ADMIN_PASSWORD='a unique 12+ character password';
 *   $env:ADMIN_ROLE='OWNER'; # or SUPER_ADMIN
 *   php backend/scripts/create_admin.php
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/database.php';

$username = trim((string) getenv('ADMIN_USERNAME'));
$email = strtolower(trim((string) getenv('ADMIN_EMAIL')));
$password = (string) getenv('ADMIN_PASSWORD');
$role = strtoupper(trim((string) (getenv('ADMIN_ROLE') ?: 'OWNER')));

if (!preg_match('/^[A-Za-z0-9_.-]{3,60}$/', $username)) {
    fwrite(STDERR, "ADMIN_USERNAME must contain 3-60 letters, numbers, periods, underscores, or hyphens.\n");
    exit(2);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) {
    fwrite(STDERR, "ADMIN_EMAIL must be a valid email address.\n");
    exit(2);
}
if (strlen($password) < 12 || strlen($password) > 1024) {
    fwrite(STDERR, "ADMIN_PASSWORD must contain 12-1024 characters.\n");
    exit(2);
}
if (!in_array($role, ['OWNER', 'SUPER_ADMIN'], true)) {
    fwrite(STDERR, "ADMIN_ROLE must be OWNER or SUPER_ADMIN.\n");
    exit(2);
}

$pdo = Database::connect();
$exists = $pdo->prepare('SELECT id FROM admins WHERE username = :username OR email = :email LIMIT 1');
$exists->execute(['username' => $username, 'email' => $email]);
if ($exists->fetchColumn()) {
    fwrite(STDERR, "An administrator with that username or email already exists.\n");
    exit(1);
}

$stmt = $pdo->prepare('INSERT INTO admins (username, email, password_hash, role, is_active, session_version) VALUES (:username, :email, :hash, :role, 1, 1)');
$stmt->execute([
    'username' => $username,
    'email' => $email,
    'hash' => password_hash($password, PASSWORD_DEFAULT),
    'role' => $role,
]);
fwrite(STDOUT, "{$role} account created successfully.\n");
