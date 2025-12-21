"use client";

interface SalaryAdjustment {
  id: string;
  month: string;
  amount: number;
  reason?: string | null;
  created_at: string;
}

interface SalaryHistoryProps {
  adjustments: SalaryAdjustment[];
}

export function SalaryHistory({ adjustments }: SalaryHistoryProps) {
  if (!adjustments.length) {
    return <div className="text-sm text-gray-500">No salary changes recorded yet.</div>;
  }

  return (
    <div className="space-y-2 text-sm">
      {adjustments.map((adj) => (
        <div
          key={adj.id}
          className="border rounded-lg p-2 flex items-center justify-between"
        >
          <div>
            <div className="font-medium">
              ₹{Number(adj.amount).toLocaleString("en-IN")} <span className="text-xs text-gray-500">({adj.month})</span>
            </div>
            {adj.reason && (
              <div className="text-xs text-gray-500">Reason: {adj.reason}</div>
            )}
          </div>
          <div className="text-xs text-gray-400">
            {new Date(adj.created_at).toLocaleString("en-IN")}
          </div>
        </div>
      ))}
    </div>
  );
}
