<?php
/**
 * SMS Database Sync API Endpoint
 * Upload this file to: https://server.learningladder.site/api/sync-full-db.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration - from environment variables
$db_config = [
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'username' => $_ENV['DB_USER'] ?? 'learpvop',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'database' => $_ENV['DB_NAME'] ?? 'learpvop_learningladder',
    'charset' => 'utf8mb4'
];

// No API key validation needed - direct access

function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    http_response_code($success ? 200 : 400);
    echo json_encode($response);
    exit();
}

function logMessage($message) {
    $log_file = 'sync-log-' . date('Y-m-d') . '.txt';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message\n", FILE_APPEND);
}

try {
    // Check if it's a GET request (health check)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        sendResponse(true, 'SMS Sync API is running', [
            'version' => '1.0',
            'endpoint' => 'sync-full-db.php',
            'status' => 'ready'
        ]);
    }
    
    // Check if it's a POST request
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(false, 'Only POST requests are allowed');
    }
    
    // Get request body
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        sendResponse(false, 'Invalid JSON data');
    }
    
    // No API key validation - direct access allowed
    
    // Validate required data
    if (!isset($data['database_export']) || !is_array($data['database_export'])) {
        sendResponse(false, 'Missing database_export data');
    }
    
    $export_data = $data['database_export'];
    $metadata = $export_data['_metadata'] ?? [];
    
    logMessage("Starting database sync - Tables: {$metadata['total_tables']}, Records: {$metadata['total_records']}");
    
    // Connect to database
    $dsn = "mysql:host={$db_config['host']};dbname={$db_config['database']};charset={$db_config['charset']}";
    $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    
    $processed_tables = 0;
    $processed_records = 0;
    $errors = [];
    
    // Process each table
    foreach ($export_data as $table_name => $table_data) {
        if ($table_name === '_metadata') continue;
        
        try {
            logMessage("Processing table: $table_name");
            
            // Check if table exists
            $stmt = $pdo->prepare("SHOW TABLES LIKE ?");
            $stmt->execute([$table_name]);
            $table_exists = $stmt->fetch() !== false;
            
            if (!$table_exists) {
                logMessage("Table $table_name does not exist, skipping");
                continue;
            }
            
            // Clear existing data
            $pdo->exec("TRUNCATE TABLE `$table_name`");
            logMessage("Cleared existing data from $table_name");
            
            // Insert new data
            if (!empty($table_data['data'])) {
                $columns = array_keys($table_data['data'][0]);
                $placeholders = str_repeat('?,', count($columns) - 1) . '?';
                $sql = "INSERT INTO `$table_name` (`" . implode('`, `', $columns) . "`) VALUES ($placeholders)";
                
                $stmt = $pdo->prepare($sql);
                
                foreach ($table_data['data'] as $row) {
                    $stmt->execute(array_values($row));
                    $processed_records++;
                }
                
                logMessage("Inserted " . count($table_data['data']) . " records into $table_name");
            }
            
            $processed_tables++;
            
        } catch (Exception $e) {
            $error_msg = "Error processing table $table_name: " . $e->getMessage();
            logMessage($error_msg);
            $errors[] = $error_msg;
        }
    }
    
    logMessage("Sync completed - Tables: $processed_tables, Records: $processed_records");
    
    sendResponse(true, 'Database sync completed successfully', [
        'processedTables' => $processed_tables,
        'processedRecords' => $processed_records,
        'errors' => $errors,
        'metadata' => $metadata
    ]);
    
} catch (Exception $e) {
    logMessage("Fatal error: " . $e->getMessage());
    sendResponse(false, 'Sync failed: ' . $e->getMessage());
}
?>