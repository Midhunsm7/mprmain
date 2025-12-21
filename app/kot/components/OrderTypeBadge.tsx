"use client";
import React from "react";

export default function OrderTypeBadge({ type }: { type?: string }) {
  const t = type ?? "dine_in";
  const classes = t === "takeaway" ? "bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs" : "bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs";
  return <span className={classes}>{t.replace("_", " ").toUpperCase()}</span>;
}
