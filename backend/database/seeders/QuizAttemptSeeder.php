<?php

namespace Database\Seeders;

use App\Models\Course;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizAttemptAnswer;
use App\Models\User;
use App\Services\ScoreService;
use Illuminate\Database\Seeder;

class QuizAttemptSeeder extends Seeder
{
    public function run(): void
    {
        $course = Course::firstWhere('title', 'Cybersecurity Beginner');
        $quiz = Quiz::where('course_id', $course->id)->firstOrFail();
        $questions = $quiz->questions()->get();

        $students = User::where('email', 'like', 'student%@learntrack.test')->orderBy('email')->get();

        $scoreService = app(ScoreService::class);

        // Student 1: answers everything correctly -> passes.
        // Student 2: gets 2 wrong -> still passes (pass_marks = 30/50).
        // Student 3: gets most wrong -> fails.
        $attemptPlans = [
            ['student' => $students[0], 'wrongCount' => 0],
            ['student' => $students[1], 'wrongCount' => 2],
            ['student' => $students[2], 'wrongCount' => 4],
        ];

        foreach ($attemptPlans as $index => $plan) {
            $student = $plan['student'];
            $wrongCount = $plan['wrongCount'];

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'student_id' => $student->id,
                'score' => 0,
                'status' => 'completed',
                'attempted_at' => now()->copy()->subHours(2 + $index),
            ]);

            $totalScore = 0;
            $wrongAssigned = 0;

            foreach ($questions as $question) {
                $shouldBeWrong = $wrongAssigned < $wrongCount;

                if ($shouldBeWrong) {
                    $options = collect($question->options)->reject(fn ($opt) => $opt === $question->correct_answer);
                    $submittedAnswer = $options->first() ?? $question->correct_answer;
                    $isCorrect = $submittedAnswer === $question->correct_answer;
                    $wrongAssigned++;
                } else {
                    $submittedAnswer = $question->correct_answer;
                    $isCorrect = true;
                }

                if ($isCorrect) {
                    $totalScore += $question->marks;
                }

                QuizAttemptAnswer::create([
                    'quiz_attempt_id' => $attempt->id,
                    'question_id' => $question->id,
                    'submitted_answer' => $submittedAnswer,
                    'is_correct' => $isCorrect,
                ]);
            }

            $attempt->update(['score' => $totalScore]);

            // Only awards a ScoreLog if the attempt's score meets the quiz's
            // pass_marks - ScoreService::awardForQuizPass() handles that check.
            $scoreService->awardForQuizPass($student, $attempt->fresh('quiz'));
        }
    }
}
