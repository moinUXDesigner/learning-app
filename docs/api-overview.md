# API Overview

Base URL: `http://localhost:8000` (all endpoints below are prefixed with `/api` unless noted). Auth is Laravel Sanctum SPA cookie-session — call `GET /sanctum/csrf-cookie` once, then send `withCredentials`/`X-XSRF-TOKEN` on every request. Errors are returned as `{ "message": "...", "errors": {...}, "status_code": <int> }`. List endpoints are paginated (Laravel's standard paginator envelope: `data`, `current_page`, `total`, `links`, ...).

## Auth (public)
| Method | Path | Notes |
|---|---|---|
| POST | `/register` | Public self-signup, always creates a `student` |
| POST | `/login` | Sanctum SPA session login |
| POST | `/logout` | Auth required |
| GET | `/me` | Auth required, returns `{ user }` |
| POST | `/forgot-password` | Sends reset link (logged to `storage/logs/laravel.log` in dev, `MAIL_MAILER=log`) |
| POST | `/reset-password` | Completes reset |
| GET | `/health` | No auth — `{ status, db }` |
| GET | `/certificates/verify/{certificateNumber}` | No auth — public certificate verification |

## Organizations & Subscription Plans
| Method | Path |
|---|---|
| GET/POST | `/organizations` |
| GET/PUT/DELETE | `/organizations/{organization}` |
| GET/POST | `/subscription-plans` (write = super_admin only) |
| GET/PUT/DELETE | `/subscription-plans/{subscriptionPlan}` |

## Users & Batches
| Method | Path |
|---|---|
| GET/POST | `/users` (org-scoped for org_admin/teacher, global for super_admin) |
| GET/PUT/DELETE | `/users/{user}` |
| GET/POST | `/batches` |
| GET/PUT/DELETE | `/batches/{batch}` |

## Courses & workflow
| Method | Path |
|---|---|
| GET/POST | `/courses` |
| GET/PUT/DELETE | `/courses/{course}` |
| POST | `/courses/{course}/submit-approval` |
| POST | `/courses/{course}/approve` |
| POST | `/courses/{course}/reject` |
| POST | `/courses/{course}/publish` |
| POST | `/courses/{course}/archive` |

Status graph: `draft → submitted_for_approval → {approved, rejected}`; `approved → {published, draft}`; `rejected → draft`; `published → {archived, draft}`. Enforced by `CourseWorkflowService`.

## Curriculum (modules, lessons, learning plans, daily tasks, projects)
| Method | Path |
|---|---|
| GET/POST | `/courses/{course}/modules` |
| GET/PUT/DELETE | `/modules/{module}` |
| GET/POST | `/modules/{module}/lessons` |
| GET/PUT/DELETE | `/lessons/{lesson}` |
| POST | `/lessons/{lesson}/progress` (video-watch beacon) |
| GET/POST | `/courses/{course}/learning-plans` |
| GET/PUT/DELETE | `/learning-plans/{learningPlan}` |
| GET/POST | `/learning-plans/{learningPlan}/daily-tasks` |
| GET/PUT/DELETE | `/daily-tasks/{dailyTask}` |
| GET/POST | `/courses/{course}/projects` |
| GET/PUT/DELETE | `/projects/{project}` |

## Assignments & submissions
| Method | Path |
|---|---|
| POST | `/course-assignments` (course must be approved/published) |
| GET | `/teacher/assignments` |
| GET | `/student/courses` |
| POST | `/tasks/{dailyTask}/submit` |
| POST | `/submissions/{submission}/review` |
| GET | `/student/submissions` |
| GET | `/teacher/submissions` |

## Quizzes
| Method | Path |
|---|---|
| GET/POST | `/courses/{course}/quizzes` |
| GET/PUT/DELETE | `/quizzes/{quiz}` |
| GET/POST | `/quizzes/{quiz}/questions` (correct answers hidden from students) |
| GET/PUT/DELETE | `/questions/{question}` |
| POST | `/quizzes/{quiz}/attempt` |

## Certificates & Dashboards
| Method | Path |
|---|---|
| GET | `/certificates` (own, student) |
| GET | `/student/dashboard` |
| GET | `/teacher/dashboard` |
| GET | `/admin/dashboard` (org_admin: org-scoped, super_admin: platform-wide) |

## Scoring
All points are written by `App\Services\ScoreService` to an append-only `score_logs` ledger (never a mutable counter). Values: lesson watch=5, notes=10, quiz pass=20, assignment=30 (capped at task's max), project=100, capstone=500, daily streak=15, early-submission bonus=+5, late-submission penalty=-10.
