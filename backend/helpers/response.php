<?php
/**
 * Consistent JSON response envelope used by every endpoint:
 * { "success": true, "data": {...} }
 * { "success": false, "message": "..." }
 */

declare(strict_types=1);

function json_response_headers(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store, max-age=0');
}

function json_success($data = [], int $status = 200): void
{
    http_response_code($status);
    json_response_headers();
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $errors = []): void
{
    http_response_code($status);
    json_response_headers();
    $payload = ['success' => false, 'message' => $message];
    if (!empty($errors)) {
        $payload['errors'] = $errors;
    }
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

/** Reads and JSON-decodes the raw request body into an assoc array. */
function json_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }

    if (strlen($raw) > 1048576) {
        json_error('The request payload is too large.', 413);
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_error('The request body must contain valid JSON.', 400);
    }

    return $decoded;
}

/** Logs a technical error server-side without exposing internals to the client. */
function log_server_error(string $context, Throwable $e): void
{
    error_log(sprintf('[%s] %s in %s:%d', $context, $e->getMessage(), $e->getFile(), $e->getLine()));
}

// Keep every API failure inside the documented JSON envelope. In particular,
// a database process that restarts between connect() and the first query must
// not leak a PHP fatal-error page to the React client.
set_exception_handler(static function (Throwable $e): void {
    log_server_error('UNHANDLED_API_EXCEPTION', $e);

    if ($e instanceof PDOException) {
        json_error('The database is temporarily unavailable. Please retry in a moment.', 503);
    }

    json_error('The server could not complete that request. Please try again.', 500);
});
