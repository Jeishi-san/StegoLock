<?php

namespace App\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class B2Service
{
    private string $keyId;
    private string $appKey;
    private string $apiUrl;
    private string $authToken;

    public function __construct()
    {
        $this->keyId = env('B2_KEY_ID');
        $this->appKey = env('B2_APPLICATION_KEY');
    }

    public function authorize()
    {
        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withBasicAuth($this->keyId, $this->appKey)
            ->get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account');

        $data = $response->json();

        $this->apiUrl = $data['apiUrl'];
        $this->authToken = $data['authorizationToken'];

        return $data;
    }

    public function getAuth()
    {

        return cache()->remember('b2_auth', 3500, function () {
            /** @var \Illuminate\Http\Client\Response $res */
            $res = Http::withBasicAuth($this->keyId, $this->appKey)
                ->get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account');

            $data = $res->json();

            return [
                'apiUrl' => $data['apiUrl'],
                'token' => $data['authorizationToken'],
                'bucketId' => $data['allowed']['bucketId'] ?? null,
                'downloadUrl' => $data['downloadUrl'] ?? null,

            ];
        });
    }

    public function getUploadUrl()
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_get_upload_url', [
            'bucketId' => env('B2_BUCKET_ID'),
        ]);

        return $response->json();
    }

    public function uploadFile($file)
    {
        $upload = $this->getUploadUrl();

        $fileName = 'temp-upload/'.bin2hex(random_bytes(16)) . '.' . $file->getClientOriginalExtension();

        $content = file_get_contents($file->getRealPath());

        $sha1 = sha1($content);

        $stream = fopen($file->getRealPath(), 'r');

        if ($content === false || $stream === false) {
            throw new \Exception("Failed to read file");
        }

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::timeout(180)
        ->withHeaders([
            'Authorization' => $upload['authorizationToken'],
            'X-Bz-File-Name' => $fileName,
            'Content-Type' => 'b2/x-auto',
            'X-Bz-Content-Sha1' => $sha1,
        ])
        ->withBody($stream, 'application/octet-stream')
        ->post($upload['uploadUrl']);

        fclose($stream);

        return $response->json();
    }

    public function download(string $fileId)
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->withOptions([
            'stream' => true,
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_download_file_by_id', [
            'fileId' => $fileId,
        ]);

        if (!$response->successful()) {
            throw new \Exception('B2 streaming download failed');
        }

        return $response;
    }

    public function storeFile(string $filePath)
    {
        $store = $this->getUploadUrl();

        $fileName = 'locked/'. basename($filePath);
        $sha1 = sha1_file($filePath);

        $client = new \GuzzleHttp\Client([
            'timeout' => 0,
        ]);

        $response = $client->request('POST', $store['uploadUrl'], [
        'headers' => [
            'Authorization' => $store['authorizationToken'],
            'X-Bz-File-Name' => $fileName,
            'Content-Type' => 'b2/x-auto',
            'X-Bz-Content-Sha1' => $sha1,
        ],
        'body' => fopen($filePath, 'r'),
    ]);

        return json_decode($response->getBody(), true);
    }

    public function listFiles()
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_list_file_names', [
            'bucketId' => env('B2_BUCKET_ID'),
            'maxFileCount' => 200,
        ]);

        return $response->json();
    }

    public function listAllVersions()
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_list_file_versions', [
            'bucketId' => env('B2_BUCKET_ID'),
            'maxFileCount' => 100,
        ]);

        return $response->json();
    }

    public function deleteFile($fileId, $fileName)
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_delete_file_version', [
            'fileId' => $fileId,
            'fileName' => $fileName,
        ]);

        return $response->json();
    }

    public function getFileInfo($fileId)
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_get_file_info', [
            'fileId' => $fileId,
        ]);

        return $response->json();
    }

    public function readfile($fileId)
    {
        $response = $this->download($fileId);

        $plaintext = '';

        $stream = $response->getBody();

        if (!$stream) {
            throw new \Exception('stream empty');
        }

        while (!$stream->eof()) {
            $plaintext .= $stream->read(8192);
        }

        if (!$plaintext) {
            throw new \Exception('stream->read failed, empty plaintext');
        }

        $stream->close();

        return $plaintext;
    }
}
