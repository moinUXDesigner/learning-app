import axios, { AxiosError } from 'axios';
import type { ApiErrorResponse } from './types';
import { ApiError } from './types';

// ---------------------------------------------------------------------------
// Base URL design decision
// ---------------------------------------------------------------------------
// The backend exposes two kinds of endpoints on the SAME host:
//   - Sanctum's CSRF bootstrap route:  GET /sanctum/csrf-cookie   (no /api prefix)
//   - Every other API endpoint:        /api/...                  (has /api prefix)
//
// Rather than maintaining two axios instances (which would mean two sets of
// interceptors, two configs to keep in sync, etc.), we use a SINGLE axios
// instance whose baseURL is just the host root (e.g. http://localhost:8000),
// and every call site is responsible for including the `/api` prefix itself
// (e.g. `apiClient.get('/api/me')`). The one exception is `ensureCsrfCookie()`
// below, which calls `/sanctum/csrf-cookie` directly — this is the only
// caller that should ever hit a non-`/api` path, and it's centralized here
// so nobody has to think about it elsewhere.
// ---------------------------------------------------------------------------

const API_HOST = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_HOST,
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Normalize every rejected response into a typed ApiError so calling code
// (React Query mutations, the auth store, etc.) never has to deal with raw
// axios/backend error shapes.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const data = error.response.data;
      const message = data?.message ?? error.message ?? 'An unexpected error occurred.';
      const status = data?.status_code ?? error.response.status;
      return Promise.reject(new ApiError(message, status, data?.errors));
    }

    if (error.request) {
      // Request was made but no response was received (network error, CORS, backend down, etc.)
      return Promise.reject(new ApiError('Unable to reach the server. Please check your connection.', 0));
    }

    return Promise.reject(new ApiError(error.message ?? 'An unexpected error occurred.', 0));
  },
);

let csrfCookiePromise: Promise<void> | null = null;

/**
 * Ensures the XSRF-TOKEN cookie is set before any state-changing request
 * (login, register, logout, POST/PUT/PATCH/DELETE calls). Laravel Sanctum's
 * SPA mode requires hitting this endpoint once per browser session before
 * such requests will be accepted.
 *
 * Safe to call multiple times — the underlying GET only actually fires once
 * (in-flight/completed requests are deduplicated via the cached promise).
 */
export function ensureCsrfCookie(): Promise<void> {
  if (!csrfCookiePromise) {
    csrfCookiePromise = apiClient
      .get('/sanctum/csrf-cookie')
      .then(() => undefined)
      .catch((err) => {
        // Allow retrying on failure instead of caching a rejected promise forever.
        csrfCookiePromise = null;
        throw err;
      });
  }
  return csrfCookiePromise;
}
