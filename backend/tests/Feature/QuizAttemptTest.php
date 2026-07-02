<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\Organization;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\ScoreLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizAttemptTest extends TestCase
{
    use RefreshDatabase;

    private function quizWithQuestions(Organization $org, int $passMarks = 10): Quiz
    {
        $course = Course::factory()->create(['organization_id' => $org->id]);
        $quiz = Quiz::factory()->create([
            'course_id' => $course->id,
            'total_marks' => 20,
            'pass_marks' => $passMarks,
        ]);

        Question::factory()->create([
            'quiz_id' => $quiz->id,
            'correct_answer' => 'A',
            'marks' => 10,
        ]);
        Question::factory()->create([
            'quiz_id' => $quiz->id,
            'correct_answer' => 'B',
            'marks' => 10,
        ]);

        return $quiz;
    }

    public function test_correct_answers_are_graded_and_score_sums_matching_marks(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $quiz = $this->quizWithQuestions($org, 10);
        $questions = $quiz->questions()->orderBy('id')->get();

        $response = $this->postJson("/api/quizzes/{$quiz->id}/attempt", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'submitted_answer' => 'A'], // correct, 10 marks
                ['question_id' => $questions[1]->id, 'submitted_answer' => 'Z'], // wrong
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('score', 10);
        $response->assertJsonPath('status', 'pass');
    }

    public function test_passing_score_awards_a_score_log_via_quiz_pass(): void
    {
        $org = Organization::factory()->create();
        $student = $this->actingAsRole('student', $org);
        $quiz = $this->quizWithQuestions($org, 10);
        $questions = $quiz->questions()->orderBy('id')->get();

        $this->postJson("/api/quizzes/{$quiz->id}/attempt", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'submitted_answer' => 'A'],
                ['question_id' => $questions[1]->id, 'submitted_answer' => 'B'],
            ],
        ])->assertCreated();

        $this->assertDatabaseHas('score_logs', [
            'student_id' => $student->id,
            'course_id' => $quiz->course_id,
            'activity_type' => 'quiz_pass',
        ]);
    }

    public function test_failing_score_does_not_award_a_score_log(): void
    {
        $org = Organization::factory()->create();
        $student = $this->actingAsRole('student', $org);
        $quiz = $this->quizWithQuestions($org, 15);
        $questions = $quiz->questions()->orderBy('id')->get();

        $response = $this->postJson("/api/quizzes/{$quiz->id}/attempt", [
            'answers' => [
                ['question_id' => $questions[0]->id, 'submitted_answer' => 'A'], // 10 marks, below pass_marks 15
                ['question_id' => $questions[1]->id, 'submitted_answer' => 'Z'], // wrong
            ],
        ]);

        $response->assertCreated();
        $response->assertJsonPath('status', 'fail');

        $this->assertSame(
            0,
            ScoreLog::where('student_id', $student->id)
                ->where('activity_type', 'quiz_pass')
                ->count()
        );
    }

    public function test_question_resource_hides_correct_answer_for_students(): void
    {
        $org = Organization::factory()->create();
        $this->actingAsRole('student', $org);
        $quiz = $this->quizWithQuestions($org);

        $response = $this->getJson("/api/quizzes/{$quiz->id}/questions");

        $response->assertOk();
        foreach ($response->json('data') as $question) {
            $this->assertNull($question['correct_answer']);
        }
    }

    public function test_question_resource_shows_correct_answer_for_teachers(): void
    {
        $org = Organization::factory()->create();
        $teacher = User::factory()->teacher()->create(['organization_id' => $org->id]);
        $course = Course::factory()->create(['organization_id' => $org->id, 'created_by' => $teacher->id]);
        $quiz = Quiz::factory()->create(['course_id' => $course->id]);
        Question::factory()->create(['quiz_id' => $quiz->id, 'correct_answer' => 'A']);

        $this->actingAs($teacher);

        $response = $this->getJson("/api/quizzes/{$quiz->id}/questions");

        $response->assertOk();
        $this->assertSame('A', $response->json('data.0.correct_answer'));
    }
}
