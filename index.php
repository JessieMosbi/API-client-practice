<?php

ini_set('display_errors', 'on');
error_reporting(E_ALL);

use Dotenv\Exception\ValidationException;
use Jcheng\DataApiClient\Client;

require __DIR__ . '/vendor/autoload.php';

try {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
    $dotenv->required('ACCOUNT')->notEmpty();
    $dotenv->required('PASSWORD')->notEmpty();

    $client = new Client('curl');
    $client->login($_ENV['ACCOUNT'], $_ENV['PASSWORD']);

    $token = $client->response;
    echo 'status code: ' . $client->statusCode . '<br>';
    echo 'token: ' . $token . '<br>';
    echo '<br><br>';
    echo 'status code code: ' . $client->statusCode . '<br>';
    // echo 'data: ' . $client->getData($token);
    $client->getDataAsyncMultiple($token);
} catch (ValidationException $e) {
    echo "Please check your environment file: ";
    echo $e->getMessage();
} catch (Exception $e) {
    echo $e->getMessage();
}
