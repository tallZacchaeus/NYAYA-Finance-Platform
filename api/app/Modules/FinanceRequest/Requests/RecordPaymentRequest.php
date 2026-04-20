<?php

namespace App\Modules\FinanceRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount_kobo'       => ['required', 'integer', 'min:1'],
            'payment_method'    => ['required', 'string', 'max:100'],
            'payment_reference' => ['nullable', 'string', 'max:255'],
            'notes'             => ['nullable', 'string', 'max:1000'],
        ];
    }
}
