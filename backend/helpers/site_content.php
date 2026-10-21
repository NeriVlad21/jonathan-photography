<?php
/**
 * Sanitises Website Content before it is stored (used by api/site/content.php).
 * Arrays are cleaned recursively, strings lose HTML tags and surrounding space,
 * scalars and null pass through. Invalid input ends the request with a 422
 * via json_error(), the API's standard error response.
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

/**
 * @param mixed $value Decoded JSON content (array, string, int, float, bool or null).
 * @return mixed The cleaned value; never returns for invalid input.
 */
function clean_content_value(mixed $value, int $depth = 0): mixed
{
    if ($depth > 8) json_error('The content structure is too deeply nested.', 422);
    if (is_array($value)) {
        if (count($value) > 30) json_error('A content section contains too many items.', 422);
        $clean = [];
        foreach ($value as $key => $item) {
            if (!is_int($key) && !preg_match('/^[A-Za-z0-9_-]{1,50}$/', (string) $key)) {
                json_error('The content contains an invalid field name.', 422);
            }
            $clean[$key] = clean_content_value($item, $depth + 1);
        }
        return $clean;
    }
    if (is_string($value)) {
        $value = trim(strip_tags($value));
        if (mb_strlen($value) > 1200) json_error('A content field exceeds the 1,200 character limit.', 422);
        return $value;
    }
    if (!is_bool($value) && !is_int($value) && !is_float($value) && $value !== null) {
        // json_error() sends the 422 response and exits, so nothing below runs
        // for unsupported values (objects, resources).
        json_error('The content contains an unsupported value.', 422);
    }
    return $value;
}
