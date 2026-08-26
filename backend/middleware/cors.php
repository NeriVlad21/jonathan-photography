<?php
/**
 * CORS handling. The API only accepts requests from the configured
 * frontend origin, and allows credentials so the admin session cookie
 * can be sent cross-port during local development (React on :5173,
 * PHP on :8000).
 */

declare(strict_types=1);

$config = require __DIR__ . '/../config/config.php';
$allowedOrigin = $config['frontend_url'];

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin === $allowedOrigin) {
    header('Access-Control-Allow-Origin: ' . $allowedOrigin);
    header('Access-Control-Allow-Credentials: true');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('Vary: Origin');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
