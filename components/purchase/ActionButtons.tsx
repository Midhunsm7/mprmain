"use client";

import { Button } from "@/components/ui/button";

export default function ActionButtons({ onPass, onApprove, onVerify, onReject }: any) {
  return (
    <div className="flex gap-2">
      <Button onClick={onPass}>Pass</Button>
      <Button onClick={onApprove}>Approve</Button>
      <Button onClick={onVerify}>Verify</Button>
      <Button variant="destructive" onClick={onReject}>Reject</Button>
    </div>
  );
}
