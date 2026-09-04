<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$adminSession = require_admin();
$pdo = Database::connect();
$adminId = (int) $adminSession['id'];

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare(
        'SELECT id, username, email, created_at, updated_at
         FROM admins WHERE id = :id LIMIT 1'
    );
    $stmt->execute(['id' => $adminId]);
    $admin = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$admin) {
        json_error('Admin profile not found.', 404);
    }

    json_success($admin);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_csrf();
$input = json_input();

$v = new Validator($input);
$v->required('username', 'username')
    ->required('email', 'email address')
    ->email('email')
    ->required('current_password', 'current password')
    ->maxLength('username', 60)
    ->maxLength('email', 160);

if ($v->fails()) {
    json_error('Please check the profile fields.', 422, $v->errors());
}

$username = clean_string($input['username']);
$email = strtolower(clean_string($input['email']));
$currentPassword = (string) $input['current_password'];
$newPassword = (string) ($input['new_password'] ?? '');
$confirmPassword = (string) ($input['confirm_password'] ?? '');

if ($newPassword !== '') {
    if (strlen($newPassword) < 8) {
        json_error('The new password must be at least 8 characters.', 422);
    }
    if ($newPassword !== $confirmPassword) {
        json_error('The new passwords do not match.', 422);
    }
}

$stmt = $pdo->prepare(
    'SELECT password_hash FROM admins WHERE id = :id LIMIT 1'
);
$stmt->execute(['id' => $adminId]);
$existing = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$existing || !password_verify($currentPassword, $existing['password_hash'])) {
    json_error('The current password is incorrect.', 422);
}

$duplicate = $pdo->prepare(
    'SELECT id FROM admins
     WHERE (username = :username OR email = :email) AND id <> :id
     LIMIT 1'
);
$duplicate->execute([
    'username' => $username,
    'email' => $email,
    'id' => $adminId
]);

if ($duplicate->fetch()) {
    json_error('That username or email address is already in use.', 409);
}

if ($newPassword !== '') {
    $update = $pdo->prepare(
        'UPDATE admins
         SET username = :username, email = :email, password_hash = :password_hash
         WHERE id = :id'
    );
    $update->execute([
        'username' => $username,
        'email' => $email,
        'password_hash' => password_hash($newPassword, PASSWORD_DEFAULT),
        'id' => $adminId
    ]);
} else {
    $update = $pdo->prepare(
        'UPDATE admins SET username = :username, email = :email WHERE id = :id'
    );
    $update->execute([
        'username' => $username,
        'email' => $email,
        'id' => $adminId
    ]);
}

$_SESSION['admin_username'] = $username;

json_success([
    'admin' => [
        'id' => $adminId,
        'username' => $username,
        'email' => $email
    ],
    'password_changed' => $newPassword !== '',
    'message' => 'Profile updated successfully.'
]);
