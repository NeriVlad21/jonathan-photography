<?php
/**
 * Consistent JSON response envelope used by every endpoint:
 * { "success": true, "data": {...} }
 * { "success": false, "message": "..." }
 */

declare(strict_types=1);

function json_success($data = [], int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_SLASHES);
    exit;
}

function json_error(string $message, int $status = 400, array $errors = []): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
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
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

/** Logs a technical error server-side without exposing internals to the client. */
function log_server_error(string $context, Throwable $e): void
{
    error_log(sprintf('[%s] %s in %s:%d', $context, $e->getMessage(), $e->getFile(), $e->getLine()));
}
