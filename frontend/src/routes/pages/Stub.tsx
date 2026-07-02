// Generic placeholder page used throughout the route table until real
// pages are built in the next phase. Swap individual routes' element to
// a real component as pages are implemented — the route table structure
// itself should not need to change.
export function Stub({ name }: { name: string }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-800">{name}</h1>
      <p className="mt-1 text-sm text-gray-500">Placeholder page — not yet implemented.</p>
    </div>
  );
}
