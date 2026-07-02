import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useQuiz, useQuizQuestions } from '../../api/hooks/useQuizzes';
import { useSubmitQuizAttempt } from '../../api/hooks/useQuizzes';
import type { QuizAnswerPayload } from '../../api/hooks/useQuizzes';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { QuizAttempt as QuizAttemptResult } from '../../types';

export function QuizAttempt() {
  const { quizId } = useParams<{ quizId: string }>();
  const { data: quiz, isLoading: quizLoading, error: quizError } = useQuiz(quizId);
  // Deliberately NOT using `quiz.questions` here: GET /api/quizzes/{quiz}
  // eager-loads raw Question models, which include `correct_answer`
  // un-stripped (QuestionResource's student-hiding logic only applies to
  // the dedicated GET /api/quizzes/{quiz}/questions endpoint). Using that
  // dedicated endpoint instead avoids leaking answers to the browser.
  const { data: questions, isLoading: questionsLoading, error: questionsError } = useQuizQuestions(quizId);
  const submitAttempt = useSubmitQuizAttempt(quizId ?? '');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  if (quizLoading || questionsLoading) {
    return <p className="text-sm text-gray-500">Loading quiz…</p>;
  }

  if (quizError || questionsError || !quiz || !questions) {
    return <p className="text-sm text-red-600">Couldn&apos;t load this quiz.</p>;
  }

  const loadedQuestions = questions;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const payload: QuizAnswerPayload[] = loadedQuestions.map((q) => ({
      question_id: q.id,
      submitted_answer: answers[q.id] ?? null,
    }));

    try {
      const attempt = await submitAttempt.mutateAsync(payload);
      setResult(attempt);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not submit your attempt. Please try again.');
    }
  }

  if (result) {
    const passed = result.status === 'pass';
    return (
      <div className="mx-auto max-w-lg">
        <Card className={`text-center ${passed ? 'border-green-300' : 'border-red-300'}`}>
          <h1 className={`text-2xl font-bold ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed ? 'You passed!' : 'Not quite — try again later'}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Score: {result.score} / {quiz.total_marks} (pass mark: {quiz.pass_marks})
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{quiz.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {quiz.total_marks} total marks • pass mark {quiz.pass_marks}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {formError}
          </div>
        )}

        {questions.map((question, idx) => (
          <Card key={question.id}>
            <p className="mb-3 text-sm font-medium text-gray-800">
              {idx + 1}. {question.question_text}{' '}
              <span className="text-xs font-normal text-gray-400">({question.marks} marks)</span>
            </p>

            {question.question_type === 'mcq' && question.options ? (
              <div className="space-y-2">
                {question.options.map((option) => (
                  <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {option}
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                value={answers[question.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Your answer"
              />
            )}
          </Card>
        ))}

        <button
          type="submit"
          disabled={submitAttempt.isPending || questions.length === 0}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitAttempt.isPending ? 'Submitting…' : 'Submit Quiz'}
        </button>
      </form>
    </div>
  );
}
