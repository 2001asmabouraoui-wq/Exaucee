<?php
header('Content-Type: application/json');

$products = file_get_contents('data/products.json');
echo $products;
