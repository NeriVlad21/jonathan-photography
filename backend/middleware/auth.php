<?php
/**
 * Session bootstrap + admin auth guard + CSRF protection.
 *
 * require_once this file, then call require_admin() at the top of any
 * endpoint that should only be reachable by a logged-in admin.
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/config.php';

function start_secure_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    $config = require __DIR__ . '/../config/config.php';
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

    if ($config['app_env'] === 'production') {
        $secret = (string) ($config['app_secret'] ?? '');
        if (strlen($secret) < 32 || $secret === 'change-this-to-a-long-random-string') {
            error_log('[AUTH] Production APP_SECRET is missing or unsafe.');
            json_error('Authentication is temporarily unavailable because the server is not configured securely.', 503);
        }
        if (!$isHttps) {
            error_log('[AUTH] Refusing to create a production admin session without HTTPS.');
            json_error('Secure HTTPS is required for administrator access.', 503);
        }
    }

    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.cookie_httponly', '1');
    ini_set('session.sid_length', '48');
    ini_set('session.sid_bits_per_character', '6');
    session_name($config['session']['name']);
    session_set_cookie_params([
        'lifetime' => $config['session']['lifetime_seconds'],
        'path'     => '/',
        'secure'   => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();

    // Rotate periodically to reduce session fixation risk.
    if (empty($_SESSION['_started_at'])) {
        $_SESSION['_started_at'] = time();
        $_SESSION['_absolute_started_at'] = time();
    } elseif (time() - $_SESSION['_started_at'] > 1800) {
        session_regenerate_id(true);
        $_SESSION['_started_at'] = time();
    }
}

function clear_admin_session(): void
{
    start_secure_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'domain' => $params['domain'],
            'secure' => $params['secure'],
            'httponly' => $params['httponly'],
            'samesite' => $params['samesite'] ?? 'Lax',
        ]);
    }
    session_destroy();
}

/** Blocks the request unless an admin is logged in. */
function require_admin(): array
{
    start_secure_session();
    $config = require __DIR__ . '/../config/config.php';
    $now = time();
    $lastActivity = (int) ($_SESSION['_last_activity'] ?? $now);
    $absoluteStart = (int) ($_SESSION['_absolute_started_at'] ?? $now);
    if (!empty($_SESSION['admin_id']) && (
        $now - $lastActivity > $config['session']['idle_seconds'] ||
        $now - $absoluteStart > $config['session']['lifetime_seconds']
    )) {
        clear_admin_session();
        json_error('Your admin session expired. Please sign in again.', 401);
    }
    if (empty($_SESSION['admin_id'])) {
        json_error('You must be logged in to do that.', 401);
    }

    // Re-check the account on every protected request. This immediately
    // invalidates an old owner's session after a Super Admin transfers
    // ownership or deactivates the account.
    require_once __DIR__ . '/../config/database.php';
    $pdo = Database::connect();
    $stmt = $pdo->prepare(
        'SELECT id, username, role, is_active, session_version FROM admins WHERE id = :id LIMIT 1'
    );
    $stmt->execute(['id' => (int) $_SESSION['admin_id']]);
    $account = $stmt->fetch(PDO::FETCH_ASSOC);

    if (
        !$account ||
        (int) $account['is_active'] !== 1 ||
        (int) $account['session_version'] !== (int) ($_SESSION['admin_session_version'] ?? 0)
    ) {
        clear_admin_session();
        json_error('This administrator account is no longer active.', 401);
    }

    $_SESSION['admin_username'] = (string) $account['username'];
    $_SESSION['admin_role'] = (string) $account['role'];
    $_SESSION['_last_activity'] = $now;
    return [
        'id'       => (int) $account['id'],
        'username' => (string) $account['username'],
        'role'     => (string) $account['role'],
    ];
}

/** Blocks the request unless the current account has the required role. */
function require_role(string $role): array
{
    $admin = require_admin();
    if (($admin['role'] ?? '') !== $role) {
        json_error('You do not have permission to perform this action.', 403);
    }
    return $admin;
}

function require_super_admin(): array
{
    return require_role('SUPER_ADMIN');
}

/** Issues a CSRF token for the current session (called by /api/auth/check.php). */
function issue_csrf_token(): string
{
    start_secure_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/** Verifies the X-CSRF-Token header on state-changing admin requests. */
function require_csrf(): void
{
    start_secure_session();
    $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $expected = $_SESSION['csrf_token'] ?? '';
    if ($expected === '' || !hash_equals($expected, $sent)) {
        json_error('Your session expired. Please refresh and try again.', 403);
    }
}
