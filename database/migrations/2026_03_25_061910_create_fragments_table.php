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
        Schema::create('fragments', function (Blueprint $table) {
            $table->uuid('fragment_id')->primary();
            $table->unsignedBigInteger('document_id');
            $table->integer('index');
            $table->longText('blob');
            $table->integer('size');
            $table->string('hash', 64); // SHA-256 hash
            $table->enum('status', ['floating', 'embedded', 'retrieved'])->default('floating');
            $table->timestamps();

            $table->foreign('document_id')->references('document_id')->on('documents')->onDelete('cascade');
            $table->unique(['document_id', 'index']); // prevent duplicate fragment order
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('fragments');
    }
};
