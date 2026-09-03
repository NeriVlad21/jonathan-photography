<?php
/**
 * /api/portfolio/shoots.php
 *
 * GET  ?category=weddings                     — public list of shoots in a category
 * GET  ?category=weddings&shoot=john-and-maria — public single shoot + its images
 * GET  ?category=weddings&images=1            — public all images in a category
 * GET  ?all=1                                  — admin: every shoot (any visibility)
 * GET  ?id=5                                   — admin: single shoot by id (for editing)
 * POST   { category_id, title, description, location, shoot_date }         — admin create
 * PUT    { id, category_id, title, description, location, shoot_date, visible } — admin update
 * DELETE ?id=5                                 — admin delete (cascades images)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

function slugify_text(string $text): string
{
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9]+/', '-', $text), '-'));
    return $slug !== '' ? $slug : 'shoot-' . bin2hex(random_bytes(3));
}

function fetch_shoot_images(PDO $pdo, int $shootId, bool $includeHidden = false): array
{
    $sql = 'SELECT * FROM portfolio_images WHERE shoot_id = :id' . ($includeHidden ? '' : ' AND visible = 1') . ' ORDER BY sort_order ASC, id ASC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['id' => $shootId]);
    return $stmt->fetchAll();
}

if ($method === 'GET') {
    if (isset($_GET['all'])) {
        require_admin();

        $stmt = $pdo->query(
            'SELECT s.*, c.name AS category_name, c.slug AS category_slug,
                    (SELECT COUNT(*) FROM portfolio_images pi WHERE pi.shoot_id = s.id) AS image_count
             FROM portfolio_shoots s
             JOIN portfolio_categories c ON c.id = s.category_id
             ORDER BY s.sort_order ASC, s.id DESC'
        );

        json_success($stmt->fetchAll());
    }

    if (isset($_GET['id'])) {
        require_admin();

        $stmt = $pdo->prepare('SELECT * FROM portfolio_shoots WHERE id = :id');
        $stmt->execute(['id' => (int) $_GET['id']]);

        $shoot = $stmt->fetch();

        if (!$shoot) {
            json_error('Shoot not found.', 404);
        }

        $shoot['images'] = fetch_shoot_images(
            $pdo,
            (int) $shoot['id'],
            true
        );

        json_success($shoot);
    }

    if (isset($_GET['category']) && isset($_GET['shoot'])) {
        $stmt = $pdo->prepare(
            'SELECT s.*, c.name AS category_name, c.slug AS category_slug
             FROM portfolio_shoots s
             JOIN portfolio_categories c ON c.id = s.category_id
             WHERE c.slug = :cat
               AND s.slug = :shoot
               AND s.visible = 1
               AND c.visible = 1
             LIMIT 1'
        );

        $stmt->execute([
            'cat'   => $_GET['category'],
            'shoot' => $_GET['shoot']
        ]);

        $shoot = $stmt->fetch();

        if (!$shoot) {
            json_error('Shoot not found.', 404);
        }

        $shoot['images'] = fetch_shoot_images(
            $pdo,
            (int) $shoot['id']
        );

        json_success($shoot);
    }

    /*
     * NEW:
     * Return every visible portfolio image belonging to
     * every visible shoot inside the requested category.
     *
     * Example:
     * /portfolio/shoots.php?category=portraits&images=1
     */
    if (isset($_GET['category']) && isset($_GET['images'])) {
        $stmt = $pdo->prepare(
            'SELECT
                pi.*,
                s.title AS shoot_title,
                s.slug AS shoot_slug,
                s.location AS shoot_location,
                s.shoot_date AS shoot_date,
                c.name AS category_name,
                c.slug AS category_slug
             FROM portfolio_images pi
             JOIN portfolio_shoots s
               ON s.id = pi.shoot_id
             JOIN portfolio_categories c
               ON c.id = s.category_id
             WHERE c.slug = :cat
               AND c.visible = 1
               AND s.visible = 1
               AND pi.visible = 1
             ORDER BY
                s.sort_order ASC,
                s.id ASC,
                pi.sort_order ASC,
                pi.id ASC'
        );

        $stmt->execute([
            'cat' => $_GET['category']
        ]);

        json_success($stmt->fetchAll());
    }

    if (isset($_GET['category'])) {
        $stmt = $pdo->prepare(
            'SELECT s.*,
                    (SELECT image_path
                     FROM portfolio_images pi
                     WHERE pi.shoot_id = s.id
                       AND pi.is_cover = 1
                     LIMIT 1) AS cover_image_path
             FROM portfolio_shoots s
             JOIN portfolio_categories c
               ON c.id = s.category_id
             WHERE c.slug = :cat
               AND s.visible = 1
               AND c.visible = 1
             ORDER BY s.sort_order ASC, s.id ASC'
        );

        $stmt->execute([
            'cat' => $_GET['category']
        ]);

        json_success($stmt->fetchAll());
    }

    json_error('Missing query parameters.', 422);
}

if ($method === 'POST') {
    require_admin();
    require_csrf();

    $input = json_input();

    $v = new Validator($input);

    $v
        ->required('category_id')
        ->required('title', 'a shoot title')
        ->maxLength('title', 160);

    if ($v->fails()) {
        json_error(
            'Please fix the errors below.',
            422,
            $v->errors()
        );
    }

    $title = clean_string($input['title']);

    $slugBase = slugify_text($title);
    $slug = $slugBase;
    $i = 1;

    $check = $pdo->prepare(
        'SELECT COUNT(*)
         FROM portfolio_shoots
         WHERE category_id = :c
           AND slug = :s'
    );

    do {
        $check->execute([
            'c' => (int) $input['category_id'],
            's' => $slug
        ]);

        if ((int) $check->fetchColumn() === 0) {
            break;
        }

        $slug = $slugBase . '-' . (++$i);
    } while (true);

    $stmt = $pdo->prepare(
        'INSERT INTO portfolio_shoots
            (category_id, title, slug, description, location, shoot_date, visible)
         VALUES
            (:cat, :title, :slug, :desc, :loc, :date, 1)'
    );

    $stmt->execute([
        'cat'   => (int) $input['category_id'],
        'title' => $title,
        'slug'  => $slug,
        'desc'  => clean_string($input['description'] ?? ''),
        'loc'   => clean_string($input['location'] ?? ''),
        'date'  => $input['shoot_date'] ?: null,
    ]);

    $id = (int) $pdo->lastInsertId();

    $row = $pdo->prepare(
        'SELECT *
         FROM portfolio_shoots
         WHERE id = :id'
    );

    $row->execute([
        'id' => $id
    ]);

    json_success(
        $row->fetch(),
        201
    );
}

if ($method === 'PUT') {
    require_admin();
    require_csrf();

    $input = json_input();

    $v = new Validator($input);

    $v
        ->required('id')
        ->required('title', 'a shoot title');

    if ($v->fails()) {
        json_error(
            'Please fix the errors below.',
            422,
            $v->errors()
        );
    }

    $stmt = $pdo->prepare(
        'UPDATE portfolio_shoots
         SET
            title = :title,
            description = :desc,
            location = :loc,
            shoot_date = :date,
            visible = :visible,
            category_id = :cat
         WHERE id = :id'
    );

    $stmt->execute([
        'title'   => clean_string($input['title']),
        'desc'    => clean_string($input['description'] ?? ''),
        'loc'     => clean_string($input['location'] ?? ''),
        'date'    => $input['shoot_date'] ?: null,
        'visible' => !empty($input['visible']) ? 1 : 0,
        'cat'     => (int) $input['category_id'],
        'id'      => (int) $input['id'],
    ]);

    $row = $pdo->prepare(
        'SELECT *
         FROM portfolio_shoots
         WHERE id = :id'
    );

    $row->execute([
        'id' => (int) $input['id']
    ]);

    $shoot = $row->fetch();

    if (!$shoot) {
        json_error('Shoot not found.', 404);
    }

    json_success($shoot);
}

if ($method === 'DELETE') {
    require_admin();
    require_csrf();

    $id = (int) ($_GET['id'] ?? 0);

    if (!$id) {
        json_error('Missing shoot id.', 422);
    }

    $stmt = $pdo->prepare(
        'DELETE FROM portfolio_shoots
         WHERE id = :id'
    );

    $stmt->execute([
        'id' => $id
    ]);

    json_success([
        'deleted' => true
    ]);
}

json_error('Method not allowed.', 405);