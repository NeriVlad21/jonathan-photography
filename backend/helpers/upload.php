<?php
/**
 * Secure image upload helper.
 *
 * Security measures:
 *  - Validates the REAL mime type via finfo (never trusts the client's
 *    Content-Type header or file extension).
 *  - Enforces a max file size.
 *  - Generates a random filename — the original filename is never used
 *    to build a path, so path traversal / double-extension tricks
 *    (e.g. "shell.php.jpg") can't do anything.
 *  - Writes only inside the configured uploads directory, which the
 *    included .htaccess / nginx config (see README) disables PHP
 *    execution in.
 */

declare(strict_types=1);

class UploadException extends RuntimeException {}

/**
 * @param array $file One entry from $_FILES
 * @return array{path:string,public_url:string}
 */
function handle_image_upload(array $file, string $subfolder = ''): array
{
    $config = (require __DIR__ . '/../config/config.php')['uploads'];

    // OVERRIDE: Force a 256MB limit for high-res professional portraits.
    // This bypasses the smaller default limit inside your config.php file.
    $config['max_bytes'] = 256 * 1024 * 1024;

    if (!isset($file['error']) || is_array($file['error'])) {
        throw new UploadException('Malformed upload.');
    }

    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_NO_FILE:
            throw new UploadException('No file was uploaded.');
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            // Custom error so you know exactly why it failed if XAMPP blocks it
            throw new UploadException('The server blocked the upload. You MUST increase upload_max_filesize to 256M in XAMPP\'s php.ini.');
        default:
            throw new UploadException('The image could not be uploaded.');
    }

    if ($file['size'] > $config['max_bytes']) {
        $maxMb = (int) ($config['max_bytes'] / (1024 * 1024));
        throw new UploadException("The image must be smaller than {$maxMb}MB.");
    }

    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($file['tmp_name']);

    if (!isset($config['allowed_mimes'][$mime])) {
        throw new UploadException('Please use JPG, PNG, or WEBP.');
    }

    // Re-validate that it's a real, decodable image (defends against
    // polyglot files that pass the mime sniff but aren't real images).
    $imageInfo = @getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        throw new UploadException('The file does not appear to be a valid image.');
    }

    $extension = $config['allowed_mimes'][$mime];
    $randomName = bin2hex(random_bytes(16)) . '.' . $extension;

    $targetDir = rtrim($config['path'], '/') . ($subfolder ? '/' . trim($subfolder, '/') : '');
    if (!is_dir($targetDir)) {
        if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
            throw new UploadException('Could not prepare the upload directory.');
        }
    }

    $destination = $targetDir . '/' . $randomName;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        throw new UploadException('The image could not be saved.');
    }

    @chmod($destination, 0644);

    $publicUrl = rtrim($config['public_path'], '/') . ($subfolder ? '/' . trim($subfolder, '/') : '') . '/' . $randomName;

    return [
        'path'       => $destination,
        'public_url' => $publicUrl,
    ];
}