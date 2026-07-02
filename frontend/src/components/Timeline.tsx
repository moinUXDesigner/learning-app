import type { ReactNode } from 'react';

export interface TimelineNode {
  id: number | string;
  title: string;
  subtitle?: string;
  content?: ReactNode;
}

interface TimelineProps {
  nodes: TimelineNode[];
}

/** Vertical timeline used by CourseDetail to render modules -> lessons/tasks. */
export function Timeline({ nodes }: TimelineProps) {
  return (
    <ol className="relative border-l-2 border-gray-200 pl-6">
      {nodes.map((node, idx) => (
        <li key={node.id} className={idx === nodes.length - 1 ? '' : 'mb-6'}>
          <span className="absolute -left-[9px] mt-1.5 h-4 w-4 rounded-full border-2 border-indigo-600 bg-white" />
          <h4 className="text-base font-semibold text-gray-800">{node.title}</h4>
          {node.subtitle && <p className="text-xs text-gray-500">{node.subtitle}</p>}
          {node.content && <div className="mt-2">{node.content}</div>}
        </li>
      ))}
    </ol>
  );
}
