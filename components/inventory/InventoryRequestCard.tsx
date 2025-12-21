import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function InventoryRequestCard({ r }: { r: any }) {
  const itemName = r.item?.name || r.item_name || "Unknown Item"
  const unit = r.item?.unit || r.unit || ""

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">{itemName}</h3>
          <Badge>{r.status}</Badge>
        </div>

        <p>
          <b>Quantity:</b> {r.quantity} {unit}
        </p>

        <p>
          <b>Department:</b> {r.department}
        </p>

        <p>
          <b>Priority:</b> {r.priority}
        </p>

        {r.reason && (
          <p>
            <b>Reason:</b> {r.reason}
          </p>
        )}

        {r.needed_by && (
          <p>
            <b>Needed By:</b>{" "}
            {new Date(r.needed_by).toLocaleDateString()}
          </p>
        )}

        {r.requester && (
          <p>
            <b>Requested By:</b> {r.requester.name} (
            {r.requester.department})
          </p>
        )}

        {r.approver && (
          <p>
            <b>Approved By:</b> {r.approver.name}
          </p>
        )}

        {r.comments && (
          <p className="italic text-sm text-gray-600">
            <b>Comments:</b> {r.comments}
          </p>
        )}

        <p className="text-xs text-gray-500">
          Created: {new Date(r.created_at).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  )
}
