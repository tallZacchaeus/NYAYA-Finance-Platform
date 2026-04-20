<?php

namespace App\Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:20'],
            'avatar'        => ['sometimes', 'nullable', 'string'],
            'is_active'     => ['sometimes', 'boolean'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'role'          => ['sometimes', 'string', 'exists:roles,name'],
        ];
    }
}
