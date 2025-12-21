"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function useKotRealtime({
  onNew,
  onUpdate,
}: {
  onNew: (order: any) => void;
  onUpdate: (order: any) => void;
}) {
  useEffect(() => {
    const channel = supabase
      .channel("kot-orders-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kot_orders" },
        (payload) => {
          const order = payload.new;

          // highlight new order
          order.__isNew = true;

          // PLAYS NOTIFICATION SOUND
          playDingSound();

          onNew(order);

          // remove highlight after 2.5 seconds
          setTimeout(() => {
            order.__isNew = false;
            onUpdate(order);
          }, 2500);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "kot_orders" },
        (payload) => {
          const order = payload.new;
          onUpdate(order);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}

/* ------------------------------------------------------ */
/*            🔔 Zomato-Style Ding Sound                  */
/* ------------------------------------------------------ */
function playDingSound() {
  const ding = new Audio(
    "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5028d37921.mp3?filename=notification-113724.mp3"
  );

  ding.volume = 0.5;
  ding.play().catch(() => {});
}
