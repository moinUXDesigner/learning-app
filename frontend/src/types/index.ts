// Shared domain types mirrored from the backend (Laravel 11 + Sanctum).
// Keep these in sync with the backend's API resources as new fields are added.

/** Backend role enum values (snake_case strings). */
export type Role = 'super_admin' | 'org_admin' | 'teacher' | 'student';

/** Backend user status enum — adjust if the backend adds/renames values. */
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface Organization {
  id: number;
  name: string;
  logo: string | null;
  domain: string | null;
  subscription_plan_id: number | null;
  status: string | null;
  subscription_plan?: SubscriptionPlan | null;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

/** Backend App\Models\SubscriptionPlan — super_admin-managed billing tiers. */
export interface SubscriptionPlan {
  id: number;
  name: string;
  price: string | number;
  max_users: number | null;
  max_courses: number | null;
  features: string[] | null;
  created_at?: string;
  updated_at?: string;
}

/** Backend App\Models\Batch. */
export interface Batch {
  id: number;
  organization_id: number;
  teacher_id: number | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  organization?: Organization;
  teacher?: User | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  organization_id: number | null;
  organization?: Organization;
  status: UserStatus;
}

// ---------------------------------------------------------------------------
// Course / curriculum domain types (mirrored from backend Eloquent models —
// see backend/app/Models/*.php for the authoritative fillable/cast lists).
// ---------------------------------------------------------------------------

export type CourseStatus =
  | 'draft'
  | 'submitted_for_approval'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived';

export interface Course {
  id: number;
  organization_id: number;
  created_by: number;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string | null;
  duration_days: number | null;
  status: CourseStatus;
  approved_by: number | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Module {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  module_id: number;
  title: string;
  content: string | null;
  video_url: string | null;
  video_start_seconds: number | null;
  video_end_seconds: number | null;
  estimated_minutes: number | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface LearningPlan {
  id: number;
  course_id: number;
  title: string;
  duration_days: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Backend App\Enums\SubmissionType */
export type SubmissionType = 'file' | 'text' | 'screenshot' | 'url' | 'github_link';

/** Backend App\Enums\TaskStatus */
export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'completed'
  | 'rejected'
  | 'late';

export interface DailyTask {
  id: number;
  learning_plan_id: number;
  course_id: number;
  module_id: number | null;
  lesson_id: number | null;
  day_number: number;
  title: string;
  description: string | null;
  task_type: string;
  estimated_minutes: number | null;
  points: number;
  due_time: string | null;
  difficulty: string | null;
  completion_criteria: string | null;
  resource_link: string | null;
  video_link: string | null;
  submission_type: SubmissionType;
  created_at: string;
  updated_at: string;
}

export interface TaskSubmission {
  id: number;
  daily_task_id: number;
  student_id: number;
  submission_type: SubmissionType;
  text_answer: string | null;
  file_path: string | null;
  url: string | null;
  github_url: string | null;
  status: TaskStatus;
  submitted_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  score: number | null;
  feedback: string | null;
  daily_task?: DailyTask;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: number;
  course_id: number;
  lesson_id: number | null;
  title: string;
  total_marks: number;
  pass_marks: number;
  questions?: Question[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: string;
  options: string[] | null;
  /** Stripped to null for students by QuestionResource. */
  correct_answer: string | null;
  marks: number;
  created_at: string;
  updated_at: string;
}

export interface QuizAttemptAnswer {
  id: number;
  question_id: number;
  submitted_answer: string | null;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  status: 'in_progress' | 'pass' | 'fail';
  attempted_at: string;
  quiz?: Quiz;
  answers?: QuizAttemptAnswer[];
}

export interface LessonProgress {
  id: number;
  student_id: number;
  lesson_id: number;
  watched_seconds: number;
  completed_at: string | null;
}

export interface Certificate {
  id: number;
  student_id: number;
  course_id: number;
  certificate_number: string;
  issued_at: string;
  verification_url: string | null;
  course?: Course;
}

/** GET /api/certificates/verify/{certificateNumber} (public) response shape. */
export interface CertificateVerification {
  certificate_number: string;
  issued_at: string;
  verification_url: string | null;
  student_name: string | null;
  course_title: string | null;
}

/** GET /api/student/dashboard response shape (StudentDashboardController::index). */
export interface StudentDashboardData {
  course_completion_percent: number;
  daily_task_completion_count: number;
  total_daily_tasks: number;
  quiz_scores: { id: number; quiz_id: number; score: number; status: string }[];
  assignment_scores: number[];
  total_xp: number;
  streaks_by_course: Record<string, number>;
  late_submission_count: number;
}

/** GET /api/teacher/dashboard response shape (TeacherDashboardController::index). */
export interface TeacherDashboardData {
  pending_reviews_count: number;
  average_score: number | null;
  student_progress: {
    student_id: number;
    submission_count: number;
    completed_count: number;
    average_score: number | null;
    student: { id: number; name: string; email: string };
  }[];
  course_completion: {
    course_id: number;
    submission_count: number;
    completed_count: number;
    course: { id: number; title: string };
  }[];
  inactive_students: { id: number; name: string; email: string }[];
  inactive_days_threshold: number;
}

/**
 * GET /api/admin/dashboard response shape (AdminDashboardController::index).
 * Same shape for org_admin and super_admin — org_admin's numbers are scoped
 * to their own organization_id (explicit `where` for user counts, the
 * global OrganizationScope for course counts), while super_admin sees
 * platform-wide totals across all organizations. There is no
 * per-organization breakdown in this payload for super_admin — see
 * SaaSDashboard.tsx / PlatformAnalytics.tsx for the documented gap.
 */
export interface AdminDashboardData {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_courses: number;
  /** Keyed by CourseStatus value, e.g. { draft: 3, published: 5 }. */
  course_status_breakdown: Partial<Record<CourseStatus, number>>;
  active_students_count: number;
  completion_rate: number;
}

/** CourseAssignment model — see backend App\Models\CourseAssignment. */
export interface CourseAssignment {
  id: number;
  course_id: number;
  teacher_id: number;
  student_id: number | null;
  batch_id: number | null;
  start_date: string;
  end_date: string | null;
  status: string;
  course?: Course;
  teacher?: User;
  student?: User;
  batch?: { id: number; name: string } | null;
  created_at: string;
  updated_at: string;
}
