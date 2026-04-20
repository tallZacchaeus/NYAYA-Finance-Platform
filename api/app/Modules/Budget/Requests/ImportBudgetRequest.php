<?php

namespace App\Modules\Budget\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportBudgetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:xlsx,xls', 'max:10240'],
        ];
    }
}
