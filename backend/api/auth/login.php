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
$v->required('username', 'a username or email')->string('username', 'Username or email')->maxLength('username', 160)
  ->required('password', 'a password')->string('password', 'Password')->maxLength('password', 1024);
if ($v->fails()) {
    json_error('Please enter your username and password.', 422, $v->errors());
}

// Basic brute-force throttling.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$config = require __DIR__ . '/../../config/config.php';
$normalizedIdentifier = strtolower(trim((string) ($input['username'] ?? '')));
$ipBucket = 'admin_login_ip_v2';
$identifierBucket = 'admin_login_identifier_v2';
if (!rate_limit_allowed($ipBucket, $ip, $config['rate_limit']['login_max_per_15_minutes'], 900)
    || !rate_limit_allowed($identifierBucket, $normalizedIdentifier, $config['rate_limit']['login_identifier_max_per_15_minutes'], 900)) {
    json_error('Too many login attempts. Please try again later.', 429);
}

$username = clean_string($input['username']);
$password = (string) $input['password'];

$pdo = Database::connect();
$stmt = $pdo->prepare(
    'SELECT id, username, password_hash, role, is_active, session_version, must_change_password
     FROM admins 
     WHERE (username = :username OR email = :email) AND is_active = 1
     LIMIT 1'
);

$stmt->execute([
    'username' => $username,
    'email' => $username
]);
$admin = $stmt->fetch();

$hashToVerify = $admin['password_hash'] ?? '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
if (!password_verify($password, $hashToVerify) || !$admin) {
    $ipRecorded = rate_limit_check($ipBucket, $ip, $config['rate_limit']['login_max_per_15_minutes'], 900);
    $identifierRecorded = rate_limit_check($identifierBucket, $normalizedIdentifier, $config['rate_limit']['login_identifier_max_per_15_minutes'], 900);
    if (!$ipRecorded || !$identifierRecorded) {
        json_error('Too many login attempts. Please try again later.', 429);
    }
    json_error('Incorrect username or password.', 401);
}

// A valid sign-in clears earlier failures for this address and account.
rate_limit_reset($ipBucket, $ip);
rate_limit_reset($identifierBucket, $normalizedIdentifier);

if (password_needs_rehash($admin['password_hash'], PASSWORD_DEFAULT)) {
    $pdo->prepare('UPDATE admins SET password_hash = :hash WHERE id = :id')
        ->execute(['hash' => password_hash($password, PASSWORD_DEFAULT), 'id' => $admin['id']]);
}

session_regenerate_id(true);
$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_username'] = $admin['username'];
$_SESSION['admin_role'] = $admin['role'];
$_SESSION['admin_session_version'] = (int) $admin['session_version'];
$_SESSION['csrf_token'] = bin2hex(random_bytes(32));
$_SESSION['_absolute_started_at'] = time();
$_SESSION['_last_activity'] = time();

json_success([
    'admin' => ['id' => $admin['id'], 'username' => $admin['username'], 'role' => $admin['role'], 'must_change_password' => (bool) $admin['must_change_password']],
    'csrf_token' => $_SESSION['csrf_token'],
]);
