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
            $table->string('file_hash'); // SHA-256
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
            $table->unsignedBigInteger('in_cloud_size')->default(0);
            $table->text('error_message')->nullable();

            $table->timestamps();

            $table->unique(['document_id', 'file_hash']);
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
