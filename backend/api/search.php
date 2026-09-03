<?php
/**
 * GET /api/search.php?q=...
 * Admin only: Searches bookings, estimator leads, and contacts simultaneously.
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
    json_success(['bookings' => [], 'leads' => [], 'contacts' => []]);
}

$searchTerm = '%' . trim($query) . '%';
$bookings = [];
$leads = [];
$contacts = [];

// 1. Search Bookings
try {
    $stmtBookings = $pdo->prepare('
        SELECT id, name, email, shoot_type, created_at, reference_code, phone 
        FROM bookings 
        WHERE name LIKE ? 
           OR email LIKE ? 
           OR shoot_type LIKE ? 
           OR reference_code LIKE ? 
           OR phone LIKE ? 
           OR facebook LIKE ?
        ORDER BY created_at DESC 
        LIMIT 10
    ');
    $stmtBookings->execute([$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
    $bookings = $stmtBookings->fetchAll(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    // If a column is missing, fail silently and return empty array
    $bookings = [];
}

// 2. Search Estimator Leads
try {
    $stmtLeads = $pdo->prepare('
        SELECT id, name, email, status, created_at 
        FROM estimator_leads 
        WHERE name LIKE ? 
           OR email LIKE ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ');
    $stmtLeads->execute([$searchTerm, $searchTerm]);
    $leads = $stmtLeads->fetchAll(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    $leads = [];
}

// 3. Search Contacts (Wrapped in try/catch because the table doesn't exist!)
try {
    $stmtContacts = $pdo->prepare('
        SELECT id, name, email, created_at 
        FROM contacts 
        WHERE name LIKE ? 
           OR email LIKE ? 
        ORDER BY created_at DESC 
        LIMIT 10
    ');
    $stmtContacts->execute([$searchTerm, $searchTerm]);
    $contacts = $stmtContacts->fetchAll(PDO::FETCH_ASSOC) ?: [];
} catch (Throwable $e) {
    // Fails safely since 'contacts' table is missing!
    $contacts = [];
}

// Return combined results safely
json_success([
    'bookings' => $bookings,
    'leads' => $leads,
    'contacts' => $contacts
]);