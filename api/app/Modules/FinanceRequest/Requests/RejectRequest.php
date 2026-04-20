<?php

namespace App\Modules\FinanceRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RejectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason'   => ['required', 'string', 'max:1000'],
            'category' => ['nullable', 'string', 'max:100'],
        ];
    }
}
