"use client";

import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function NotificationBell({ role }) {
  const notifications = useNotifications(role);
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      >
        <Bell className="w-6 h-6" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-1 -right-1 text-xs bg-red-500 text-white">
            {notifications.length}
          </Badge>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white dark:bg-gray-900 shadow-xl rounded-xl p-4 space-y-3">
          {notifications.map((n) => (
            <div key={n.id} className="border-b pb-2">
              <p className="font-semibold">{n.title}</p>
              <p className="text-sm text-gray-500">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
