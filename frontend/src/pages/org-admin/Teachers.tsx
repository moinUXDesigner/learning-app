import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../../auth/authStore';
import { useOrgUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../../api/hooks/useUsers';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { User } from '../../types';

/**
 * Org Admin's Teachers page: list/create/edit/deactivate users with
 * role === 'teacher' in the caller's own organization.
 *
 * GET /api/users has no server-side role filter (checked
 * UserController::index — it only scopes by organization_id for
 * non-super_admin callers), so this page fetches the full org user list via
 * useOrgUsers() and filters to role === 'teacher' client-side, same pattern
 * already established by useOrgStudents() for the teacher's AssignCourse
 * page.
 */
export function Teachers() {
  const { user: me } = useAuthStore();
  const { data: users, isLoading, error } = useOrgUsers();
  const [showCreate, setShowCreate] = useState(false);

  const teachers = (users ?? []).filter((u) => u.role === 'teacher');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Teachers</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Teacher'}
        </button>
      </div>

      {showCreate && (
        <CreateUserForm
          role="teacher"
          organizationId={me?.organization_id ?? null}
          onDone={() => setShowCreate(false)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading teachers…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load teachers. Please try again.</p>
      ) : teachers.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No teachers yet. Add one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teachers.map((t) => (
            <UserCard key={t.id} user={t} />
          ))}
        </div>
      )}
    </div>
  );
}

export function CreateUserForm({
  role,
  organizationId,
  onDone,
}: {
  role: 'teacher' | 'student';
  organizationId: number | null;
  onDone: () => void;
}) {
  const createUser = useCreateUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setGeneratedPassword(null);

    try {
      const result = await createUser.mutateAsync({
        name,
        email,
        password: password || undefined,
        role,
        organization_id: organizationId,
      });
      if (result.generated_password) {
        setGeneratedPassword(result.generated_password);
        return;
      }
      onDone();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors ?? {});
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  }

  if (generatedPassword) {
    return (
      <Card className="border-indigo-200 bg-indigo-50">
        <p className="text-sm font-medium text-indigo-800">
          {role === 'teacher' ? 'Teacher' : 'Student'} created. No password was supplied, so a temporary
          one was generated — share it securely, it won&apos;t be shown again:
        </p>
        <p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-sm text-gray-800">
          {generatedPassword}
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-3 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Done
        </button>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Password <span className="text-gray-400">(optional — auto-generated if left blank)</span>
          </label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>}
        </div>
        <button
          type="submit"
          disabled={createUser.isPending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
        >
          {createUser.isPending ? 'Creating…' : `Create ${role === 'teacher' ? 'Teacher' : 'Student'}`}
        </button>
      </form>
    </Card>
  );
}

export function UserCard({ user }: { user: User }) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [error, setError] = useState<string | null>(null);
  const isActive = user.status !== 'inactive';

  async function toggleStatus() {
    setError(null);
    try {
      await updateUser.mutateAsync({
        userId: user.id,
        payload: { status: isActive ? 'inactive' : 'active' },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update status.');
    }
  }

  async function handleDelete() {
    setError(null);
    try {
      await deleteUser.mutateAsync(user.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete user.');
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-gray-800">{user.name}</h3>
          <p className="text-xs text-gray-400">{user.email}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 text-xs">
        <button
          type="button"
          disabled={updateUser.isPending}
          onClick={toggleStatus}
          className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {isActive ? 'Deactivate' : 'Reactivate'}
        </button>
        <button
          type="button"
          disabled={deleteUser.isPending}
          onClick={handleDelete}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
