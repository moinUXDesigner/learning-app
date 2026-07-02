// Types describing the backend's error response shape and a typed
// ApiError that the axios response interceptor normalizes all
// rejected requests into (see ./client.ts).

/** Raw error payload shape returned by the Laravel backend. */
export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status_code?: number;
}

/**
 * Normalized error thrown by the axios client for every failed request.
 * Calling code can rely on this shape regardless of what the backend sent.
 */
export class ApiError extends Error {
  /** HTTP status code of the response, or 0 if the request never got a response (network error). */
  status: number;
  /** Field-level validation errors, e.g. { email: ["The email field is required."] } */
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}
