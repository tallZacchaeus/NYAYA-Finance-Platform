<?php

namespace App\Modules\Budget\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'department_id'        => ['required', 'exists:departments,id'],
            'allocated_amount_kobo' => ['required', 'integer', 'min:1'],
            'notes'                => ['nullable', 'string'],
        ];
    }
}
