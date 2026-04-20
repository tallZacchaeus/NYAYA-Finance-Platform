<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('review_notes', function (Blueprint $table) {
            $table->id();
            // Polymorphic: works for both InternalRequest and FinanceRequest
            $table->morphs('noteable');
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action'); // lead_approve, lead_reject, lead_revision_request,
                                      // finance_review, finance_reject, satgo_approve,
                                      // satgo_reject, payment_recorded, receipt_uploaded,
                                      // refund_confirmed
            $table->text('notes');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('review_notes');
    }
};
