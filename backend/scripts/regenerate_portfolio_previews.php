<?php
/**
 * Regenerate public portfolio previews from private originals.
 *
 * Usage:
 *   php backend/scripts/regenerate_portfolio_previews.php --mode=none
 *   php backend/scripts/regenerate_portfolio_previews.php --mode=subtle
 *   php backend/scripts/regenerate_portfolio_previews.php --mode=tiled
 *
 * Optional visible watermark modes are deterrents only. This command never
 * modifies private originals and updates each database URL only after export
 * and metadata verification succeed.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/portfolio_preview.php';

$options = getopt('', ['mode::', 'image-id::']);
$mode = (string) ($options['mode'] ?? 'none');
if (!in_array($mode, ['none', 'subtle', 'tiled'], true)) {
    fwrite(STDERR, "Mode must be none, subtle, or tiled.\n");
    exit(2);
}

$config = require __DIR__ . '/../config/config.php';
$pdo = Database::connect();
$sql = 'SELECT id, shoot_id, image_path, original_path FROM portfolio_images WHERE original_path IS NOT NULL';
$params = [];
if (isset($options['image-id'])) {
    $sql .= ' AND id = :id';
    $params['id'] = (int) $options['image-id'];
}
$sql .= ' ORDER BY id';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll();

$updated = 0;
foreach ($rows as $row) {
    $relativeOriginal = ltrim(str_replace('\\', '/', (string) $row['original_path']), '/');
    $source = rtrim($config['private_uploads']['path'], '/\\') . '/' . $relativeOriginal;
    if (!is_file($source)) {
        fwrite(STDERR, "[skip] #{$row['id']}: private original is missing.\n");
        continue;
    }

    $preview = null;
    try {
        $preview = generate_public_preview($source, 'shoot-' . (int) $row['shoot_id'], $mode);
        $expected = $config['portfolio_protection'];
        $metadata = $preview['metadata'];
        if ($metadata['creator'] !== $expected['creator']
            || $metadata['copyright'] !== $expected['copyright']
            || $metadata['licensing_url'] !== $expected['licensing_url']) {
            throw new PreviewException('Rights metadata read-back did not match configured values.');
        }

        $pdo->prepare('UPDATE portfolio_images SET image_path = :path WHERE id = :id')
            ->execute(['path' => $preview['public_url'], 'id' => (int) $row['id']]);

        $oldUrl = (string) $row['image_path'];
        $prefix = (string) $config['uploads']['public_path'];
        if (str_starts_with($oldUrl, $prefix)) {
            $oldPath = rtrim($config['uploads']['path'], '/\\') . substr($oldUrl, strlen($prefix));
            if (is_file($oldPath) && realpath($oldPath) !== realpath($preview['path'])) {
                @unlink($oldPath);
            }
        }
        $updated++;
        fwrite(STDOUT, "[ok] #{$row['id']}: {$preview['width']}x{$preview['height']} {$mode}\n");
    } catch (Throwable $e) {
        if (!empty($preview['path']) && is_file($preview['path'])) @unlink($preview['path']);
        fwrite(STDERR, "[error] #{$row['id']}: {$e->getMessage()}\n");
        exit(1);
    }
}

fwrite(STDOUT, "Regenerated {$updated} preview(s); private originals were not modified.\n");
