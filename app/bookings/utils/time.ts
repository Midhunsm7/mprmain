// Format date in Indian IST 12-hour format (SAFE)
export const formatDateTime12 = (iso: string) => {
  const d = new Date(iso)

  return d.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
