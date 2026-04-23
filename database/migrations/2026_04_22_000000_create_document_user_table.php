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
        Schema::create('document_user', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('document_id');
            $table->boolean('starred')->default(false);
            $table->foreignId('shared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('permission')->default('view');
            $table->timestamps();

            $table->foreign('document_id')
                ->references('document_id')
                ->on('documents')
                ->cascadeOnDelete();

            $table->unique(['user_id', 'document_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_user');
    }
};
