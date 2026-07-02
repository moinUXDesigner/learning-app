<?php

namespace Database\Factories;

use App\Models\Question;
use App\Models\QuizAttempt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuizAttemptAnswer>
 */
class QuizAttemptAnswerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_attempt_id' => QuizAttempt::factory(),
            'question_id' => Question::factory(),
            'submitted_answer' => fake()->randomElement(['A', 'B', 'C', 'D']),
            'is_correct' => fake()->boolean(),
        ];
    }
}
