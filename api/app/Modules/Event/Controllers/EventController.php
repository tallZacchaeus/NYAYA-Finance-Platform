<?php

namespace App\Modules\Event\Controllers;

use App\Modules\Budget\Models\Budget;
use App\Modules\Event\Models\Event;
use App\Modules\Event\Requests\StoreEventRequest;
use App\Modules\Event\Requests\UpdateEventRequest;
use App\Modules\Event\Resources\EventResource;
use App\Modules\FinanceRequest\Models\FinanceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class EventController extends Controller
{
    public function index(): JsonResponse
    {
        $events = Event::with('createdBy')->paginate(20);

        return response()->json([
            'success' => true,
            'data'    => EventResource::collection($events),
            'meta'    => [
                'current_page' => $events->currentPage(),
                'last_page'    => $events->lastPage(),
                'per_page'     => $events->perPage(),
                'total'        => $events->total(),
            ],
        ]);
    }

    public function store(StoreEventRequest $request): JsonResponse
    {
        $event = Event::create(array_merge(
            $request->validated(),
            ['created_by' => $request->user()->id]
        ));

        return response()->json([
            'success' => true,
            'data'    => new EventResource($event->load('createdBy')),
            'message' => 'Event created successfully.',
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $event = Event::with('createdBy')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => new EventResource($event),
        ]);
    }

    public function update(UpdateEventRequest $request, int $id): JsonResponse
    {
        $event = Event::findOrFail($id);
        $event->update($request->validated());

        return response()->json([
            'success' => true,
            'data'    => new EventResource($event->fresh('createdBy')),
            'message' => 'Event updated successfully.',
        ]);
    }

    public function dashboard(int $id): JsonResponse
    {
        $event = Event::with(['budgets.department'])->findOrFail($id);

        $budgets = $event->budgets->map(function (Budget $budget) {
            $remaining = $budget->allocated_amount_kobo - $budget->spent_amount_kobo;
            $percentage = $budget->allocated_amount_kobo > 0
                ? round(($budget->spent_amount_kobo / $budget->allocated_amount_kobo) * 100, 2)
                : 0;

            return [
                'department'       => ['id' => $budget->department->id, 'name' => $budget->department->name],
                'allocated'        => $budget->allocated_amount_kobo / 100,
                'allocated_kobo'   => $budget->allocated_amount_kobo,
                'spent'            => $budget->spent_amount_kobo / 100,
                'spent_kobo'       => $budget->spent_amount_kobo,
                'remaining'        => $remaining / 100,
                'remaining_kobo'   => $remaining,
                'percentage_used'  => $percentage,
                'status'           => $budget->status,
            ];
        });

        $requestCounts = FinanceRequest::where('event_id', $id)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $totalAllocated = $event->budgets->sum('allocated_amount_kobo');
        $totalSpent = $event->budgets->sum('spent_amount_kobo');

        return response()->json([
            'success' => true,
            'data'    => [
                'event'              => new EventResource($event),
                'budgets'            => $budgets,
                'request_counts'     => $requestCounts,
                'total_allocated'    => $totalAllocated / 100,
                'total_allocated_kobo' => $totalAllocated,
                'total_spent'        => $totalSpent / 100,
                'total_spent_kobo'   => $totalSpent,
                'total_remaining'    => ($totalAllocated - $totalSpent) / 100,
            ],
        ]);
    }
}
