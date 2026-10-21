<?php
/**
 * Focused tests for clean_content_value() (backend/helpers/site_content.php).
 * Run from the repository root: php backend/tests/site_content_test.php
 * Exit code 0 = all passed. Error cases run in a child PHP process because
 * json_error() ends the request with exit.
 */

declare(strict_types=1);

require_once __DIR__ . '/../helpers/site_content.php';

$failures = 0;
$check = static function (string $label, bool $ok, string $detail = '') use (&$failures): void {
    echo ($ok ? 'ok   ' : 'FAIL ') . $label . ($ok || $detail === '' ? '' : " — {$detail}") . PHP_EOL;
    if (!$ok) $failures++;
};

// ---------------------------------------------------------------- normal paths
$check('string: trims and strips HTML tags', clean_content_value("  <b>Hello</b> <script>x</script>world  ") === 'Hello xworld');
$check('string: empty stays empty', clean_content_value('') === '');
$check('string: 1,200 characters accepted', clean_content_value(str_repeat('é', 1200)) === str_repeat('é', 1200));
$check('scalars pass through unchanged', clean_content_value(true) === true && clean_content_value(false) === false
    && clean_content_value(0) === 0 && clean_content_value(42) === 42 && clean_content_value(1.5) === 1.5);
$check('null passes through', clean_content_value(null) === null);
$check('list keys and order preserved', clean_content_value(['a', ' b ', 3]) === ['a', 'b', 3]);
$nested = ['brand' => ['name' => ' <i>jonathan</i> ', 'mapLink' => 'https://maps.app.goo.gl/x'], 'faq' => ['items' => [['q' => 'Q?', 'a' => 'A.']]]];
$check('nested objects cleaned recursively', clean_content_value($nested) === ['brand' => ['name' => 'jonathan', 'mapLink' => 'https://maps.app.goo.gl/x'], 'faq' => ['items' => [['q' => 'Q?', 'a' => 'A.']]]]);
$check('field names with _ and - accepted', clean_content_value(['map_link-2' => 'x']) === ['map_link-2' => 'x']);
$check('30 items accepted', count(clean_content_value(array_fill(0, 30, 'x'))) === 30);
$deep = 'leaf';
for ($i = 0; $i < 8; $i++) $deep = [$deep];
$check('depth 8 accepted', is_array(clean_content_value($deep)));

// ------------------------------------------------------- error paths (child process)
$helper = var_export(realpath(__DIR__ . '/../helpers/site_content.php'), true);
$expectError = static function (string $label, string $valueCode, string $message) use ($check, $helper): void {
    $code = "require {$helper}; clean_content_value({$valueCode}); echo 'RETURNED';";
    $output = (string) shell_exec(escapeshellarg(PHP_BINARY) . ' -r ' . escapeshellarg($code) . ' 2>&1');
    $json = json_decode($output, true);
    $check($label, is_array($json) && ($json['success'] ?? null) === false && ($json['message'] ?? '') === $message,
        'got: ' . substr($output, 0, 160));
};
$expectError('string over 1,200 characters → 422', "str_repeat('x', 1201)", 'A content field exceeds the 1,200 character limit.');
$expectError('more than 30 items → 422', "array_fill(0, 31, 'x')", 'A content section contains too many items.');
$expectError('invalid field name → 422', "['bad key!' => 'x']", 'The content contains an invalid field name.');
$expectError('nesting deeper than 8 → 422', "[[[[[[[[[['x']]]]]]]]]]", 'The content structure is too deeply nested.');
$expectError('object value → 422 (never returned)', "new stdClass()", 'The content contains an unsupported value.');
$expectError('object nested in array → 422', "['a' => new stdClass()]", 'The content contains an unsupported value.');

echo $failures === 0 ? "\nAll clean_content_value tests passed.\n" : "\n{$failures} test(s) failed.\n";
exit($failures === 0 ? 0 : 1);
