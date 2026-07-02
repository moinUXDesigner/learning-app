<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubscriptionPlan extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionPlanFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'max_users',
        'max_courses',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'max_users' => 'integer',
            'max_courses' => 'integer',
            'features' => 'array',
        ];
    }

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }
}
