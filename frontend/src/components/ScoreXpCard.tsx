import { Card } from './Card';

interface ScoreXpCardProps {
  totalXp: number;
  completedTasks: number;
  totalTasks: number;
  lateSubmissions: number;
}

export function ScoreXpCard({ totalXp, completedTasks, totalTasks, lateSubmissions }: ScoreXpCardProps) {
  return (
    <Card className="bg-gradient-to-br from-indigo-600 to-indigo-500 text-white">
      <p className="text-sm font-medium uppercase tracking-wide text-indigo-100">Total XP</p>
      <p className="mt-1 text-4xl font-bold">{totalXp}</p>
      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-indigo-400/50 pt-4 text-sm">
        <div>
          <p className="text-indigo-100">Tasks Completed</p>
          <p className="text-lg font-semibold">
            {completedTasks}/{totalTasks}
          </p>
        </div>
        <div>
          <p className="text-indigo-100">Late Submissions</p>
          <p className="text-lg font-semibold">{lateSubmissions}</p>
        </div>
      </div>
    </Card>
  );
}
