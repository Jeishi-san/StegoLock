<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stego_files', function (Blueprint $table) {
            $table->uuid('stego_file_id')->primary();

            $table->uuid('stego_map_id');
            $table->uuid('fragment_id');

            $table->integer('offset');

            $table->string('stego_path');
            $table->bigInteger('stego_size');

            $table->string('status')->default('pending');
            $table->text('error_message')->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Foreign Keys
            |--------------------------------------------------------------------------
            */

            $table->foreign('stego_map_id')
                ->references('stego_map_id')
                ->on('stego_maps')
                ->cascadeOnDelete();

            $table->foreign('fragment_id')
                ->references('fragment_id')
                ->on('fragments')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | CRITICAL Constraints (DO NOT REMOVE)
            |--------------------------------------------------------------------------
            */

            // Prevent duplicate fragment embedding per map
            $table->unique(['stego_map_id', 'fragment_id']);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stego_files');
    }
};
