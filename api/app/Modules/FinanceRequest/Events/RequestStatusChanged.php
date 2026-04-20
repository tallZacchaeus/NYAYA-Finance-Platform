<?php

namespace App\Modules\FinanceRequest\Events;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RequestStatusChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly FinanceRequest $financeRequest,
        public readonly string $oldStatus,
        public readonly string $newStatus,
        public readonly User $actor,
    ) {}
}
