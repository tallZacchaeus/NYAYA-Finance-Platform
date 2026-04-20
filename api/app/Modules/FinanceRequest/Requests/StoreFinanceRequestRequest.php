<?php

namespace App\Modules\FinanceRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreFinanceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_id'        => ['required', 'exists:events,id'],
            'department_id'   => ['required', 'exists:departments,id'],
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit_cost_kobo'  => ['required', 'integer', 'min:1'],
            'quantity'        => ['required', 'integer', 'min:1'],
            'request_type_id' => ['required', 'exists:request_types,id'],
        ];
    }
}
