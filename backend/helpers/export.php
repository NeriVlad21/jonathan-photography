<?php
/**
 * Shared helpers for read-only record exports (Super Admin archives and
 * platform support reports): query-parameter validation, CSV safety, and a
 * streamed CSV response with a safe filename.
 */

declare(strict_types=1);

const EXPORT_MAX_ROWS = 1000;

/** Optional YYYY-MM-DD query parameter; rejects anything else with a 422. */
function export_date_param(string $name, string $label): ?string
{
    $value = trim((string) ($_GET[$name] ?? ''));
    if ($value === '') return null;
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    if (!$date || $date->format('Y-m-d') !== $value) {
        json_error("Use a valid {$label} (YYYY-MM-DD).", 422, [$name => 'Invalid date.']);
    }
    return $value;
}

/** Validates an optional date range and that it is not reversed. */
function export_date_range(): array
{
    $from = export_date_param('from', 'start date');
    $to = export_date_param('to', 'end date');
    if ($from !== null && $to !== null && $from > $to) {
        json_error('The start date cannot be later than the end date.', 422, ['from' => 'Start date is after end date.']);
    }
    return [$from, $to];
}

/** Optional value that must be one of an allow-list (case-insensitive). */
function export_enum_param(string $name, array $allowed, string $label): ?string
{
    $value = strtoupper(trim((string) ($_GET[$name] ?? '')));
    if ($value === '' || $value === 'ALL') return null;
    if (!in_array($value, $allowed, true)) json_error("Unknown {$label}.", 422, [$name => 'Not an allowed value.']);
    return $value;
}

/** Free-text search, trimmed and capped; matched with bound LIKE parameters. */
function export_search_param(): string
{
    $value = trim((string) ($_GET['q'] ?? ''));
    return mb_substr(preg_replace('/\s+/u', ' ', $value) ?? '', 0, 120);
}

/** Escapes % and _ so user search text is matched literally inside LIKE. */
function export_like(string $value): string
{
    return '%' . addcslashes($value, '%_\\') . '%';
}

/**
 * Neutralises spreadsheet formula injection: text cells that begin with
 * = + - @ (or a tab/carriage return) are prefixed with an apostrophe.
 * Numeric cells are passed as numbers and left untouched.
 */
function csv_safe_cell($value): string
{
    if ($value === null) return '';
    if (is_int($value) || is_float($value)) return (string) $value;
    $text = (string) $value;
    $text = str_replace(["\r\n", "\r"], "\n", $text);
    if ($text !== '' && in_array($text[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
        $text = "'" . $text;
    }
    return $text;
}

/** Keeps only safe filename characters (no paths, quotes, or separators). */
function export_safe_filename(string $base, string $extension): string
{
    $clean = preg_replace('/[^A-Za-z0-9._-]+/', '-', $base) ?? 'export';
    $clean = trim($clean, '-.');
    return ($clean !== '' ? substr($clean, 0, 80) : 'export') . '.' . $extension;
}

/** Streams rows as UTF-8 CSV (with BOM for spreadsheet apps) and exits. */
function stream_csv(string $filename, array $headers, iterable $rows): void
{
    http_response_code(200);
    header('Content-Type: text/csv; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    header('Cache-Control: no-store, max-age=0');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'wb');
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $headers, ',', '"', '');
    foreach ($rows as $row) {
        fputcsv($out, array_map('csv_safe_cell', $row), ',', '"', '');
    }
    fclose($out);
    exit;
}
