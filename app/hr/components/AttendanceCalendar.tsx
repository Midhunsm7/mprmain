"use client";

interface AttendanceRecord {
  day: string; // "YYYY-MM-DD"
  status: "present" | "absent" | "half" | "leave" | "late";
  note?: string | null;
}

interface AttendanceCalendarProps {
  attendance: AttendanceRecord[];
}

const statusColors: Record<AttendanceRecord["status"], string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  half: "bg-amber-500",
  leave: "bg-blue-500",
  late: "bg-purple-500",
};

export function AttendanceCalendar({ attendance }: AttendanceCalendarProps) {
  // we assume attendance already sorted by day
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-5 gap-2 text-xs text-gray-600">
        {attendance.map((a) => (
          <div
            key={a.day}
            className="border rounded-lg p-2 flex flex-col items-center justify-center"
          >
            <div>{a.day}</div>
            <div className={`mt-1 h-2 w-2 rounded-full ${statusColors[a.status]}`} />
            <div className="mt-1 capitalize text-[11px]">{a.status}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Present
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Absent
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Half day
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Leave
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-500" /> Late
        </div>
      </div>
    </div>
  );
}
