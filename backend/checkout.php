<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$ordersFile = 'data/orders.json';

// Read existing orders
$orders = file_exists($ordersFile) ? json_decode(file_get_contents($ordersFile), true) : [];

// Add new order
$orders[] = $input;

// Save back
file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
