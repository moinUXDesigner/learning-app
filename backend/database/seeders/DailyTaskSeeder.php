<?php

namespace Database\Seeders;

use App\Enums\SubmissionType;
use App\Models\Course;
use App\Models\DailyTask;
use App\Models\LearningPlan;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class DailyTaskSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');
        $learningPlan = LearningPlan::where('course_id', $course->id)->firstOrFail();
        $lessons = Lesson::whereHas('module', fn ($q) => $q->where('course_id', $course->id))
            ->orderBy('module_id')
            ->orderBy('order')
            ->get();

        // Representative set of tasks spread across the 30-day plan, mixing
        // task types and submission types. Not every day gets a hand-crafted
        // task - this is a demo dataset, not exhaustive day-by-day coverage.
        $tasks = [
            ['day' => 1, 'title' => 'Watch: What Is Cybersecurity?', 'type' => 'video', 'submission' => SubmissionType::Text, 'lesson' => 0, 'points' => 10],
            ['day' => 2, 'title' => 'Read & Summarize the CIA Triad', 'type' => 'reading', 'submission' => SubmissionType::Text, 'lesson' => 1, 'points' => 10],
            ['day' => 3, 'title' => 'Identify 3 Threat Actors in the News', 'type' => 'assignment', 'submission' => SubmissionType::Text, 'lesson' => 2, 'points' => 15],
            ['day' => 5, 'title' => 'Module 1 Quiz Prep Notes', 'type' => 'quiz', 'submission' => SubmissionType::Text, 'lesson' => null, 'points' => 10],
            ['day' => 7, 'title' => 'Watch: How the Internet Works', 'type' => 'video', 'submission' => SubmissionType::Text, 'lesson' => 3, 'points' => 10],
            ['day' => 9, 'title' => 'Diagram a TCP/IP Handshake', 'type' => 'assignment', 'submission' => SubmissionType::Screenshot, 'lesson' => 4, 'points' => 20],
            ['day' => 12, 'title' => 'Spot the Phishing Email', 'type' => 'assignment', 'submission' => SubmissionType::Screenshot, 'lesson' => 5, 'points' => 20],
            ['day' => 14, 'title' => 'Malware Types Reflection', 'type' => 'reading', 'submission' => SubmissionType::Text, 'lesson' => 6, 'points' => 10],
            ['day' => 16, 'title' => 'Configure a Firewall Rule (Lab)', 'type' => 'project', 'submission' => SubmissionType::File, 'lesson' => 7, 'points' => 30],
            ['day' => 18, 'title' => 'Set Up MFA on a Personal Account', 'type' => 'assignment', 'submission' => SubmissionType::Screenshot, 'lesson' => 8, 'points' => 20],
            ['day' => 21, 'title' => 'Safe Browsing Checklist Submission', 'type' => 'assignment', 'submission' => SubmissionType::GithubLink, 'lesson' => 9, 'points' => 15],
            ['day' => 24, 'title' => 'Mid-Course Capstone Draft Link', 'type' => 'project', 'submission' => SubmissionType::Url, 'lesson' => null, 'points' => 25],
            ['day' => 27, 'title' => 'Peer Review a Classmate Report', 'type' => 'assignment', 'submission' => SubmissionType::Text, 'lesson' => null, 'points' => 15],
            ['day' => 30, 'title' => 'Final Course Recap Submission', 'type' => 'project', 'submission' => SubmissionType::File, 'lesson' => null, 'points' => 40],
        ];

        foreach ($tasks as $taskData) {
            $lesson = $taskData['lesson'] !== null ? $lessons->get($taskData['lesson']) : null;

            DailyTask::create([
                'learning_plan_id' => $learningPlan->id,
                'course_id' => $course->id,
                'module_id' => $lesson?->module_id,
                'lesson_id' => $lesson?->id,
                'day_number' => $taskData['day'],
                'title' => $taskData['title'],
                'description' => "Complete: {$taskData['title']}.",
                'task_type' => $taskData['type'],
                'estimated_minutes' => 20,
                'points' => $taskData['points'],
                'due_time' => now()->copy()->addDays($taskData['day']),
                'difficulty' => $taskData['points'] >= 25 ? 'hard' : ($taskData['points'] >= 15 ? 'medium' : 'easy'),
                'completion_criteria' => 'Submit the requested artifact for teacher review.',
                'resource_link' => null,
                'video_link' => $lesson?->video_url,
                'submission_type' => $taskData['submission'],
            ]);
        }
    }
}
