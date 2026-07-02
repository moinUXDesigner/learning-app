import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllAssignedDailyTasks } from '../../api/hooks/useTasks';
import { useStudentSubmissions } from '../../api/hooks/useSubmissions';
import { Checklist } from '../../components/Checklist';
import type { ChecklistItemData } from '../../components/Checklist';
import { Card } from '../../components/Card';

/**
 * There is no dedicated "today's tasks" endpoint (see api/hooks/useTasks.ts
 * docblock) — this page fetches all daily tasks across the student's
 * assigned courses' learning plans, then filters client-side into three
 * buckets: overdue, due today, and due soon (next 7 days). Tasks with no
 * due_time are shown in a fourth "no due date" bucket.
 */
export function TodaysTasks() {
  const { tasks, isLoading, isError } = useAllAssignedDailyTasks();
  const { data: submissions } = useStudentSubmissions();
  const navigate = useNavigate();

  const submittedTaskIds = useMemo(
    () => new Set((submissions ?? []).map((s) => s.daily_task_id)),
    [submissions],
  );

  const buckets = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    const weekFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

    const overdue: typeof tasks = [];
    const dueToday: typeof tasks = [];
    const dueSoon: typeof tasks = [];
    const noDueDate: typeof tasks = [];

    for (const task of tasks) {
      if (!task.due_time) {
        noDueDate.push(task);
        continue;
      }
      const due = new Date(task.due_time);
      if (due < startOfToday && !submittedTaskIds.has(task.id)) {
        overdue.push(task);
      } else if (due >= startOfToday && due < endOfToday) {
        dueToday.push(task);
      } else if (due >= endOfToday && due < weekFromNow) {
        dueSoon.push(task);
      }
    }

    return { overdue, dueToday, dueSoon, noDueDate };
  }, [tasks, submittedTaskIds]);

  function toChecklistItems(list: typeof tasks): ChecklistItemData[] {
    return list.map((task) => ({
      id: task.id,
      title: task.title,
      subtitle: `${task._courseTitle} • Day ${task.day_number} • ${task.points} XP`,
      done: submittedTaskIds.has(task.id),
      onClick: () => navigate(`/student/task-submission/${task.id}`),
    }));
  }

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your tasks…</p>;
  }

  if (isError) {
    return <p className="text-sm text-red-600">Couldn&apos;t load your tasks. Please try again.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-800">Today&apos;s Tasks</h1>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-red-600">Overdue</h3>
        <Checklist items={toChecklistItems(buckets.overdue)} emptyMessage="Nothing overdue. Nice work!" />
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-indigo-600">Due Today</h3>
        <Checklist items={toChecklistItems(buckets.dueToday)} emptyMessage="Nothing due today." />
      </Card>

      <Card>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Due Soon (7 days)</h3>
        <Checklist items={toChecklistItems(buckets.dueSoon)} emptyMessage="Nothing due in the next 7 days." />
      </Card>

      {buckets.noDueDate.length > 0 && (
        <Card>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">No Due Date</h3>
          <Checklist items={toChecklistItems(buckets.noDueDate)} />
        </Card>
      )}
    </div>
  );
}
