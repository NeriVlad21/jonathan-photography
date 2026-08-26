<?php
/**
 * Minimal .env loader — no Composer dependency required for this piece.
 * Reads backend/.env and exposes values through getenv()/$_ENV.
 */

declare(strict_types=1);

function load_env(string $path): void
{
    static $loaded = false;
    if ($loaded) {
        return;
    }

    if (!is_file($path)) {
        // Fall back silently to real environment variables (e.g. set by the host).
        $loaded = true;
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        // Strip matching surrounding quotes.
        if (strlen($value) >= 2 && (
            ($value[0] === '"' && $value[-1] === '"') ||
            ($value[0] === "'" && $value[-1] === "'")
        )) {
            $value = substr($value, 1, -1);
        }
        if ($key !== '') {
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }

    $loaded = true;
}

load_env(__DIR__ . '/../.env');

/** Convenience getter with a default fallback. */
function env(string $key, $default = null)
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}
