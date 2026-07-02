import { useState } from 'react';
import { useAuthStore } from '../../auth/authStore';
import { useOrgUsers } from '../../api/hooks/useUsers';
import { Card } from '../../components/Card';
import { CreateUserForm, UserCard } from './Teachers';

/**
 * Org Admin's Students page — same pattern as Teachers.tsx (see that file's
 * docblock for why GET /api/users is filtered to role === 'student'
 * client-side). Reuses CreateUserForm/UserCard from Teachers.tsx rather
 * than duplicating the create-form/card markup, since the only difference
 * between the two pages is which role they create/filter for.
 */
export function Students() {
  const { user: me } = useAuthStore();
  const { data: users, isLoading, error } = useOrgUsers();
  const [showCreate, setShowCreate] = useState(false);

  const students = (users ?? []).filter((u) => u.role === 'student');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Students</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Student'}
        </button>
      </div>

      {showCreate && (
        <CreateUserForm
          role="student"
          organizationId={me?.organization_id ?? null}
          onDone={() => setShowCreate(false)}
        />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading students…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load students. Please try again.</p>
      ) : students.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No students yet. Add one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => (
            <UserCard key={s.id} user={s} />
          ))}
        </div>
      )}
    </div>
  );
}
