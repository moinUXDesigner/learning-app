import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTeacherSubmissions, useReviewSubmission } from '../../api/hooks/useTeacher';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { TaskSubmission } from '../../types';

export function ReviewSubmissions() {
  // `status=pending` is a backend alias for Submitted OR Late (see
  // TaskSubmissionController::teacherSubmissions) — exactly "the review
  // queue" this page wants.
  const { data: submissions, isLoading, error } = useTeacherSubmissions('pending');

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading submissions…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">Couldn&apos;t load submissions. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Review Submissions</h1>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No submissions are waiting for review. Nice work!</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ submission }: { submission: TaskSubmission }) {
  const reviewSubmission = useReviewSubmission();
  const maxPoints = submission.daily_task?.points;
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleReview(status: 'completed' | 'rejected') {
    setError(null);

    if (score === '') {
      setError('Please enter a score.');
      return;
    }

    try {
      await reviewSubmission.mutateAsync({
        submissionId: submission.id,
        payload: { score: Number(score), feedback: feedback || null, status },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit review.');
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleReview('completed');
  }

  if (done) {
    return (
      <Card>
        <p className="text-sm font-medium text-green-700">Review submitted.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            {submission.daily_task?.title ?? `Task #${submission.daily_task_id}`}
          </h3>
          <p className="text-xs text-gray-400">
            Day {submission.daily_task?.day_number ?? '—'} • Student #{submission.student_id} •{' '}
            {submission.submission_type}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            submission.status === 'late' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {submission.status}
        </span>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
        {submission.text_answer && <p>{submission.text_answer}</p>}
        {submission.url && (
          <a href={submission.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
            {submission.url}
          </a>
        )}
        {submission.github_url && (
          <a href={submission.github_url} target="_blank" rel="noreferrer" className="text-indigo-600 underline">
            {submission.github_url}
          </a>
        )}
        {submission.file_path && <p className="text-gray-500">File uploaded: {submission.file_path}</p>}
        {!submission.text_answer && !submission.url && !submission.github_url && !submission.file_path && (
          <p className="text-gray-400">No submission content available.</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Score {maxPoints != null && <span className="text-gray-400">(max {maxPoints})</span>}
            </label>
            <input
              type="number"
              min={0}
              max={maxPoints ?? undefined}
              required
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="mt-1 block w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700">Feedback</label>
          <textarea
            rows={2}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={reviewSubmission.isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
          >
            {reviewSubmission.isPending ? 'Submitting…' : 'Approve'}
          </button>
          <button
            type="button"
            disabled={reviewSubmission.isPending}
            onClick={() => handleReview('rejected')}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </form>
    </Card>
  );
}
