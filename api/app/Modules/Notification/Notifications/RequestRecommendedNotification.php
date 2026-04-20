<?php

namespace App\Modules\Notification\Notifications;

use App\Modules\FinanceRequest\Models\FinanceRequest;
use App\Modules\User\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RequestRecommendedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly FinanceRequest $financeRequest,
        public readonly User $actor,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('[NYAYA Finance] Request ' . $this->financeRequest->reference . ' status update')
            ->view('emails.request-status', [
                'financeRequest' => $this->financeRequest,
                'actor'          => $this->actor,
                'notifiable'     => $notifiable,
            ]);
    }

    public function toArray(object $notifiable): array
    {
        return [
            'finance_request_id' => $this->financeRequest->id,
            'reference'          => $this->financeRequest->reference,
            'title'              => $this->financeRequest->title,
            'status'             => $this->financeRequest->status,
            'actor_id'           => $this->actor->id,
            'actor_name'         => $this->actor->name,
        ];
    }
}
