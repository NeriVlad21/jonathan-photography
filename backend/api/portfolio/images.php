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
    $id = positive_integer_input($_GET['id']);
    if (!$id) json_error('Invalid photo id.', 422);
    
    // Using LEFT JOIN to guarantee the image returns even if the shoot/category linkage is imperfect.
    $stmt = $pdo->prepare(
        'SELECT pi.id, pi.shoot_id, pi.image_path, pi.title, pi.caption,
                pi.sort_order, pi.is_cover, pi.visible, pi.created_at, pi.updated_at,
                s.title AS shoot_title, s.slug AS shoot_slug, s.location, s.shoot_date,
                c.name AS category_name, c.slug AS category_slug
         FROM portfolio_images pi
         LEFT JOIN portfolio_shoots s ON s.id = pi.shoot_id
         LEFT JOIN portfolio_categories c ON c.id = s.category_id
         WHERE pi.id = :id
           AND pi.visible = 1
           AND (s.id IS NULL OR s.visible = 1)
           AND (c.id IS NULL OR c.visible = 1)
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
            'SELECT id FROM portfolio_images WHERE shoot_id = :sid AND visible = 1
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
            'SELECT id FROM portfolio_images WHERE shoot_id = :sid AND visible = 1
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
    $shootId = positive_integer_input($_GET['shoot_id']);
    if (!$shootId) json_error('Invalid shoot id.', 422);
    $stmt = $pdo->prepare('SELECT * FROM portfolio_images WHERE shoot_id = :sid ORDER BY sort_order ASC, id ASC');
    $stmt->execute(['sid' => $shootId]);
    json_success($stmt->fetchAll());
}

// Handle updates
if ($method === 'PUT') {
    require_admin();
    require_csrf();
    $input = json_input();

    if (!empty($input['reorder']) && is_array($input['reorder'])) {
        if (count($input['reorder']) > 500) json_error('Too many images to reorder at once.', 422);
        $stmt = $pdo->prepare('UPDATE portfolio_images SET sort_order = :so WHERE id = :id');
        $pdo->beginTransaction();
        foreach ($input['reorder'] as $item) {
            if (!is_array($item)) {
                $pdo->rollBack();
                json_error('Invalid reorder entry.', 422);
            }
            $itemId = positive_integer_input($item['id'] ?? null);
            $sort = $item['sort_order'] ?? null;
            if (!$itemId || !(is_int($sort) || (is_string($sort) && preg_match('/^-?\d+$/', $sort))) || abs((int) $sort) > 100000) {
                $pdo->rollBack();
                json_error('Invalid reorder entry.', 422);
            }
            $stmt->execute(['so' => (int) $sort, 'id' => $itemId]);
        }
        $pdo->commit();
        json_success(['reordered' => true]);
    }

    $v = new Validator($input);
    $v->required('id')->positiveInteger('id', 'image id')
      ->string('title', 'Title')->maxLength('title', 160)
      ->string('caption', 'Caption')->maxLength('caption', 2000)
      ->boolean('visible')->boolean('is_cover')->integer('sort_order', -100000, 100000);
    if ($v->fails()) json_error('Missing image id.', 422, $v->errors());

    $id = positive_integer_input($input['id']);

    if (!empty($input['is_cover'])) {
        $shootRow = $pdo->prepare('SELECT shoot_id FROM portfolio_images WHERE id = :id');
        $shootRow->execute(['id' => $id]);
        $shootId = $shootRow->fetchColumn();
        if ($shootId) {
            $pdo->prepare('UPDATE portfolio_images SET is_cover = 0 WHERE shoot_id = :sid')->execute(['sid' => $shootId]);
            $pdo->prepare('UPDATE portfolio_shoots SET cover_image_id = :img WHERE id = :sid')->execute(['img' => $id, 'sid' => $shootId]);
        }
    }

    // Only update fields that were sent: "Set as cover" sends just
    // { id, is_cover } and must not wipe the title/caption or unhide the photo.
    $sets = [];
    $params = ['id' => $id];
    if (array_key_exists('title', $input)) {
        $sets[] = 'title = :title';
        $params['title'] = mb_substr(clean_string($input['title']), 0, 160);
    }
    if (array_key_exists('caption', $input)) {
        $sets[] = 'caption = :caption';
        $params['caption'] = mb_substr(clean_string($input['caption']), 0, 2000);
    }
    if (array_key_exists('visible', $input)) {
        $sets[] = 'visible = :visible';
        $params['visible'] = boolean_input($input['visible']);
    }
    if (array_key_exists('is_cover', $input)) {
        $sets[] = 'is_cover = :cover';
        $params['cover'] = boolean_input($input['is_cover']);
    }
    if (isset($input['sort_order']) && is_numeric($input['sort_order'])) {
        $sets[] = 'sort_order = :sort';
        $params['sort'] = (int) $input['sort_order'];
    }
    if ($sets) {
        $pdo->prepare('UPDATE portfolio_images SET ' . implode(', ', $sets) . ' WHERE id = :id')->execute($params);
    }

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
    $id = positive_integer_input($_GET['id'] ?? null);
    if (!$id) json_error('Missing image id.', 422);

    $config = require __DIR__ . '/../../config/config.php';
    $row = $pdo->prepare('SELECT image_path, original_path FROM portfolio_images WHERE id = :id');
    $row->execute(['id' => $id]);
    $paths = $row->fetch();
    if (!$paths) json_error('Image not found.', 404);

    $pdo->prepare('DELETE FROM portfolio_images WHERE id = :id')->execute(['id' => $id]);

    if (!empty($paths['image_path'])) {
        $path = $paths['image_path'];
        $publicPrefix = $config['uploads']['public_path'];
        if (str_starts_with($path, $publicPrefix)) {
            $diskPath = $config['uploads']['path'] . substr($path, strlen($publicPrefix));
            if (is_file($diskPath)) {
                @unlink($diskPath);
            }
        }
    }

    if (!empty($paths['original_path'])) {
        $privateRoot = realpath($config['private_uploads']['path']);
        $privatePath = $config['private_uploads']['path'] . '/' . ltrim(str_replace('\\', '/', $paths['original_path']), '/');
        $privateDir = realpath(dirname($privatePath));
        if ($privateRoot && $privateDir && str_starts_with($privateDir, $privateRoot) && is_file($privatePath)) {
            @unlink($privatePath);
        }
    }

    json_success(['deleted' => true]);
}

json_error('Method not allowed.', 405);
