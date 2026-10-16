<?php
declare(strict_types=1);

function billing_settings(PDO $pdo): array
{
    $keys = ['platform_fee_threshold','platform_fee_low_rate','platform_fee_high_rate','platform_fee_cycle_start_date','platform_fee_due_days','pass_platform_fee_to_client_default'];
    $placeholders = implode(',', array_fill(0, count($keys), '?'));
    $stmt = $pdo->prepare("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ($placeholders)");
    $stmt->execute($keys);
    $values = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    return [
        'threshold' => (float) ($values['platform_fee_threshold'] ?? 10000),
        'low_rate' => (float) ($values['platform_fee_low_rate'] ?? 0.005),
        'high_rate' => (float) ($values['platform_fee_high_rate'] ?? 0.01),
        'cycle_start_date' => (string) ($values['platform_fee_cycle_start_date'] ?? date('Y-01-01')),
        'due_days' => max(0, min(90, (int) ($values['platform_fee_due_days'] ?? 7))),
        'pass_platform_fee_to_client_default' => ($values['pass_platform_fee_to_client_default'] ?? '0') === '1',
    ];
}

function platform_fee_values(PDO $pdo, float $total): array
{
    $settings = billing_settings($pdo);
    $rate = $total > $settings['threshold'] ? $settings['high_rate'] : $settings['low_rate'];
    return ['rate' => $rate, 'amount' => round($total * $rate, 2), 'settings' => $settings];
}

const FEE_RESPONSIBILITIES = ['CLIENT', 'STUDIO'];
const DOWN_PAYMENT_SHARE = 0.5;

/**
 * Rounds a peso amount to a whole peso, halves rounded up. The amount is
 * first rounded to 6 decimals so float noise (14.4999999) cannot flip a
 * half-peso value downward.
 */
function whole_peso(float $amount): int
{
    return (int) floor(round($amount, 6) + 0.5);
}

/** True when a money value is a whole number of pesos. */
function is_whole_peso(float $amount): bool
{
    return abs($amount - round($amount)) < 0.000001;
}

/**
 * Authoritative booking money figures, computed on the server from the
 * agreed service price and the owner's platform-fee choice:
 *   platform fee      = whole_peso(service total × configured rate)
 *   client total      = service total + fee   (CLIENT pays the fee)
 *                     = service total         (STUDIO absorbs the fee)
 *   required down     = whole_peso(client total × 50%)
 *
 * Agreed details saved before fee responsibility existed have no
 * fee_responsibility key. Their price already included the fee, so they
 * are read as STUDIO-absorbed with the fee computed as it was then.
 */
function booking_financials(PDO $pdo, array $agreed): array
{
    $serviceTotal = round((float) ($agreed['total'] ?? 0), 2);
    $responsibility = in_array($agreed['fee_responsibility'] ?? null, FEE_RESPONSIBILITIES, true) ? $agreed['fee_responsibility'] : null;
    if ($responsibility !== null && isset($agreed['platform_fee']['amount'], $agreed['platform_fee']['rate'])) {
        $feeRate = (float) $agreed['platform_fee']['rate'];
        $feeAmount = round((float) $agreed['platform_fee']['amount'], 2);
    } else {
        $fee = platform_fee_values($pdo, $serviceTotal);
        $feeRate = (float) $fee['rate'];
        $feeAmount = $responsibility === null ? $fee['amount'] : (float) whole_peso($serviceTotal * $feeRate);
    }
    $effective = $responsibility ?? 'STUDIO';
    $clientTotal = round($serviceTotal + ($effective === 'CLIENT' ? $feeAmount : 0), 2);
    return [
        'service_total' => $serviceTotal,
        'fee_responsibility' => $effective,
        'fee_responsibility_set' => $responsibility !== null,
        'fee_rate' => $feeRate,
        'fee_amount' => $feeAmount,
        'client_total' => $clientTotal,
        'required_down_payment' => whole_peso($clientTotal * DOWN_PAYMENT_SHARE),
    ];
}

/** Adds total paid and remaining client balance to booking_financials(). */
function booking_balance(PDO $pdo, array $agreed, int $bookingId): array
{
    $money = booking_financials($pdo, $agreed);
    $paid = round(array_sum(array_map(fn($p) => (float) $p['amount'], booking_payments($pdo, $bookingId))), 2);
    $money['total_paid'] = $paid;
    $money['balance_due'] = max(0, round($money['client_total'] - $paid, 2));
    return $money;
}

function booking_payments(PDO $pdo, int $bookingId): array
{
    $stmt = $pdo->prepare('SELECT id, payment_type, amount, received_at, note, created_at FROM booking_payments WHERE booking_id = :id ORDER BY received_at, id');
    $stmt->execute(['id' => $bookingId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function next_invoice_number(PDO $pdo): string
{
    $year = (int) date('Y');
    $pdo->prepare('INSERT INTO invoice_sequences (sequence_year, next_number) VALUES (:year, 1) ON DUPLICATE KEY UPDATE next_number = next_number')
        ->execute(['year' => $year]);
    $stmt = $pdo->prepare('SELECT next_number FROM invoice_sequences WHERE sequence_year = :year FOR UPDATE');
    $stmt->execute(['year' => $year]);
    $number = (int) $stmt->fetchColumn();
    $pdo->prepare('UPDATE invoice_sequences SET next_number = next_number + 1 WHERE sequence_year = :year')->execute(['year' => $year]);
    return sprintf('JP-%d-%04d', $year, $number);
}

function invoice_snapshot(PDO $pdo, array $booking, string $type): array
{
    $agreed = is_array($booking['agreed_details'] ?? null)
        ? $booking['agreed_details']
        : json_decode((string) ($booking['agreed_details'] ?? ''), true, 512, JSON_THROW_ON_ERROR);
    $payments = booking_payments($pdo, (int) $booking['id']);
    $money = booking_financials($pdo, $agreed);
    $total = $money['client_total'];
    $paid = round(array_sum(array_map(fn($item) => (float) $item['amount'], $payments)), 2);
    $contacts = $pdo->query("SELECT setting_key, setting_value FROM site_settings WHERE setting_key IN ('business_name','business_email','business_phone','business_address')")->fetchAll(PDO::FETCH_KEY_PAIR);
    return [
        'invoice_type' => $type,
        'issued_on' => date('Y-m-d'),
        'status_label' => $type === 'FINAL_PAYMENT' ? 'PAID IN FULL' : 'DOWN PAYMENT RECEIVED',
        'booking' => ['id' => (int) $booking['id'], 'reference_code' => $booking['reference_code'], 'shoot_type' => $booking['shoot_type']],
        'client' => ['name' => $booking['name'], 'email' => $booking['email'], 'phone' => $booking['phone']],
        'agreed_details' => $agreed,
        'payments' => $payments,
        // agreed_total is what the client agreed to pay (client total).
        'agreed_total' => $total,
        'service_total' => $money['service_total'],
        'client_total' => $total,
        'required_down_payment' => $money['required_down_payment'],
        'total_paid' => $paid,
        'balance_due' => max(0, round($total - $paid, 2)),
        'platform_fee' => [
            'rate' => $money['fee_rate'],
            'amount' => $money['fee_amount'],
            'responsibility' => $money['fee_responsibility'],
            'charged_to_client' => $money['fee_responsibility'] === 'CLIENT',
            'included_in_price' => $money['fee_responsibility'] === 'STUDIO',
        ],
        'studio' => [
            'name' => $contacts['business_name'] ?? 'Jonathan Photography',
            'email' => $contacts['business_email'] ?? '',
            'phone' => $contacts['business_phone'] ?? '',
            'address' => $contacts['business_address'] ?? '',
        ],
    ];
}

function create_invoice_record(PDO $pdo, array $booking, string $type, ?int $paymentId, ?int $revisionOf = null): array
{
    $number = next_invoice_number($pdo);
    $snapshot = invoice_snapshot($pdo, $booking, $type);
    $snapshot['invoice_number'] = $number;
    $stmt = $pdo->prepare('INSERT INTO invoices (booking_id, payment_id, invoice_type, invoice_number, revision_of_id, snapshot) VALUES (:booking, :payment, :type, :number, :revision, :snapshot)');
    $stmt->execute([
        'booking' => $booking['id'], 'payment' => $paymentId, 'type' => $type,
        'number' => $number, 'revision' => $revisionOf,
        'snapshot' => json_encode($snapshot, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
    ]);
    return ['id' => (int) $pdo->lastInsertId(), 'invoice_number' => $number, 'snapshot' => $snapshot, 'invoice_type' => $type, 'sent_at' => null, 'voided_at' => null];
}

function cycle_for_date(PDO $pdo, string $date): int
{
    $settings = billing_settings($pdo);
    $origin = new DateTimeImmutable($settings['cycle_start_date']);
    $target = new DateTimeImmutable($date);
    $days = max(0, (int) $origin->diff($target)->format('%a'));
    $offset = intdiv($days, 30) * 30;
    $start = $origin->modify("+{$offset} days");
    $end = $start->modify('+29 days');
    $due = $end->modify('+' . $settings['due_days'] . ' days');
    $pdo->prepare('INSERT INTO fee_cycles (cycle_start, cycle_end, due_date) VALUES (:start, :end, :due) ON DUPLICATE KEY UPDATE due_date = VALUES(due_date), archived_at = NULL, archived_by_admin_id = NULL')
        ->execute(['start' => $start->format('Y-m-d'), 'end' => $end->format('Y-m-d'), 'due' => $due->format('Y-m-d')]);
    $stmt = $pdo->prepare('SELECT id FROM fee_cycles WHERE cycle_start = :start AND cycle_end = :end');
    $stmt->execute(['start' => $start->format('Y-m-d'), 'end' => $end->format('Y-m-d')]);
    return (int) $stmt->fetchColumn();
}

function accrue_platform_fee(PDO $pdo, array $booking, int $invoiceId): void
{
    $agreed = is_array($booking['agreed_details']) ? $booking['agreed_details'] : json_decode((string) $booking['agreed_details'], true, 512, JSON_THROW_ON_ERROR);
    $money = booking_financials($pdo, $agreed);
    $total = $money['service_total'];
    $fee = ['rate' => $money['fee_rate'], 'amount' => $money['fee_amount']];
    $cycleId = cycle_for_date($pdo, date('Y-m-d'));
    $stmt = $pdo->prepare('INSERT INTO platform_fee_ledger (booking_id, invoice_id, cycle_id, agreed_total, fee_rate, fee_amount, accrued_at, voided_at) VALUES (:booking, :invoice, :cycle, :total, :rate, :amount, NOW(), NULL) ON DUPLICATE KEY UPDATE invoice_id=VALUES(invoice_id), cycle_id=VALUES(cycle_id), agreed_total=VALUES(agreed_total), fee_rate=VALUES(fee_rate), fee_amount=VALUES(fee_amount), voided_at=NULL, archived_at=NULL, archived_by_admin_id=NULL');
    $stmt->execute(['booking' => $booking['id'], 'invoice' => $invoiceId, 'cycle' => $cycleId, 'total' => $total, 'rate' => $fee['rate'], 'amount' => $fee['amount']]);
}

function void_platform_fee(PDO $pdo, int $bookingId): void
{
    $pdo->prepare('UPDATE platform_fee_ledger SET voided_at = COALESCE(voided_at, NOW()) WHERE booking_id = :id')->execute(['id' => $bookingId]);
}

function refresh_fee_cycle_statuses(PDO $pdo): void
{
    $pdo->exec("UPDATE fee_cycles SET status = CASE WHEN paid_at IS NOT NULL THEN 'PAID' WHEN due_date <= CURDATE() THEN 'DUE' ELSE 'OPEN' END");
}
