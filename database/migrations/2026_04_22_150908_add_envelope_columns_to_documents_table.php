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
        Schema::table('documents', function (Blueprint $table) {
            $table->text('encrypted_dek')->nullable()->after('dk_salt');
            $table->string('dek_nonce')->nullable()->after('encrypted_dek');
            $table->string('dek_tag')->nullable()->after('dek_nonce');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['encrypted_dek', 'dek_nonce', 'dek_tag']);
        });
    }
};
