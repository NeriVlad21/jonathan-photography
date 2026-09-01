<?php
/**
 * /api/portfolio/images.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

// Handle single public photo fetching
if ($method === 'GET' && isset($_GET['id'])) {
    $id = (int) $_GET['id'];
    
    // Using LEFT JOIN to guarantee the image returns even if the shoot/category linkage is imperfect.
    $stmt = $pdo->prepare(
        'SELECT pi.*, s.title AS shoot_title, s.slug AS shoot_slug, s.location, s.shoot_date,
                c.name AS category_name, c.slug AS category_slug
         FROM portfolio_images pi
         LEFT JOIN portfolio_shoots s ON s.id = pi.shoot_id
         LEFT JOIN portfolio_categories c ON c.id = s.category_id
         WHERE pi.id = :id
         LIMIT 1'
    );
    $stmt->execute(['id' => $id]);
    $image = $stmt->fetch();
    
    if (!$image) {
        json_error('Photo not found.', 404);
    }

    // Get previous photo ID (Safely handle if shoot_id is null)
    $prevId = null;
    $nextId = null;

    if (!empty($image['shoot_id'])) {
        // FIXED: Split :so into :so1 and :so2 to satisfy PDO parameter counting
        $prev = $pdo->prepare(
            'SELECT id FROM portfolio_images WHERE shoot_id = :sid
             AND (sort_order < :so1 OR (sort_order = :so2 AND id < :id))
             ORDER BY sort_order DESC, id DESC LIMIT 1'
        );
        $prev->execute([
            'sid' => $image['shoot_id'], 
            'so1' => $image['sort_order'], 
            'so2' => $image['sort_order'], 
            'id' => $id
        ]);
        $prevId = $prev->fetchColumn() ?: null;

        $next = $pdo->prepare(
            'SELECT id FROM portfolio_images WHERE shoot_id = :sid
             AND (sort_order > :so1 OR (sort_order = :so2 AND id > :id))
             ORDER BY sort_order ASC, id ASC LIMIT 1'
        );
        $next->execute([
            'sid' => $image['shoot_id'], 
            'so1' => $image['sort_order'], 
            'so2' => $image['sort_order'], 
            'id' => $id
        ]);
        $nextId = $next->fetchColumn() ?: null;
    }

    $image['prev_id'] = $prevId;
    $image['next_id'] = $nextId;

    json_success($image);
}

// Handle Admin fetching all images for a shoot
if ($method === 'GET' && isset($_GET['shoot_id'])) {
    require_admin();
    $stmt = $pdo->prepare('SELECT * FROM portfolio_images WHERE shoot_id = :sid ORDER BY sort_order ASC, id ASC');
    $stmt->execute(['sid' => (int) $_GET['shoot_id']]);
    json_success($stmt->fetchAll());
}

// Handle updates
if ($method === 'PUT') {
    require_admin();
    require_csrf();
    $input = json_input();

    if (!empty($input['reorder']) && is_array($input['reorder'])) {
        $stmt = $pdo->prepare('UPDATE portfolio_images SET sort_order = :so WHERE id = :id');
        $pdo->beginTransaction();
        foreach ($input['reorder'] as $item) {
            $stmt->execute(['so' => (int) $item['sort_order'], 'id' => (int) $item['id']]);
        }
        $pdo->commit();
        json_success(['reordered' => true]);
    }

    $v = new Validator($input);
    $v->required('id');
    if ($v->fails()) json_error('Missing image id.', 422, $v->errors());

    $id = (int) $input['id'];

    if (!empty($input['is_cover'])) {
        $shootRow = $pdo->prepare('SELECT shoot_id FROM portfolio_images WHERE id = :id');
        $shootRow->execute(['id' => $id]);
        $shootId = $shootRow->fetchColumn();
        if ($shootId) {
            $pdo->prepare('UPDATE portfolio_images SET is_cover = 0 WHERE shoot_id = :sid')->execute(['sid' => $shootId]);
            $pdo->prepare('UPDATE portfolio_shoots SET cover_image_id = :img WHERE id = :sid')->execute(['img' => $id, 'sid' => $shootId]);
        }
    }

    $stmt = $pdo->prepare(
        'UPDATE portfolio_images
         SET title = :title, caption = :caption, visible = :visible,
             is_cover = :cover, sort_order = COALESCE(:sort, sort_order)
         WHERE id = :id'
    );
    $stmt->execute([
        'title'   => clean_string($input['title'] ?? ''),
        'caption' => clean_string($input['caption'] ?? ''),
        'visible' => array_key_exists('visible', $input) ? (!empty($input['visible']) ? 1 : 0) : 1,
        'cover'   => !empty($input['is_cover']) ? 1 : 0,
        'sort'    => isset($input['sort_order']) ? (int) $input['sort_order'] : null,
        'id'      => $id,
    ]);

    $row = $pdo->prepare('SELECT * FROM portfolio_images WHERE id = :id');
    $row->execute(['id' => $id]);
    $image = $row->fetch();
    if (!$image) json_error('Image not found.', 404);
    json_success($image);
}

// Handle deletions
if ($method === 'DELETE') {
    require_admin();
    require_csrf();
    $id = (int) ($_GET['id'] ?? 0);
    if (!$id) json_error('Missing image id.', 422);

    $config = require __DIR__ . '/../../config/config.php';
    $row = $pdo->prepare('SELECT image_path FROM portfolio_images WHERE id = :id');
    $row->execute(['id' => $id]);
    $path = $row->fetchColumn();

    $pdo->prepare('DELETE FROM portfolio_images WHERE id = :id')->execute(['id' => $id]);

    if ($path) {
        $publicPrefix = $config['uploads']['public_path'];
        if (str_starts_with($path, $publicPrefix)) {
            $diskPath = $config['uploads']['path'] . substr($path, strlen($publicPrefix));
            if (is_file($diskPath)) {
                @unlink($diskPath);
            }
        }
    }

    json_success(['deleted' => true]);
}

json_error('Method not allowed.', 405);