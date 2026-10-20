<?php
/**
 * Resets an existing active admin account from the command line only.
 * The entered password is never accepted as an argument or written to output.
 * A reset password is temporary; the admin must replace it with a 12+ character
 * password immediately after signing in.
 *
 * Usage (PowerShell):
 *   php backend/scripts/reset_admin_password.php admin --sql
 *   php backend/scripts/reset_admin_password.php admin
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../config/database.php';

function prompt_hidden_password(string $label): string
{
    fwrite(STDOUT, $label . ': ');

    if (PHP_OS_FAMILY === 'Windows') {
        if (!function_exists('shell_exec')) {
            fwrite(STDERR, "Hidden password input is unavailable. Do not pass a password as a command-line argument.\n");
            exit(2);
        }

        $escaped = str_replace("'", "''", $label);
        $command = 'powershell -NoProfile -Command "$p=Read-Host -AsSecureString \'' . $escaped
            . '\'; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); '
            . 'try {[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}"';
        $value = shell_exec($command);
        if (!is_string($value) || trim($value) === '') {
            fwrite(STDERR, "Could not read hidden password input. No account was changed.\n");
            exit(2);
        }

        return rtrim($value, "\r\n");
    }

    if (!function_exists('shell_exec')) {
        fwrite(STDERR, "Hidden password input is unavailable. No account was changed.\n");
        exit(2);
    }

    shell_exec('stty -echo');
    $value = fgets(STDIN);
    shell_exec('stty echo');
    fwrite(STDOUT, PHP_EOL);

    return rtrim((string) $value, "\r\n");
}

$username = trim((string) ($argv[1] ?? ''));
$sqlOnly = in_array('--sql', $argv, true);
if (!preg_match('/^[A-Za-z0-9_.-]{3,60}$/', $username)) {
    fwrite(STDERR, "Provide an exact username (3-60 letters, numbers, periods, underscores, or hyphens).\n");
    fwrite(STDERR, "Usage: php backend/scripts/reset_admin_password.php <username> [--sql]\n");
    exit(2);
}

$password = prompt_hidden_password('Temporary password');
$confirmation = prompt_hidden_password('Confirm temporary password');
if ($password === '' || strlen($password) > 1024) {
    fwrite(STDERR, "The temporary password must contain 1-1024 characters. No account was changed.\n");
    exit(2);
}
if (!hash_equals($password, $confirmation)) {
    fwrite(STDERR, "The passwords did not match. No account was changed.\n");
    exit(2);
}

if ($sqlOnly) {
    // The username is constrained above to characters safe for a single-
    // quoted SQL literal. The hash alphabet cannot contain a single quote.
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $quotedUsername = "'{$username}'";
    $quotedHash = "'{$hash}'";
    fwrite(STDOUT, "Run this statement in the intended database's phpMyAdmin:\n\n");
    fwrite(STDOUT, "UPDATE admins SET password_hash = {$quotedHash}, session_version = session_version + 1, must_change_password = 1 WHERE username = {$quotedUsername} AND is_active = 1 AND role IN ('OWNER', 'SUPER_ADMIN');\n");
    fwrite(STDOUT, "\nCheck that phpMyAdmin reports exactly 1 affected row. The temporary password must be replaced after sign-in with a 12+ character password.\n");
    if (function_exists('sodium_memzero')) {
        sodium_memzero($password);
        sodium_memzero($confirmation);
    }
    exit(0);
}

try {
    $pdo = Database::connect();
    $statement = $pdo->prepare(
        "UPDATE admins
         SET password_hash = :password_hash,
             session_version = session_version + 1,
             must_change_password = 1
         WHERE username = :username
           AND is_active = 1
           AND role IN ('OWNER', 'SUPER_ADMIN')"
    );
    $statement->execute([
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'username' => $username,
    ]);

    if ($statement->rowCount() !== 1) {
        fwrite(STDERR, "No active admin account with that exact username was updated. Check the username and try again.\n");
        exit(1);
    }

    fwrite(STDOUT, "Password reset successfully for {$username}. Sign in and replace it immediately with a 12+ character password.\n");
} catch (Throwable $error) {
    error_log('[ADMIN PASSWORD RESET] ' . $error->getMessage());
    fwrite(STDERR, "The password reset failed. Check the database connection and server logs.\n");
    exit(1);
} finally {
    if (function_exists('sodium_memzero') && isset($password)) {
        sodium_memzero($password);
    }
    if (function_exists('sodium_memzero') && isset($confirmation)) {
        sodium_memzero($confirmation);
    }
}
