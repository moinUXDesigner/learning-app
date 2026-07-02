import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCourse } from '../../api/hooks/useCourses';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';

export function CreateCourse() {
  const navigate = useNavigate();
  const createCourse = useCreateCourse();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    try {
      const course = await createCourse.mutateAsync({
        title,
        description: description || null,
        category: category || null,
        difficulty_level: difficultyLevel || null,
        duration_days: durationDays ? Number(durationDays) : null,
      });
      navigate(`/teacher/course-builder/${course.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors ?? {});
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Create Course</h1>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.title && <p className="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <input
                id="category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Security"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {fieldErrors.category && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.category[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="difficulty_level" className="block text-sm font-medium text-gray-700">
                Difficulty
              </label>
              <select
                id="difficulty_level"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Select…</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              {fieldErrors.difficulty_level && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.difficulty_level[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="duration_days" className="block text-sm font-medium text-gray-700">
              Duration (days)
            </label>
            <input
              id="duration_days"
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.duration_days && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.duration_days[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={createCourse.isPending}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {createCourse.isPending ? 'Creating…' : 'Create Course'}
          </button>
        </form>
      </Card>
    </div>
  );
}
