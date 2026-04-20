<?php

namespace App\Modules\InternalRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInternalRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'           => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit_cost_kobo'  => ['required', 'integer', 'min:1'],
            'quantity'        => ['required', 'integer', 'min:1'],
            'department_id'   => ['required', 'integer', 'exists:departments,id'],
            'event_id'        => ['required', 'integer', 'exists:events,id'],
            'request_type_id' => ['required', 'integer', 'exists:request_types,id'],
        ];
    }
}
