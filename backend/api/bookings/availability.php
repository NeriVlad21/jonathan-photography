<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_error('Method not allowed.', 405);
}

$month = (string) ($_GET['month'] ?? date('Y-m'));
if (!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/', $month)) {
    json_error('Please provide a valid month.', 422);
}

$start = $month . '-01';
$end = date('Y-m-d', strtotime($start . ' +1 month'));
$pdo = Database::connect();

$stmt = $pdo->prepare(
    'SELECT event_date,
            CASE
              WHEN SUM(status = \'BOOKED\') > 0 THEN \'BOOKED\'
              ELSE \'REQUESTED\'
            END AS availability_status
     FROM calendar_events
     WHERE status IN (\'REQUESTED\', \'BOOKED\')
       AND event_date >= :start
       AND event_date < :end
     GROUP BY event_date
     ORDER BY event_date'
);
$stmt->execute(['start' => $start, 'end' => $end]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
$requestedDates = [];
$bookedDates = [];

foreach ($rows as $row) {
    if ($row['availability_status'] === 'BOOKED') {
        $bookedDates[] = $row['event_date'];
    } else {
        $requestedDates[] = $row['event_date'];
    }
}

json_success([
    'month' => $month,
    'unavailable_dates' => array_values(array_merge($requestedDates, $bookedDates)),
    'requested_dates' => $requestedDates,
    'booked_dates' => $bookedDates,
]);
