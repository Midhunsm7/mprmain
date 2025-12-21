"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export function useNotifications(role?: string, userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    (async function fetchList() {
      const res = await fetch("/api/notifications/list", {
        method: "POST",
        body: JSON.stringify({ role, user_id: userId }),
      });
      const data = await res.json();
      setNotifications(data || []);
    })();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const n = payload.new;
          if (!role || n.target_role === role || n.target_user === userId) {
            setNotifications((prev) => [n, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [role, userId]);

  return notifications;
}
