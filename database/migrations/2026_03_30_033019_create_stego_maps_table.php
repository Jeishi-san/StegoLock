<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stego_maps', function (Blueprint $table) {
            $table->uuid('stego_map_id')->primary();

            $table->unsignedBigInteger('document_id');

            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();

            $table->timestamps();

            // FK
            $table->foreign('document_id')
                ->references('document_id')
                ->on('documents')
                ->cascadeOnDelete();

            // If 1 document = 1 stego map (recommended)
            $table->unique('document_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stego_maps');
    }
};
