<?php
declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../helpers/billing.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error('Method not allowed.',405);
require_admin(); require_csrf();
$input=json_input(); $invoiceId=positive_integer_input($input['invoice_id']??null);
if(!$invoiceId) json_error('Invalid invoice id.',422);
$pdo=Database::connect();
$stmt=$pdo->prepare('SELECT i.*, b.name, b.email, b.phone, b.reference_code, b.shoot_type, b.agreed_details FROM invoices i JOIN bookings b ON b.id=i.booking_id WHERE i.id=:id');
$stmt->execute(['id'=>$invoiceId]); $row=$stmt->fetch(PDO::FETCH_ASSOC);
if(!$row) json_error('Invoice not found.',404);
if($row['voided_at']) json_error('Voided invoices cannot be sent.',409);
$invoice=$row; $invoice['snapshot']=json_decode((string)$row['snapshot'],true,512,JSON_THROW_ON_ERROR);
$booking=['id'=>(int)$row['booking_id'],'name'=>$row['name'],'email'=>$row['email'],'phone'=>$row['phone'],'reference_code'=>$row['reference_code'],'shoot_type'=>$row['shoot_type'],'agreed_details'=>json_decode((string)$row['agreed_details'],true,512,JSON_THROW_ON_ERROR)];
if(!send_stored_invoice($invoice,$booking)) json_error('The invoice could not be sent. Check the email configuration and try again.',502);
try{
  $pdo->beginTransaction();
  $pdo->prepare('UPDATE invoices SET sent_at=COALESCE(sent_at,NOW()) WHERE id=:id')->execute(['id'=>$invoiceId]);
  if($row['invoice_type']==='DOWN_PAYMENT') accrue_platform_fee($pdo,$booking,$invoiceId);
  $pdo->commit();
}catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();log_server_error('INVOICE_SEND_STATE',$e);json_error('Invoice was emailed, but its sent status could not be saved. Please do not resend until this is checked.',500);}
json_success(['invoice_id'=>$invoiceId,'sent_at'=>$row['sent_at']?:date('Y-m-d H:i:s'),'message'=>$row['sent_at']?'Invoice resent successfully.':'Invoice sent successfully.']);
