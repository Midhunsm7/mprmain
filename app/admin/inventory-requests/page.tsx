"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AdminInventoryRequestsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from("kitchen_inventory_request")
      .select(`
        id,
        quantity,
        status,
        priority,
        department,
        reason,
        comments,
        created_at,
        approved_at,
        fulfilled_at,
        inventory_items (
          id,
          name,
          unit
        ),
        requester:requested_by (
          name,
          department
        ),
        approver:approved_by (
          name
        ),
        fulfiller:fulfilled_by (
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(error.message)
    } else {
      setRequests(data || [])
    }

    setLoading(false)
  }

  const approve = async (id: string) => {
    const { error } = await supabase
      .from("kitchen_inventory_request")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) toast.error(error.message)
    else {
      toast.success("Request approved")
      loadRequests()
    }
  }

  const fulfill = async (id: string) => {
    const { error } = await supabase
      .from("kitchen_inventory_request")
      .update({
        status: "fulfilled",
        fulfilled_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) toast.error(error.message)
    else {
      toast.success("Request fulfilled")
      loadRequests()
    }
  }

  const reject = async (id: string) => {
    const { error } = await supabase
      .from("kitchen_inventory_request")
      .update({
        status: "rejected",
      })
      .eq("id", id)

    if (error) toast.error(error.message)
    else {
      toast.success("Request rejected")
      loadRequests()
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Inventory Requests</h1>

      {loading && <p>Loading…</p>}

      {!loading && requests.length === 0 && (
        <p className="text-gray-500">No inventory requests found.</p>
      )}

      {requests.map((r) => (
        <Card key={r.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <p className="font-semibold text-lg">
                {r.inventory_items?.name ?? "Unknown Item"}
              </p>
              <Badge>{r.status}</Badge>
            </div>

            <p>
              <b>Quantity:</b> {r.quantity} {r.inventory_items?.unit ?? ""}
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

            {r.requester && (
              <p className="text-sm">
                <b>Requested By:</b> {r.requester.name} (
                {r.requester.department})
              </p>
            )}

            {r.approver && (
              <p className="text-sm text-blue-700">
                <b>Approved By:</b> {r.approver.name}
              </p>
            )}

            {r.fulfiller && (
              <p className="text-sm text-green-700">
                <b>Fulfilled By:</b> {r.fulfiller.name}
              </p>
            )}

            <p className="text-xs text-gray-500">
              Created: {new Date(r.created_at).toLocaleString()}
            </p>

            <div className="flex gap-2 pt-2">
              {r.status === "pending" && (
                <Button onClick={() => approve(r.id)}>Approve</Button>
              )}

              {r.status === "approved" && (
                <Button onClick={() => fulfill(r.id)}>Fulfill</Button>
              )}

              {r.status !== "fulfilled" && (
                <Button
                  variant="destructive"
                  onClick={() => reject(r.id)}
                >
                  Reject
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
