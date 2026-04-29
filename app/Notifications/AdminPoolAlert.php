<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AdminPoolAlert extends Notification
{
    use Queueable;

    protected $details;

    /**
     * Create a new notification instance.
     */
    public function __construct($details)
    {
        $this->details = $details;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('StegoLock: Critical Cover Pool Alert')
            ->greeting('Hello Administrator,')
            ->line('A document locking job has failed due to insufficient cover file capacity.')
            ->line('Details: ' . $this->details['message'])
            ->action('Manage Covers', url('/admin/covers'))
            ->line('Please upload more cover files or generate text covers to resolve this.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Critical Cover Pool Alert',
            'message' => $this->details['message'],
            'type' => 'critical_error',
            'action_url' => '/admin/covers'
        ];
    }
}
