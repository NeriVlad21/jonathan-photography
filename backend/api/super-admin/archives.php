<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/admin_audit.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$admin = require_super_admin();
$pdo = Database::connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $cycles = $pdo->query(
        "SELECT fc.*, COALESCE(SUM(CASE WHEN pfl.voided_at IS NULL THEN pfl.fee_amount ELSE 0 END),0) total_owed,
                COUNT(pfl.id) booking_count
         FROM fee_cycles fc
         LEFT JOIN platform_fee_ledger pfl ON pfl.cycle_id=fc.id
         WHERE fc.archived_at IS NOT NULL
         GROUP BY fc.id ORDER BY fc.archived_at DESC"
    )->fetchAll(PDO::FETCH_ASSOC);
    $ledger = $pdo->query(
        "SELECT pfl.*, b.reference_code, b.name, b.status booking_status, i.invoice_number,
                fc.cycle_start, fc.cycle_end, fc.status cycle_status
         FROM platform_fee_ledger pfl
         JOIN bookings b ON b.id=pfl.booking_id
         JOIN invoices i ON i.id=pfl.invoice_id
         JOIN fee_cycles fc ON fc.id=pfl.cycle_id
         WHERE pfl.archived_at IS NOT NULL
         ORDER BY pfl.archived_at DESC"
    )->fetchAll(PDO::FETCH_ASSOC);
    $reports = $pdo->query(
        "SELECT r.*, a.username submitted_by_username, a.email submitted_by_email
         FROM support_reports r JOIN admins a ON a.id=r.submitted_by_admin_id
         WHERE r.archived_at IS NOT NULL ORDER BY r.archived_at DESC"
    )->fetchAll(PDO::FETCH_ASSOC);
    json_success(['cycles'=>$cycles,'ledger'=>$ledger,'reports'=>$reports]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') json_error('Method not allowed.',405);
require_csrf();
$input=json_input();
$v=new Validator($input);
$v->required('entity')->inList('entity',['cycle','ledger','support'])
  ->required('id')->positiveInteger('id','record id')
  ->required('operation')->inList('operation',['archive','restore']);
if($v->fails()) json_error('Please check the archive action.',422,$v->errors());

$entity=(string)$input['entity'];
$id=positive_integer_input($input['id']);
$archive=$input['operation']==='archive';
$actor=(int)$admin['id'];

if($entity==='cycle'){
    $check=$pdo->prepare('SELECT status FROM fee_cycles WHERE id=:id'); $check->execute(['id'=>$id]); $status=$check->fetchColumn();
    if(!$status) json_error('Billing cycle not found.',404);
    if($archive && $status!=='PAID') json_error('Only paid billing cycles can be archived.',409);
    $pdo->beginTransaction();
    try{
        $pdo->prepare('UPDATE fee_cycles SET archived_at=:archived, archived_by_admin_id=:actor WHERE id=:id')->execute(['archived'=>$archive?date('Y-m-d H:i:s'):null,'actor'=>$archive?$actor:null,'id'=>$id]);
        $pdo->prepare('UPDATE platform_fee_ledger SET archived_at=:archived, archived_by_admin_id=:actor WHERE cycle_id=:id')->execute(['archived'=>$archive?date('Y-m-d H:i:s'):null,'actor'=>$archive?$actor:null,'id'=>$id]);
        record_admin_audit($pdo,$actor,$archive?'FEE_CYCLE_ARCHIVED':'FEE_CYCLE_RESTORED',null,['cycle_id'=>$id]);
        $pdo->commit();
    }catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();throw $e;}
}
if($entity==='ledger'){
    $check=$pdo->prepare("SELECT pfl.voided_at,fc.status FROM platform_fee_ledger pfl JOIN fee_cycles fc ON fc.id=pfl.cycle_id WHERE pfl.id=:id"); $check->execute(['id'=>$id]); $row=$check->fetch();
    if(!$row) json_error('Fee record not found.',404);
    if($archive && $row['status']!=='PAID' && !$row['voided_at']) json_error('Only paid or voided fee records can be archived.',409);
    $pdo->prepare('UPDATE platform_fee_ledger SET archived_at=:archived, archived_by_admin_id=:actor WHERE id=:id')->execute(['archived'=>$archive?date('Y-m-d H:i:s'):null,'actor'=>$archive?$actor:null,'id'=>$id]);
    record_admin_audit($pdo,$actor,$archive?'FEE_LEDGER_ARCHIVED':'FEE_LEDGER_RESTORED',null,['ledger_id'=>$id]);
}
if($entity==='support'){
    $check=$pdo->prepare('SELECT status FROM support_reports WHERE id=:id'); $check->execute(['id'=>$id]); $status=$check->fetchColumn();
    if(!$status) json_error('Support report not found.',404);
    if($archive && !in_array($status,['RESOLVED','CLOSED'],true)) json_error('Resolve or close the report before archiving it.',409);
    $pdo->prepare('UPDATE support_reports SET archived_at=:archived, archived_by_admin_id=:actor WHERE id=:id')->execute(['archived'=>$archive?date('Y-m-d H:i:s'):null,'actor'=>$archive?$actor:null,'id'=>$id]);
    record_admin_audit($pdo,$actor,$archive?'SUPPORT_REPORT_ARCHIVED':'SUPPORT_REPORT_RESTORED',null,['report_id'=>$id]);
}
json_success(['entity'=>$entity,'id'=>$id,'archived'=>$archive,'message'=>$archive?'Record moved to Super Admin Archives.':'Record restored to its active section.']);

