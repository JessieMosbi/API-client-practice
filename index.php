<?php

ini_set('display_errors', 'on');
error_reporting(E_ALL);

use Dotenv\Exception\ValidationException;

require __DIR__ . '/vendor/autoload.php';

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();

    $dotenv->required('ACCOUNT')->notEmpty();
    $dotenv->required('PASSWORD')->notEmpty();
} catch (ValidationException $e) {
    echo "Please check your environment file: ";
    echo $e->getMessage();
} catch (Exception $e) {
    echo $e->getMessage();
}
