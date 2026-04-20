<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                => ['required', 'string', 'max:255'],
            'description'         => ['nullable', 'string'],
            'event_date'          => ['required', 'date'],
            'venue'               => ['nullable', 'string', 'max:255'],
            'status'              => ['sometimes', 'in:planning,active,completed,cancelled'],
            'total_budget_kobo'   => ['sometimes', 'integer', 'min:0'],
            'expected_attendance' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
