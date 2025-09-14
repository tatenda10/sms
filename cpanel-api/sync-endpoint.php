<?php
// cPanel Sync API Endpoint
// Upload this file to your cPanel public_html/api/ directory

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Get database credentials from cPanel
$db_host = 'localhost';
$db_name = 'your_cpanel_db_name';
$db_user = 'your_cpanel_db_user';
$db_pass = 'your_cpanel_db_password';

// API Key validation
$api_key = 'your_secure_api_key';
$headers = getallheaders();
$auth_header = $headers['Authorization'] ?? '';

if (!preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches) || $matches[1] !== $api_key) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

try {
    // Connect to database
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get JSON data
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!$data) {
        throw new Exception('Invalid JSON data');
    }
    
    $synced_records = 0;
    
    // Sync student balances
    if (isset($data['data']['student_balances'])) {
        $stmt = $pdo->prepare("
            INSERT INTO student_balances 
            (student_reg_number, current_balance, last_updated, created_at)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            current_balance = VALUES(current_balance),
            last_updated = VALUES(last_updated)
        ");
        
        foreach ($data['data']['student_balances'] as $balance) {
            $stmt->execute([
                $balance['student_reg_number'],
                $balance['current_balance'],
                $balance['last_updated'],
                $balance['created_at'] ?? date('Y-m-d H:i:s')
            ]);
            $synced_records++;
        }
    }
    
    // Sync student transactions
    if (isset($data['data']['student_transactions'])) {
        $stmt = $pdo->prepare("
            INSERT INTO student_transactions 
            (student_reg_number, transaction_type, amount, description, transaction_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            amount = VALUES(amount),
            description = VALUES(description)
        ");
        
        foreach ($data['data']['student_transactions'] as $transaction) {
            $stmt->execute([
                $transaction['student_reg_number'],
                $transaction['transaction_type'],
                $transaction['amount'],
                $transaction['description'],
                $transaction['transaction_date'],
                $transaction['created_by'] ?? 1
            ]);
            $synced_records++;
        }
    }
    
    // Sync uniform issues
    if (isset($data['data']['uniform_issues'])) {
        $stmt = $pdo->prepare("
            INSERT INTO uniform_issues 
            (student_reg_number, item_id, quantity, amount, issue_date, payment_status, reference)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            quantity = VALUES(quantity),
            amount = VALUES(amount),
            payment_status = VALUES(payment_status)
        ");
        
        foreach ($data['data']['uniform_issues'] as $issue) {
            $stmt->execute([
                $issue['student_reg_number'],
                $issue['item_id'],
                $issue['quantity'],
                $issue['amount'],
                $issue['issue_date'],
                $issue['payment_status'],
                $issue['reference'] ?? null
            ]);
            $synced_records++;
        }
    }
    
    // Log sync activity
    $log_stmt = $pdo->prepare("
        INSERT INTO sync_logs 
        (sync_timestamp, records_synced, source, status)
        VALUES (?, ?, ?, 'success')
    ");
    $log_stmt->execute([
        $data['sync_timestamp'] ?? date('Y-m-d H:i:s'),
        $synced_records,
        $data['source'] ?? 'unknown'
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Sync completed successfully',
        'syncedRecords' => $synced_records,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    // Log error
    if (isset($pdo)) {
        try {
            $log_stmt = $pdo->prepare("
                INSERT INTO sync_logs 
                (sync_timestamp, records_synced, source, status, error_message)
                VALUES (?, 0, ?, 'error', ?)
            ");
            $log_stmt->execute([
                date('Y-m-d H:i:s'),
                $data['source'] ?? 'unknown',
                $e->getMessage()
            ]);
        } catch (Exception $log_error) {
            // Ignore logging errors
        }
    }
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Sync failed: ' . $e->getMessage()
    ]);
}
?>
