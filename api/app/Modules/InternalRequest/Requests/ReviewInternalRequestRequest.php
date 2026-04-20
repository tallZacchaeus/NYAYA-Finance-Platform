<?php

namespace App\Modules\InternalRequest\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReviewInternalRequestRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'action' => ['required', Rule::in(['lead_approve', 'lead_reject', 'lead_revision_request'])],
            'notes'  => ['required', 'string', 'max:1000'],
        ];
    }
}
