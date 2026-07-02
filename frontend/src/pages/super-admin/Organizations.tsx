import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  useOrganizations,
  useCreateOrganization,
  useUpdateOrganization,
  useDeleteOrganization,
} from '../../api/hooks/useOrganizations';
import { useSubscriptionPlans } from '../../api/hooks/useSubscriptionPlans';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { Organization } from '../../types';

/** Super Admin's Organizations page — full CRUD via OrganizationController (super_admin-only writes per OrganizationPolicy). */
export function Organizations() {
  const { data: organizations, isLoading, error } = useOrganizations();
  const { data: plans } = useSubscriptionPlans();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Organizations</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Organization'}
        </button>
      </div>

      {showCreate && (
        <OrganizationForm plans={plans ?? []} onDone={() => setShowCreate(false)} />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading organizations…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load organizations. Please try again.</p>
      ) : !organizations || organizations.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No organizations yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) =>
            editingId === org.id ? (
              <Card key={org.id}>
                <OrganizationForm
                  plans={plans ?? []}
                  organization={org}
                  onDone={() => setEditingId(null)}
                />
              </Card>
            ) : (
              <OrganizationCard key={org.id} organization={org} onEdit={() => setEditingId(org.id)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function OrganizationForm({
  plans,
  organization,
  onDone,
}: {
  plans: { id: number; name: string }[];
  organization?: Organization;
  onDone: () => void;
}) {
  const createOrg = useCreateOrganization();
  const updateOrg = useUpdateOrganization();
  const [name, setName] = useState(organization?.name ?? '');
  const [logo, setLogo] = useState(organization?.logo ?? '');
  const [domain, setDomain] = useState(organization?.domain ?? '');
  const [planId, setPlanId] = useState(
    organization?.subscription_plan_id ? String(organization.subscription_plan_id) : '',
  );
  const [status, setStatus] = useState(organization?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isPending = createOrg.isPending || updateOrg.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      name,
      logo: logo || null,
      domain: domain || null,
      subscription_plan_id: planId ? Number(planId) : null,
      status: status || null,
    };

    try {
      if (organization) {
        await updateOrg.mutateAsync({ organizationId: organization.id, payload });
      } else {
        await createOrg.mutateAsync(payload);
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

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <input
              type="text"
              value={domain ?? ''}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo URL</label>
            <input
              type="text"
              value={logo ?? ''}
              onChange={(e) => setLogo(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Subscription Plan</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">None</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status ?? ''}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : organization ? 'Save Changes' : 'Create Organization'}
          </button>
          {organization && (
            <button
              type="button"
              onClick={onDone}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </Card>
  );
}

function OrganizationCard({ organization, onEdit }: { organization: Organization; onEdit: () => void }) {
  const deleteOrg = useDeleteOrganization();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteOrg.mutateAsync(organization.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete organization.');
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-gray-800">{organization.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            organization.status === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-200 text-gray-500'
          }`}
        >
          {organization.status ?? 'unknown'}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{organization.domain ?? 'No domain set'}</p>
      <p className="text-xs text-gray-400">Plan: {organization.subscription_plan?.name ?? 'None'}</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-gray-100 pt-3 text-xs">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50"
        >
          Edit
        </button>
        <button
          type="button"
          disabled={deleteOrg.isPending}
          onClick={handleDelete}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
