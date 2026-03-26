<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->bigIncrements('document_id');

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('filename');
            $table->string('file_type');
            $table->string('file_hash')->unique(); // SHA-256
            $table->unsignedBigInteger('original_size');

            $table->unsignedBigInteger('encrypted_size')->nullable();
            $table->string('dk_salt')->nullable();

            $table->enum('status', [
                'uploaded',
                'encrypted',
                'fragmented',
                'mapped',
                'embedded',
                'stored',
                'extracted',
                'reconstructed',
                'decrypted',
                'retrieved',
                'failed'
            ])->default('uploaded');

            $table->integer('fragment_count')->nullable();
            $table->text('error_message')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
