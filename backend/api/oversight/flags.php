<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';
require_once __DIR__ . '/../../helpers/oversight.php';

$admin = require_admin();
$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];
$entityTables = [
    'BOOKING' => 'bookings',
    'CALENDAR_EVENT' => 'calendar_events',
    'PORTFOLIO_SHOOT' => 'portfolio_shoots',
    'PORTFOLIO_IMAGE' => 'portfolio_images',
];

if ($method === 'GET') {
    $status = strtoupper(trim((string) ($_GET['status'] ?? '')));
    $type = strtoupper(trim((string) ($_GET['entity_type'] ?? '')));
    $entityId = positive_integer_input($_GET['entity_id'] ?? null);
    if ($status !== '' && !in_array($status, ['OPEN', 'RESOLVED'], true)) json_error('Invalid flag status.', 422);
    if ($type !== '' && !isset($entityTables[$type])) json_error('Invalid flag type.', 422);

    $where = [];
    $params = [];
    if ($status !== '') { $where[] = 'f.status = :status'; $params['status'] = $status; }
    if ($type !== '') { $where[] = 'f.entity_type = :type'; $params['type'] = $type; }
    if ($entityId) { $where[] = 'f.entity_id = :entity_id'; $params['entity_id'] = $entityId; }
    $sql = "SELECT f.*, creator.username AS flagged_by_username, resolver.username AS resolved_by_username
            FROM entity_flags f
            JOIN admins creator ON creator.id = f.flagged_by
            LEFT JOIN admins resolver ON resolver.id = f.resolved_by";
    if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
    $sql .= " ORDER BY (f.status = 'OPEN') DESC, f.created_at DESC LIMIT 250";
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    json_success(['flags' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
}

require_csrf();
$input = json_input();

if ($method === 'POST') {
    $admin = require_superadmin();
    $validator = new Validator($input);
    $validator->required('entity_type')->inList('entity_type', array_keys($entityTables))
        ->required('entity_id')->positiveInteger('entity_id', 'entity id')
        ->required('reason')->string('reason', 'Reason')->maxLength('reason', 500);
    if ($validator->fails()) json_error('Please check the flag details.', 422, $validator->errors());
    $type = strtoupper((string) $input['entity_type']);
    $entityId = positive_integer_input($input['entity_id']);
    $reason = clean_string($input['reason']);
    if (mb_strlen($reason) < 5) json_error('Give the owner a clear reason of at least five characters.', 422, ['reason' => 'Reason is too short.']);

    $exists = $pdo->prepare('SELECT id FROM ' . $entityTables[$type] . ' WHERE id = :id LIMIT 1');
    $exists->execute(['id' => $entityId]);
    if (!$exists->fetchColumn()) json_error('The selected item no longer exists.', 404);
    $duplicate = $pdo->prepare("SELECT id FROM entity_flags WHERE entity_type=:type AND entity_id=:id AND status='OPEN' LIMIT 1");
    $duplicate->execute(['type' => $type, 'id' => $entityId]);
    if ($duplicate->fetchColumn()) json_error('This item already has an open flag.', 409);

    $statement = $pdo->prepare("INSERT INTO entity_flags(entity_type,entity_id,reason,flagged_by,status) VALUES(:type,:id,:reason,:admin,'OPEN')");
    $statement->execute(['type' => $type, 'id' => $entityId, 'reason' => $reason, 'admin' => $admin['id']]);
    $flagId = (int) $pdo->lastInsertId();
    log_superadmin_access($pdo, $admin, $type, (string) $entityId, 'VIEW');
    $flag = ['id' => $flagId, 'entity_type' => $type, 'entity_id' => $entityId, 'reason' => $reason, 'status' => 'OPEN', 'created_at' => date('Y-m-d H:i:s')];
    send_owner_flag_email($flag);
    record_admin_audit($pdo, (int) $admin['id'], 'ENTITY_FLAG_CREATED', null, $flag);
    json_success(['flag' => $flag, 'message' => 'Warning sent to the Owner. No content or record was changed.'], 201);
}

if ($method === 'PUT') {
    $owner = require_owner();
    $validator = new Validator($input);
    $validator->required('id')->positiveInteger('id', 'flag id')
        ->required('resolution_note')->string('resolution_note', 'Resolution note')->maxLength('resolution_note', 1000);
    if ($validator->fails()) json_error('Please check the resolution.', 422, $validator->errors());
    $id = positive_integer_input($input['id']);
    $note = clean_string($input['resolution_note']);
    if (mb_strlen($note) < 5) json_error('Explain how the warning was addressed.', 422, ['resolution_note' => 'Resolution note is too short.']);
    $statement = $pdo->prepare("UPDATE entity_flags SET status='RESOLVED',resolution_note=:note,resolved_by=:owner,resolved_at=NOW() WHERE id=:id AND status='OPEN'");
    $statement->execute(['note' => $note, 'owner' => $owner['id'], 'id' => $id]);
    if (!$statement->rowCount()) json_error('Flag not found or already resolved.', 409);
    record_admin_audit($pdo, (int) $owner['id'], 'ENTITY_FLAG_RESOLVED', null, ['flag_id' => $id, 'resolution_note' => $note]);
    json_success(['id' => $id, 'status' => 'RESOLVED', 'resolution_note' => $note, 'resolved_at' => date('Y-m-d H:i:s'), 'message' => 'The warning was marked resolved.']);
}

json_error('Method not allowed.', 405);
