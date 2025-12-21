// app/staff/[id]/page.tsx

import StaffClient from "./StaffClient";

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ⭐ THIS FIXES THE "undefined" ISSUE

  return <StaffClient id={id} />;
}
    