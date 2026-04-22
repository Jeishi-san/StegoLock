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
        Schema::create('folders', function (Blueprint $table) {
            $table->uuid('folder_id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->uuid('parent_id')->nullable();

            $table->timestamps();

            // Foreign keys

            $table->foreign('parent_id')
                ->references('folder_id')
                ->on('folders')
                ->cascadeOnDelete();
        });

        // Index for faster navigation
        Schema::table('folders', function (Blueprint $table) {
            $table->index(['user_id', 'parent_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('folders');
    }
};
