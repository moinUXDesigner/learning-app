import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../../api/hooks/useCourses';
import { useCreateCourseAssignment } from '../../api/hooks/useTeacher';
import { useOrgStudents } from '../../api/hooks/useUsers';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';

const ASSIGNABLE_STATUSES = ['approved', 'published'];

export function AssignCourse() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: students, isLoading: studentsLoading, error: studentsError } = useOrgStudents();
  const createAssignment = useCreateCourseAssignment();

  const [studentId, setStudentId] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (courseLoading) {
    return <p className="text-sm text-gray-500">Loading course…</p>;
  }

  if (!course || !courseId) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  const isAssignable = ASSIGNABLE_STATUSES.includes(course.status);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!studentId) {
      setError('Please choose a student.');
      return;
    }

    try {
      await createAssignment.mutateAsync({
        course_id: Number(courseId),
        student_id: Number(studentId),
        start_date: startDate,
        end_date: endDate || null,
      });
      setSuccess('Course assigned successfully.');
      setStudentId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to assign course.');
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Assign Course — {course.title}</h1>
        <Link to="/teacher/my-courses" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500">
          &larr; Back to My Courses
        </Link>
      </div>

      {!isAssignable ? (
        <Card>
          <p className="text-sm text-yellow-800">
            This course is <strong>{course.status.replace(/_/g, ' ')}</strong>. Only Approved or
            Published courses can be assigned to students. Submit it for approval from My Courses
            first.
          </p>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Student</label>
              {studentsLoading ? (
                <p className="mt-1 text-sm text-gray-500">Loading students…</p>
              ) : studentsError ? (
                <p className="mt-1 text-sm text-red-600">Couldn&apos;t load the student list.</p>
              ) : (
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a student…</option>
                  {(students ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              )}
              {students && students.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">No students found in your organization.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createAssignment.isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {createAssignment.isPending ? 'Assigning…' : 'Assign Course'}
            </button>
          </form>
        </Card>
      )}
    </div>
  );
}
