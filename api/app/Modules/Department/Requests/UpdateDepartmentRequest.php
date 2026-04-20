<?php

namespace App\Modules\Department\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'        => ['sometimes', 'string', 'max:255', Rule::unique('departments', 'name')->ignore($this->route('id'))],
            'slug'        => ['sometimes', 'string', 'max:255', Rule::unique('departments', 'slug')->ignore($this->route('id'))],
            'description' => ['sometimes', 'nullable', 'string'],
        ];
    }
}
