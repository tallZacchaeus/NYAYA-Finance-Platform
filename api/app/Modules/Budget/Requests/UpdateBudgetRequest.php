<?php

namespace App\Modules\Budget\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'allocated_amount_kobo' => ['sometimes', 'integer', 'min:1'],
            'notes'                 => ['sometimes', 'nullable', 'string'],
        ];
    }
}
