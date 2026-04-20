<?php

namespace App\Modules\FinanceRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateFinanceRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'           => ['sometimes', 'string', 'max:255'],
            'description'     => ['sometimes', 'nullable', 'string'],
            'unit_cost_kobo'  => ['sometimes', 'integer', 'min:1'],
            'quantity'        => ['sometimes', 'integer', 'min:1'],
            'request_type_id' => ['sometimes', 'exists:request_types,id'],
        ];
    }
}
