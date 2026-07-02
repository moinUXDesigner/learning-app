import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { setupServer } from 'msw/node';
import { cleanup } from '@testing-library/react';
import { handlers } from './mocks/handlers';
import { useAuthStore } from '../auth/authStore';

export const server = setupServer(...handlers);

// The default (logged-out) shape of the Zustand auth store, captured once
// at import time so every test file starts from the same clean slate.
// authStore.ts is a module-level singleton (`create<AuthState>(...)` is
// called once and shared across every import), so without an explicit
// reset, state mutated by one test (e.g. a successful login) would leak
// into the next test.
const initialAuthState = useAuthStore.getState();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  useAuthStore.setState(initialAuthState, true);
});

afterAll(() => {
  server.close();
});
