export default function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-800",
    passed_by_accounts: "bg-sky-100 text-sky-800",
    approved_by_admin: "bg-green-100 text-green-800",
    verified: "bg-indigo-100 text-indigo-800",
    rejected: "bg-red-100 text-red-800",
  };
  const cls = map[status] ?? "bg-gray-100 text-gray-800";
  return <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${cls}`}>{status.replaceAll("_", " ")}</span>;
}
