<?php
/**
 * GET /api/search.php?q=...
 * Admin only: Searches bookings and estimator leads simultaneously.
 */

declare(strict_types=1);

require_once __DIR__ . '/../middleware/cors.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../middleware/auth.php';
require_once __DIR__ . '/../config/database.php';

// Ensure only logged-in admins can search
require_admin();

$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    json_error('Method not allowed.', 405);
}

$query = $_GET['q'] ?? '';

// If search is empty, return empty arrays
if (empty(trim($query))) {
    json_success(['bookings' => [], 'leads' => []]);
}

$searchTerm = '%' . trim($query) . '%';

// Search Bookings
$stmtBookings = $pdo->prepare('
    SELECT id, name, email, shoot_type, created_at 
    FROM bookings 
    WHERE name LIKE :q OR email LIKE :q OR shoot_type LIKE :q 
    ORDER BY created_at DESC 
    LIMIT 10
');
$stmtBookings->execute(['q' => $searchTerm]);
$bookings = $stmtBookings->fetchAll();

// Search Estimator Leads
$stmtLeads = $pdo->prepare('
    SELECT id, name, email, status, created_at 
    FROM estimator_leads 
    WHERE name LIKE :q OR email LIKE :q 
    ORDER BY created_at DESC 
    LIMIT 10
');
$stmtLeads->execute(['q' => $searchTerm]);
$leads = $stmtLeads->fetchAll();

// Return combined results
json_success([
    'bookings' => $bookings,
    'leads' => $leads
]);