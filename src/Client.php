<?php

namespace Jcheng\DataApiClient;

use GuzzleHttp\Client as GuzzleClient;

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
}
