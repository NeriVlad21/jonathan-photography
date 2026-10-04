<?php
/**
 * Shared service/package rules. Every endpoint that reads or writes the
 * services table goes through these helpers so the public Services page,
 * the estimator, and the admin screens all see the same record shape.
 */

declare(strict_types=1);

require_once __DIR__ . '/response.php';

/** Package-detail columns => key used in the public `details` object. */
const SERVICE_DETAIL_FIELDS = [
    'inclusions'       => 'included',
    'coverage_details' => 'coverage',
    'deliverables'     => 'deliverables',
    'package_options'  => 'options',
    'notes'            => 'notes',
];

const SERVICE_DETAIL_MAX_CHARS = 2000;
const SERVICE_DETAIL_MAX_LINES = 30;
const SERVICE_MAX_PRICE = 9999999.99;

const SERVICE_COLUMNS =
    'id, name, slug, category, description, inclusions, coverage_details, deliverables,
     package_options, notes, starting_price, visible, sort_order';

/** Splits a stored detail column into display lines. */
function service_detail_lines(?string $value): array
{
    if ($value === null || trim($value) === '') {
        return [];
    }
    $lines = preg_split('/\R/u', $value) ?: [];
    return array_values(array_filter(array_map('trim', $lines), static fn($line) => $line !== ''));
}

/** Casts a database row into the API shape used by every client. */
function present_service(array $row): array
{
    $details = [];
    foreach (SERVICE_DETAIL_FIELDS as $column => $key) {
        $details[$key] = service_detail_lines($row[$column] ?? null);
    }

    return [
        'id'               => (int) $row['id'],
        'name'             => (string) $row['name'],
        'slug'             => (string) $row['slug'],
        'category'         => (string) ($row['category'] ?? 'photography'),
        'description'      => (string) ($row['description'] ?? ''),
        'inclusions'       => (string) ($row['inclusions'] ?? ''),
        'coverage_details' => (string) ($row['coverage_details'] ?? ''),
        'deliverables'     => (string) ($row['deliverables'] ?? ''),
        'package_options'  => (string) ($row['package_options'] ?? ''),
        'notes'            => (string) ($row['notes'] ?? ''),
        'details'          => $details,
        'starting_price'   => $row['starting_price'] !== null ? (float) $row['starting_price'] : null,
        'visible'          => !empty($row['visible']) ? 1 : 0,
        'sort_order'       => (int) ($row['sort_order'] ?? 0),
    ];
}

/**
 * Validates and normalizes service input. Returns [clean values, errors].
 * Only keys present in $input are returned, so updates can be partial.
 */
function normalize_service_input(array $input, bool $requireName): array
{
    $clean = [];
    $errors = [];

    if ($requireName || array_key_exists('name', $input)) {
        $name = is_string($input['name'] ?? null) ? trim(strip_tags($input['name'])) : '';
        if ($name === '') {
            $errors['name'] = 'Please provide a service name.';
        } elseif (mb_strlen($name) > 160) {
            $errors['name'] = 'Name must be under 160 characters.';
        }
        $clean['name'] = $name;
    }

    if (array_key_exists('category', $input)) {
        $category = is_string($input['category']) ? strtolower(trim($input['category'])) : '';
        if ($category === '') {
            $category = 'photography';
        }
        if (!preg_match('/^[a-z0-9-]{1,60}$/', $category)) {
            $errors['category'] = 'Choose a valid service section.';
        }
        $clean['category'] = $category;
    }

    if (array_key_exists('description', $input)) {
        $description = $input['description'];
        if ($description !== null && !is_string($description)) {
            $errors['description'] = 'Description must be text.';
            $description = '';
        }
        $description = trim(strip_tags((string) $description));
        if (mb_strlen($description) > 1200) {
            $errors['description'] = 'Description must be under 1200 characters.';
        }
        $clean['description'] = $description;
    }

    foreach (array_keys(SERVICE_DETAIL_FIELDS) as $field) {
        if (!array_key_exists($field, $input)) {
            continue;
        }
        $value = $input[$field];
        // Accept either newline-separated text or a list of lines.
        if (is_array($value)) {
            $value = implode("\n", array_map(static fn($v) => is_scalar($v) ? (string) $v : '', $value));
        } elseif ($value !== null && !is_string($value)) {
            $errors[$field] = 'This field must be text.';
            continue;
        }
        $value = strip_tags((string) $value);
        if (mb_strlen($value) > SERVICE_DETAIL_MAX_CHARS) {
            $errors[$field] = 'Keep this section under ' . SERVICE_DETAIL_MAX_CHARS . ' characters.';
            continue;
        }
        // Normalize: one trimmed item per line, drop typed bullet markers and blanks.
        $lines = array_map(
            static fn($line) => trim((string) preg_replace('/^\s*(?:[-*•]\s+)/u', '', $line)),
            preg_split('/\R/u', $value) ?: []
        );
        $lines = array_values(array_filter($lines, static fn($line) => $line !== ''));
        if (count($lines) > SERVICE_DETAIL_MAX_LINES) {
            $errors[$field] = 'Keep this section to ' . SERVICE_DETAIL_MAX_LINES . ' lines or fewer.';
            continue;
        }
        foreach ($lines as $line) {
            if (mb_strlen($line) > 300) {
                $errors[$field] = 'Each line must be under 300 characters.';
                continue 2;
            }
        }
        $clean[$field] = $lines ? implode("\n", $lines) : null;
    }

    if (array_key_exists('starting_price', $input)) {
        $price = $input['starting_price'];
        if ($price === null || $price === '') {
            $clean['starting_price'] = null;
        } elseif ((is_int($price) || is_float($price) || (is_string($price) && is_numeric(trim($price))))
            && is_finite((float) $price)) {
            $price = round((float) $price, 2);
            if ($price < 0 || $price > SERVICE_MAX_PRICE) {
                $errors['starting_price'] = 'Starting price must be between 0 and 9,999,999.99.';
            }
            $clean['starting_price'] = $price;
        } else {
            $errors['starting_price'] = 'Starting price must be a number.';
        }
    }

    if (array_key_exists('visible', $input)) {
        $visible = $input['visible'];
        if (!in_array($visible, [true, false, 0, 1, '0', '1', 'true', 'false'], true)) {
            $errors['visible'] = 'Invalid visibility value.';
        } else {
            $clean['visible'] = in_array($visible, [true, 1, '1', 'true'], true) ? 1 : 0;
        }
    }

    if (array_key_exists('sort_order', $input)) {
        $sort = $input['sort_order'];
        if ($sort === null || $sort === '') {
            $sort = 0;
        }
        if (!is_numeric($sort) || (int) $sort != $sort || abs((int) $sort) > 100000) {
            $errors['sort_order'] = 'Sort order must be a whole number.';
        } else {
            $clean['sort_order'] = (int) $sort;
        }
    }

    return [$clean, $errors];
}

const ESTIMATOR_MARGIN_KEY = 'estimator_range_margin';
const ESTIMATOR_MARGIN_DEFAULT = 15.0;

/** Percentage added on top of the baseline to show the public estimate range. */
function read_estimator_margin(PDO $pdo): float
{
    $stmt = $pdo->prepare('SELECT setting_value FROM site_settings WHERE setting_key = :key');
    $stmt->execute(['key' => ESTIMATOR_MARGIN_KEY]);
    $value = $stmt->fetchColumn();
    if ($value === false || !is_numeric($value)) {
        return ESTIMATOR_MARGIN_DEFAULT;
    }
    return max(0.0, min(100.0, (float) $value));
}

/** Reads a positive integer id from a scalar, or returns 0. */
function positive_id($value): int
{
    if (is_int($value)) {
        return $value > 0 ? $value : 0;
    }
    if (is_string($value) && ctype_digit($value)) {
        $id = (int) $value;
        return $id > 0 ? $id : 0;
    }
    return 0;
}
