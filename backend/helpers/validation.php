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
        if ($value === null || (is_string($value) && trim($value) === '')) {
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

/** Basic honeypot spam check: a hidden field that only bots fill in. */
function honeypot_tripped(array $input, string $field = 'website'): bool
{
    return !empty($input[$field]);
}

/**
 * Very small in-file rate limiter keyed by IP + action.
 * Good enough to blunt naive spam bots without needing Redis.
 */
function rate_limit_check(string $action, string $ip, int $maxPerHour): bool
{
    $dir = sys_get_temp_dir() . '/jp_rate_limit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $key = md5($action . '|' . $ip);
    $file = $dir . '/' . $key . '.json';

    $now = time();
    $windowStart = $now - 3600;
    $hits = [];

    if (is_file($file)) {
        $raw = json_decode((string) file_get_contents($file), true);
        if (is_array($raw)) {
            $hits = array_filter($raw, fn($t) => $t > $windowStart);
        }
    }

    if (count($hits) >= $maxPerHour) {
        return false;
    }

    $hits[] = $now;
    @file_put_contents($file, json_encode(array_values($hits)));
    return true;
}
