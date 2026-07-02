import { useTeacherDashboard } from '../../api/hooks/useTeacher';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';

/**
 * Derived entirely from GET /api/teacher/dashboard's `student_progress`
 * array (per-student submission_count/completed_count/average_score across
 * this teacher's courses) — no separate endpoint exists for this, and the
 * task brief explicitly allows deriving from the dashboard/submissions data
 * rather than inventing a new endpoint.
 */
export function StudentProgress() {
  const { data, isLoading, error } = useTeacherDashboard();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading student progress…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load student progress. Please try again.</p>;
  }

  const inactiveIds = new Set(data.inactive_students.map((s) => s.id));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Student Progress</h1>

      <Card>
        {data.student_progress.length === 0 ? (
          <p className="text-sm text-gray-500">No student submissions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="py-2 pr-3">Student</th>
                  <th className="py-2 pr-3">Completion</th>
                  <th className="py-2 pr-3">Avg Score</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.student_progress.map((row) => {
                  const percent =
                    row.submission_count > 0 ? (row.completed_count / row.submission_count) * 100 : 0;
                  const isInactive = inactiveIds.has(row.student_id);
                  return (
                    <tr key={row.student_id}>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-gray-800">{row.student.name}</p>
                        <p className="text-xs text-gray-400">{row.student.email}</p>
                      </td>
                      <td className="w-48 py-2 pr-3">
                        <ProgressBar percent={percent} />
                        <p className="mt-1 text-xs text-gray-400">
                          {row.completed_count}/{row.submission_count} completed
                        </p>
                      </td>
                      <td className="py-2 pr-3">
                        {row.average_score !== null ? row.average_score.toFixed(1) : '—'}
                      </td>
                      <td className="py-2 pr-3">
                        {isInactive ? (
                          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            Inactive
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Course-wise Completion
        </h3>
        {data.course_completion.length === 0 ? (
          <p className="text-sm text-gray-500">No course completion data yet.</p>
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
    </div>
  );
}
