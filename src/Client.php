<?php

namespace Jcheng\DataApiClient;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Promise;

class Client
{
    private $type;
    private static $baseURL = 'http://dataapimanage:8888/';

    public $statusCode;
    public $response;

    public function __construct($clientType)
    {
        $this->type = $clientType;
    }

    public function login($account, $password)
    {
        if ($this->type === 'curl') {
            $url = self::$baseURL . 'login';
            $postData = json_encode(['email' => $account, 'password' => $password]);

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = json_decode(curl_exec($ch), true);
            $this->statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        } elseif ($this->type === 'guzzle') {
            $client = new GuzzleClient([
                'base_uri' => self::$baseURL
            ]);

            $response = $client->request('POST', 'login', [
                'json' => ["email" => $account, "password" => $password],
                'http_errors' => false
            ]);

            $this->statusCode = $response->getStatusCode();
            $response = json_decode($response->getBody(), true);
        }

        if ($response["status"] === "success") {
            $token = $response["result"]["access_token"];
        }

        $this->response = $token;
    }

    public function getData($token)
    {
        if ($this->type === 'curl') {
            $url = self::$baseURL . 'test';
            $headerData = [
                "Content-Type: application/json",
                "Authorization: Bearer " . $token
            ];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headerData);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($ch);
            $this->statusCode = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            curl_close($ch);
        } elseif ($this->type === 'guzzle') {
            $client = new GuzzleClient([
                'base_uri' => self::$baseURL,
            ]);

            $response = $client->request('POST', 'test', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ]
            ]);

            $this->statusCode = $response->getStatusCode();
            $response = $response->getBody();
        }

        // return json_decode($response, true);
        return $response;
    }

    public function getDataAsync($token)
    {
        $client = new GuzzleClient([
            'base_uri' => self::$baseURL
        ]);
        $headers = ['Authorization' => 'Bearer ' . $token];
        $request = new Request('POST', 'test', $headers);

        $promise = $client->sendAsync($request)
          ->then(function ($response) {
              echo $response->getBody();
          });
        $promise->wait();
    }

    public function getDataAsyncMultiple($token)
    {
        $client = new GuzzleClient([
            'base_uri' => self::$baseURL
        ]);

        // Initiate each request but do not block
        $promises = [];
        for ($i = 1; $i <= 2; $i++) {
            $promises['test-' . $i] = $client->requestAsync('POST', 'test', [
                'headers' => [
                    'Authorization' => 'Bearer ' . $token
                ]
            ]);
        }

        // Wait for the requests to complete, even if some of them fail
        $responses = Promise\Utils::settle($promises)->wait();

        // Values returned above are wrapped in an array with 2 keys
        // "state" (either fulfilled or rejected) and "value" (contains the response)
        echo $responses['test-1']['state'] . '<br>'; // returns "fulfilled"
        echo $responses['test-1']['value']->getStatusCode() . '<br>';
        echo $responses['test-1']['value']->getHeaderLine('content-type') . '<br><br>';
        echo 'test-1: ' . $responses['test-1']['value']->getBody() . '<br>';
        echo 'test-2: ' . $responses['test-2']['value']->getBody() . '<br>';
    }
}
