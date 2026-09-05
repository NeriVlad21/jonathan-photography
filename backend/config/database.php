<?php
/**
 * PDO connection factory. All queries in this app go through PDO
 * prepared statements — never raw string interpolation.
 */

declare(strict_types=1);

class Database
{
    private static ?PDO $connection = null;

    public static function connect(): PDO
    {
        if (self::$connection !== null) {
            return self::$connection;
        }

        $config = require __DIR__ . '/config.php';
        $db = $config['db'];

        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
            $db['host'],
            $db['port'],
            $db['name']
        );

        $lastError = null;
        for ($attempt = 1; $attempt <= 3; $attempt++) {
            try {
                self::$connection = new PDO($dsn, $db['user'], $db['password'], [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 3,
                ]);
                break;
            } catch (PDOException $e) {
                $lastError = $e;
                if ($attempt < 3) {
                    usleep(150000 * $attempt);
                }
            }
        }

        if (self::$connection === null) {
            // Never leak connection details to the client.
            error_log('[DB CONNECTION ERROR] ' . ($lastError?->getMessage() ?? 'Unknown connection failure'));
            http_response_code(503);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'message' => 'The database is temporarily unavailable. Please retry in a moment.',
            ]);
            exit;
        }

        return self::$connection;
    }
}
