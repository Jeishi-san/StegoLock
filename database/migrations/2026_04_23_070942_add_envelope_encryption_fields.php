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
            $table->enum('encryption_mode', ['legacy_derived', 'envelope_wrapped'])->default('legacy_derived')->after('dk_salt');
            $table->binary('document_dek')->nullable()->after('encryption_mode');
            $table->binary('document_dek_iv')->nullable()->after('document_dek');
            $table->binary('document_dek_tag')->nullable()->after('document_dek_iv');
        });

        Schema::table('document_user', function (Blueprint $table) {
            $table->binary('wrapped_dek')->nullable()->after('permission');
            $table->binary('wrapped_dek_iv')->nullable()->after('wrapped_dek');
            $table->binary('wrapped_dek_auth_tag')->nullable()->after('wrapped_dek_iv');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('documents', function (Blueprint $table) {
            $table->dropColumn(['encryption_mode', 'document_dek', 'document_dek_iv', 'document_dek_tag']);
        });

        Schema::table('document_user', function (Blueprint $table) {
            $table->dropColumn(['wrapped_dek', 'wrapped_dek_iv', 'wrapped_dek_auth_tag']);
        });
    }
};
