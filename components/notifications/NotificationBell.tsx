"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";

export default function NotificationBell({ role }: { role?: string }) {
  const notifications = useNotifications(role);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="p-2 rounded-full hover:bg-gray-100">
        <Bell className="w-5 h-5" />
        {notifications && notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs bg-red-600 text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 shadow-xl rounded-xl p-3 z-50">
          <div className="font-semibold mb-2">Notifications</div>
          <div className="max-h-64 overflow-auto space-y-2">
            {notifications.map((n: any) => (
              <div key={n.id} className="p-2 border rounded-md">
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-muted">{n.message}</div>
              </div>
            ))}
            {notifications.length === 0 && <div className="text-sm text-muted">No notifications</div>}
          </div>
        </div>
      )}
    </div>
  );
}
