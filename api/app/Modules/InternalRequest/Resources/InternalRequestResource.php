<?php

namespace App\Modules\InternalRequest\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InternalRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'         => $this->id,
            'reference'  => $this->reference,
            'title'      => $this->title,
            'description' => $this->description,
            'amount'     => $this->amount,
            'amount_kobo' => $this->amount_kobo,
            'unit_cost'  => $this->unit_cost,
            'unit_cost_kobo' => $this->unit_cost_kobo,
            'quantity'   => $this->quantity,
            'status'     => $this->status,

            'request_type' => $this->whenLoaded('requestType', fn () => [
                'id'   => $this->requestType->id,
                'name' => $this->requestType->name,
                'slug' => $this->requestType->slug,
            ]),

            'department' => $this->whenLoaded('department', fn () => [
                'id'   => $this->department->id,
                'name' => $this->department->name,
            ]),

            'event' => $this->whenLoaded('event', fn () => [
                'id'   => $this->event->id,
                'name' => $this->event->name,
            ]),

            'requester' => $this->whenLoaded('requester', fn () => [
                'id'   => $this->requester->id,
                'name' => $this->requester->name,
            ]),

            'reviewed_by' => $this->whenLoaded('reviewedBy', fn () => $this->reviewedBy ? [
                'id'   => $this->reviewedBy->id,
                'name' => $this->reviewedBy->name,
            ] : null),
            'reviewed_at' => $this->reviewed_at?->toISOString(),

            'finance_request_id' => $this->finance_request_id,

            'review_notes' => $this->whenLoaded('reviewNotes', fn () =>
                $this->reviewNotes->map(fn ($note) => [
                    'id'         => $note->id,
                    'user'       => ['id' => $note->user->id, 'name' => $note->user->name],
                    'action'     => $note->action,
                    'notes'      => $note->notes,
                    'created_at' => $note->created_at->toISOString(),
                ])
            ),

            'documents' => $this->whenLoaded('documents', fn () =>
                $this->documents->map(fn ($doc) => [
                    'id'          => $doc->id,
                    'file_name'   => $doc->file_name,
                    'file_type'   => $doc->file_type,
                    'file_size'   => $doc->file_size,
                    'url'         => $doc->url ?? asset('storage/' . $doc->file_path),
                    'uploaded_at' => $doc->created_at->toISOString(),
                ])
            ),

            'can' => $user ? [
                'edit'   => $user->id === $this->requester_id && $this->status === 'draft',
                'submit' => $user->id === $this->requester_id && $this->status === 'draft',
                'review' => $user->can('internal-requests.review') && $user->department_id === $this->department_id && $this->status === 'submitted',
                'delete' => $user->id === $this->requester_id && in_array($this->status, ['draft', 'needs_revision']),
            ] : null,

            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
