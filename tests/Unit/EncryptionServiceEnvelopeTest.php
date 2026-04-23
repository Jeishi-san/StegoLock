<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Providers\EncryptionService;

class EncryptionServiceEnvelopeTest extends TestCase
{
    protected EncryptionService $encryptionService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->encryptionService = new EncryptionService();
    }

    /** @test */
    public function it_generates_valid_random_dek()
    {
        $dek = $this->encryptionService->generateRandomDEK();

        $this->assertEquals(32, strlen($dek));
        $this->assertNotEquals($dek, $this->encryptionService->generateRandomDEK());
    }

    /** @test */
    public function it_can_wrap_and_unwrap_dek_correctly()
    {
        $masterKey = random_bytes(32);
        $originalDek = $this->encryptionService->generateRandomDEK();

        $wrapped = $this->encryptionService->wrapDEK($originalDek, $masterKey);

        $this->assertArrayHasKey('wrapped_dek', $wrapped);
        $this->assertArrayHasKey('iv', $wrapped);
        $this->assertArrayHasKey('auth_tag', $wrapped);

        $unwrappedDek = $this->encryptionService->unwrapDEK(
            $wrapped['wrapped_dek'],
            $wrapped['iv'],
            $wrapped['auth_tag'],
            $masterKey
        );

        $this->assertEquals($originalDek, $unwrappedDek);
    }

    /** @test */
    public function it_throws_exception_when_unwrapping_with_wrong_key()
    {
        $this->expectException(\Exception::class);

        $masterKey = random_bytes(32);
        $wrongMasterKey = random_bytes(32);
        $originalDek = $this->encryptionService->generateRandomDEK();

        $wrapped = $this->encryptionService->wrapDEK($originalDek, $masterKey);

        $this->encryptionService->unwrapDEK(
            $wrapped['wrapped_dek'],
            $wrapped['iv'],
            $wrapped['auth_tag'],
            $wrongMasterKey
        );
    }

    /** @test */
    public function it_detects_tampered_wrapped_dek()
    {
        $this->expectException(\Exception::class);

        $masterKey = random_bytes(32);
        $originalDek = $this->encryptionService->generateRandomDEK();

        $wrapped = $this->encryptionService->wrapDEK($originalDek, $masterKey);

        // Tamper with wrapped DEK
        $tamperedDek = $wrapped['wrapped_dek'] ^ str_repeat("\x01", strlen($wrapped['wrapped_dek']));

        $this->encryptionService->unwrapDEK(
            $tamperedDek,
            $wrapped['iv'],
            $wrapped['auth_tag'],
            $masterKey
        );
    }
}
