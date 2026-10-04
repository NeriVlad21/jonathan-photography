<?php
/**
 * Small, dependency-free validation toolkit.
 * Never trust client-side validation alone — every public endpoint
 * re-checks its input here.
 */

declare(strict_types=1);

final class Validator
{
    private array $data;
    private array $errors = [];

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function required(string $field, string $label = null): self
    {
        $label = $label ?? $field;
        $value = $this->data[$field] ?? null;
        if ($value === null || (is_string($value) && trim(strip_tags($value)) === '')) {
            $this->errors[$field] = "Please provide {$label}.";
        }
        return $this;
    }

    public function email(string $field): self
    {
        $value = $this->data[$field] ?? null;
        if ($value && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = 'Please enter a valid email address.';
        }
        return $this;
    }

    public function maxLength(string $field, int $max): self
    {
        $value = $this->data[$field] ?? null;
        if (is_string($value) && mb_strlen($value) > $max) {
            $this->errors[$field] = ucfirst($field) . " must be under {$max} characters.";
        }
        return $this;
    }

    public function string(string $field, string $label = null): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && !is_string($value)) {
            $this->errors[$field] = ($label ?? ucfirst($field)) . ' must be text.';
        }
        return $this;
    }

    public function positiveInteger(string $field, string $label = null): self
    {
        $value = $this->data[$field] ?? null;
        $valid = is_int($value) ? $value > 0 : (is_string($value) && ctype_digit($value) && (int) $value > 0);
        if ($value !== null && $value !== '' && !$valid) {
            $this->errors[$field] = 'Please provide a valid ' . ($label ?? $field) . '.';
        }
        return $this;
    }

    public function integer(string $field, int $min, int $max): self
    {
        $value = $this->data[$field] ?? null;
        if ($value === null || $value === '') return $this;
        $valid = is_int($value) || (is_string($value) && preg_match('/^-?\d+$/', $value));
        if (!$valid || (int) $value < $min || (int) $value > $max) {
            $this->errors[$field] = ucfirst($field) . " must be a whole number from {$min} to {$max}.";
        }
        return $this;
    }

    public function boolean(string $field): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && !in_array($value, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
            $this->errors[$field] = 'Invalid value for ' . $field . '.';
        }
        return $this;
    }

    public function date(string $field, bool $allowEmpty = true): self
    {
        $value = $this->data[$field] ?? null;
        if (($value === null || $value === '') && $allowEmpty) return $this;
        if (!is_string($value)) {
            $this->errors[$field] = 'Please provide a valid date.';
            return $this;
        }
        $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
        if (!$parsed || $parsed->format('Y-m-d') !== $value) {
            $this->errors[$field] = 'Please provide a valid date.';
        }
        return $this;
    }

    public function boolTrue(string $field, string $message): self
    {
        $value = $this->data[$field] ?? null;
        if (!($value === true || $value === 1 || $value === '1' || $value === 'true')) {
            $this->errors[$field] = $message;
        }
        return $this;
    }

    public function inList(string $field, array $allowed): self
    {
        $value = $this->data[$field] ?? null;
        if ($value !== null && $value !== '' && !in_array($value, $allowed, true)) {
            $this->errors[$field] = 'Invalid value for ' . $field . '.';
        }
        return $this;
    }

    public function fails(): bool
    {
        return count($this->errors) > 0;
    }

    public function errors(): array
    {
        return $this->errors;
    }
}

/** Strips tags and trims — use for any free-text field before storing/echoing. */
function clean_string($value): string
{
    if (!is_string($value)) {
        return '';
    }
    return trim(strip_tags($value));
}

function boolean_input(mixed $value): ?int
{
    if (in_array($value, [true, 1, '1', 'true'], true)) return 1;
    if (in_array($value, [false, 0, '0', 'false'], true)) return 0;
    return null;
}

function positive_integer_input(mixed $value): int
{
    if (is_int($value)) return $value > 0 ? $value : 0;
    if (is_string($value) && ctype_digit($value)) return (int) $value > 0 ? (int) $value : 0;
    return 0;
}

/**
 * Normalizes a money amount (number or numeric string) to 2 decimals.
 * Returns null for anything non-numeric, non-finite, negative, or too large.
 */
function money_input($value, float $max = 9999999.99): ?float
{
    if (!(is_int($value) || is_float($value) || (is_string($value) && is_numeric(trim($value))))) {
        return null;
    }
    $amount = (float) $value;
    if (!is_finite($amount) || $amount < 0 || $amount > $max) {
        return null;
    }
    return round($amount, 2);
}

/**
 * True when a public link is safe to render as an href: either no scheme
 * (e.g. "facebook.com/studio") or an allow-listed one. Blocks javascript:,
 * data:, vbscript: and similar, including variants hidden with whitespace or
 * control characters that browsers ignore.
 */
function is_safe_link(string $link): bool
{
    $probe = preg_replace('/[\x00-\x20\x7F]+/', '', $link) ?? '';
    if (preg_match('/^([a-z][a-z0-9+.-]*):/i', $probe, $m)) {
        return in_array(strtolower($m[1]), ['http', 'https', 'mailto', 'tel', 'sms', 'viber'], true);
    }
    return true;
}

/** Basic honeypot spam check: a hidden field that only bots fill in. */
function honeypot_tripped(array $input, string $field = 'website'): bool
{
    return !empty($input[$field]);
}

/**
 * Very small in-file rate limiter keyed by IP + action.
 * Good enough to blunt naive spam bots without needing Redis.
 */
function rate_limit_check(string $action, string $ip, int $maxHits, int $windowSeconds = 3600): bool
{
    $dir = sys_get_temp_dir() . '/jp_rate_limit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $key = hash('sha256', $action . '|' . $ip);
    $file = $dir . '/' . $key . '.json';

    $now = time();
    $windowStart = $now - max(60, $windowSeconds);
    $hits = [];
    $handle = @fopen($file, 'c+');
    if ($handle === false) return false;
    try {
        if (!flock($handle, LOCK_EX)) return false;
        rewind($handle);
        $raw = json_decode((string) stream_get_contents($handle), true);
        if (is_array($raw)) {
            $hits = array_values(array_filter($raw, fn($t) => is_int($t) && $t > $windowStart));
        }
        if (count($hits) >= $maxHits) return false;
        $hits[] = $now;
        ftruncate($handle, 0);
        rewind($handle);
        fwrite($handle, json_encode($hits, JSON_THROW_ON_ERROR));
        fflush($handle);
        return true;
    } finally {
        flock($handle, LOCK_UN);
        fclose($handle);
    }
}
