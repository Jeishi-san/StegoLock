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
        Schema::create('folder_shares', function (Blueprint $table) {
            $table->id('share_id');
            $table->uuid('folder_id');
            $table->foreignId('sender_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('recipient_id')->constrained('users')->cascadeOnDelete();
            
            $table->enum('status', ['pending', 'accepted'])->default('pending');
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('folder_id')->references('folder_id')->on('folders')->cascadeOnDelete();
            
            // A folder can be shared with a recipient once at a time
            $table->unique(['folder_id', 'recipient_id']);
        });

        // Add folder_share_id to document_shares to link them
        Schema::table('document_shares', function (Blueprint $table) {
            $table->unsignedBigInteger('folder_share_id')->nullable()->after('folder_id');
            $table->foreign('folder_share_id')->references('share_id')->on('folder_shares')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_shares', function (Blueprint $table) {
            $table->dropForeign(['folder_share_id']);
            $table->dropColumn('folder_share_id');
        });
        Schema::dropIfExists('folder_shares');
    }
};
