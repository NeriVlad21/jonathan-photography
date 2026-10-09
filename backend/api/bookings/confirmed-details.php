<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

require_admin();
json_error('This endpoint has been retired. Use the agreed-details endpoint so booking, calendar, invoice, and platform-fee data stay synchronized.', 410);
