<?php
/**
 * CORS handling. The API only accepts requests from the configured
 * frontend origin, and allows credentials so the admin session cookie
 * can be sent cross-port during local development (React on :5173,
 * PHP on :8000).
 */

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
$configuredOrigin = rtrim((string) $config['frontend_url'], '/');

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$normalizedOrigin = rtrim($requestOrigin, '/');
$originHost = strtolower((string) parse_url($normalizedOrigin, PHP_URL_HOST));
$originPort = (int) (parse_url($normalizedOrigin, PHP_URL_PORT) ?: 0);
$originScheme = strtolower((string) parse_url($normalizedOrigin, PHP_URL_SCHEME));
$isConfiguredOrigin = $normalizedOrigin !== '' && hash_equals($configuredOrigin, $normalizedOrigin);
$isLocalViteOrigin = in_array($originHost, ['localhost', '127.0.0.1'], true)
    && $originScheme === 'http'
    && $originPort >= 5173
    && $originPort <= 5199;
$isAllowedOrigin = $isConfiguredOrigin || $isLocalViteOrigin;

if ($isAllowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $normalizedOrigin);
    header('Access-Control-Allow-Credentials: true');
}

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
header('Cache-Control: no-store');

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Vary: Origin');

if ($requestOrigin !== '' && !$isAllowedOrigin) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Origin not allowed.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
