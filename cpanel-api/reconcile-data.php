<?php
// cPanel Data Reconciliation API Endpoint
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
    
    $action = $data['action'] ?? '';
    
    switch ($action) {
        case 'get_table_data':
            $result = getTableData($pdo, $data['table_name']);
            break;
            
        case 'update_record':
            $result = updateRecord($pdo, $data['table_name'], $data['data'], $data['key']);
            break;
            
        case 'create_record':
            $result = createRecord($pdo, $data['table_name'], $data['data']);
            break;
            
        case 'get_all_tables':
            $result = getAllTables($pdo);
            break;
            
        case 'get_table_structure':
            $result = getTableStructure($pdo, $data['table_name']);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
    echo json_encode([
        'success' => true,
        'data' => $result,
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Reconciliation failed: ' . $e->getMessage()
    ]);
}

// Get all data from a table
function getTableData($pdo, $tableName) {
    $stmt = $pdo->prepare("SELECT * FROM `$tableName`");
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Update a record in a table
function updateRecord($pdo, $tableName, $data, $key) {
    // Extract key columns and values
    $keyParts = explode('|', $key);
    $keyColumns = ['id']; // Default key column, should be determined dynamically
    
    // Build WHERE clause
    $whereClause = 'id = ?'; // Simplified for now
    $whereValues = [$keyParts[0]];
    
    // Build SET clause
    $setClause = [];
    $setValues = [];
    
    foreach ($data as $column => $value) {
        if (!in_array($column, $keyColumns)) {
            $setClause[] = "`$column` = ?";
            $setValues[] = $value;
        }
    }
    
    $query = "UPDATE `$tableName` SET " . implode(', ', $setClause) . " WHERE $whereClause";
    $stmt = $pdo->prepare($query);
    $stmt->execute(array_merge($setValues, $whereValues));
    
    return ['updated' => $stmt->rowCount()];
}

// Create a new record in a table
function createRecord($pdo, $tableName, $data) {
    $columns = array_keys($data);
    $values = array_values($data);
    $placeholders = str_repeat('?,', count($values) - 1) . '?';
    
    $query = "INSERT INTO `$tableName` (`" . implode('`, `', $columns) . "`) VALUES ($placeholders)";
    $stmt = $pdo->prepare($query);
    $stmt->execute($values);
    
    return ['created' => $stmt->rowCount(), 'id' => $pdo->lastInsertId()];
}

// Get all table names
function getAllTables($pdo) {
    $stmt = $pdo->query("SHOW TABLES");
    $tables = [];
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }
    return $tables;
}

// Get table structure
function getTableStructure($pdo, $tableName) {
    $stmt = $pdo->query("DESCRIBE `$tableName`");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
?>
