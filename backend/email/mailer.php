<?php
/**
 * Email sending via PHPMailer + SMTP.
 *
 * Run `composer install` inside /backend before this will work — it
 * requires vendor/autoload.php. If SMTP credentials are not configured
 * (empty SMTP_HOST), sending is skipped and logged rather than fatally
 * failing the booking request — a booking should still succeed even if
 * email is temporarily unavailable.
 */

declare(strict_types=1);

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

$autoload = __DIR__ . '/../vendor/autoload.php';
if (is_file($autoload)) {
    require_once $autoload;
}

function make_mailer(): ?PHPMailer
{
    if (!class_exists(PHPMailer::class)) {
        error_log('[MAILER] PHPMailer not installed. Run "composer install" in /backend.');
        return null;
    }

    $config = require __DIR__ . '/../config/config.php';
    $smtp = $config['smtp'];

    if (empty($smtp['host']) || empty($smtp['username']) || empty($smtp['password'])) {
        error_log('[MAILER] SMTP credentials are incomplete — skipping email send.');
        return null;
    }

    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtp['host'];
    $mail->Port = $smtp['port'];
    $mail->SMTPAuth = true;
    $mail->Timeout = 5;
    $mail->Timelimit = 5;
    $mail->Username = $smtp['username'];
    $mail->Password = $smtp['password'];
    $mail->SMTPSecure = $smtp['port'] === 465 ? PHPMailer::ENCRYPTION_SMTPS : PHPMailer::ENCRYPTION_STARTTLS;
    $mail->CharSet = 'UTF-8';
    $mail->setFrom($smtp['from_email'], $smtp['from_name']);

    return $mail;
}

/**
 * One bounded retry for transient SMTP failures. Callers still catch the
 * final exception so third-party email outages never roll back saved data.
 */
function send_mail_with_retry(PHPMailer $mail, string $context): void
{
    $lastError = null;
    for ($attempt = 1; $attempt <= 2; $attempt++) {
        try {
            $mail->send();
            return;
        } catch (Throwable $e) {
            $lastError = $e;
            $mail->smtpClose();
            if ($attempt < 2) usleep(250000);
        }
    }
    throw new RuntimeException("{$context} failed after a retry.", 0, $lastError);
}

/**
 * The most recently maintained admin profile is the studio's notification
 * address. Fall back to the environment setting during setup or recovery.
 */
function studio_profile_email(?array $config = null): string
{
    static $resolvedEmail = null;

    if ($resolvedEmail !== null) {
        return $resolvedEmail;
    }

    $config ??= require __DIR__ . '/../config/config.php';
    $fallback = trim((string) ($config['smtp']['admin_email'] ?? ''));

    try {
        require_once __DIR__ . '/../config/database.php';
        $pdo = Database::connect();
        $stmt = $pdo->query(
            "SELECT email FROM admins
             WHERE email IS NOT NULL AND TRIM(email) <> ''
             ORDER BY updated_at DESC, id ASC
             LIMIT 1"
        );
        $profileEmail = trim((string) ($stmt->fetchColumn() ?: ''));
        Database::disconnect();

        if ($profileEmail !== '' && filter_var($profileEmail, FILTER_VALIDATE_EMAIL)) {
            return $resolvedEmail = $profileEmail;
        }
    } catch (Throwable $e) {
        Database::disconnect();
        error_log('[MAILER] Unable to resolve studio profile email: ' . $e->getMessage());
    }

    return $resolvedEmail = $fallback;
}

function add_studio_reply_to(PHPMailer $mail, ?array $config = null): void
{
    $studioEmail = studio_profile_email($config);
    if ($studioEmail !== '') {
        $mail->addReplyTo($studioEmail, 'Jonathan Photography');
    }
}

function peso(float $amount): string
{
    return '₱' . number_format($amount, 0);
}

/**
 * Sends the "we received your request" email to the client, and a
 * notification email to the studio. Failures are logged, never thrown —
 * a booking must not be lost just because SMTP hiccups.
 */
function send_booking_emails(array $booking): void
{
    $config = require __DIR__ . '/../config/config.php';

    $shootType = htmlspecialchars($booking['shoot_type']);
    $name = htmlspecialchars($booking['name']);
    $date = $booking['preferred_date'] ? date('F j, Y', strtotime($booking['preferred_date'])) : 'To be discussed';
    if (!empty($booking['preferred_time'])) {
        $date .= ' at ' . date('g:i A', strtotime((string) $booking['preferred_time']));
    }
    $location = htmlspecialchars($booking['location'] ?: 'To be discussed');
    $estimate = $booking['estimate_total'] ? peso((float) $booking['estimate_total']) : 'To be discussed';
    $reference = htmlspecialchars($booking['reference_code']);

    // Notify the studio first so client-mail latency cannot delay the new-request alert.
    try {
        $mail = make_mailer();
        $studioEmail = studio_profile_email($config);
        if ($mail && $studioEmail !== '') {
            $mail->addAddress($studioEmail);
            $mail->isHTML(true);
            $subjectDate = $booking['preferred_date'] ?: 'Date TBD';
            $mail->Subject = "New booking request — {$booking['name']}, {$booking['shoot_type']}, {$subjectDate}";
            $mail->Body = admin_email_body($booking);
            send_mail_with_retry($mail, 'Studio booking email');
        }
    } catch (Throwable $e) {
        error_log('[MAILER] Admin notification email failed: ' . $e->getMessage());
    }

    // ---- Client confirmation email ----
    try {
        $mail = make_mailer();
        if ($mail) {
            add_studio_reply_to($mail, $config);
            $mail->addAddress($booking['email'], $booking['name']);
            $mail->isHTML(true);
            $mail->Subject = "We've got your request, {$booking['name']} — Jonathan Photography";
            $mail->Body = client_email_body($name, $shootType, $date, $location, $estimate, $reference);
            $mail->AltBody = "Hi {$booking['name']},\n\nThank you for reaching out to Jonathan Photography. We've received your booking request (ref. {$reference}) and will review the details shortly.\n\nShoot: {$shootType}\nDate: {$date}\nLocation: {$location}\nEstimated Budget: {$estimate}\n\nWe'll reach out using the information you provided.\n\n— Jonathan Photography";
            send_mail_with_retry($mail, 'Client booking email');
        }
    } catch (Throwable $e) {
        error_log('[MAILER] Client email failed: ' . $e->getMessage());
    }

}

function client_email_body(string $name, string $shootType, string $date, string $location, string $estimate, string $reference): string
{
    return <<<HTML
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color:#0A0A0A;">
      <div style="background:#0A0A0A; padding: 28px 32px;">
        <span style="color:#F5D000; font-size:12px; letter-spacing:3px; text-transform:uppercase;">Jonathan Photography</span>
      </div>
      <div style="padding: 32px; background:#F7F7F5;">
        <h1 style="font-size:22px; margin:0 0 16px;">Hi, {$name}!</h1>
        <p style="line-height:1.6; font-size:15px;">Thank you for reaching out to Jonathan Photography. We've received your booking request and our team will review the details shortly — usually within 1–2 business days.</p>
        <table style="width:100%; border-collapse:collapse; margin:24px 0; font-size:14px;">
          <tr><td style="padding:8px 0; border-bottom:1px solid #ddd; color:#777;">Reference</td><td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right;">{$reference}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #ddd; color:#777;">Shoot</td><td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right;">{$shootType}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #ddd; color:#777;">Date</td><td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right;">{$date}</td></tr>
          <tr><td style="padding:8px 0; border-bottom:1px solid #ddd; color:#777;">Location</td><td style="padding:8px 0; border-bottom:1px solid #ddd; text-align:right;">{$location}</td></tr>
          <tr><td style="padding:8px 0; color:#777;">Estimated Budget</td><td style="padding:8px 0; text-align:right; font-weight:bold;">{$estimate}</td></tr>
        </table>
        <p style="line-height:1.6; font-size:15px;">We'll contact you using the details you provided. Until then, you're welcome to look through more of our work.</p>
        <p style="margin-top:28px; font-size:13px; color:#777;">Thank you for trusting us with your moments.<br/><strong style="color:#0A0A0A;">— Jonathan Photography</strong></p>
      </div>
    </div>
    HTML;
}

function admin_email_body(array $b): string
{
    $safe = fn($v) => htmlspecialchars((string) ($v ?? '—'));
    $estimate = $b['estimate_total'] ? peso((float) $b['estimate_total']) : '—';
    $breakdown = is_array($b['estimate_breakdown'] ?? null) ? $b['estimate_breakdown'] : [];
    $estimateRows = '';

    if (!empty($breakdown['service'])) {
        $service = $breakdown['service'];
        $estimateRows .= '<tr><td style="padding:7px 0;border-bottom:1px solid #ddd;">'
            . $safe($service['name'] ?? 'Service')
            . '</td><td style="padding:7px 0;border-bottom:1px solid #ddd;text-align:right;">'
            . peso((float) ($service['price'] ?? 0)) . '</td></tr>';
    }

    if (!empty($breakdown['hours'])) {
        $hours = $breakdown['hours'];
        $estimateRows .= '<tr><td style="padding:7px 0;border-bottom:1px solid #ddd;">'
            . $safe($hours['label'] ?? 'Coverage')
            . '</td><td style="padding:7px 0;border-bottom:1px solid #ddd;text-align:right;">'
            . peso((float) ($hours['price'] ?? 0)) . '</td></tr>';
    }

    foreach (($breakdown['addons'] ?? []) as $addon) {
        $quantity = max(1, (int) ($addon['quantity'] ?? 1));
        $label = ($quantity > 1 ? $quantity . '× ' : '') . ($addon['label'] ?? 'Add-on');
        $estimateRows .= '<tr><td style="padding:7px 0;border-bottom:1px solid #ddd;">'
            . $safe($label)
            . '</td><td style="padding:7px 0;border-bottom:1px solid #ddd;text-align:right;">'
            . peso((float) ($addon['total'] ?? $addon['price'] ?? 0)) . '</td></tr>';
    }

    $config = require __DIR__ . '/../config/config.php';
    $adminUrl = rtrim((string) $config['frontend_url'], '/') . '/admin/bookings/' . rawurlencode((string) $b['id']);
    $adminUrlSafe = htmlspecialchars($adminUrl, ENT_QUOTES, 'UTF-8');

    return <<<HTML
    <div style="font-family: Arial, sans-serif; max-width:560px; margin:0 auto; color:#0A0A0A;">
      <h2 style="border-bottom:3px solid #F5D000; padding-bottom:8px;">New booking request</h2>
      <p><strong>Booking ID:</strong> {$safe($b['id'])} &nbsp; <strong>Reference:</strong> {$safe($b['reference_code'])}</p>
      <h3>Client</h3>
      <p>{$safe($b['name'] ?? null)}<br/>{$safe($b['email'] ?? null)}<br/>{$safe($b['phone'] ?? null)}<br/>{$safe($b['facebook'] ?? null)}</p>
      <h3>Shoot</h3>
      <p>Type: {$safe($b['shoot_type'] ?? null)}<br/>Date: {$safe($b['preferred_date'] ?? null)}<br/>Preferred start time: {$safe($b['preferred_time'] ?? null)}<br/>Location: {$safe($b['location'] ?? null)}<br/>Guests: {$safe($b['guest_count'] ?? null)}</p>
      <h3>Estimate</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        {$estimateRows}
        <tr><td style="padding:10px 0;font-weight:bold;">Estimated total</td><td style="padding:10px 0;text-align:right;font-weight:bold;color:#8A7200;">{$estimate}</td></tr>
      </table>
      <p style="color:#666;font-size:12px;">Preliminary estimate only; review the final quotation with the client.</p>
      <h3>Message</h3>
      <p>{$safe($b['message'] ?? null)}</p>
      <p style="margin-top:24px;"><a href="{$adminUrlSafe}" style="display:inline-block;background:#F5D000;color:#0A0A0A;padding:12px 18px;text-decoration:none;font-weight:bold;">Open booking details</a></p>
    </div>
    HTML;
}

/** Sends the final-package invoice after a manually recorded down payment. */
function send_booking_invoice(array $booking): bool
{
    try {
        $details = is_array($booking['confirmed_details'] ?? null)
            ? $booking['confirmed_details']
            : json_decode((string) ($booking['confirmed_details'] ?? ''), true, 512, JSON_THROW_ON_ERROR);
        $total = round((float) ($details['total'] ?? 0), 2);
        $payment = round((float) ($booking['down_payment_amount'] ?? 0), 2);
        if ($total <= 0 || $payment <= 0 || empty($booking['email'])) return false;
        $fee = round($total * ($total > 10000 ? 0.01 : 0.005), 2);
        $balance = max(0, round($total - $payment, 2));
        $safe = fn($value) => htmlspecialchars((string) ($value ?? '—'), ENT_QUOTES, 'UTF-8');
        $rows = '';
        if (!empty($details['coverage'])) {
            $coverage = $safe($details['coverage'] . (!empty($details['hours']) ? ' (' . $details['hours'] . ' hours)' : ''));
            $rows .= "<tr><td style='padding:7px 0;border-bottom:1px solid #ddd;'>Coverage</td><td style='padding:7px 0;border-bottom:1px solid #ddd;text-align:right;'>{$coverage}</td></tr>";
        }
        foreach (($details['addons'] ?? []) as $addon) {
            $label = $safe(((int) ($addon['quantity'] ?? 1) > 1 ? (int) $addon['quantity'] . '× ' : '') . ($addon['label'] ?? 'Add-on'));
            $amount = peso((float) ($addon['amount'] ?? 0) * max(1, (int) ($addon['quantity'] ?? 1)));
            $rows .= "<tr><td style='padding:7px 0;border-bottom:1px solid #ddd;'>{$label}</td><td style='padding:7px 0;border-bottom:1px solid #ddd;text-align:right;'>{$amount}</td></tr>";
        }
        $config = require __DIR__ . '/../config/config.php';
        $studioEmail = studio_profile_email($config);
        $studioPhone = '';
        $studioAddress = '';
        try {
            require_once __DIR__ . '/../config/database.php';
            $contactPdo = Database::connect();
            $contactRows = $contactPdo->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('business_phone','business_address')")->fetchAll(PDO::FETCH_KEY_PAIR);
            $studioPhone = (string) ($contactRows['business_phone'] ?? '');
            $studioAddress = (string) ($contactRows['business_address'] ?? '');
            Database::disconnect();
        } catch (Throwable $e) {
            Database::disconnect();
            error_log('[MAILER] Invoice contact lookup failed: ' . $e->getMessage());
        }
        $mail = make_mailer();
        if (!$mail) return false;
        add_studio_reply_to($mail, $config);
        $mail->addAddress((string) $booking['email'], (string) $booking['name']);
        $mail->isHTML(true);
        $mail->Subject = 'Payment receipt and invoice — ' . $booking['reference_code'];
        $mail->Body = "<div style='font-family:Arial,sans-serif;max-width:580px;margin:auto;color:#111'>
          <h2 style='border-bottom:3px solid #F5D000;padding-bottom:10px'>Jonathan Photography invoice</h2>
          <p><strong>Reference:</strong> {$safe($booking['reference_code'])}<br><strong>Client:</strong> {$safe($booking['name'])}<br><strong>Final event date:</strong> {$safe($details['date'] ?? '')}</p>
          <table style='width:100%;border-collapse:collapse;font-size:14px'>
            <tr><td style='padding:7px 0;border-bottom:1px solid #ddd;'>Package</td><td style='padding:7px 0;border-bottom:1px solid #ddd;text-align:right;'>{$safe($booking['shoot_type'])}</td></tr>{$rows}
            <tr><td style='padding:10px 0;font-weight:bold'>Final agreed total</td><td style='text-align:right;font-weight:bold'>" . peso($total) . "</td></tr>
            <tr><td style='padding:7px 0'>Down payment received ({$safe($booking['down_payment_received_at'])})</td><td style='text-align:right'>−" . peso($payment) . "</td></tr>
            <tr><td style='padding:7px 0'>Platform service fee (informational only; not charged separately)</td><td style='text-align:right'>" . peso($fee) . "</td></tr>
            <tr><td style='padding:12px 0;border-top:2px solid #111;font-weight:bold'>Balance due to studio</td><td style='padding:12px 0;border-top:2px solid #111;text-align:right;font-weight:bold'>" . peso($balance) . "</td></tr>
          </table>
          <p style='color:#666;font-size:13px'>The platform service fee is shown for transparency and is not added to the amount you owe Jonathan Photography.</p>
          <p>Questions? Contact <a href='mailto:{$safe($studioEmail)}'>{$safe($studioEmail)}</a>" . ($studioPhone !== '' ? '<br>' . $safe($studioPhone) : '') . ($studioAddress !== '' ? '<br>' . $safe($studioAddress) : '') . ".</p>
        </div>";
        $mail->AltBody = "Invoice {$booking['reference_code']}\nPackage: {$booking['shoot_type']}\nFinal total: " . peso($total) . "\nDown payment received: " . peso($payment) . " on {$booking['down_payment_received_at']}\nPlatform service fee (informational only): " . peso($fee) . "\nBalance due: " . peso($balance) . "\nContact: {$studioEmail} {$studioPhone} {$studioAddress}";
        send_mail_with_retry($mail, 'Booking invoice');
        return true;
    } catch (Throwable $e) {
        error_log('[MAILER] Invoice email failed: ' . $e->getMessage());
        return false;
    }
}
