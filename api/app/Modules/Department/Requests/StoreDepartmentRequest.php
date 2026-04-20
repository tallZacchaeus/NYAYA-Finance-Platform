<?php

namespace App\Modules\Department\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255', 'unique:departments,name'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:departments,slug'],
            'description' => ['nullable', 'string'],
        ];
    }
}
