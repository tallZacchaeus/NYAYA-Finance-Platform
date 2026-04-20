<?php

namespace App\Modules\Budget\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BudgetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $remaining = $this->allocated_amount_kobo - $this->spent_amount_kobo;

        return [
            'id'                   => $this->id,
            'event_id'             => $this->event_id,
            'department'           => $this->whenLoaded('department', fn () => [
                'id'   => $this->department->id,
                'name' => $this->department->name,
            ]),
            'allocated'            => $this->allocated_amount_kobo / 100,
            'allocated_kobo'       => $this->allocated_amount_kobo,
            'spent'                => $this->spent_amount_kobo / 100,
            'spent_kobo'           => $this->spent_amount_kobo,
            'remaining'            => $remaining / 100,
            'remaining_kobo'       => $remaining,
            'percentage_used'      => $this->allocated_amount_kobo > 0
                ? round(($this->spent_amount_kobo / $this->allocated_amount_kobo) * 100, 2)
                : 0,
            'status'               => $this->status,
            'notes'                => $this->notes,
            'approved_by'          => $this->whenLoaded('approvedBy', fn () => [
                'id'   => $this->approvedBy->id,
                'name' => $this->approvedBy->name,
            ]),
            'approved_at'          => $this->approved_at?->toIso8601String(),
            'created_at'           => $this->created_at?->toIso8601String(),
        ];
    }
}
