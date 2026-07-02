import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ensureCsrfCookie } from '../client';
import type { Paginated } from '../pagination';
import type { CourseAssignment, TaskSubmission, TeacherDashboardData } from '../../types';

/** GET /api/teacher/dashboard — see TeacherDashboardController::index for exact keys. */
export function useTeacherDashboard() {
  return useQuery({
    queryKey: ['teacher', 'dashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get<TeacherDashboardData>('/api/teacher/dashboard');
      return data;
    },
  });
}

/**
 * Submissions for courses owned by the authenticated teacher
 * (GET /api/teacher/submissions). `status` supports the backend's special
 * `pending` alias (Submitted OR Late) in addition to literal TaskStatus
 * values — see TaskSubmissionController::teacherSubmissions.
 */
export function useTeacherSubmissions(status?: string) {
  return useQuery({
    queryKey: ['teacher', 'submissions', status ?? 'all'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<TaskSubmission>>('/api/teacher/submissions', {
        params: status ? { status } : undefined,
      });
      return data.data;
    },
  });
}

export interface ReviewSubmissionPayload {
  score: number;
  feedback?: string | null;
  status?: 'completed' | 'rejected';
}

/** POST /api/submissions/{submission}/review */
export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      payload,
    }: {
      submissionId: number | string;
      payload: ReviewSubmissionPayload;
    }) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<TaskSubmission>(
        `/api/submissions/${submissionId}/review`,
        payload,
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'submissions'] });
      queryClient.invalidateQueries({ queryKey: ['teacher', 'dashboard'] });
    },
  });
}

/** GET /api/teacher/assignments — the authenticated teacher's own course assignments. */
export function useTeacherAssignments() {
  return useQuery({
    queryKey: ['teacher', 'assignments'],
    queryFn: async () => {
      const { data } = await apiClient.get<Paginated<CourseAssignment>>('/api/teacher/assignments');
      return data.data;
    },
  });
}

export interface CreateAssignmentPayload {
  course_id: number;
  student_id?: number | null;
  batch_id?: number | null;
  start_date: string;
  end_date?: string | null;
  status?: string;
}

/** POST /api/course-assignments */
export function useCreateCourseAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateAssignmentPayload) => {
      await ensureCsrfCookie();
      const { data } = await apiClient.post<CourseAssignment>('/api/course-assignments', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher', 'assignments'] });
    },
  });
}
