<?php
// Простой скрипт для записи логов в txt файл
// Просто загрузите этот файл на ваш VPS в папку с сайтом

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

$logFile = 'invites_log.txt';
$data = json_decode(file_get_contents('php://input'), true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $timestamp = date('Y-m-d H:i:s');
    
    if (isset($data['inviterId'])) {
        // Логирование приглашения
        $inviterId = $data['inviterId'] ?? 'N/A';
        $userId = $data['userId'] ?? 'N/A';
        $username = $data['username'] ?? 'N/A';
        $logTime = $data['timestamp'] ?? date('Y-m-d\TH:i:s');
        
        $logLine = "[$timestamp] ПРИГЛАШЕНИЕ | ID пригласившего: $inviterId | ID пользователя: $userId | Username: $username | Время: $logTime\n";
    } else {
        // Логирование обычного входа
        $userId = $data['userId'] ?? 'N/A';
        $username = $data['username'] ?? 'N/A';
        $logTime = $data['timestamp'] ?? date('Y-m-d\TH:i:s');
        
        $logLine = "[$timestamp] ВХОД | ID пользователя: $userId | Username: $username | Время: $logTime\n";
    }
    
    // Записываем в файл
    file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);
    
    echo json_encode(['success' => true]);
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>

