import { Link } from 'react-router-dom';
import { useTeacherDashboard } from '../../api/hooks/useTeacher';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';

export function TeacherDashboard() {
  const { data, isLoading, error } = useTeacherDashboard();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your dashboard…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your dashboard. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Teacher Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-700">{data.pending_reviews_count}</p>
          <p className="mt-1 text-sm text-gray-500">Pending Reviews</p>
          <Link
            to="/teacher/review-submissions"
            className="mt-2 inline-block text-xs font-medium text-indigo-600 hover:text-indigo-500"
          >
            Review now
          </Link>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {data.average_score !== null ? data.average_score.toFixed(1) : '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Average Score</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500">{data.inactive_students.length}</p>
          <p className="mt-1 text-sm text-gray-500">
            Inactive Students <span className="text-gray-400">({data.inactive_days_threshold}d)</span>
          </p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Course-wise Completion
        </h3>
        {data.course_completion.length === 0 ? (
          <p className="text-sm text-gray-500">No submissions recorded for your courses yet.</p>
        ) : (
          <div className="space-y-4">
            {data.course_completion.map((row) => {
              const percent =
                row.submission_count > 0 ? (row.completed_count / row.submission_count) * 100 : 0;
              return (
                <div key={row.course_id}>
                  <ProgressBar
                    percent={percent}
                    label={`${row.course?.title ?? `Course #${row.course_id}`} (${row.completed_count}/${row.submission_count} completed)`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Inactive Students</h3>
          <Link to="/teacher/student-progress" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View progress
          </Link>
        </div>
        {data.inactive_students.length === 0 ? (
          <p className="text-sm text-gray-500">No inactive students right now.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.inactive_students.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">{s.name}</span>
                <span className="text-gray-400">{s.email}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
