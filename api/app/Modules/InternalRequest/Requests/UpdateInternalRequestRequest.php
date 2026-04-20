<?php

namespace App\Modules\InternalRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInternalRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'unit_cost_kobo'  => ['sometimes', 'integer', 'min:1'],
            'quantity'        => ['sometimes', 'integer', 'min:1'],
            'request_type_id' => ['sometimes', 'integer', 'exists:request_types,id'],
        ];
    }
}
