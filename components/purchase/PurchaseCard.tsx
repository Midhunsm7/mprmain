"use client";

import StatusBadge from "./StatusBadge";

export default function PurchaseCard({ request }: { request: any }) {
  const itemName = request.inventory_items?.name ?? request.item_name ?? "Item";
  return (
    <div className="bg-white dark:bg-gray-900 border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{itemName}</h4>
          <p className="text-sm text-muted">Qty: {request.quantity} {request.inventory_items?.unit ?? ""}</p>
          <p className="text-xs text-muted mt-2">{request.reason}</p>
        </div>
        <div className="text-xs text-muted mt-2">
  {request.created_by?.name && (
    <p>Created by: {request.created_by.name}</p>
  )}
  {request.passed_by?.name && (
    <p>Passed by: {request.passed_by.name}</p>
  )}
  {request.approved_by?.name && (
    <p>Approved by: {request.approved_by.name}</p>
  )}
  {request.verified_by?.name && (
    <p>Verified by: {request.verified_by.name}</p>
  )}
</div>

        <div className="text-right">
          <StatusBadge status={request.status} />
          <p className="text-xs mt-2 text-muted">{new Date(request.created_at).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
