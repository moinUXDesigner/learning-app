import { useQueries, useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Paginated } from '../pagination';
import type { Course, DailyTask, LearningPlan } from '../../types';

/**
 * There is no dedicated "today's tasks" endpoint on the backend (checked
 * routes/api.php — only /api/student/courses, /api/courses/{id}/learning-plans,
 * and /api/learning-plans/{id}/daily-tasks exist). So this hook derives
 * "today's tasks" client-side:
 *   1. fetch the student's assigned courses
 *   2. for each course, fetch its learning plan(s)
 *   3. for each learning plan, fetch its daily tasks
 *   4. flatten and attach course context, for the UI to filter/display
 *      (TodaysTasks.tsx filters this list down to due-today/overdue/soon).
 * This is fine at demo scale (one or two assigned courses) but would need
 * a real backend aggregate endpoint at scale.
 */
export function useAllAssignedDailyTasks() {
  const coursesQuery = useQuery({
    queryKey: ['student', 'courses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Course>>('/api/student/courses');
      return data.data;
    },
  });

  const courses = coursesQuery.data ?? [];

  const planQueries = useQueries({
    queries: courses.map((course) => ({
      queryKey: ['courses', course.id, 'learning-plans'],
      queryFn: async () => {
        const { data } = await apiClient.get<Paginated<LearningPlan>>(
          `/api/courses/${course.id}/learning-plans`,
        );
        return data.data;
      },
      enabled: coursesQuery.isSuccess,
    })),
  });

  const allPlans = planQueries.flatMap((q) => q.data ?? []);
  const plansLoaded = planQueries.length === 0 || planQueries.every((q) => q.isSuccess || q.isError);

  const taskQueries = useQueries({
    queries: allPlans.map((plan) => ({
      queryKey: ['learning-plans', plan.id, 'daily-tasks'],
      queryFn: async () => {
        const { data } = await apiClient.get<Paginated<DailyTask>>(
          `/api/learning-plans/${plan.id}/daily-tasks`,
        );
        return data.data.map((task) => ({ ...task, _courseTitle: findCourseTitle(courses, task.course_id) }));
      },
      enabled: plansLoaded,
    })),
  });

  const tasks = taskQueries.flatMap((q) => q.data ?? []);
  const isLoading =
    coursesQuery.isLoading ||
    planQueries.some((q) => q.isLoading) ||
    taskQueries.some((q) => q.isLoading);
  const isError = coursesQuery.isError;

  return { tasks, courses, isLoading, isError };
}

function findCourseTitle(courses: Course[], courseId: number): string {
  return courses.find((c) => c.id === courseId)?.title ?? `Course #${courseId}`;
}

export type DailyTaskWithCourse = DailyTask & { _courseTitle: string };
