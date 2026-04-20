<?php

namespace App\Modules\Event\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'                => ['sometimes', 'string', 'max:255'],
            'description'         => ['sometimes', 'nullable', 'string'],
            'event_date'          => ['sometimes', 'date'],
            'venue'               => ['sometimes', 'nullable', 'string', 'max:255'],
            'status'              => ['sometimes', 'in:planning,active,completed,cancelled'],
            'total_budget_kobo'   => ['sometimes', 'integer', 'min:0'],
            'expected_attendance' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ];
    }
}
