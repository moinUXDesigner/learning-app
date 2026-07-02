import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Login } from '../pages/public/Login';
import { renderWithProviders } from './test-utils';
import { server } from './setup';

const API_HOST = 'http://localhost:8000';

const mockNavigate = vi.fn();

// Login.tsx calls useNavigate() from react-router-dom and navigates to
// '/dashboard' on success (see handleSubmit in Login.tsx). Mock just the
// hook so we can assert on the call without needing to inspect the
// resulting route tree.
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders the login form with email/password fields and a submit button', () => {
    renderWithProviders(<Login />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows an error message when the API returns a login failure', async () => {
    server.use(
      http.post(`${API_HOST}/api/login`, () => {
        return HttpResponse.json(
          { message: 'These credentials do not match our records.' },
          { status: 401 },
        );
      }),
    );

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /these credentials do not match our records/i,
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to /dashboard on successful login', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Login />);

    await user.type(screen.getByLabelText(/email/i), 'alex@example.com');
    await user.type(screen.getByLabelText(/password/i), 'correct-password');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
});
