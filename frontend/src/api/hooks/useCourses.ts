import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { Course, DailyTask, LearningPlan, Lesson, Module } from '../../types';

/** Courses assigned to the authenticated student (GET /api/student/courses). */
export function useStudentCourses() {
  return useQuery({
    queryKey: ['student', 'courses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Course>>('/api/student/courses');
      return data.data;
    },
  });
}

/**
 * All courses visible to the authenticated user (GET /api/courses).
 * NOT filtered by creator server-side (CourseController::index has no
 * created_by query param — checked) — org-scoped only, via the backend's
 * OrganizationScope global scope. Teacher pages (e.g. MyCourses) must
 * filter client-side by `course.created_by === user.id`.
 */
export function useAllCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Course>>('/api/courses');
      return data.data;
    },
  });
}

export interface CoursePayload {
  title: string;
  description?: string | null;
  category?: string | null;
  difficulty_level?: string | null;
  duration_days?: number | null;
  [key: string]: unknown;
}

/** POST /api/courses — creates a Draft-status course owned by the caller. */
export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CoursePayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Course>('/api/courses', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

/** PUT /api/courses/{course} */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      payload,
    }: {
      courseId: number | string;
      payload: Partial<CoursePayload>;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.put<Course>(`/api/courses/${courseId}`, payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', variables.courseId] });
    },
  });
}

/**
 * Course approval-workflow transitions: submit-approval / approve / reject
 * / publish / archive. See backend CourseWorkflowService for the legal
 * transition graph — this hook just POSTs to the right action endpoint and
 * lets the backend enforce/report legality (422 with a message on an
 * illegal transition).
 */
export type CourseWorkflowAction = 'submit-approval' | 'approve' | 'reject' | 'publish' | 'archive';

export function useCourseWorkflowAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      action,
      reason,
    }: {
      courseId: number | string;
      action: CourseWorkflowAction;
      reason?: string;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<Course>(
        `/api/courses/${courseId}/${action}`,
        action === 'reject' ? { reason } : undefined,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCourse(courseId: number | string | undefined) {
  return useQuery({
    queryKey: ['courses', courseId],
    enabled: courseId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Course>(`/api/courses/${courseId}`);
      return data;
    },
  });
}

export function useCourseModules(courseId: number | string | undefined) {
  return useQuery({
    queryKey: ['courses', courseId, 'modules'],
    enabled: courseId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Module>>(`/api/courses/${courseId}/modules`);
      return data.data;
    },
  });
}

export function useModuleLessons(moduleId: number | string | undefined) {
  return useQuery({
    queryKey: ['modules', moduleId, 'lessons'],
    enabled: moduleId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<Lesson>>(`/api/modules/${moduleId}/lessons`);
      return data.data;
    },
  });
}

export function useLesson(lessonId: number | string | undefined) {
  return useQuery({
    queryKey: ['lessons', lessonId],
    enabled: lessonId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Lesson & { module?: Module }>(`/api/lessons/${lessonId}`);
      return data;
    },
  });
}

export function useCourseLearningPlans(courseId: number | string | undefined) {
  return useQuery({
    queryKey: ['courses', courseId, 'learning-plans'],
    enabled: courseId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<LearningPlan>>(
        `/api/courses/${courseId}/learning-plans`,
      );
      return data.data;
    },
  });
}

export function useLearningPlanDailyTasks(learningPlanId: number | string | undefined) {
  return useQuery({
    queryKey: ['learning-plans', learningPlanId, 'daily-tasks'],
    enabled: learningPlanId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<DailyTask>>(
        `/api/learning-plans/${learningPlanId}/daily-tasks`,
      );
      return data.data;
    },
  });
}

export function useDailyTask(dailyTaskId: number | string | undefined) {
  return useQuery({
    queryKey: ['daily-tasks', dailyTaskId],
    enabled: dailyTaskId !== undefined,
    queryFn: async () => {
      const { data } = await apiClient.get<DailyTask>(`/api/daily-tasks/${dailyTaskId}`);
      return data;
    },
  });
}
