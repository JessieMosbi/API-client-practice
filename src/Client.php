<?php

namespace Jcheng\DataApiClient;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\Promise;
use GuzzleHttp\Pool;
use GuzzleHttp\Psr7\Response;
use GuzzleHttp\Exception\RequestException;

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

    public function getDataAsyncMultiple($token)
    {
        $client = new GuzzleClient([
            'base_uri' => self::$baseURL
        ]);

        // $requests = function ($total) use ($token) {
        //     for ($i = 0; $i < $total; $i++) {
        //         yield new Request('POST', 'test', ['Authorization' => 'Bearer ' . $token]);
        //     }
        // };

        $requests = function ($total) use ($client, $token) {
            for ($i = 0; $i < $total; $i++) {
                yield function () use ($client, $token) {
                    return $client->requestAsync('POST', 'test', [
                        'headers' => [
                            'Authorization' => 'Bearer ' . $token
                        ]
                    ]);
                };
            }
        };

        $pool = new Pool($client, $requests(5), [
            'concurrency' => 2,
            'fulfilled' => function (Response $response, $index) {
                // this is delivered each successful response
                echo $response->getBody() . '<br>';
            },
            'rejected' => function (RequestException $reason, $index) {
                // this is delivered each failed request
                print_r($reason);
                echo '<br>';
            },
        ]);

        // Initiate the transfers and create a promise
        $promise = $pool->promise();

        // Force the pool of requests to complete.
        $promise->wait();
    }
}
