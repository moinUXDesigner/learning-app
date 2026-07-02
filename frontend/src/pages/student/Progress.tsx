import { useStudentDashboard } from '../../api/hooks/useDashboard';
import { useStudentCourses } from '../../api/hooks/useCourses';
import { Card } from '../../components/Card';
import { ProgressBar } from '../../components/ProgressBar';
import { StreakWidget } from '../../components/StreakWidget';

export function Progress() {
  const { data, isLoading, error } = useStudentDashboard();
  const { data: courses } = useStudentCourses();

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your progress…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your progress. Please try again.</p>;
  }

  const courseTitleById = Object.fromEntries((courses ?? []).map((c) => [String(c.id), c.title]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">My Progress</h1>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Overall Completion
        </h3>
        <ProgressBar percent={data.course_completion_percent} />
        <p className="mt-3 text-sm text-gray-500">
          {data.daily_task_completion_count} of {data.total_daily_tasks} daily tasks completed
        </p>
      </Card>

      <StreakWidget streaksByCourse={data.streaks_by_course} courseTitleById={courseTitleById} />

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Per-Course Completion
        </h3>
        {!courses || courses.length === 0 ? (
          <p className="text-sm text-gray-500">No assigned courses yet.</p>
        ) : (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li key={course.id}>
                {/* The dashboard endpoint only exposes an aggregate completion
                    percent across all assigned courses, not a per-course
                    breakdown — so each course row here reuses the same
                    overall percent as an approximation until a per-course
                    metric is exposed by the backend. */}
                <ProgressBar percent={data.course_completion_percent} label={course.title} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
