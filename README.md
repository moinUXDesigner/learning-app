# LearnTrack SaaS

A competency-based learning management and daily-task-tracking platform for institutes, teachers, and students — course approval workflows, daily trackable learning plans, scoring/streaks/quizzes, and role-based dashboards for Super Admin, Organization Admin, Teacher, and Student.

## Architecture

- **Frontend**: React 19 + Vite + TypeScript + Tailwind CSS v4, React Query, Zustand, react-router-dom, PWA-ready.
- **Backend**: Laravel 11 (PHP 8.4) REST API, Laravel Sanctum (SPA cookie-session auth), MySQL 8.
- **Infra**: Docker Compose — `frontend`, `backend`, `db` (MySQL), `phpmyadmin`, `redis` (available, not yet wired into cache/queue).

```
learntrack-saas/
├── docker-compose.yml
├── frontend/    React + Vite + TS + Tailwind
├── backend/     Laravel 11 API
└── docs/api-overview.md
```

## Prerequisites

Docker Desktop only — no local PHP, Composer, or Node required to run the app (Node is only needed if you want to run frontend scripts directly on the host).

## Setup

```bash
git clone <this-repo>
cd learntrack-saas

cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up -d --build

docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate --seed
docker compose exec backend php artisan storage:link
```

Then open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api (health check: `GET /api/health`)
- phpMyAdmin: http://localhost:8080 (server `db`, user/password from `.env`)

## Demo credentials

All seeded accounts use password `password`.

| Role | Email |
|---|---|
| Super Admin | `superadmin@learntrack.test` |
| Organization Admin | `orgadmin@learntrack.test` |
| Teacher | `teacher1@learntrack.test`, `teacher2@learntrack.test` |
| Student | `student1@learntrack.test` ... `student10@learntrack.test` |

Seeded data includes one organization ("Cyber Academy"), a published "Cybersecurity Beginner" course with a 30-day learning plan, modules/lessons, daily tasks, a quiz, course assignments to all 10 students, a mix of completed/late/pending submissions, and quiz attempts — all scored through the real `ScoreService`, not hand-inserted.

## Environment variables

**Root `.env`** (compose-level): `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `DB_PORT`, `FRONTEND_PORT`, `BACKEND_PORT`, `PHPMYADMIN_PORT`, `FRONTEND_URL`, `BACKEND_URL`.

**`backend/.env`**: standard Laravel vars plus `FRONTEND_URL` (CORS + password-reset link target) and `SANCTUM_STATEFUL_DOMAINS=localhost:3000` (required for SPA cookie auth).

**`frontend/.env`**: `VITE_API_URL=http://localhost:8000`.

## API

See [docs/api-overview.md](docs/api-overview.md) for the full endpoint list grouped by feature area.

## Running tests

```bash
# Backend (PHPUnit, sqlite in-memory — does not touch the dev MySQL data)
docker compose exec backend php artisan test

# Frontend (Vitest + React Testing Library + MSW)
cd frontend && npm run test
```

## Known MVP simplifications

Deliberate scope cuts to keep this a coherent, working first build. Each has a clean seam to extend later without a rewrite:

1. **Subscription plans** — CRUD only, no billing integration, no limit enforcement.
2. **Certificates** — DB record + HTML verification page (`/verify/{certificate_number}`), no PDF generation, and issuance is not yet auto-triggered on course completion (read/verify endpoints exist against whatever rows are created manually).
3. **File uploads** — local disk (`storage/app/public`), no cloud storage/AV scanning.
4. **No course versioning** — a teacher can only edit a course while it's `draft`/`rejected`; an admin must revert `approved`/`published` courses to `draft` to allow further edits.
5. **Redis** — present in the compose stack but not wired into cache/queue (`CACHE_DRIVER`/`QUEUE_CONNECTION` still default to database/file).
6. **No nginx in dev** — `php artisan serve` + Vite dev server directly; nginx would be a production-profile addition.
7. **YouTube progress tracking** — watched/last-position via the IFrame Player API, not frame-accurate analytics.
8. **Rate limiting** — Laravel's built-in `throttle` middleware, no dedicated gateway.
9. **Notifications** — in-app only, no email/push delivery (forgot-password emails are the exception, logged to `storage/logs/laravel.log` via `MAIL_MAILER=log`).
10. **PWA** — manifest + basic asset caching via `vite-plugin-pwa`, not full offline-first; placeholder icon paths need real PNG assets.
11. **Analytics** — direct SQL aggregation endpoints, no analytics warehouse.
12. **Register endpoint** — public self-signup always creates a `student`; other roles are created by an authenticated org_admin/super_admin via `POST /api/users`. The registration form's organization picker is a plain numeric ID input (no public organization-list endpoint exists yet).
13. **Profile page** — read-only for MVP, no edit form yet.

## Verification checklist

1. `docker compose config` — validates compose syntax.
2. `docker compose up -d --build` — all 5 services reach running/healthy.
3. `curl http://localhost:8000/api/health` → `{"status":"ok","db":true}`.
4. `docker compose exec backend php artisan migrate --seed`, then browse phpMyAdmin to confirm seeded data.
5. Log in as `student1@learntrack.test` at http://localhost:3000 → dashboard shows XP/streak; complete a task in Today's Tasks.
6. Log in as a teacher → review a pending submission, assign a score.
7. Log in as Org Admin → approve a submitted course.
8. Log in as Super Admin → Organizations/Subscription Plans screens load.
9. `docker compose exec backend php artisan test` and `cd frontend && npm run test` both green.
