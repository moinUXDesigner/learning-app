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
        Schema::create('daily_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('learning_plan_id')->constrained('learning_plans')->cascadeOnDelete();
            $table->foreignId('course_id')->constrained('courses')->cascadeOnDelete();
            $table->foreignId('module_id')->nullable()->constrained('modules')->nullOnDelete();
            $table->foreignId('lesson_id')->nullable()->constrained('lessons')->nullOnDelete();
            $table->integer('day_number');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('task_type')->nullable();
            $table->integer('estimated_minutes')->nullable();
            $table->integer('points')->default(0);
            $table->timestamp('due_time')->nullable();
            $table->string('difficulty')->nullable();
            $table->text('completion_criteria')->nullable();
            $table->string('resource_link')->nullable();
            $table->string('video_link')->nullable();
            $table->string('submission_type')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_tasks');
    }
};
