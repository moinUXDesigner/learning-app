<?php

namespace Database\Factories;

use App\Models\Quiz;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Question>
 */
class QuestionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'quiz_id' => Quiz::factory(),
            'question_text' => fake()->sentence().'?',
            'question_type' => 'mcq',
            'options' => ['A' => fake()->word(), 'B' => fake()->word(), 'C' => fake()->word(), 'D' => fake()->word()],
            'correct_answer' => 'A',
            'marks' => fake()->numberBetween(1, 5),
        ];
    }
}
