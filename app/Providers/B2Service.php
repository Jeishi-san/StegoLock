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

    private ?array $cachedUploadUrl = null;

    public function getUploadUrl($forceFresh = false)
    {
        if (!$forceFresh && $this->cachedUploadUrl) {
            return $this->cachedUploadUrl;
        }

        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_get_upload_url', [
            'bucketId' => env('B2_BUCKET_ID'),
        ]);

        $this->cachedUploadUrl = $response->json();
        return $this->cachedUploadUrl;
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

        $url = $auth['downloadUrl'] . '/b2api/v3/b2_download_file_by_id?fileId=' . $fileId;

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->withOptions([
            'stream' => true,
        ])->get($url);

        if (!$response->successful()) {
            throw new \Exception('B2 streaming download failed: ' . $response->status());
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

        try {
            $response = $client->request('POST', $store['uploadUrl'], [
                'headers' => [
                    'Authorization' => $store['authorizationToken'],
                    'X-Bz-File-Name' => $fileName,
                    'Content-Type' => 'b2/x-auto',
                    'X-Bz-Content-Sha1' => $sha1,
                ],
                'body' => fopen($filePath, 'r'),
            ]);
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            // If 401 or other error, maybe the upload URL expired. 
            // We could retry with $forceFresh = true here, but for simplicity let's just throw.
            throw $e;
        }

        return json_decode($response->getBody(), true);
    }

    public function findFileByName(string $fileName)
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_list_file_names', [
            'bucketId' => env('B2_BUCKET_ID'),
            'startFileName' => $fileName,
            'maxFileCount' => 1,
            'prefix' => $fileName,
        ]);

        if (!$response->successful()) {
            return null;
        }

        $data = $response->json();
        return $data['files'][0] ?? null;
    }

    public function listFiles() //300 files limit
    {
        $auth = $this->getAuth();

        /** @var \Illuminate\Http\Client\Response $response */
        $response = Http::withHeaders([
            'Authorization' => $auth['token'],
        ])->post($auth['apiUrl'] . '/b2api/v2/b2_list_file_names', [
            'bucketId' => env('B2_BUCKET_ID'),
            'maxFileCount' => 300,
        ]);

        return $response->json();
    }

    public function listAllFiles() //list all files
    {
        $auth = $this->getAuth();

        $files = [];
        $nextFileName = null;

        do {
            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'Authorization' => $auth['token'],
            ])->post($auth['apiUrl'] . '/b2api/v2/b2_list_file_names', [
                'bucketId' => env('B2_BUCKET_ID'),
                'maxFileCount' => 200,
                'startFileName' => $nextFileName, // key part
            ]);

            $data = $response->json();

            $files = array_merge($files, $data['files']);

            $nextFileName = $data['nextFileName'] ?? null;

        } while ($nextFileName);

        return $files;
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

    public function wrong_download(string $fileId)
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
}
