<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Question;
use App\Models\Quiz;
use Illuminate\Database\Seeder;

class QuizSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');

        $quiz = Quiz::create([
            'course_id' => $course->id,
            'lesson_id' => null,
            'title' => 'Cybersecurity Beginner: Module 1-3 Checkpoint',
            'total_marks' => 50,
            'pass_marks' => 30,
        ]);

        $questions = [
            [
                'question_text' => 'What does the "C" in the CIA triad stand for?',
                'options' => ['Confidentiality', 'Control', 'Compliance', 'Certification'],
                'correct_answer' => 'Confidentiality',
                'marks' => 10,
            ],
            [
                'question_text' => 'Which of these is a common sign of a phishing email?',
                'options' => ['A generic greeting and urgent call to action', 'A company logo', 'A short subject line', 'An unsubscribe link'],
                'correct_answer' => 'A generic greeting and urgent call to action',
                'marks' => 10,
            ],
            [
                'question_text' => 'Which protocol suite underlies most internet communication?',
                'options' => ['TCP/IP', 'FTP', 'SMTP', 'HTTP only'],
                'correct_answer' => 'TCP/IP',
                'marks' => 10,
            ],
            [
                'question_text' => 'What is the primary purpose of a firewall?',
                'options' => ['Filter and control network traffic', 'Encrypt files at rest', 'Compress network packets', 'Manage user passwords'],
                'correct_answer' => 'Filter and control network traffic',
                'marks' => 10,
            ],
            [
                'question_text' => 'Which of the following best strengthens account security beyond a password?',
                'options' => ['Multi-factor authentication', 'A longer session timeout', 'A public Wi-Fi connection', 'Disabling logout'],
                'correct_answer' => 'Multi-factor authentication',
                'marks' => 10,
            ],
        ];

        foreach ($questions as $questionData) {
            Question::create([
                'quiz_id' => $quiz->id,
                'question_text' => $questionData['question_text'],
                'question_type' => 'mcq',
                'options' => $questionData['options'],
                'correct_answer' => $questionData['correct_answer'],
                'marks' => $questionData['marks'],
            ]);
        }
    }
}
