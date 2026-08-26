<?php
/**
 * /api/portfolio/categories.php
 *
 * GET    ?all=1            (admin) list every category, visible or not
 * GET                      (public) list visible categories only
 * POST   { name, description }              — admin, create
 * PUT    { id, name, description, visible, sort_order } — admin, update
 * DELETE ?id=1                               — admin, delete (cascades shoots+images)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

function slugify(string $text): string
{
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $text), '-'));
    return $slug !== '' ? $slug : 'category-' . bin2hex(random_bytes(3));
}

if ($method === 'GET') {
    $wantAll = isset($_GET['all']);
    if ($wantAll) {
        require_admin();
        $stmt = $pdo->query('SELECT * FROM portfolio_categories ORDER BY sort_order ASC, id ASC');
    } else {
        $stmt = $pdo->query('SELECT * FROM portfolio_categories WHERE visible = 1 ORDER BY sort_order ASC, id ASC');
    }
    json_success($stmt->fetchAll());
}

if ($method === 'POST') {
    require_admin();
    require_csrf();
    $input = json_input();

    $v = new Validator($input);
    $v->required('name', 'a category name')->maxLength('name', 120);
    if ($v->fails()) {
        json_error('Please fix the errors below.', 422, $v->errors());
    }

    $name = clean_string($input['name']);
    $slugBase = slugify($name);
    $slug = $slugBase;
    $i = 1;
    $check = $pdo->prepare('SELECT COUNT(*) FROM portfolio_categories WHERE slug = :s');
    do {
        $check->execute(['s' => $slug]);
        if ((int) $check->fetchColumn() === 0) break;
        $slug = $slugBase . '-' . (++$i);
    } while (true);

    $maxOrder = (int) $pdo->query('SELECT COALESCE(MAX(sort_order),0) FROM portfolio_categories')->fetchColumn();

    $stmt = $pdo->prepare('INSERT INTO portfolio_categories (name, slug, description, sort_order, visible) VALUES (:name, :slug, :desc, :sort, 1)');
    $stmt->execute([
        'name' => $name,
        'slug' => $slug,
        'desc' => clean_string($input['description'] ?? ''),
        'sort' => $maxOrder + 1,
    ]);

    $id = (int) $pdo->lastInsertId();
    $row = $pdo->prepare('SELECT * FROM portfolio_categories WHERE id = :id');
    $row->execute(['id' => $id]);
    json_success($row->fetch(), 201);
}

if ($method === 'PUT') {
    require_admin();
    require_csrf();
    $input = json_input();

    $v = new Validator($input);
    $v->required('id')->required('name', 'a category name');
    if ($v->fails()) {
        json_error('Please fix the errors below.', 422, $v->errors());
    }

    $stmt = $pdo->prepare(
        'UPDATE portfolio_categories SET name = :name, description = :desc, visible = :visible, sort_order = :sort WHERE id = :id'
    );
    $stmt->execute([
        'name'    => clean_string($input['name']),
        'desc'    => clean_string($input['description'] ?? ''),
        'visible' => !empty($input['visible']) ? 1 : 0,
        'sort'    => (int) ($input['sort_order'] ?? 0),
        'id'      => (int) $input['id'],
    ]);

    $row = $pdo->prepare('SELECT * FROM portfolio_categories WHERE id = :id');
    $row->execute(['id' => (int) $input['id']]);
    $category = $row->fetch();
    if (!$category) {
        json_error('Category not found.', 404);
    }
    json_success($category);
}

if ($method === 'DELETE') {
    require_admin();
    require_csrf();
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) {
        json_error('Missing category id.', 422);
    }
    $stmt = $pdo->prepare('DELETE FROM portfolio_categories WHERE id = :id');
    $stmt->execute(['id' => $id]);
    json_success(['deleted' => true]);
}

json_error('Method not allowed.', 405);
