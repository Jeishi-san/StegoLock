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
        Schema::create('fragment_maps', function (Blueprint $table) {
            $table->uuid('map_id')->primary();            // unique ID for this mapping entry
            $table->unsignedBigInteger('document_id');
            $table->json('fragments_in_covers');         // array of {fragment_id, cover_id, offset}
            $table->enum('status', ['pending', 'complete'])
                ->default('pending');                 // tracks reconstruction status
            $table->timestamps();

            $table->foreign('document_id')->references('document_id')->on('documents')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fragment_maps');
    }
};
