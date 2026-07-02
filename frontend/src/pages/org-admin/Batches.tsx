import { useState } from 'react';
import type { FormEvent } from 'react';
import { useBatches, useCreateBatch, useUpdateBatch, useDeleteBatch } from '../../api/hooks/useBatches';
import { useOrgUsers } from '../../api/hooks/useUsers';
import { ApiError } from '../../api/types';
import { Card } from '../../components/Card';
import type { Batch } from '../../types';

/** Org Admin's Batches page — full CRUD via BatchController. */
export function Batches() {
  const { data: batches, isLoading, error } = useBatches();
  const { data: users } = useOrgUsers();
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const teachers = (users ?? []).filter((u) => u.role === 'teacher');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Batches</h1>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Batch'}
        </button>
      </div>

      {showCreate && (
        <BatchForm teachers={teachers} onDone={() => setShowCreate(false)} />
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading batches…</p>
      ) : error ? (
        <p className="text-sm text-red-600">Couldn&apos;t load batches. Please try again.</p>
      ) : !batches || batches.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-500">No batches yet. Add one to group students together.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {batches.map((batch) =>
            editingId === batch.id ? (
              <Card key={batch.id}>
                <BatchForm
                  teachers={teachers}
                  batch={batch}
                  onDone={() => setEditingId(null)}
                />
              </Card>
            ) : (
              <BatchCard key={batch.id} batch={batch} onEdit={() => setEditingId(batch.id)} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

function BatchForm({
  teachers,
  batch,
  onDone,
}: {
  teachers: { id: number; name: string }[];
  batch?: Batch;
  onDone: () => void;
}) {
  const createBatch = useCreateBatch();
  const updateBatch = useUpdateBatch();
  const [name, setName] = useState(batch?.name ?? '');
  const [teacherId, setTeacherId] = useState<string>(batch?.teacher_id ? String(batch.teacher_id) : '');
  const [startDate, setStartDate] = useState(batch?.start_date ?? '');
  const [endDate, setEndDate] = useState(batch?.end_date ?? '');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const isPending = createBatch.isPending || updateBatch.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const payload = {
      name,
      teacher_id: teacherId ? Number(teacherId) : null,
      start_date: startDate || null,
      end_date: endDate || null,
    };

    try {
      if (batch) {
        await updateBatch.mutateAsync({ batchId: batch.id, payload });
      } else {
        await createBatch.mutateAsync(payload);
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
          <label className="block text-sm font-medium text-gray-700">Teacher</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Unassigned</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate ?? ''}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate ?? ''}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldErrors.end_date && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.end_date[0]}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {isPending ? 'Saving…' : batch ? 'Save Changes' : 'Create Batch'}
          </button>
          {batch && (
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

function BatchCard({ batch, onEdit }: { batch: Batch; onEdit: () => void }) {
  const deleteBatch = useDeleteBatch();
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    try {
      await deleteBatch.mutateAsync(batch.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to delete batch.');
    }
  }

  return (
    <Card className="flex h-full flex-col">
      <h3 className="text-base font-semibold text-gray-800">{batch.name}</h3>
      <p className="mt-1 text-sm text-gray-500">
        Teacher: {batch.teacher?.name ?? 'Unassigned'}
      </p>
      <p className="text-xs text-gray-400">
        {batch.start_date ?? '—'} to {batch.end_date ?? '—'}
      </p>
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
          disabled={deleteBatch.isPending}
          onClick={handleDelete}
          className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
        >
          Delete
        </button>
      </div>
    </Card>
  );
}
