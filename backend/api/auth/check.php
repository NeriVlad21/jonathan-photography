<?php
/**
 * GET /api/auth/check.php
 * Returns the current admin session (if any) plus a fresh CSRF token.
 * The React admin app calls this on load to know whether to show the
 * login screen or the dashboard.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

start_secure_session();

if (empty($_SESSION['admin_id'])) {
    json_success(['authenticated' => false]);
}

json_success([
    'authenticated' => true,
    'admin' => ['id' => $_SESSION['admin_id'], 'username' => $_SESSION['admin_username'] ?? ''],
    'csrf_token' => issue_csrf_token(),
]);
