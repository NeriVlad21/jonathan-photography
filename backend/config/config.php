<?php
/**
 * Central application configuration.
 * Everything here reads from environment variables — nothing sensitive
 * is hardcoded, per project requirements.
 */

declare(strict_types=1);

require_once __DIR__ . '/env.php';

return [
    'app_env'      => env('APP_ENV', 'production'),
    'app_url'      => env('APP_URL', 'http://localhost:8000'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    'app_secret'   => env('APP_SECRET', ''),

    'db' => [
        'host'     => env('DB_HOST', '127.0.0.1'),
        'port'     => env('DB_PORT', '3306'),
        'name'     => env('DB_NAME', 'jonathan_photography'),
        'user'     => env('DB_USER', 'root'),
        'password' => env('DB_PASSWORD', ''),
    ],

    'smtp' => [
        'host'        => env('SMTP_HOST', ''),
        'port'        => (int) env('SMTP_PORT', 587),
        'username'    => env('SMTP_USERNAME', ''),
        'password'    => env('SMTP_PASSWORD', ''),
        'from_email'  => env('SMTP_FROM_EMAIL', 'mereziko@gmail.com'),
        'from_name'   => env('SMTP_FROM_NAME', 'Jonathan Photography'),
        'admin_email' => env('SMTP_ADMIN_EMAIL', env('SMTP_FROM_EMAIL', '')),
    ],

    'uploads' => [
        // Absolute path on disk.
        'path'          => __DIR__ . '/../uploads/portfolio',
        // Path as served publicly (adjust to match your web server's document root).
        'public_path'   => '/uploads/portfolio',
        'max_bytes'     => 8 * 1024 * 1024, // 8 MB per image
        'max_pixels'    => 40 * 1000 * 1000, // decompression-bomb guard
        'allowed_mimes' => [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        ],
    ],

    'session' => [
        'name'            => 'jp_admin_session',
        'lifetime_seconds' => 60 * 60 * 8, // 8 hours
        'idle_seconds'     => 60 * 30,
    ],

    // Basic in-memory rate limit for public form submissions (per IP).
    'rate_limit' => [
        'booking_max_per_hour' => 6,
        'lead_max_per_hour'    => 12,
        'login_max_per_15_minutes' => 10,
        'login_identifier_max_per_15_minutes' => 5,
    ],
];
