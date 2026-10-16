<?php

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script can only run from the command line.\n");
    exit(1);
}

function prompt_value(string $label): string
{
    fwrite(STDOUT, $label . ': ');
    return trim((string) fgets(STDIN));
}

function prompt_password(string $label): string
{
    if (PHP_OS_FAMILY === 'Windows') {
        $escaped = str_replace("'", "''", $label);
        $command = 'powershell -NoProfile -Command "$p=Read-Host -AsSecureString \'' . $escaped
            . '\'; $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); '
            . 'try {[Runtime.InteropServices.Marshal]::PtrToStringBSTR($b)} finally {[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($b)}"';
        $value = trim((string) shell_exec($command));
        if ($value !== '') return $value;
        fwrite(STDOUT, $label . ' (input visible): ');
        return trim((string) fgets(STDIN));
    }

    fwrite(STDOUT, $label . ': ');
    shell_exec('stty -echo');
    $value = trim((string) fgets(STDIN));
    shell_exec('stty echo');
    fwrite(STDOUT, PHP_EOL);
    return $value;
}

$username = prompt_value('Superadmin username');
$email = strtolower(prompt_value('Superadmin email'));
$password = prompt_password('Temporary password');
$confirmation = prompt_password('Confirm temporary password');

if (!preg_match('/^[A-Za-z0-9_.-]{3,60}$/', $username)) {
    fwrite(STDERR, "Username must contain 3-60 letters, numbers, periods, underscores, or hyphens.\n");
    exit(1);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 160) {
    fwrite(STDERR, "Enter a valid email address.\n");
    exit(1);
}
if (strlen($password) < 12 || $password !== $confirmation) {
    fwrite(STDERR, "Passwords must match and contain at least 12 characters.\n");
    exit(1);
}

$pdo = Database::connect();
$duplicate = $pdo->prepare('SELECT id FROM admins WHERE username = :username OR email = :email LIMIT 1');
$duplicate->execute(['username' => $username, 'email' => $email]);
if ($duplicate->fetchColumn()) {
    fwrite(STDERR, "That username or email is already registered.\n");
    exit(1);
}

$statement = $pdo->prepare(
    "INSERT INTO admins (username, email, password_hash, role, is_active, session_version, must_change_password)
     VALUES (:username, :email, :password, 'SUPER_ADMIN', 1, 1, 1)"
);
$statement->execute([
    'username' => $username,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
]);

fwrite(STDOUT, "Superadmin created. The temporary password must be changed at first login.\n");
