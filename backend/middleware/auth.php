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
    } elseif (time() - $_SESSION['_started_at'] > 1800) {
        session_regenerate_id(true);
        $_SESSION['_started_at'] = time();
    }
}

/** Blocks the request unless an admin is logged in. */
function require_admin(): array
{
    start_secure_session();
    if (empty($_SESSION['admin_id'])) {
        json_error('You must be logged in to do that.', 401);
    }
    return [
        'id'       => $_SESSION['admin_id'],
        'username' => $_SESSION['admin_username'] ?? '',
    ];
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
