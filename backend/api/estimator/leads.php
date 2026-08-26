<?php
/**
 * GET  /api/estimator/leads.php   — admin: list every estimator lead,
 *      with a live-computed "booked" flag (true if that email later
 *      submitted a booking).
 * POST /api/estimator/leads.php   — public: "Email me this estimate"
 *      Body: { name, email, hours, addons: [...], service_type, total }
 */

declare(strict_types=1);

require_once __DIR__ . '/../../middleware/cors.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validation.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../email/mailer.php';

$pdo = Database::connect();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    require_admin();
    $stmt = $pdo->query(
        'SELECT l.*,
                EXISTS(SELECT 1 FROM bookings b WHERE b.email = l.email) AS booked_live
         FROM estimator_leads l
         ORDER BY l.created_at DESC'
    );
    json_success($stmt->fetchAll());
}

if ($method === 'POST') {
    $input = json_input();

    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!rate_limit_check('estimator_lead', $ip, 12)) {
        json_error('Too many requests. Please try again in a bit.', 429);
    }
    if (honeypot_tripped($input)) {
        // Silently pretend success to not tip off bots.
        json_success(['saved' => true]);
    }

    $v = new Validator($input);
    $v->required('name', 'your name')->required('email', 'your email')->email('email')->required('total');
    if ($v->fails()) json_error('Please fix the errors below.', 422, $v->errors());

    $stmt = $pdo->prepare(
        'INSERT INTO estimator_leads (name, email, hours, addons, service_type, total)
         VALUES (:name, :email, :hours, :addons, :service, :total)'
    );
    $stmt->execute([
        'name'    => clean_string($input['name']),
        'email'   => clean_string($input['email']),
        'hours'   => isset($input['hours']) ? (float) $input['hours'] : null,
        'addons'  => json_encode($input['addons'] ?? [], JSON_UNESCAPED_SLASHES),
        'service' => clean_string($input['service_type'] ?? ''),
        'total'   => (float) $input['total'],
    ]);

    // Best-effort email of the estimate — never block the save on this.
    try {
        $mail = make_mailer();
        if ($mail) {
            $addonLines = '';
            foreach (($input['addons'] ?? []) as $addon) {
                $label = htmlspecialchars($addon['label'] ?? '');
                $price = isset($addon['price']) ? peso((float) $addon['price']) : '';
                $addonLines .= "<tr><td style='padding:4px 0;color:#777;'>{$label}</td><td style='padding:4px 0;text-align:right;'>{$price}</td></tr>";
            }
            $mail->addAddress($input['email'], $input['name']);
            $mail->isHTML(true);
            $mail->Subject = 'Your Jonathan Photography estimate';
            $mail->Body = "<div style='font-family:Georgia,serif;max-width:520px;margin:0 auto;'>
                <h2 style='border-bottom:3px solid #F5D000;padding-bottom:8px;'>Your Estimate</h2>
                <table style='width:100%;border-collapse:collapse;font-size:14px;'>{$addonLines}
                <tr><td style='padding-top:10px;font-weight:bold;'>Estimated Total</td><td style='padding-top:10px;text-align:right;font-weight:bold;'>" . peso((float) $input['total']) . "</td></tr>
                </table>
                <p style='color:#777;font-size:13px;margin-top:20px;'>This is a baseline estimate — we're happy to customize it during a consultation. Ready to move forward? Just reply to this email or visit our booking page.</p>
                </div>";
            $mail->send();
        }
    } catch (Throwable $e) {
        log_server_error('ESTIMATOR_LEAD_EMAIL', $e);
    }

    json_success(['saved' => true], 201);
}

json_error('Method not allowed.', 405);
