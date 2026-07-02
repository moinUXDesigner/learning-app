import type { ReactNode } from 'react';

export interface ChecklistItemData {
  id: number | string;
  title: string;
  subtitle?: string;
  done: boolean;
  badge?: ReactNode;
  onClick?: () => void;
}

interface ChecklistProps {
  items: ChecklistItemData[];
  emptyMessage?: string;
}

/** Simple checklist UI used by TodaysTasks — each row links out via onClick. */
export function Checklist({ items, emptyMessage = 'Nothing here.' }: ChecklistProps) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={item.onClick}
            disabled={!item.onClick}
            className="flex w-full items-center gap-3 py-3 text-left disabled:cursor-default"
          >
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                item.done
                  ? 'border-green-500 bg-green-500 text-white'
                  : 'border-gray-300 text-transparent'
              }`}
            >
              {'✓'}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block truncate text-sm font-medium ${item.done ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {item.title}
              </span>
              {item.subtitle && <span className="block truncate text-xs text-gray-500">{item.subtitle}</span>}
            </span>
            {item.badge}
          </button>
        </li>
      ))}
    </ul>
  );
}
