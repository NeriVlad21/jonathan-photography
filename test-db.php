<?php
$c = require "backend/config/config.php";
$d = $c["db"];
try {
    $pdo = new PDO("mysql:host=".$d["host"].";port=".$d["port"].";dbname=".$d["name"].";charset=utf8mb4", $d["user"], $d["password"], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
    echo "DB OK";
} catch (Throwable $e) {
    echo "DB ERROR: ".$e->getMessage();
}
