import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDailyTask } from '../../api/hooks/useCourses';
import { useSubmitTask } from '../../api/hooks/useSubmissions';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';

export function TaskSubmission() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading, error } = useDailyTask(taskId);
  const submitTask = useSubmitTask(taskId ?? '');

  const [textAnswer, setTextAnswer] = useState('');
  const [url, setUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading task…</p>;
  }

  if (error || !task) {
    return <p className="text-sm text-red-600">Couldn&apos;t load this task.</p>;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!task) return;

    const formData = new FormData();

    if (task.submission_type === 'file' || task.submission_type === 'screenshot') {
      if (!file) {
        setFormError('Please choose a file to upload.');
        return;
      }
      formData.append('file', file);
    } else if (task.submission_type === 'text') {
      formData.append('text_answer', textAnswer);
    } else if (task.submission_type === 'url') {
      formData.append('url', url);
    } else if (task.submission_type === 'github_link') {
      formData.append('github_url', githubUrl);
    }

    try {
      await submitTask.mutateAsync(formData);
      setSuccess(true);
      setTimeout(() => navigate(-1), 1200);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Submission failed. Please try again.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{task.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{task.description}</p>
        <p className="mt-1 text-xs text-gray-400">
          Day {task.day_number} • {task.points} XP
          {task.due_time && <> • Due {new Date(task.due_time).toLocaleString()}</>}
        </p>
      </div>

      <Card>
        {success ? (
          <p className="text-sm font-medium text-green-700">Submitted! Redirecting…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {formError}
              </div>
            )}

            {task.submission_type === 'text' && (
              <div>
                <label htmlFor="text_answer" className="block text-sm font-medium text-gray-700">
                  Your answer
                </label>
                <textarea
                  id="text_answer"
                  required
                  rows={6}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {task.submission_type === 'url' && (
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                  Link
                </label>
                <input
                  id="url"
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {task.submission_type === 'github_link' && (
              <div>
                <label htmlFor="github_url" className="block text-sm font-medium text-gray-700">
                  GitHub link
                </label>
                <input
                  id="github_url"
                  type="url"
                  required
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/…"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}

            {(task.submission_type === 'file' || task.submission_type === 'screenshot') && (
              <div>
                <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                  {task.submission_type === 'screenshot' ? 'Upload screenshot' : 'Upload file'}
                </label>
                <input
                  id="file"
                  type="file"
                  required
                  accept={task.submission_type === 'screenshot' ? 'image/*' : undefined}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitTask.isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {submitTask.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </form>
        )}
      </Card>
    </div>
  );
}
