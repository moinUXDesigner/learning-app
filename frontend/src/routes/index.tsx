import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { Stub } from './pages/Stub';
import { DashboardShell } from '../layouts/DashboardShell';

import { Landing } from '../pages/public/Landing';
import { Login } from '../pages/public/Login';
import { Register } from '../pages/public/Register';
import { ForgotPassword } from '../pages/public/ForgotPassword';
import { CertificateVerify } from '../pages/public/CertificateVerify';

import { Dashboard } from '../pages/common/Dashboard';
import { Profile } from '../pages/common/Profile';
import { Notifications } from '../pages/common/Notifications';

import { StudentDashboard } from '../pages/student/StudentDashboard';
import { TodaysTasks } from '../pages/student/TodaysTasks';
import { MyCourses as StudentMyCourses } from '../pages/student/MyCourses';
import { CourseDetail } from '../pages/student/CourseDetail';
import { LessonPlayer } from '../pages/student/LessonPlayer';
import { TaskSubmission } from '../pages/student/TaskSubmission';
import { QuizAttempt } from '../pages/student/QuizAttempt';
import { Progress } from '../pages/student/Progress';
import { Scores } from '../pages/student/Scores';
import { Certificates } from '../pages/student/Certificates';

import { TeacherDashboard } from '../pages/teacher/TeacherDashboard';
import { MyCourses as TeacherMyCourses } from '../pages/teacher/MyCourses';
import { CreateCourse } from '../pages/teacher/CreateCourse';
import { CourseBuilder } from '../pages/teacher/CourseBuilder';
import { LearningPlanBuilder } from '../pages/teacher/LearningPlanBuilder';
import { TaskBuilder } from '../pages/teacher/TaskBuilder';
import { AssignCourse } from '../pages/teacher/AssignCourse';
import { StudentProgress } from '../pages/teacher/StudentProgress';
import { ReviewSubmissions } from '../pages/teacher/ReviewSubmissions';
import { Analytics } from '../pages/teacher/Analytics';

import { AdminDashboard } from '../pages/org-admin/AdminDashboard';
import { Teachers } from '../pages/org-admin/Teachers';
import { Students } from '../pages/org-admin/Students';
import { Courses as OrgAdminCourses } from '../pages/org-admin/Courses';
import { CourseApproval } from '../pages/org-admin/CourseApproval';
import { Batches } from '../pages/org-admin/Batches';
import { Reports } from '../pages/org-admin/Reports';

import { SaaSDashboard } from '../pages/super-admin/SaaSDashboard';
import { Organizations } from '../pages/super-admin/Organizations';
import { SubscriptionPlans } from '../pages/super-admin/SubscriptionPlans';
import { PlatformAnalytics } from '../pages/super-admin/PlatformAnalytics';

// Central route table for LearnTrack SaaS.
//
// Every route group (public/common/student/teacher/org-admin/super-admin)
// now renders real page components (Phase 8 complete). Route PATHS and
// role-guarding structure are final.
export function AppRoutes() {
  return (
    <Routes>
      {/* ---------------------------------------------------------------- */}
      {/* Public routes                                                     */}
      {/* ---------------------------------------------------------------- */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify/:certificateNumber" element={<CertificateVerify />} />
      <Route path="/not-authorized" element={<Stub name="Not Authorized" />} />

      {/* ---------------------------------------------------------------- */}
      {/* Common routes (any authenticated role)                           */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Super Admin routes                                                */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/super-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DashboardShell>
              <SaaSDashboard />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/organizations"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DashboardShell>
              <Organizations />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/subscription-plans"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DashboardShell>
              <SubscriptionPlans />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DashboardShell>
              <PlatformAnalytics />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Org Admin routes                                                  */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/org-admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <AdminDashboard />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/teachers"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <Teachers />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/students"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <Students />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/courses"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <OrgAdminCourses />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/course-approval"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <CourseApproval />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/batches"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <Batches />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/org-admin/reports"
        element={
          <ProtectedRoute allowedRoles={['org_admin']}>
            <DashboardShell>
              <Reports />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Teacher routes                                                    */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <TeacherDashboard />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/my-courses"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <TeacherMyCourses />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/create-course"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <CreateCourse />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/course-builder/:courseId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <CourseBuilder />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/learning-plan-builder/:courseId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <LearningPlanBuilder />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/task-builder/:courseId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <TaskBuilder />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/assign-course/:courseId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <AssignCourse />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/student-progress"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <StudentProgress />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/review-submissions"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <ReviewSubmissions />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/analytics"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardShell>
              <Analytics />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Student routes                                                    */}
      {/* ---------------------------------------------------------------- */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <StudentDashboard />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/todays-tasks"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <TodaysTasks />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-courses"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <StudentMyCourses />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/course-detail/:courseId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <CourseDetail />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/lesson-player/:lessonId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <LessonPlayer />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/task-submission/:taskId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <TaskSubmission />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz-attempt/:quizId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <QuizAttempt />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <Progress />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/scores"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <Scores />
            </DashboardShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/certificates"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <DashboardShell>
              <Certificates />
            </DashboardShell>
          </ProtectedRoute>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Fallback                                                          */}
      {/* ---------------------------------------------------------------- */}
      <Route path="*" element={<Stub name="404 Not Found" />} />
    </Routes>
  );
}
