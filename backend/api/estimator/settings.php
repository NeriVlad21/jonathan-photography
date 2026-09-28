<?php
/**
 * PUT /api/estimator/settings.php
 * Body: { range_margin }  — percentage (0–100) shown as the public estimate range.
 * Admin only. The public value is returned by /api/estimator/config.php.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/services.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$input = json_input();
$margin = $input['range_margin'] ?? null;
if (!(is_int($margin) || is_float($margin) || (is_string($margin) && is_numeric(trim($margin))))
    || !is_finite((float) $margin) || (float) $margin < 0 || (float) $margin > 100) {
    json_error('Margin must be between 0 and 100.', 422, ['range_margin' => 'Enter a percentage from 0 to 100.']);
}
$margin = round((float) $margin, 2);

$pdo = Database::connect();
$pdo->prepare(
    'INSERT INTO site_settings (setting_key, setting_value) VALUES (:key, :value)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP'
)->execute(['key' => ESTIMATOR_MARGIN_KEY, 'value' => (string) $margin]);

json_success(['range_margin' => $margin]);
