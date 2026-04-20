<?php

namespace App\Modules\Budget\Controllers;

use App\Modules\Budget\Models\Budget;
use App\Modules\Budget\Requests\ImportBudgetRequest;
use App\Modules\Budget\Requests\StoreBudgetRequest;
use App\Modules\Budget\Requests\UpdateBudgetRequest;
use App\Modules\Budget\Resources\BudgetResource;
use App\Modules\Budget\Services\BudgetImportService;
use App\Modules\Budget\Services\BudgetService;
use App\Modules\Event\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class BudgetController extends Controller
{
    public function __construct(
        private BudgetService $budgetService,
        private BudgetImportService $importService,
    ) {}

    public function index(int $eventId): JsonResponse
    {
        $budgets = Budget::with(['department', 'approvedBy'])
            ->where('event_id', $eventId)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => BudgetResource::collection($budgets),
        ]);
    }

    public function store(StoreBudgetRequest $request, int $eventId): JsonResponse
    {
        $event      = Event::findOrFail($eventId);
        $department = \App\Modules\Department\Models\Department::findOrFail($request->department_id);

        $budget = $this->budgetService->allocate($event, $department, $request->allocated_amount_kobo);

        return response()->json([
            'success' => true,
            'data'    => new BudgetResource($budget->load(['department', 'approvedBy'])),
            'message' => 'Budget allocated successfully.',
        ], 201);
    }

    public function update(UpdateBudgetRequest $request, int $id): JsonResponse
    {
        $budget = Budget::findOrFail($id);
        $budget->update($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new BudgetResource($budget->fresh(['department', 'approvedBy'])),
            'message' => 'Budget updated successfully.',
        ]);
    }

    public function approve(Request $request, int $id): JsonResponse
    {
        $budget = Budget::findOrFail($id);
        $budget->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => new BudgetResource($budget->fresh(['department', 'approvedBy'])),
            'message' => 'Budget approved successfully.',
        ]);
    }

    public function import(ImportBudgetRequest $request, int $eventId): JsonResponse
    {
        $event   = Event::findOrFail($eventId);
        $preview = $this->importService->preview($event, $request->file('file'));

        return response()->json([
            'success' => true,
            'data'    => $preview,
            'message' => 'Preview generated. Call /import/confirm to commit.',
        ]);
    }

    public function confirmImport(Request $request, int $eventId): JsonResponse
    {
        $event  = Event::findOrFail($eventId);
        $result = $this->importService->confirm($event, $request->import_token, $request->user());

        return response()->json([
            'success' => true,
            'data'    => $result,
            'message' => 'Budget import completed successfully.',
        ]);
    }
}
