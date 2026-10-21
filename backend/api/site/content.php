<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/site_content.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

const CONTENT_KEY = 'public_content_v1';

$pdo = Database::connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Cache-Control: no-store, max-age=0');
    $stmt = $pdo->prepare('SELECT setting_value, updated_at FROM site_settings WHERE setting_key = :key');
    $stmt->execute(['key' => CONTENT_KEY]);
    $row = $stmt->fetch();
    $content = $row ? json_decode((string) $row['setting_value'], true) : [];
    json_success(['content' => is_array($content) ? $content : [], 'updated_at' => $row['updated_at'] ?? null]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.', 405);

require_owner();
require_csrf();
$input = json_input();
$content = $input['content'] ?? null;
if (!is_array($content)) json_error('Invalid site content.', 422);

$faqCount = count($content['faq']['items'] ?? []);
if ($faqCount < 3 || $faqCount > 12) json_error('The FAQ must contain between 3 and 12 questions.', 422);
$faqItems = $content['faq']['items'] ?? [];
foreach ($faqItems as $item) {
    if (trim((string) ($item['question'] ?? '')) === '' || trim((string) ($item['answer'] ?? '')) === '') {
        json_error('Every FAQ needs both a question and an answer.', 422);
    }
}
$songCount = count($content['music']['songs'] ?? []);
if ($songCount < 1 || $songCount > 20) json_error('The playlist must contain between 1 and 20 songs.', 422);
$songs = $content['music']['songs'] ?? [];
foreach ($songs as $song) {
    if (trim((string) ($song['title'] ?? '')) === '' || trim((string) ($song['artist'] ?? '')) === '' || !preg_match('/^[A-Za-z0-9_-]{6,20}$/', (string) ($song['youtubeId'] ?? ''))) {
        json_error('Every song needs a title, artist, and valid YouTube video ID.', 422);
    }
}
$categoryCount = count($content['servicesPage']['categories'] ?? []);
if ($categoryCount < 1 || $categoryCount > 12) json_error('Services must contain between 1 and 12 sections.', 422);
$categoryKeys = [];
foreach (($content['servicesPage']['categories'] ?? []) as $category) {
    $key = (string) ($category['key'] ?? '');
    if (!preg_match('/^[a-z0-9-]{1,30}$/', $key) || trim((string) ($category['label'] ?? '')) === '' || in_array($key, $categoryKeys, true)) {
        json_error('Every service section needs a unique lowercase key and a public name.', 422);
    }
    $categoryKeys[] = $key;
}
$workflowSteps = $content['bookingPage']['steps'] ?? [];
if (count($workflowSteps) !== 4) json_error('The booking guide must contain four workflow steps.', 422);
foreach ($workflowSteps as $step) {
    if (trim((string) ($step['title'] ?? '')) === '' || trim((string) ($step['text'] ?? '')) === '') {
        json_error('Every booking workflow step needs a title and explanation.', 422);
    }
}

$latitude = trim((string) ($content['brand']['mapLatitude'] ?? ''));
$longitude = trim((string) ($content['brand']['mapLongitude'] ?? ''));
if (($latitude !== '' || $longitude !== '') && ($latitude === '' || $longitude === '' || !is_numeric($latitude) || !is_numeric($longitude) || (float) $latitude < -90 || (float) $latitude > 90 || (float) $longitude < -180 || (float) $longitude > 180)) {
    json_error('Enter both map coordinates using a valid latitude and longitude.', 422);
}

// Optional studio Google Maps link (share link or google.com/maps URL), HTTPS only.
$mapLink = trim((string) ($content['brand']['mapLink'] ?? ''));
if ($mapLink !== '') {
    $mapHost = strtolower((string) parse_url($mapLink, PHP_URL_HOST));
    $mapPath = (string) parse_url($mapLink, PHP_URL_PATH);
    $isMapsLink = $mapHost === 'maps.app.goo.gl'
        || ($mapHost === 'goo.gl' && str_starts_with($mapPath, '/maps'))
        || $mapHost === 'maps.google.com'
        || (in_array($mapHost, ['google.com', 'www.google.com'], true) && str_starts_with($mapPath, '/maps'));
    if (strlen($mapLink) > 300 || !filter_var($mapLink, FILTER_VALIDATE_URL) || strtolower((string) parse_url($mapLink, PHP_URL_SCHEME)) !== 'https' || !$isMapsLink) {
        json_error('Enter a Google Maps link (for example https://maps.app.goo.gl/…), or leave it empty.', 422);
    }
}

$portfolioVideos = $content['portfolioPage']['videos'] ?? [];
if (!is_array($portfolioVideos) || count($portfolioVideos) > 6) {
    json_error('The portfolio can contain up to six videos.', 422);
}
foreach ($portfolioVideos as $video) {
    $url = trim((string) ($video['url'] ?? ''));
    $host = strtolower((string) parse_url($url, PHP_URL_HOST));
    $host = preg_replace('/^www\./', '', $host);
    if ($url === '' || !filter_var($url, FILTER_VALIDATE_URL) || !in_array($host, ['youtube.com', 'm.youtube.com', 'youtu.be', 'vimeo.com'], true)) {
        json_error('Every portfolio video needs a valid YouTube or Vimeo link.', 422);
    }
}

$clean = clean_content_value($content);
$json = json_encode($clean, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
if ($json === false || strlen($json) > 60000) json_error('The website content is too large to save.', 422);

$stmt = $pdo->prepare(
    'INSERT INTO site_settings (setting_key, setting_value) VALUES (:key, :value)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP'
);
$stmt->execute(['key' => CONTENT_KEY, 'value' => $json]);

// brand.address is the single studio address. Booking emails and new invoices
// read business_address, so keep it in step; an empty field never erases it.
$studioAddress = trim((string) ($clean['brand']['address'] ?? ''));
if ($studioAddress !== '') {
    $stmt->execute(['key' => 'business_address', 'value' => $studioAddress]);
}
json_success(['content' => $clean, 'updated_at' => date('Y-m-d H:i:s')]);
