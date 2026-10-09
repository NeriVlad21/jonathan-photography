<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/billing.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_admin();
$pdo=Database::connect();
$method=$_SERVER['REQUEST_METHOD'];

if($method==='GET'){
  refresh_fee_cycle_statuses($pdo);
  $settings=billing_settings($pdo);
  $cycles=$pdo->query("SELECT fc.*, COALESCE(SUM(CASE WHEN pfl.voided_at IS NULL THEN pfl.fee_amount ELSE 0 END),0) total_owed, COUNT(CASE WHEN pfl.voided_at IS NULL THEN 1 END) booking_count FROM fee_cycles fc LEFT JOIN platform_fee_ledger pfl ON pfl.cycle_id=fc.id GROUP BY fc.id ORDER BY fc.cycle_start DESC")->fetchAll(PDO::FETCH_ASSOC);
  $ledger=$pdo->query("SELECT pfl.*, b.reference_code,b.name,b.status booking_status,i.invoice_number,fc.cycle_start,fc.cycle_end,fc.due_date,fc.status cycle_status FROM platform_fee_ledger pfl JOIN bookings b ON b.id=pfl.booking_id JOIN invoices i ON i.id=pfl.invoice_id JOIN fee_cycles fc ON fc.id=pfl.cycle_id ORDER BY pfl.accrued_at DESC")->fetchAll(PDO::FETCH_ASSOC);
  $due=(float)$pdo->query("SELECT COALESCE(SUM(pfl.fee_amount),0) FROM platform_fee_ledger pfl JOIN fee_cycles fc ON fc.id=pfl.cycle_id WHERE pfl.voided_at IS NULL AND fc.status<>'PAID'")->fetchColumn();
  json_success(['settings'=>$settings,'cycles'=>$cycles,'ledger'=>$ledger,'total_due'=>$due]);
}

require_csrf(); $input=json_input();
if($method==='PUT'){
  $v=new Validator($input); $v->required('cycle_start_date')->date('cycle_start_date',false);
  if($v->fails())json_error('Choose a valid billing-cycle start date.',422,$v->errors());
  $pdo->prepare("INSERT INTO site_settings(setting_key,setting_value) VALUES('platform_fee_cycle_start_date',:value) ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value)")->execute(['value'=>$input['cycle_start_date']]);
  json_success(['cycle_start_date'=>$input['cycle_start_date'],'message'=>'Billing-cycle start date updated. Existing cycles were preserved.']);
}
if($method==='POST'){
  $id=positive_integer_input($input['cycle_id']??null); $date=(string)($input['paid_at']??''); $note=clean_string($input['note']??'');
  $v=new Validator($input); $v->required('cycle_id')->positiveInteger('cycle_id','cycle id')->required('paid_at')->date('paid_at',false)->string('note','Note')->maxLength('note',500);
  if($v->fails())json_error('Please correct the cycle payment details.',422,$v->errors());
  $stmt=$pdo->prepare("UPDATE fee_cycles SET status='PAID',paid_at=:date,payment_note=:note WHERE id=:id AND paid_at IS NULL");
  $stmt->execute(['date'=>$date,'note'=>$note,'id'=>$id]);
  if(!$stmt->rowCount())json_error('Cycle not found or already marked paid.',409);
  json_success(['cycle_id'=>$id,'status'=>'PAID','paid_at'=>$date,'payment_note'=>$note,'message'=>'Billing cycle marked as paid.']);
}
json_error('Method not allowed.',405);
