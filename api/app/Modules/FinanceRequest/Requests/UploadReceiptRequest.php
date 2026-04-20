<?php

namespace App\Modules\FinanceRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file'        => ['required', 'file', 'mimes:pdf,jpeg,jpg,png,webp', 'max:10240'],
            'amount_kobo' => ['required', 'integer', 'min:1'],
            'notes'       => ['nullable', 'string', 'max:1000'],
        ];
    }
}
