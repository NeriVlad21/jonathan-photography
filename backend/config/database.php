<?php
/**
 * PDO connection factory. All queries in this app go through PDO
 * prepared statements — never raw string interpolation.
 */

declare(strict_types=1);

class Database
{
    private static ?PDO $connection = null;

    public static function disconnect(): void
    {
        self::$connection = null;
    }

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
        // Shared MySQL hosts can briefly drop or restart connections. Retry
        // connection setup (before any query can write data), but keep the
        // limit and backoff small so a real configuration error fails quickly.
        $maxAttempts = 3;
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                $connection = new PDO($dsn, $db['user'], $db['password'], [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_TIMEOUT            => 1,
                    PDO::ATTR_PERSISTENT         => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET SESSION sql_mode='STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
                ]);

                // A database restart can occasionally accept the TCP connection
                // and close it before the endpoint's first real query. Validate
                // the connection here so that condition is retried centrally
                // instead of surfacing as an uncaught "server has gone away".
                $connection->query('SELECT 1');
                self::$connection = $connection;
                break;
            } catch (PDOException $e) {
                self::$connection = null;
                $lastError = $e;
                if ($attempt < $maxAttempts) {
                    usleep(200_000 * $attempt);
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
