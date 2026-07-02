<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'organization_id',
        'status',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => Role::class,
        ];
    }

    /**
     * The organization this user belongs to.
     *
     * Nullable: only a super_admin is expected to have no organization.
     */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Courses created by this user (as a teacher/org admin).
     */
    public function createdCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'created_by');
    }

    /**
     * Courses approved by this user (org admin approval workflow).
     */
    public function approvedCourses(): HasMany
    {
        return $this->hasMany(Course::class, 'approved_by');
    }

    /**
     * Batches this user teaches.
     */
    public function taughtBatches(): HasMany
    {
        return $this->hasMany(Batch::class, 'teacher_id');
    }

    /**
     * Course assignments where this user is the teacher.
     */
    public function teachingAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'teacher_id');
    }

    /**
     * Course assignments where this user is the (individually assigned) student.
     */
    public function studentAssignments(): HasMany
    {
        return $this->hasMany(CourseAssignment::class, 'student_id');
    }

    /**
     * Task submissions made by this user (as a student).
     */
    public function taskSubmissions(): HasMany
    {
        return $this->hasMany(TaskSubmission::class, 'student_id');
    }

    /**
     * Task submissions reviewed by this user (as a teacher).
     */
    public function reviewedSubmissions(): HasMany
    {
        return $this->hasMany(TaskSubmission::class, 'reviewed_by');
    }

    /**
     * Quiz attempts made by this user (as a student).
     */
    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class, 'student_id');
    }

    /**
     * Score ledger entries for this user (as a student).
     */
    public function scoreLogs(): HasMany
    {
        return $this->hasMany(ScoreLog::class, 'student_id');
    }

    /**
     * Certificates issued to this user (as a student).
     */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class, 'student_id');
    }

    /**
     * In-app notifications for this user.
     */
    public function appNotifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }

    /**
     * Lesson progress records for this user (as a student).
     */
    public function lessonProgress(): HasMany
    {
        return $this->hasMany(LessonProgress::class, 'student_id');
    }
}
