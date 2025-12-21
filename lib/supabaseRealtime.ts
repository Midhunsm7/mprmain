// lib/supabaseRealtime.ts
import { supabase } from "./supabaseClient";

type ChangeHandler = (payload: any) => void;

export function subscribeToTable(
  table: string,
  event: "INSERT" | "UPDATE" | "DELETE" | "ALL",
  handler: ChangeHandler
) {
  const channel = supabase.channel(`table-changes-${table}-${Date.now()}`);

  const events =
    event === "ALL"
      ? ["INSERT", "UPDATE", "DELETE"]
      : [event];

  events.forEach((ev) => {
    channel.on(
      "postgres_changes",
      {
        event: ev,         // MUST BE UPPERCASE
        schema: "public",
        table,
      },
      (payload) => handler({ event: ev, payload })
    );
  });

  channel.subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
