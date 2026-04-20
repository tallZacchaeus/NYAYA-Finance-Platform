<?php

namespace App\Modules\RequestType\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequestTypeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:100', 'unique:request_types,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
