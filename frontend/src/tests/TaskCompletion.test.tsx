import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { TodaysTasks } from '../pages/student/TodaysTasks';
import { renderWithProviders } from './test-utils';
import { server } from './setup';

const API_HOST = 'http://localhost:8000';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const course = {
  id: 1,
  organization_id: 1,
  created_by: 2,
  title: 'Intro to Cybersecurity',
  description: null,
  category: null,
  difficulty_level: null,
  duration_days: 30,
  status: 'published',
  approved_by: null,
  approved_at: null,
  rejection_reason: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const learningPlan = {
  id: 10,
  course_id: 1,
  title: 'Plan A',
  duration_days: 30,
  description: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

// A task due "today" so it lands in the "Due Today" bucket regardless of
// when this test runs (TodaysTasks.tsx buckets by comparing to `new Date()`
// at render time — see its useMemo).
function dueTodayTask(id: number) {
  const now = new Date();
  const dueToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return {
    id,
    learning_plan_id: 10,
    course_id: 1,
    module_id: null,
    lesson_id: null,
    day_number: 3,
    title: 'Set up a strong password policy',
    description: null,
    task_type: 'reading',
    estimated_minutes: 20,
    points: 15,
    due_time: dueToday.toISOString(),
    difficulty: 'easy',
    completion_criteria: null,
    resource_link: null,
    video_link: null,
    submission_type: 'text',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
}

function paginated<T>(data: T[]) {
  return {
    current_page: 1,
    data,
    first_page_url: null,
    from: data.length ? 1 : null,
    last_page: 1,
    last_page_url: null,
    links: [],
    next_page_url: null,
    path: '',
    per_page: 15,
    prev_page_url: null,
    to: data.length || null,
    total: data.length,
  };
}

describe('TodaysTasks — marking a task complete', () => {
  beforeEach(() => {
    mockNavigate.mockClear();

    server.use(
      http.get(`${API_HOST}/api/student/courses`, () => HttpResponse.json(paginated([course]))),
      http.get(`${API_HOST}/api/courses/1/learning-plans`, () =>
        HttpResponse.json(paginated([learningPlan])),
      ),
      http.get(`${API_HOST}/api/learning-plans/10/daily-tasks`, () =>
        HttpResponse.json(paginated([dueTodayTask(99)])),
      ),
      http.get(`${API_HOST}/api/student/submissions`, () => HttpResponse.json(paginated([]))),
    );
  });

  it('renders the fetched daily task in the checklist', async () => {
    renderWithProviders(<TodaysTasks />);

    expect(await screen.findByText('Set up a strong password policy')).toBeInTheDocument();
    expect(screen.getByText(/Intro to Cybersecurity • Day 3 • 15 XP/)).toBeInTheDocument();
  });

  /**
   * TodaysTasks.tsx does NOT call a "mark complete" API directly — reading
   * toChecklistItems(), each item's onClick is
   * `() => navigate('/student/task-submission/${task.id}')`. There is no
   * checkbox mutation; clicking a task row navigates to the submission
   * page, where the actual submit mutation (useSubmitTask, in
   * api/hooks/useSubmissions.ts) lives. So the correct behavior to test
   * here is navigation, not a direct API call.
   */
  it('navigates to the task submission page when a task row is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TodaysTasks />);

    const taskButton = await screen.findByRole('button', { name: /set up a strong password policy/i });
    await user.click(taskButton);

    expect(mockNavigate).toHaveBeenCalledWith('/student/task-submission/99');
  });
});
