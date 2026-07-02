<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BatchController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\CourseAssignmentController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\DailyTaskController;
use App\Http\Controllers\Api\LearningPlanController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\LessonProgressController;
use App\Http\Controllers\Api\ModuleController;
use App\Http\Controllers\Api\OrganizationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\StudentDashboardController;
use App\Http\Controllers\Api\SubscriptionPlanController;
use App\Http\Controllers\Api\TaskSubmissionController;
use App\Http\Controllers\Api\TeacherDashboardController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Phase 1 infra scaffolding only: route group skeletons are declared below
| so each domain area has a stable place to register routes in later
| phases. No concrete endpoints are defined yet (see Phase 2+).
|
*/

// --- Auth ---
// Public endpoints (no auth:sanctum): register/login/forgot-password/reset-password.
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// --- Certificate public verification (no auth:sanctum) ---
Route::get('/certificates/verify/{certificateNumber}', [CertificateController::class, 'verify']);

// --- Health check (no auth:sanctum) ---
Route::get('/health', function () {
    $dbOk = true;
    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
    } catch (\Throwable $e) {
        $dbOk = false;
    }

    return response()->json(['status' => 'ok', 'db' => $dbOk]);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // --- Organizations ---
    Route::prefix('organizations')->group(function () {
        Route::get('/', [OrganizationController::class, 'index']);
        Route::post('/', [OrganizationController::class, 'store']);
        Route::get('/{organization}', [OrganizationController::class, 'show']);
        Route::put('/{organization}', [OrganizationController::class, 'update']);
        Route::delete('/{organization}', [OrganizationController::class, 'destroy']);
    });

    // --- Subscription Plans (reads: any authenticated user; writes: super_admin only) ---
    Route::prefix('subscription-plans')->group(function () {
        Route::get('/', [SubscriptionPlanController::class, 'index']);
        Route::get('/{subscriptionPlan}', [SubscriptionPlanController::class, 'show']);

        Route::middleware('role:super_admin')->group(function () {
            Route::post('/', [SubscriptionPlanController::class, 'store']);
            Route::put('/{subscriptionPlan}', [SubscriptionPlanController::class, 'update']);
            Route::delete('/{subscriptionPlan}', [SubscriptionPlanController::class, 'destroy']);
        });
    });

    // --- Users ---
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
    });

    // --- Batches ---
    Route::prefix('batches')->group(function () {
        Route::get('/', [BatchController::class, 'index']);
        Route::post('/', [BatchController::class, 'store']);
        Route::get('/{batch}', [BatchController::class, 'show']);
        Route::put('/{batch}', [BatchController::class, 'update']);
        Route::delete('/{batch}', [BatchController::class, 'destroy']);
    });

    // --- Courses ---
    Route::prefix('courses')->group(function () {
        Route::get('/', [CourseController::class, 'index']);
        Route::post('/', [CourseController::class, 'store']);
        Route::get('/{course}', [CourseController::class, 'show']);
        Route::put('/{course}', [CourseController::class, 'update']);
        Route::delete('/{course}', [CourseController::class, 'destroy']);

        Route::post('/{course}/submit-approval', [CourseController::class, 'submitApproval']);
        Route::post('/{course}/approve', [CourseController::class, 'approve']);
        Route::post('/{course}/reject', [CourseController::class, 'reject']);
        Route::post('/{course}/publish', [CourseController::class, 'publish']);
        Route::post('/{course}/archive', [CourseController::class, 'archive']);

        Route::get('/{course}/modules', [ModuleController::class, 'index']);
        Route::post('/{course}/modules', [ModuleController::class, 'store']);

        Route::get('/{course}/learning-plans', [LearningPlanController::class, 'index']);
        Route::post('/{course}/learning-plans', [LearningPlanController::class, 'store']);

        Route::get('/{course}/projects', [ProjectController::class, 'index']);
        Route::post('/{course}/projects', [ProjectController::class, 'store']);
    });

    // --- Modules ---
    Route::prefix('modules')->group(function () {
        Route::get('/{module}', [ModuleController::class, 'show']);
        Route::put('/{module}', [ModuleController::class, 'update']);
        Route::delete('/{module}', [ModuleController::class, 'destroy']);

        Route::get('/{module}/lessons', [LessonController::class, 'index']);
        Route::post('/{module}/lessons', [LessonController::class, 'store']);
    });

    // --- Lessons ---
    Route::prefix('lessons')->group(function () {
        Route::get('/{lesson}', [LessonController::class, 'show']);
        Route::put('/{lesson}', [LessonController::class, 'update']);
        Route::delete('/{lesson}', [LessonController::class, 'destroy']);
    });

    // --- Learning Plans ---
    Route::prefix('learning-plans')->group(function () {
        Route::get('/{learningPlan}', [LearningPlanController::class, 'show']);
        Route::put('/{learningPlan}', [LearningPlanController::class, 'update']);
        Route::delete('/{learningPlan}', [LearningPlanController::class, 'destroy']);

        Route::get('/{learningPlan}/daily-tasks', [DailyTaskController::class, 'index']);
        Route::post('/{learningPlan}/daily-tasks', [DailyTaskController::class, 'store']);
    });

    // --- Daily Tasks ---
    Route::prefix('daily-tasks')->group(function () {
        Route::get('/{dailyTask}', [DailyTaskController::class, 'show']);
        Route::put('/{dailyTask}', [DailyTaskController::class, 'update']);
        Route::delete('/{dailyTask}', [DailyTaskController::class, 'destroy']);
    });

    // --- Projects ---
    Route::prefix('projects')->group(function () {
        Route::get('/{project}', [ProjectController::class, 'show']);
        Route::put('/{project}', [ProjectController::class, 'update']);
        Route::delete('/{project}', [ProjectController::class, 'destroy']);
    });

    // --- Course Assignments ---
    Route::post('/course-assignments', [CourseAssignmentController::class, 'store']);
    Route::get('/teacher/assignments', [CourseAssignmentController::class, 'teacherAssignments']);
    Route::get('/student/courses', [CourseAssignmentController::class, 'studentCourses']);

    // --- Task Submissions ---
    Route::post('/tasks/{dailyTask}/submit', [TaskSubmissionController::class, 'submit']);
    Route::post('/submissions/{submission}/review', [TaskSubmissionController::class, 'review']);
    Route::get('/student/submissions', [TaskSubmissionController::class, 'studentSubmissions']);
    Route::get('/teacher/submissions', [TaskSubmissionController::class, 'teacherSubmissions']);

    // --- Quizzes / Questions / Quiz Attempts ---
    Route::get('/courses/{course}/quizzes', [QuizController::class, 'index']);
    Route::post('/courses/{course}/quizzes', [QuizController::class, 'store']);
    Route::get('/quizzes/{quiz}', [QuizController::class, 'show']);
    Route::put('/quizzes/{quiz}', [QuizController::class, 'update']);
    Route::delete('/quizzes/{quiz}', [QuizController::class, 'destroy']);

    Route::get('/quizzes/{quiz}/questions', [QuestionController::class, 'index']);
    Route::post('/quizzes/{quiz}/questions', [QuestionController::class, 'store']);
    Route::get('/questions/{question}', [QuestionController::class, 'show']);
    Route::put('/questions/{question}', [QuestionController::class, 'update']);
    Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);

    Route::post('/quizzes/{quiz}/attempt', [QuizAttemptController::class, 'attempt']);

    // --- Lesson Progress ---
    Route::post('/lessons/{lesson}/progress', [LessonProgressController::class, 'track']);

    // --- Certificates (authenticated) ---
    Route::get('/certificates', [CertificateController::class, 'index']);

    // --- Dashboards ---
    Route::middleware('role:student')->get('/student/dashboard', [StudentDashboardController::class, 'index']);
    Route::middleware('role:teacher')->get('/teacher/dashboard', [TeacherDashboardController::class, 'index']);
    Route::middleware('role:org_admin,super_admin')->get('/admin/dashboard', [AdminDashboardController::class, 'index']);
});
