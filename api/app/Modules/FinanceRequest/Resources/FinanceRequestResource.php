<?php

namespace App\Modules\FinanceRequest\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinanceRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'reference'       => $this->reference,
            'title'           => $this->title,
            'description'     => $this->description,
            'amount'          => $this->amount_kobo / 100,
            'amount_kobo'     => $this->amount_kobo,
            'unit_cost'       => $this->unit_cost_kobo / 100,
            'unit_cost_kobo'  => $this->unit_cost_kobo,
            'quantity'        => $this->quantity,
            'status'          => $this->status,
            'request_type'    => $this->whenLoaded('requestType', fn () => $this->requestType ? [
                'id'   => $this->requestType->id,
                'name' => $this->requestType->name,
                'slug' => $this->requestType->slug,
            ] : null),
            'department'      => $this->whenLoaded('department', fn () => [
                'id'   => $this->department->id,
                'name' => $this->department->name,
            ]),
            'event'           => $this->whenLoaded('event', fn () => [
                'id'   => $this->event->id,
                'name' => $this->event->name,
            ]),
            'requester'       => $this->whenLoaded('requester', fn () => [
                'id'   => $this->requester->id,
                'name' => $this->requester->name,
            ]),
            'created_at'      => $this->created_at?->toIso8601String(),
        ];
    }
}
