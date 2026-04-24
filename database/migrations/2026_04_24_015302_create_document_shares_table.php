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
        Schema::create('document_shares', function (Blueprint $table) {
            $table->id('share_id');
            $table->foreignId('document_id')->constrained('documents', 'document_id')->cascadeOnDelete();
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();

            // Re-wrapped DEK for the recipient
            $table->text('encrypted_dek');
            $table->string('dek_nonce');
            $table->string('dek_tag');
            $table->string('dk_salt');
            
            $table->enum('status', ['pending', 'accepted'])->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            // Ensure a document can only be shared with a specific user once
            $table->unique(['document_id', 'recipient_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_shares');
    }
};
