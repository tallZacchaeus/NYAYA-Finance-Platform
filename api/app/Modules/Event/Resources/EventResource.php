<?php

namespace App\Modules\Event\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EventResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'description'         => $this->description,
            'event_date'          => $this->event_date?->toDateString(),
            'venue'               => $this->venue,
            'status'              => $this->status,
            'total_budget'        => $this->total_budget_kobo / 100,
            'total_budget_kobo'   => $this->total_budget_kobo,
            'expected_attendance' => $this->expected_attendance,
            'created_by'          => $this->whenLoaded('createdBy', fn () => [
                'id'   => $this->createdBy->id,
                'name' => $this->createdBy->name,
            ]),
            'created_at'          => $this->created_at?->toIso8601String(),
        ];
    }
}
