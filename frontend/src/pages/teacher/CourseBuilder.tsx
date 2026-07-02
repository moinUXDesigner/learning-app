import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse, useCourseModules, useModuleLessons } from '../../api/hooks/useCourses';
import { useCreateModule, useDeleteModule, useUpdateModule } from '../../api/hooks/useModules';
import { useCreateLesson, useDeleteLesson, useUpdateLesson } from '../../api/hooks/useLessons';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { Lesson, Module } from '../../types';

const EDITABLE_STATUSES = ['draft', 'rejected'];

export function CourseBuilder() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);

  if (courseLoading || modulesLoading) {
    return <p className="text-sm text-gray-500">Loading course builder…</p>;
  }

  if (!course || !courseId) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  const isEditable = EDITABLE_STATUSES.includes(course.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Course Builder — {course.title}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Build the curriculum: modules, and lessons within each module.
        </p>
        <div className="mt-2 flex gap-3 text-sm">
          <Link to="/teacher/my-courses" className="text-indigo-600 hover:text-indigo-500">
            &larr; Back to My Courses
          </Link>
          <Link to={`/teacher/learning-plan-builder/${courseId}`} className="text-indigo-600 hover:text-indigo-500">
            Learning Plan &rarr;
          </Link>
        </div>
      </div>

      {!isEditable && (
        <div className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800" role="status">
          This course is <strong>{course.status.replace(/_/g, ' ')}</strong> and can no longer be edited by
          you. Only Draft or Rejected courses can be modified. (An org admin can revert it to Draft.)
        </div>
      )}

      <ModuleList courseId={courseId} modules={modules ?? []} isEditable={isEditable} />
    </div>
  );
}

function ModuleList({
  courseId,
  modules,
  isEditable,
}: {
  courseId: string;
  modules: Module[];
  isEditable: boolean;
}) {
  const createModule = useCreateModule(courseId);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createModule.mutateAsync({
        title,
        description: description || null,
        order: order ? Number(order) : null,
      });
      setTitle('');
      setDescription('');
      setOrder('');
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create module.');
    }
  }

  return (
    <div className="space-y-4">
      {modules.length === 0 && (
        <Card>
          <p className="text-sm text-gray-500">No modules yet. Add the first one below.</p>
        </Card>
      )}

      {modules.map((module) => (
        <ModuleCard key={module.id} courseId={courseId} module={module} isEditable={isEditable} />
      ))}

      {isEditable && (
        <Card>
          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Order</label>
                <input
                  type="number"
                  min={0}
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createModule.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {createModule.isPending ? 'Adding…' : 'Add Module'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              + Add Module
            </button>
          )}
        </Card>
      )}
    </div>
  );
}

function ModuleCard({
  courseId,
  module,
  isEditable,
}: {
  courseId: string;
  module: Module;
  isEditable: boolean;
}) {
  const { data: lessons, isLoading } = useModuleLessons(module.id);
  const updateModule = useUpdateModule(courseId);
  const deleteModule = useDeleteModule(courseId);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [description, setDescription] = useState(module.description ?? '');
  const [order, setOrder] = useState(String(module.order ?? ''));
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updateModule.mutateAsync({
        moduleId: module.id,
        payload: { title, description: description || null, order: order ? Number(order) : null },
      });
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update module.');
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete module "${module.title}" and all its lessons?`)) return;
    try {
      await deleteModule.mutateAsync(module.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete module.');
    }
  }

  return (
    <Card>
      {isEditing ? (
        <form onSubmit={handleUpdate} className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            type="number"
            min={0}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="block w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={updateModule.isPending}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {module.order != null && <span className="text-gray-400">#{module.order} </span>}
              {module.title}
            </h3>
            {module.description && <p className="mt-1 text-sm text-gray-500">{module.description}</p>}
          </div>
          {isEditable && (
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg border border-red-300 px-2 py-1 font-medium text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 border-t border-gray-100 pt-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Loading lessons…</p>
        ) : (
          <LessonList moduleId={module.id} lessons={lessons ?? []} isEditable={isEditable} />
        )}
      </div>
    </Card>
  );
}

function LessonList({
  moduleId,
  lessons,
  isEditable,
}: {
  moduleId: number;
  lessons: Lesson[];
  isEditable: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-3 pl-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Lessons</h4>
      {lessons.length === 0 && <p className="text-sm text-gray-400">No lessons yet.</p>}
      {lessons.map((lesson) => (
        <LessonRow key={lesson.id} moduleId={moduleId} lesson={lesson} isEditable={isEditable} />
      ))}
      {isEditable &&
        (showForm ? (
          <LessonForm moduleId={moduleId} onDone={() => setShowForm(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            + Add Lesson
          </button>
        ))}
    </div>
  );
}

interface LessonFormValues {
  title: string;
  content: string;
  videoUrl: string;
  videoStartSeconds: string;
  videoEndSeconds: string;
  estimatedMinutes: string;
  order: string;
}

const EMPTY_LESSON_FORM: LessonFormValues = {
  title: '',
  content: '',
  videoUrl: '',
  videoStartSeconds: '',
  videoEndSeconds: '',
  estimatedMinutes: '',
  order: '',
};

function lessonToFormValues(lesson: Lesson): LessonFormValues {
  return {
    title: lesson.title,
    content: lesson.content ?? '',
    videoUrl: lesson.video_url ?? '',
    videoStartSeconds: lesson.video_start_seconds != null ? String(lesson.video_start_seconds) : '',
    videoEndSeconds: lesson.video_end_seconds != null ? String(lesson.video_end_seconds) : '',
    estimatedMinutes: lesson.estimated_minutes != null ? String(lesson.estimated_minutes) : '',
    order: lesson.order != null ? String(lesson.order) : '',
  };
}

function LessonForm({
  moduleId,
  initial,
  onDone,
  onSave,
  isPending,
}: {
  moduleId: number;
  initial?: LessonFormValues;
  onDone: () => void;
  onSave?: (values: LessonFormValues) => Promise<void>;
  isPending?: boolean;
}) {
  const createLesson = useCreateLesson(moduleId);
  const [values, setValues] = useState<LessonFormValues>(initial ?? EMPTY_LESSON_FORM);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof LessonFormValues>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (onSave) {
        await onSave(values);
      } else {
        await createLesson.mutateAsync({
          title: values.title,
          content: values.content || null,
          video_url: values.videoUrl || null,
          video_start_seconds: values.videoStartSeconds ? Number(values.videoStartSeconds) : null,
          video_end_seconds: values.videoEndSeconds ? Number(values.videoEndSeconds) : null,
          estimated_minutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
          order: values.order ? Number(values.order) : null,
        });
      }
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save lesson.');
    }
  }

  const pending = isPending ?? createLesson.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <input
        required
        placeholder="Title"
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <textarea
        rows={2}
        placeholder="Content"
        value={values.content}
        onChange={(e) => set('content', e.target.value)}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <input
        placeholder="Video URL"
        value={values.videoUrl}
        onChange={(e) => set('videoUrl', e.target.value)}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          type="number"
          min={0}
          placeholder="Start (s)"
          value={values.videoStartSeconds}
          onChange={(e) => set('videoStartSeconds', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="number"
          min={0}
          placeholder="End (s)"
          value={values.videoEndSeconds}
          onChange={(e) => set('videoEndSeconds', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="number"
          min={0}
          placeholder="Est. minutes"
          value={values.estimatedMinutes}
          onChange={(e) => set('estimatedMinutes', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <input
          type="number"
          min={0}
          placeholder="Order"
          value={values.order}
          onChange={(e) => set('order', e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : 'Save Lesson'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function LessonRow({
  moduleId,
  lesson,
  isEditable,
}: {
  moduleId: number;
  lesson: Lesson;
  isEditable: boolean;
}) {
  const updateLesson = useUpdateLesson(moduleId);
  const deleteLesson = useDeleteLesson(moduleId);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(values: LessonFormValues) {
    await updateLesson.mutateAsync({
      lessonId: lesson.id,
      payload: {
        title: values.title,
        content: values.content || null,
        video_url: values.videoUrl || null,
        video_start_seconds: values.videoStartSeconds ? Number(values.videoStartSeconds) : null,
        video_end_seconds: values.videoEndSeconds ? Number(values.videoEndSeconds) : null,
        estimated_minutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
        order: values.order ? Number(values.order) : null,
      },
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    try {
      await deleteLesson.mutateAsync(lesson.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete lesson.');
    }
  }

  if (isEditing) {
    return (
      <LessonForm
        moduleId={moduleId}
        initial={lessonToFormValues(lesson)}
        onDone={() => setIsEditing(false)}
        onSave={handleSave}
        isPending={updateLesson.isPending}
      />
    );
  }

  return (
    <div className="flex items-start justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">
          {lesson.order != null && <span className="text-gray-400">#{lesson.order} </span>}
          {lesson.title}
        </p>
        {lesson.estimated_minutes != null && (
          <p className="text-xs text-gray-400">{lesson.estimated_minutes} min</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      {isEditable && (
        <div className="flex shrink-0 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-gray-300 px-2 py-1 font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg border border-red-300 px-2 py-1 font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
