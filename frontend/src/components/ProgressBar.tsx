interface ProgressBarProps {
  /** 0-100 */
  percent: number;
  label?: string;
  colorClassName?: string;
}

export function ProgressBar({ percent, label, colorClassName = 'bg-indigo-600' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div>
      {label && (
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-gray-600">{label}</span>
          <span className="font-medium text-gray-800">{clamped.toFixed(0)}%</span>
        </div>
      )}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${colorClassName}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
