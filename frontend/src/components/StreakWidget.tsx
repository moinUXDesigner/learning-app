import { Card } from './Card';

interface StreakWidgetProps {
  streaksByCourse: Record<string, number>;
  courseTitleById?: Record<string, string>;
}

/** Displays per-course streak counts (StreakService is scoped per-course, not global). */
export function StreakWidget({ streaksByCourse, courseTitleById = {} }: StreakWidgetProps) {
  const entries = Object.entries(streaksByCourse);

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        Current Streaks
      </h3>
      {entries.length === 0 ? (
        <p className="text-sm text-gray-500">No active streaks yet — complete a daily task to start one.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([courseId, streak]) => (
            <li key={courseId} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">
                {courseTitleById[courseId] ?? `Course #${courseId}`}
              </span>
              <span className="flex items-center gap-1 font-semibold text-orange-600">
                {streak} <span aria-hidden>🔥</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
