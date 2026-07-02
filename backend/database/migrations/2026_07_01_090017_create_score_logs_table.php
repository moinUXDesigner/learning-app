<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('score_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('course_id')->nullable()->constrained('courses')->nullOnDelete();
            $table->string('activity_type');
            // Polymorphic-ish reference to the source record (daily_task, project,
            // quiz_attempt, etc.) depending on activity_type. No FK constraint
            // since the referenced table varies.
            $table->unsignedBigInteger('activity_id')->nullable();
            $table->integer('points');
            $table->string('remarks')->nullable();
            // Append-only ledger: created_at is sufficient, but Laravel's default
            // timestamps() (created_at + updated_at) is used for consistency/tooling.
            $table->timestamps();

            $table->index(['student_id', 'course_id', 'activity_type'], 'score_logs_student_course_activity_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('score_logs');
    }
};
