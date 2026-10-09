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
$input=json_input();
$v=new Validator($input); $v->required('id')->positiveInteger('id','booking id')->required('payment_type')->inList('payment_type',['DOWN_PAYMENT','FINAL_PAYMENT'])->required('amount')->required('date')->date('date',false)->string('note','Note')->maxLength('note',500);
if($v->fails()) json_error('Please correct the payment details.',422,$v->errors());
$id=positive_integer_input($input['id']??null); $amount=money_input($input['amount']??null); $type=(string)$input['payment_type'];
if($amount===null||$amount<=0) json_error('Payment amount must be greater than zero.',422);
$pdo=Database::connect();
try {
  $pdo->beginTransaction();
  $stmt=$pdo->prepare('SELECT * FROM bookings WHERE id=:id FOR UPDATE'); $stmt->execute(['id'=>$id]); $booking=$stmt->fetch(PDO::FETCH_ASSOC);
  if(!$booking){$pdo->rollBack();json_error('Booking not found.',404);}
  if($booking['status']!=='CONFIRMED'||empty($booking['agreed_details'])){$pdo->rollBack();json_error('Confirm the booking and save agreed details before recording payments.',409);}
  $booking['agreed_details']=json_decode((string)$booking['agreed_details'],true,512,JSON_THROW_ON_ERROR);
  $payments=booking_payments($pdo,$id); $paid=round(array_sum(array_map(fn($p)=>(float)$p['amount'],$payments)),2); $total=(float)$booking['agreed_details']['total']; $remaining=round($total-$paid,2);
  if($amount>$remaining){$pdo->rollBack();json_error('Payment cannot exceed the remaining balance.',422);}
  if($type==='DOWN_PAYMENT' && $amount >= $remaining){$pdo->rollBack();json_error('The down payment must be less than the agreed total so a final payment and paid-in-full receipt can follow.',422);}
  if($type==='FINAL_PAYMENT'){
    if(!array_filter($payments,fn($p)=>$p['payment_type']==='DOWN_PAYMENT')){$pdo->rollBack();json_error('Record the down payment first.',409);}
    $downInvoice=$pdo->prepare("SELECT id FROM invoices WHERE booking_id=:id AND invoice_type='DOWN_PAYMENT' AND voided_at IS NULL AND sent_at IS NOT NULL ORDER BY id DESC LIMIT 1");
    $downInvoice->execute(['id'=>$id]);
    if(!$downInvoice->fetchColumn()){$pdo->rollBack();json_error('Send the active down-payment invoice before recording the final payment.',409);}
    if(abs($amount-$remaining)>0.009){$pdo->rollBack();json_error('Final payment must equal the remaining balance.',422);}
  }
  $insert=$pdo->prepare('INSERT INTO booking_payments (booking_id,payment_type,amount,received_at,note) VALUES (:booking,:type,:amount,:date,:note)');
  $insert->execute(['booking'=>$id,'type'=>$type,'amount'=>$amount,'date'=>$input['date'],'note'=>clean_string($input['note']??'')]);
  $paymentId=(int)$pdo->lastInsertId();
  $invoice=create_invoice_record($pdo,$booking,$type,$paymentId);
  $pdo->commit();

  $sent=send_stored_invoice($invoice,$booking);
  if($sent){
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE invoices SET sent_at=NOW() WHERE id=:id AND sent_at IS NULL')->execute(['id'=>$invoice['id']]);
    if($type==='DOWN_PAYMENT') accrue_platform_fee($pdo,$booking,$invoice['id']);
    $pdo->commit();
    $invoice['sent_at']=date('Y-m-d H:i:s');
  }
  $allPayments=booking_payments($pdo,$id); $totalPaid=round(array_sum(array_map(fn($p)=>(float)$p['amount'],$allPayments)),2);
  json_success(['payment'=>end($allPayments),'payments'=>$allPayments,'invoice'=>$invoice,'invoice_sent'=>$sent,'total_paid'=>$totalPaid,'balance_due'=>max(0,round($total-$totalPaid,2)),'message'=>$sent?'Payment recorded and invoice sent.':'Payment recorded and invoice saved as a draft. Send it again after checking email settings.']);
} catch(PDOException $e){
  if($pdo->inTransaction())$pdo->rollBack();
  if($e->getCode()==='23000') json_error('That payment stage is already recorded.',409);
  log_server_error('BOOKING_PAYMENT',$e);json_error('Unable to record the payment.',500);
} catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();log_server_error('BOOKING_PAYMENT',$e);json_error('Unable to record the payment.',500);}
