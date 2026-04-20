<?php

namespace App\Modules\FinanceRequest\Services;

use App\Modules\Budget\Services\BudgetService;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\FinanceRequest\Models\Payment;
use App\Modules\FinanceRequest\Models\Receipt;
use App\Modules\FinanceRequest\StateMachine\RequestStatusMachine;
use App\Modules\User\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class ApprovalService
{
    public function __construct(
        private RequestStatusMachine $stateMachine,
        private BudgetService $budgetService,
    ) {}

    /**
     * Finance team reviews/recommends the request to SATGO.
     */
    public function financeReview(FinanceRequest $request, User $actor): FinanceRequest
    {
        return $this->stateMachine->transition($request, FinanceRequest::STATUS_FINANCE_REVIEWED, $actor);
    }

    /**
     * Finance team rejects the request.
     */
    public function financeReject(FinanceRequest $request, User $actor, string $reason, ?string $category = null): FinanceRequest
    {
        return $this->stateMachine->transition(
            $request,
            FinanceRequest::STATUS_FINANCE_REJECTED,
            $actor,
            ['rejection_reason' => $reason, 'rejection_category' => $category]
        );
    }

    /**
     * SATGO (CEO/Director) gives final approval.
     */
    public function satgoApprove(FinanceRequest $request, User $actor): FinanceRequest
    {
        // Verify budget availability before SATGO approves
        if (! $this->budgetService->canApprove($request)) {
            throw ValidationException::withMessages([
                'budget' => 'Approving this request would exceed the department budget allocation.',
            ]);
        }

        return $this->stateMachine->transition($request, FinanceRequest::STATUS_SATGO_APPROVED, $actor);
    }

    /**
     * SATGO rejects the request.
     */
    public function satgoReject(FinanceRequest $request, User $actor, string $reason, ?string $category = null): FinanceRequest
    {
        return $this->stateMachine->transition(
            $request,
            FinanceRequest::STATUS_SATGO_REJECTED,
            $actor,
            ['rejection_reason' => $reason, 'rejection_category' => $category]
        );
    }

    /**
     * Record a payment (full or partial) against an approved request.
     */
    public function recordPayment(
        FinanceRequest $request,
        User $actor,
        int $amountKobo,
        string $paymentMethod,
        ?string $paymentReference = null,
        ?string $notes = null,
    ): FinanceRequest {
        Payment::create([
            'finance_request_id' => $request->id,
            'amount_kobo'        => $amountKobo,
            'payment_method'     => $paymentMethod,
            'payment_reference'  => $paymentReference,
            'payment_date'       => now(),
            'notes'              => $notes,
            'recorded_by'        => $actor->id,
        ]);

        // Reload payments and recalculate — this also updates status to partial_payment or paid
        $request->recalculateTotalPaid();

        return $request->fresh();
    }

    /**
     * Upload a receipt for a paid request (moves to receipted status).
     */
    public function uploadReceipt(
        FinanceRequest $request,
        User $actor,
        UploadedFile $file,
        int $amountKobo,
        ?string $notes = null,
    ): FinanceRequest {
        $path = $file->store('receipts', 'public');

        Receipt::create([
            'finance_request_id' => $request->id,
            'file_name'          => $file->getClientOriginalName(),
            'file_path'          => $path,
            'file_type'          => $file->getClientOriginalExtension(),
            'file_size'          => $file->getSize(),
            'amount_kobo'        => $amountKobo,
            'notes'              => $notes,
            'uploaded_by'        => $actor->id,
        ]);

        return $this->stateMachine->transition($request, FinanceRequest::STATUS_RECEIPTED, $actor);
    }
}
