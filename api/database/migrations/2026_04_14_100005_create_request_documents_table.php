<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('request_documents', function (Blueprint $table) {
            $table->id();
            // Nullable FKs — a document belongs to either a finance request OR an internal request
            $table->foreignId('finance_request_id')->nullable()->constrained()->cascadeOnDelete();
            $table->foreignId('internal_request_id')->nullable()->constrained('internal_requests')->cascadeOnDelete();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // pdf, jpeg, png, webp
            $table->unsignedBigInteger('file_size'); // bytes
            $table->foreignId('uploaded_by')->constrained('users');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_documents');
    }
};
