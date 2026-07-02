import { useTeacherDashboard } from '../../api/hooks/useTeacher';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';

/**
 * Expands on the same GET /api/teacher/dashboard payload TeacherDashboard
 * uses. Data-availability gap (documented, not invented): the backend does
 * NOT expose "most difficult lessons" or "most failed quizzes" anywhere —
 * TeacherDashboardController only returns pending_reviews_count,
 * average_score, student_progress, course_completion, inactive_students.
 * There is no lesson-level or quiz-attempt-level aggregation endpoint. This
 * page surfaces everything that IS available (course completion rates,
 * per-student performance, overall average score, inactive students) and
 * calls out the gap explicitly below rather than fabricating numbers.
 */
export function Analytics() {
  const { data, isLoading, error } = useTeacherDashboard();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading analytics…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load analytics. Please try again.</p>;
  }

  const totalSubmissions = data.course_completion.reduce((sum, c) => sum + c.submission_count, 0);
  const totalCompleted = data.course_completion.reduce((sum, c) => sum + c.completed_count, 0);
  const overallCompletionRate = totalSubmissions > 0 ? (totalCompleted / totalSubmissions) * 100 : 0;

  const topPerformers = [...data.student_progress]
    .filter((s) => s.average_score !== null)
    .sort((a, b) => (b.average_score ?? 0) - (a.average_score ?? 0))
    .slice(0, 5);

  const strugglingStudents = [...data.student_progress]
    .filter((s) => s.average_score !== null)
    .sort((a, b) => (a.average_score ?? 0) - (b.average_score ?? 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Analytics</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold text-indigo-700">{overallCompletionRate.toFixed(0)}%</p>
          <p className="mt-1 text-sm text-gray-500">Overall Completion Rate</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">
            {data.average_score !== null ? data.average_score.toFixed(1) : '—'}
          </p>
          <p className="mt-1 text-sm text-gray-500">Average Score (all submissions)</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-orange-500">{data.pending_reviews_count}</p>
          <p className="mt-1 text-sm text-gray-500">Pending Reviews</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Completion Rate by Course
        </h3>
        {data.course_completion.length === 0 ? (
          <p className="text-sm text-gray-500">No data yet.</p>
        ) : (
          <div className="space-y-4">
            {data.course_completion.map((row) => {
              const percent =
                row.submission_count > 0 ? (row.completed_count / row.submission_count) * 100 : 0;
              return (
                <ProgressBar
                  key={row.course_id}
                  percent={percent}
                  label={row.course?.title ?? `Course #${row.course_id}`}
                />
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Top Performing Students
          </h3>
          {topPerformers.length === 0 ? (
            <p className="text-sm text-gray-500">No scored submissions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topPerformers.map((s) => (
                <li key={s.student_id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-700">{s.student.name}</span>
                  <span className="font-medium text-green-600">{s.average_score?.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Students Needing Attention
          </h3>
          {strugglingStudents.length === 0 ? (
            <p className="text-sm text-gray-500">No scored submissions yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {strugglingStudents.map((s) => (
                <li key={s.student_id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-700">{s.student.name}</span>
                  <span className="font-medium text-red-600">{s.average_score?.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="border-dashed">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
          Not Yet Available
        </h3>
        <p className="text-sm text-gray-500">
          The backend&apos;s teacher dashboard endpoint does not currently expose per-lesson difficulty
          metrics or per-quiz failure rates (no such aggregation exists in
          <code className="mx-1 rounded bg-gray-100 px-1 py-0.5 text-xs">TeacherDashboardController</code>
          or elsewhere in the API). &quot;Most difficult lessons&quot; and &quot;most failed quizzes&quot;
          would need a new backend aggregate endpoint to support.
        </p>
      </Card>
    </div>
  );
}
