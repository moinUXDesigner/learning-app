import { Link } from 'react-router-dom';
import { useStudentDashboard } from '../../api/hooks/useDashboard';
import { useStudentCourses } from '../../api/hooks/useCourses';
import { ScoreXpCard } from '../../components/ScoreXpCard';
import { StreakWidget } from '../../components/StreakWidget';
import { ProgressBar } from '../../components/ProgressBar';
import { Card } from '../../components/Card';

export function StudentDashboard() {
  const { data, isLoading, error } = useStudentDashboard();
  const { data: courses } = useStudentCourses();

  const courseTitleById = Object.fromEntries((courses ?? []).map((c) => [String(c.id), c.title]));

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your dashboard…</p>;
  }

  if (error || !data) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your dashboard. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">My Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ScoreXpCard
          totalXp={data.total_xp}
          completedTasks={data.daily_task_completion_count}
          totalTasks={data.total_daily_tasks}
          lateSubmissions={data.late_submission_count}
        />
        <StreakWidget streaksByCourse={data.streaks_by_course} courseTitleById={courseTitleById} />
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Overall Course Completion
        </h3>
        <ProgressBar percent={data.course_completion_percent} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">My Courses</h3>
          <Link to="/student/my-courses" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
            View all
          </Link>
        </div>
        {!courses || courses.length === 0 ? (
          <p className="text-sm text-gray-500">You haven&apos;t been assigned any courses yet.</p>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  to={`/student/course-detail/${course.id}`}
                  className="block rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-700 hover:border-indigo-200 hover:bg-indigo-50"
                >
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/student/todays-tasks"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-indigo-300"
        >
          <span className="text-sm font-semibold text-indigo-700">Today&apos;s Tasks</span>
        </Link>
        <Link
          to="/student/certificates"
          className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm hover:border-indigo-300"
        >
          <span className="text-sm font-semibold text-indigo-700">My Certificates</span>
        </Link>
      </div>
    </div>
  );
}
