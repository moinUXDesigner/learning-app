import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  useSubscriptionPlans,
  useCreateSubscriptionPlan,
  useUpdateSubscriptionPlan,
  useDeleteSubscriptionPlan,
} from '../../api/hooks/useSubscriptionPlans';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { SubscriptionPlan } from '../../types';

/** Super Admin's Subscription Plans page — full CRUD via SubscriptionPlanController (writes are super_admin-only). */
export function SubscriptionPlans() {
  const { data: plans, isLoading, error } = useSubscriptionPlans();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Subscription Plans</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Plan'}
        </button>
      </div>

      {showCreate && <PlanForm onDone={() => setShowCreate(false)} />}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading plans…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load subscription plans. Please try again.</p>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No subscription plans yet.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) =>
            editingId === plan.id ? (
              <Card key={plan.id}>
                <PlanForm plan={plan} onDone={() => setEditingId(null)} />
              </Card>
            ) : (
              <PlanCard key={plan.id} plan={plan} onEdit={() => setEditingId(plan.id)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function PlanForm({ plan, onDone }: { plan?: SubscriptionPlan; onDone: () => void }) {
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();
  const [name, setName] = useState(plan?.name ?? '');
  const [price, setPrice] = useState(plan ? String(plan.price) : '');
  const [maxUsers, setMaxUsers] = useState(plan?.max_users != null ? String(plan.max_users) : '');
  const [maxCourses, setMaxCourses] = useState(plan?.max_courses != null ? String(plan.max_courses) : '');
  const [features, setFeatures] = useState(plan?.features ? plan.features.join(', ') : '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isPending = createPlan.isPending || updatePlan.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      name,
      price: Number(price),
      max_users: maxUsers ? Number(maxUsers) : null,
      max_courses: maxCourses ? Number(maxCourses) : null,
      features: features
        ? features
            .split(',')
            .map((f) => f.trim())
            .filter(Boolean)
        : null,
    };

    try {
      if (plan) {
        await updatePlan.mutateAsync({ planId: plan.id, payload });
      } else {
        await createPlan.mutateAsync(payload);
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Price (USD/month)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {fieldErrors.price && <p className="mt-1 text-xs text-red-600">{fieldErrors.price[0]}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Users</label>
            <input
              type="number"
              min={0}
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              placeholder="Unlimited"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Courses</label>
            <input
              type="number"
              min={0}
              value={maxCourses}
              onChange={(e) => setMaxCourses(e.target.value)}
              placeholder="Unlimited"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Features <span className="text-gray-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="analytics, certificates, priority_support"
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : plan ? 'Save Changes' : 'Create Plan'}
          </button>
          {plan && (
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

function PlanCard({ plan, onEdit }: { plan: SubscriptionPlan; onEdit: () => void }) {
  const deletePlan = useDeleteSubscriptionPlan();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deletePlan.mutateAsync(plan.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete plan.');
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-base font-semibold text-gray-800">{plan.name}</h3>
      <p className="mt-1 text-2xl font-bold text-indigo-700">
        ${Number(plan.price).toFixed(2)}
        <span className="text-sm font-normal text-gray-400">/mo</span>
      </p>
      <p className="mt-2 text-sm text-gray-500">
        {plan.max_users != null ? `${plan.max_users} users` : 'Unlimited users'} ·{' '}
        {plan.max_courses != null ? `${plan.max_courses} courses` : 'Unlimited courses'}
      </p>
      {plan.features && plan.features.length > 0 && (
        <ul className="mt-2 flex flex-1 flex-wrap gap-1">
          {plan.features.map((f) => (
            <li key={f} className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
              {f}
            </li>
          ))}
        </ul>
      )}
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
          disabled={deletePlan.isPending}
          onClick={handleDelete}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
