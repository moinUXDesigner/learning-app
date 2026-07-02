import { http, HttpResponse } from 'msw';
import type { User } from '../../types';

// Base host used by apiClient (see src/api/client.ts) — VITE_API_URL is
// unset in the test environment, so apiClient falls back to this default.
const API_HOST = 'http://localhost:8000';

export const mockStudentUser: User = {
  id: 1,
  name: 'Alex Student',
  email: 'alex@example.com',
  role: 'student',
  organization_id: 1,
  status: 'active',
};

export const mockTeacherUser: User = {
  id: 2,
  name: 'Taylor Teacher',
  email: 'taylor@example.com',
  role: 'teacher',
  organization_id: 1,
  status: 'active',
};

export const mockAdminUser: User = {
  id: 3,
  name: 'Ada Admin',
  email: 'ada@example.com',
  role: 'org_admin',
  organization_id: 1,
  status: 'active',
};

/**
 * Shared/default handlers wired up in src/tests/setup.ts via
 * `server.listen()`. Individual tests override these per-case with
 * `server.use(...)` (e.g. to simulate a login failure or a specific
 * dashboard payload).
 *
 * Response shapes below are inferred directly from the calling code (not
 * guessed): authStore.ts's `login`/`fetchMe` both do
 * `apiClient.get<{ user: User }>('/api/me')` and read `data.user` — so
 * /api/me must return `{ user: {...} }`, not a bare user object.
 */
export const handlers = [
  http.get(`${API_HOST}/sanctum/csrf-cookie`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API_HOST}/api/login`, () => {
    return HttpResponse.json({ message: 'Logged in.' }, { status: 200 });
  }),

  http.post(`${API_HOST}/api/logout`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_HOST}/api/me`, () => {
    return HttpResponse.json({ user: mockStudentUser }, { status: 200 });
  }),

  http.get(`${API_HOST}/api/student/dashboard`, () => {
    return HttpResponse.json({
      course_completion_percent: 42,
      daily_task_completion_count: 5,
      total_daily_tasks: 12,
      quiz_scores: [],
      assignment_scores: [],
      total_xp: 350,
      streaks_by_course: { '1': 4 },
      late_submission_count: 1,
    });
  }),

  http.get(`${API_HOST}/api/teacher/dashboard`, () => {
    return HttpResponse.json({
      pending_reviews_count: 3,
      average_score: 88.5,
      student_progress: [],
      course_completion: [],
      inactive_students: [],
      inactive_days_threshold: 7,
    });
  }),

  http.get(`${API_HOST}/api/admin/dashboard`, () => {
    return HttpResponse.json({
      total_users: 100,
      total_teachers: 10,
      total_students: 85,
      total_courses: 20,
      course_status_breakdown: { draft: 2, published: 18 },
      active_students_count: 60,
      completion_rate: 75.5,
    });
  }),

  http.get(`${API_HOST}/api/student/courses`, () => {
    return HttpResponse.json({
      current_page: 1,
      data: [],
      first_page_url: null,
      from: null,
      last_page: 1,
      last_page_url: null,
      links: [],
      next_page_url: null,
      path: '',
      per_page: 15,
      prev_page_url: null,
      to: null,
      total: 0,
    });
  }),

  http.get(`${API_HOST}/api/student/submissions`, () => {
    return HttpResponse.json({
      current_page: 1,
      data: [],
      first_page_url: null,
      from: null,
      last_page: 1,
      last_page_url: null,
      links: [],
      next_page_url: null,
      path: '',
      per_page: 15,
      prev_page_url: null,
      to: null,
      total: 0,
    });
  }),
];
