import { Link, useParams } from 'react-router-dom';
import {
  useCourse,
  useCourseLearningPlans,
  useCourseModules,
  useLearningPlanDailyTasks,
  useModuleLessons,
} from '../../api/hooks/useCourses';
import { Card } from '../../components/Card';
import { Timeline } from '../../components/Timeline';
import type { TimelineNode } from '../../components/Timeline';
import type { Module } from '../../types';

/**
 * A course has two parallel structures: Modules -> Lessons (the content
 * tree), and LearningPlans -> DailyTasks (the day-by-day schedule, each
 * DailyTask optionally pointing back at a module_id/lesson_id). This page
 * renders modules as the primary timeline spine, nesting each module's
 * lessons plus any daily tasks scoped to that module underneath it. Daily
 * tasks with no module_id (e.g. quiz-prep tasks) are shown in a trailing
 * "General Tasks" section.
 */
export function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(courseId);
  const { data: modules, isLoading: modulesLoading } = useCourseModules(courseId);
  const { data: learningPlans } = useCourseLearningPlans(courseId);
  const primaryPlanId = learningPlans?.[0]?.id;
  const { data: dailyTasks } = useLearningPlanDailyTasks(primaryPlanId);

  if (courseLoading || modulesLoading) {
    return <p className="text-sm text-gray-500">Loading course…</p>;
  }

  if (!course) {
    return <p className="text-sm text-red-600">Course not found.</p>;
  }

  const tasksByModule = new Map<number, typeof dailyTasks>();
  const generalTasks = (dailyTasks ?? []).filter((t) => t.module_id === null);
  for (const task of dailyTasks ?? []) {
    if (task.module_id === null) continue;
    const list = tasksByModule.get(task.module_id) ?? [];
    list.push(task);
    tasksByModule.set(task.module_id, list);
  }

  const nodes: TimelineNode[] = (modules ?? []).map((module: Module) => ({
    id: module.id,
    title: module.title,
    subtitle: module.description ?? undefined,
    content: <ModuleTasks moduleId={module.id} tasks={tasksByModule.get(module.id) ?? []} />,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">{course.title}</h1>
        <p className="mt-1 text-sm text-gray-500">{course.description}</p>
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Curriculum</h3>
        {nodes.length === 0 ? (
          <p className="text-sm text-gray-500">This course has no modules yet.</p>
        ) : (
          <Timeline nodes={nodes} />
        )}
      </Card>

      {generalTasks.length > 0 && (
        <Card>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">General Tasks</h3>
          <TaskList tasks={generalTasks} />
        </Card>
      )}
    </div>
  );
}

function ModuleTasks({ moduleId, tasks }: { moduleId: number; tasks: NonNullable<ReturnType<typeof useLearningPlanDailyTasks>['data']> }) {
  const { data: lessons } = useModuleLessons(moduleId);

  return (
    <div className="space-y-3">
      {lessons && lessons.length > 0 && (
        <ul className="space-y-1">
          {lessons.map((lesson) => (
            <li key={lesson.id}>
              <Link
                to={`/student/lesson-player/${lesson.id}`}
                className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-indigo-700 hover:bg-indigo-50"
              >
                <span aria-hidden>▶</span> {lesson.title}
                {lesson.estimated_minutes && (
                  <span className="text-xs text-gray-400">({lesson.estimated_minutes} min)</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > 0 && <TaskList tasks={tasks} />}
    </div>
  );
}

function TaskList({ tasks }: { tasks: NonNullable<ReturnType<typeof useLearningPlanDailyTasks>['data']> }) {
  return (
    <ul className="space-y-1">
      {tasks.map((task) => (
        <li key={task.id}>
          <Link
            to={`/student/task-submission/${task.id}`}
            className="flex items-center justify-between rounded-lg px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
          >
            <span>
              Day {task.day_number}: {task.title}
            </span>
            <span className="text-xs font-medium text-gray-400">{task.points} pts</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
