<?php
/**
 * POST /api/auth/login.php
 * Body: { "username": "...", "password": "..." }
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

start_secure_session();

$input = json_input();

$v = new Validator($input);
$v->required('username', 'a username')->required('password', 'a password');
if ($v->fails()) {
    json_error('Please enter your username and password.', 422, $v->errors());
}

// Basic brute-force throttling.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!rate_limit_check('admin_login', $ip, 20)) {
    json_error('Too many login attempts. Please try again later.', 429);
}

$username = clean_string($input['username']);
$password = (string) $input['password'];

$pdo = Database::connect();
$stmt = $pdo->prepare(
    'SELECT id, username, password_hash 
     FROM admins 
     WHERE username = :username OR email = :email 
     LIMIT 1'
);

$stmt->execute([
    'username' => $username,
    'email' => $username
]);
$admin = $stmt->fetch();

if (!$admin || !password_verify($password, $admin['password_hash'])) {
    json_error('Incorrect username or password.', 401);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_username'] = $admin['username'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));

json_success([
    'admin' => ['id' => $admin['id'], 'username' => $admin['username']],
    'csrf_token' => $_SESSION['csrf_token'],
]);
