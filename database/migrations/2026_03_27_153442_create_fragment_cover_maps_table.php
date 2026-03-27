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
        Schema::create('fragment_cover_maps', function (Blueprint $table) {
            $table->uuid('fcm_id')->primary();

            $table->uuid('map_id'); // group (your FragmentMap)
            $table->uuid('fragment_id');
            $table->uuid('cover_id');

            $table->integer('offset');

            $table->timestamps();

            $table->foreign('map_id')->references('map_id')->on('fragment_maps')->cascadeOnDelete();
            $table->foreign('fragment_id')->references('fragment_id')->on('fragments')->cascadeOnDelete();
            $table->foreign('cover_id')->references('cover_id')->on('covers')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fragment_cover_maps');
    }
};
