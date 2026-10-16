<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/oversight.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$admin = require_superadmin();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed.', 405);
require_csrf();
$input = json_input();
$allowed = ['CALENDAR_EVENT','PORTFOLIO_SHOOT','PORTFOLIO_IMAGE'];
$validator = new Validator($input);
$validator->required('resource_type')->inList('resource_type', $allowed)
    ->required('resource_id')->string('resource_id')->maxLength('resource_id', 120);
if ($validator->fails()) json_error('Invalid oversight access entry.', 422, $validator->errors());
log_superadmin_access(Database::connect(), $admin, (string) $input['resource_type'], clean_string($input['resource_id']));
json_success(['logged' => true]);
