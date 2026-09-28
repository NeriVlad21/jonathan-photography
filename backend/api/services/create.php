<?php
/**
 * POST /api/services/create.php
 * Body: { name, category, description, starting_price, sort_order?, visible?,
 *         inclusions?, coverage_details?, deliverables?, package_options?, notes? }
 * Admin only.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/services.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_error('Method not allowed.', 405);
}

require_admin();
require_csrf();

$pdo = Database::connect();
$input = json_input();

[$clean, $errors] = normalize_service_input($input, true);
if ($errors) json_error('Please fix the errors below.', 422, $errors);

$name = $clean['name'];
$slugBase = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $name), '-'));
$slugBase = $slugBase !== '' ? substr($slugBase, 0, 160) : 'service-' . bin2hex(random_bytes(3));
$slug = $slugBase;
$i = 1;
$check = $pdo->prepare('SELECT COUNT(*) FROM services WHERE slug = :s');
do {
    $check->execute(['s' => $slug]);
    if ((int) $check->fetchColumn() === 0) break;
    $slug = $slugBase . '-' . (++$i);
} while (true);

if (!array_key_exists('sort_order', $clean)) {
    $clean['sort_order'] = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM services')->fetchColumn() + 1;
}

$stmt = $pdo->prepare(
    'INSERT INTO services
        (name, slug, category, description, inclusions, coverage_details, deliverables,
         package_options, notes, starting_price, sort_order, visible)
     VALUES
        (:name, :slug, :cat, :desc, :inclusions, :coverage, :deliverables,
         :options, :notes, :price, :sort, :visible)'
);
$stmt->execute([
    'name'         => $name,
    'slug'         => $slug,
    'cat'          => $clean['category'] ?? 'photography',
    'desc'         => $clean['description'] ?? '',
    'inclusions'   => $clean['inclusions'] ?? null,
    'coverage'     => $clean['coverage_details'] ?? null,
    'deliverables' => $clean['deliverables'] ?? null,
    'options'      => $clean['package_options'] ?? null,
    'notes'        => $clean['notes'] ?? null,
    'price'        => $clean['starting_price'] ?? null,
    'sort'         => $clean['sort_order'],
    'visible'      => $clean['visible'] ?? 1,
]);

$id = (int) $pdo->lastInsertId();
$row = $pdo->prepare('SELECT ' . SERVICE_COLUMNS . ' FROM services WHERE id = :id');
$row->execute(['id' => $id]);
json_success(present_service($row->fetch(PDO::FETCH_ASSOC)), 201);
