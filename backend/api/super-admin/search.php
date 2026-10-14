<?php

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

require_super_admin();
if($_SERVER['REQUEST_METHOD']!=='GET')json_error('Method not allowed.',405);
$q=trim((string)($_GET['q']??''));
if($q===''||mb_strlen($q)>100)json_success(['results'=>[]]);
$pdo=Database::connect();$like='%'.$q.'%';$results=[];

$stmt=$pdo->prepare("SELECT id,cycle_start,cycle_end,status,due_date,paid_at,archived_at FROM fee_cycles WHERE CAST(id AS CHAR) LIKE :q OR cycle_start LIKE :q OR cycle_end LIKE :q OR status LIKE :q OR COALESCE(payment_note,'') LIKE :q ORDER BY cycle_start DESC LIMIT 8");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Billing cycle','label'=>$r['cycle_start'].' – '.$r['cycle_end'],'meta'=>$r['status'].' · Due '.$r['due_date'],'to'=>$r['archived_at']?'/admin/super-archives?type=cycles':'/admin/platform-fees'];
$stmt=$pdo->prepare("SELECT pfl.id,b.reference_code,b.name,pfl.fee_amount,fc.status,pfl.archived_at FROM platform_fee_ledger pfl JOIN bookings b ON b.id=pfl.booking_id JOIN fee_cycles fc ON fc.id=pfl.cycle_id JOIN invoices i ON i.id=pfl.invoice_id WHERE b.reference_code LIKE :q OR b.name LIKE :q OR i.invoice_number LIKE :q OR fc.status LIKE :q ORDER BY pfl.accrued_at DESC LIMIT 8");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Fee ledger','label'=>$r['reference_code'].' · '.$r['name'],'meta'=>'₱'.number_format((float)$r['fee_amount'],2).' · '.$r['status'],'to'=>$r['archived_at']?'/admin/super-archives?type=ledger':'/admin/platform-fees'];
$stmt=$pdo->prepare("SELECT id,subject,status,category,archived_at FROM support_reports WHERE subject LIKE :q OR description LIKE :q OR status LIKE :q OR category LIKE :q ORDER BY created_at DESC LIMIT 8");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Support report','label'=>'#'.$r['id'].' · '.$r['subject'],'meta'=>$r['category'].' · '.str_replace('_',' ',$r['status']),'to'=>$r['archived_at']?'/admin/super-archives?type=reports':'/admin/support'];
$stmt=$pdo->prepare("SELECT id,name,description,visible FROM services WHERE name LIKE :q OR description LIKE :q OR category LIKE :q ORDER BY updated_at DESC LIMIT 6");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Website content','label'=>$r['name'],'meta'=>'Service · '.($r['visible']?'Visible':'Hidden'),'to'=>'/admin/content-oversight'];
$stmt=$pdo->prepare("SELECT id,title,description,visible FROM portfolio_shoots WHERE title LIKE :q OR description LIKE :q OR location LIKE :q ORDER BY updated_at DESC LIMIT 6");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Website content','label'=>$r['title'],'meta'=>'Portfolio shoot · '.($r['visible']?'Visible':'Hidden'),'to'=>'/admin/content-oversight'];
$stmt=$pdo->prepare("SELECT id,name,visible FROM portfolio_categories WHERE name LIKE :q OR description LIKE :q UNION ALL SELECT id,label,visible FROM contact_platforms WHERE label LIKE :q OR tagline LIKE :q OR handle LIKE :q OR link LIKE :q LIMIT 8");$stmt->execute(['q'=>$like]);
foreach($stmt->fetchAll() as $r)$results[]=['type'=>'Website content','label'=>$r['name'],'meta'=>'Portfolio or contact content · '.($r['visible']?'Visible':'Hidden'),'to'=>'/admin/content-oversight'];
$stmt=$pdo->prepare("SELECT updated_at FROM site_settings WHERE setting_key='public_content_v1' AND setting_value LIKE :q LIMIT 1");$stmt->execute(['q'=>$like]);
if($stmt->fetchColumn())$results[]=['type'=>'Website content','label'=>'Website copy match','meta'=>'Homepage, FAQ, music, services, contact, or booking copy','to'=>'/admin/content-oversight'];
json_success(['results'=>array_slice($results,0,24)]);

