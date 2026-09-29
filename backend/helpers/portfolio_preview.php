<?php
/**
 * Server-side public portfolio preview exporter.
 *
 * Re-encoding through GD removes source EXIF/GPS/profile metadata. The exporter
 * then adds only ownership/licensing IPTC and XMP fields. Optional visible
 * watermark modes are deterrents only; they cannot prevent screen capture.
 */

declare(strict_types=1);

require_once __DIR__ . '/upload.php';

class PreviewException extends RuntimeException {}

/** @return resource|GdImage */
function load_preview_source(string $path, string $mime)
{
    $image = match ($mime) {
        'image/jpeg' => @imagecreatefromjpeg($path),
        'image/png' => @imagecreatefrompng($path),
        'image/webp' => @imagecreatefromwebp($path),
        default => false,
    };
    if ($image === false) {
        throw new PreviewException('The source image could not be decoded.');
    }
    return $image;
}

function preview_iptc_tag(int $record, int $dataset, string $value): string
{
    $length = strlen($value);
    if ($length > 0x7fff) {
        throw new PreviewException('Preview metadata value is too long.');
    }
    return chr(0x1c) . chr($record) . chr($dataset) . pack('n', $length) . $value;
}

function inject_preview_metadata(string $jpegPath, array $settings): void
{
    $iptc = preview_iptc_tag(2, 80, (string) $settings['creator'])
        . preview_iptc_tag(2, 116, (string) $settings['copyright'])
        . preview_iptc_tag(2, 40, (string) $settings['licensing_url']);
    $withIptc = @iptcembed($iptc, $jpegPath, 0);
    if (!is_string($withIptc)) {
        throw new PreviewException('Could not embed ownership metadata in the preview.');
    }

    $xml = '<?xpacket begin="\xEF\xBB\xBF" id="W5M0MpCehiHzreSzNTczkc9d"?>'
        . '<x:xmpmeta xmlns:x="adobe:ns:meta/">'
        . '<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
        . '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" '
        . 'xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/">'
        . '<dc:creator><rdf:Seq><rdf:li>' . htmlspecialchars((string) $settings['creator'], ENT_XML1) . '</rdf:li></rdf:Seq></dc:creator>'
        . '<dc:rights><rdf:Alt><rdf:li xml:lang="x-default">' . htmlspecialchars((string) $settings['copyright'], ENT_XML1) . '</rdf:li></rdf:Alt></dc:rights>'
        . '<xmpRights:Marked>True</xmpRights:Marked>'
        . '<xmpRights:WebStatement>' . htmlspecialchars((string) $settings['licensing_url'], ENT_XML1) . '</xmpRights:WebStatement>'
        . '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';

    $payload = "http://ns.adobe.com/xap/1.0/\0" . $xml;
    if (strlen($payload) + 2 > 0xffff) {
        throw new PreviewException('XMP metadata is too large for a JPEG segment.');
    }
    $app1 = "\xFF\xE1" . pack('n', strlen($payload) + 2) . $payload;
    $jpeg = $withIptc;
    if (!str_starts_with($jpeg, "\xFF\xD8")) {
        throw new PreviewException('Generated preview is not a valid JPEG.');
    }
    if (file_put_contents($jpegPath, substr($jpeg, 0, 2) . $app1 . substr($jpeg, 2), LOCK_EX) === false) {
        throw new PreviewException('Could not write preview metadata.');
    }
}

/**
 * Optional baked watermark modes. Deterrent only: visible marks can be cropped,
 * edited, or bypassed by photographing a display. The default is `none`.
 *
 * @param resource|GdImage $image
 */
function apply_preview_watermark($image, string $mode, string $label): void
{
    if ($mode === 'none') return;

    $width = imagesx($image);
    $height = imagesy($image);
    $font = 5;
    $textWidth = imagefontwidth($font) * strlen($label);
    $textHeight = imagefontheight($font);
    $color = imagecolorallocatealpha($image, 255, 255, 255, $mode === 'subtle' ? 72 : 82);
    $shadow = imagecolorallocatealpha($image, 0, 0, 0, 92);

    if ($mode === 'subtle') {
        $x = max(12, $width - $textWidth - 18);
        $y = max(12, $height - $textHeight - 18);
        imagestring($image, $font, $x + 1, $y + 1, $label, $shadow);
        imagestring($image, $font, $x, $y, $label, $color);
        return;
    }

    $stepX = max(280, $textWidth + 100);
    $stepY = 180;
    for ($y = 60; $y < $height; $y += $stepY) {
        for ($x = ($y / $stepY) % 2 ? -80 : 40; $x < $width; $x += $stepX) {
            imagestring($image, $font, (int) $x + 1, $y + 1, $label, $shadow);
            imagestring($image, $font, (int) $x, $y, $label, $color);
        }
    }
}

/**
 * @return array{path:string,relative_path:string,public_url:string,width:int,height:int,metadata:array<string,string>}
 */
function generate_public_preview(string $sourcePath, string $subfolder, ?string $watermarkMode = null): array
{
    if (!extension_loaded('gd')) {
        throw new PreviewException('The GD PHP extension is required for secure public preview generation.');
    }

    $config = require __DIR__ . '/../config/config.php';
    $settings = $config['portfolio_protection'];
    if (!$settings['preview_enabled']) {
        throw new PreviewException('Public preview generation is disabled.');
    }
    $mode = $watermarkMode ?? $settings['watermark_mode'];
    if (!in_array($mode, ['none', 'subtle', 'tiled'], true)) {
        throw new PreviewException('Unknown watermark mode.');
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = (string) $finfo->file($sourcePath);
    if (!isset($config['private_uploads']['allowed_mimes'][$mime])) {
        throw new PreviewException('Unsupported source image type.');
    }
    $sourceInfo = @getimagesize($sourcePath);
    if (!$sourceInfo) throw new PreviewException('Invalid source image.');

    $source = load_preview_source($sourcePath, $mime);
    $sourceWidth = imagesx($source);
    $sourceHeight = imagesy($source);
    $scale = min(1, $settings['max_edge'] / max($sourceWidth, $sourceHeight));
    $width = max(1, (int) round($sourceWidth * $scale));
    $height = max(1, (int) round($sourceHeight * $scale));
    $preview = imagecreatetruecolor($width, $height);
    $white = imagecolorallocate($preview, 255, 255, 255);
    imagefill($preview, 0, 0, $white);
    if (!imagecopyresampled($preview, $source, 0, 0, 0, 0, $width, $height, $sourceWidth, $sourceHeight)) {
        imagedestroy($source);
        imagedestroy($preview);
        throw new PreviewException('Could not resize the public preview.');
    }
    imagedestroy($source);

    apply_preview_watermark($preview, $mode, (string) $settings['creator']);

    $cleanSubfolder = trim(str_replace('\\', '/', $subfolder), '/');
    if ($cleanSubfolder !== '' && !preg_match('/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/', $cleanSubfolder)) {
        imagedestroy($preview);
        throw new PreviewException('Invalid preview destination.');
    }
    $targetDir = rtrim($config['uploads']['path'], '/\\') . ($cleanSubfolder ? '/' . $cleanSubfolder : '');
    if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
        imagedestroy($preview);
        throw new PreviewException('Could not prepare the preview directory.');
    }
    $relativePath = ($cleanSubfolder ? $cleanSubfolder . '/' : '') . bin2hex(random_bytes(16)) . '.jpg';
    $destination = rtrim($config['uploads']['path'], '/\\') . '/' . $relativePath;
    if (!imagejpeg($preview, $destination, $settings['quality'])) {
        imagedestroy($preview);
        throw new PreviewException('Could not encode the public preview.');
    }
    imagedestroy($preview);

    try {
        inject_preview_metadata($destination, $settings);
    } catch (Throwable $e) {
        @unlink($destination);
        throw $e;
    }
    @chmod($destination, 0644);

    return [
        'path' => $destination,
        'relative_path' => $relativePath,
        'public_url' => rtrim($config['uploads']['public_path'], '/') . '/' . $relativePath,
        'width' => $width,
        'height' => $height,
        'metadata' => read_preview_rights_metadata($destination),
    ];
}

/** @return array<string,string> */
function read_preview_rights_metadata(string $jpegPath): array
{
    $info = [];
    @getimagesize($jpegPath, $info);
    $iptc = isset($info['APP13']) ? @iptcparse($info['APP13']) : false;
    $bytes = (string) @file_get_contents($jpegPath);
    preg_match('/<dc:creator>.*?<rdf:li>(.*?)<\/rdf:li>/s', $bytes, $creator);
    preg_match('/<dc:rights>.*?<rdf:li[^>]*>(.*?)<\/rdf:li>/s', $bytes, $copyright);
    preg_match('/<xmpRights:WebStatement>(.*?)<\/xmpRights:WebStatement>/s', $bytes, $license);

    return [
        'creator' => html_entity_decode($iptc['2#080'][0] ?? $creator[1] ?? '', ENT_QUOTES | ENT_XML1),
        'copyright' => html_entity_decode($iptc['2#116'][0] ?? $copyright[1] ?? '', ENT_QUOTES | ENT_XML1),
        'licensing_url' => html_entity_decode($iptc['2#040'][0] ?? $license[1] ?? '', ENT_QUOTES | ENT_XML1),
    ];
}
