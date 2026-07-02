<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * In-app notification stored in `app_notifications`.
 *
 * Deliberately not named `Notification` / table `notifications`, since
 * Laravel's built-in notifications system already reserves that table
 * name/migration.
 */
class AppNotification extends Model
{
    /** @use HasFactory<\Database\Factories\AppNotificationFactory> */
    use HasFactory;

    protected $table = 'app_notifications';

    protected $fillable = [
        'user_id',
        'type',
        'message',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
