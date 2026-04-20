<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('finance_requests', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique(); // Auto-generated: YAYA-2026-00001
            $table->foreignId('event_id')->constrained()->cascadeOnDelete();
            $table->foreignId('department_id')->constrained();
            $table->foreignId('requester_id')->constrained('users');
            $table->foreignId('request_type_id')->constrained('request_types');
            $table->string('title');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('amount_kobo');
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_cost_kobo');

            // Status flow:
            // submitted → finance_reviewed | finance_rejected
            // finance_reviewed → satgo_approved | satgo_rejected
            // satgo_approved → partial_payment | paid
            // partial_payment → paid
            // paid → receipted
            // receipted → refund_pending | completed
            // refund_pending → refund_completed → completed
            $table->string('status')->default('submitted');

            // Finance review
            $table->foreignId('finance_reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('finance_reviewed_at')->nullable();

            // SATGO approval
            $table->foreignId('satgo_approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('satgo_approved_at')->nullable();
            $table->timestamp('approval_expires_at')->nullable();

            // Rejection (finance or SATGO)
            $table->foreignId('rejected_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->string('rejection_category')->nullable();
            $table->text('rejection_reason')->nullable();

            // Payment tracking (supports partial payments)
            $table->unsignedBigInteger('total_paid_kobo')->default(0);
            $table->foreignId('paid_confirmed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('fully_paid_at')->nullable();

            // Receipting & variance
            $table->unsignedBigInteger('total_receipted_kobo')->default(0);
            $table->bigInteger('variance_kobo')->default(0); // signed: negative = underspend
            $table->foreignId('receipted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('receipted_at')->nullable();

            // Refund
            $table->unsignedBigInteger('refund_amount_kobo')->default(0);
            $table->timestamp('refund_completed_at')->nullable();

            // Completion
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('finance_requests');
    }
};
