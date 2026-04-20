<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('internal_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // Auto-generated: INT-2026-00001
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('department_id')->constrained();
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('request_type_id')->constrained('request_types');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('amount_kobo');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_cost_kobo');

            // Status flow:
            // draft → submitted → approved | needs_revision | rejected
            $table->string('status')->default('draft');

            // Team lead review
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();

            // Link to resulting finance request (set when team lead escalates to Finance)
            $table->foreignId('finance_request_id')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('internal_requests');
    }
};
