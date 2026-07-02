import { useStudentDashboard } from '../../api/hooks/useDashboard';
import { useStudentSubmissions } from '../../api/hooks/useSubmissions';
import { Card } from '../../components/Card';

export function Scores() {
  const { data, isLoading: dashboardLoading, error: dashboardError } = useStudentDashboard();
  const { data: submissions, isLoading: submissionsLoading } = useStudentSubmissions();

  if (dashboardLoading || submissionsLoading) {
    return <p className="text-sm text-gray-500">Loading your scores…</p>;
  }

  if (dashboardError || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your scores. Please try again.</p>;
  }

  const scoredSubmissions = (submissions ?? []).filter((s) => s.score !== null);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">My Scores</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-indigo-700">{data.total_xp}</p>
          <p className="text-xs text-gray-500">Total XP</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-green-600">{data.assignment_scores.length}</p>
          <p className="text-xs text-gray-500">Graded Tasks</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-gray-700">{data.quiz_scores.length}</p>
          <p className="text-xs text-gray-500">Quiz Attempts</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-orange-500">{data.late_submission_count}</p>
          <p className="text-xs text-gray-500">Late Submissions</p>
        </Card>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Quiz Scores</h3>
        {data.quiz_scores.length === 0 ? (
          <p className="text-sm text-gray-500">No quiz attempts yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.quiz_scores.map((qs) => (
              <li key={qs.id} className="flex items-center justify-between py-2 text-sm">
                <span className="text-gray-700">Quiz #{qs.quiz_id}</span>
                <span
                  className={`font-medium ${qs.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}
                >
                  {qs.score} pts — {qs.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Task Score History
        </h3>
        {scoredSubmissions.length === 0 ? (
          <p className="text-sm text-gray-500">No graded submissions yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {scoredSubmissions.map((submission) => (
              <li key={submission.id} className="flex items-center justify-between py-2 text-sm">
                <span className="min-w-0 flex-1 truncate text-gray-700">
                  {submission.daily_task?.title ?? `Task #${submission.daily_task_id}`}
                </span>
                <span className="ml-3 shrink-0 font-medium text-gray-800">{submission.score} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
