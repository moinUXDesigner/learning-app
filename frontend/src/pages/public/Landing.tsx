import { Link } from 'react-router-dom';

export function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-indigo-50 to-white">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-xl font-bold text-indigo-700">LearnTrack</span>
        <nav className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-indigo-700">
            Log in
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Master cybersecurity, one day at a time.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600">
          LearnTrack is a day-by-day learning platform for organizations teaching cybersecurity
          skills — structured courses, daily tasks, quizzes, streaks, and certificates that keep
          students accountable and engaged.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/register"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Create a free account
          </Link>
          <Link
            to="/login"
            className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            I already have an account
          </Link>
        </div>

        <dl className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-semibold text-indigo-700">Daily Tasks</dt>
            <dd className="mt-1 text-sm text-gray-500">Bite-sized lessons and tasks assigned day by day.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-indigo-700">Streaks &amp; XP</dt>
            <dd className="mt-1 text-sm text-gray-500">Stay motivated with streak tracking and scoring.</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-indigo-700">Certificates</dt>
            <dd className="mt-1 text-sm text-gray-500">Earn verifiable certificates upon completion.</dd>
          </div>
        </dl>
      </main>

      <footer className="mx-auto w-full max-w-5xl px-6 py-6 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} LearnTrack. All rights reserved.
      </footer>
    </div>
  );
}
