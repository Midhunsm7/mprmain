"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Check, X, Package, User, Calendar, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type RequestGroup = {
  groupId: string
  date: string
  requester: any
  requests: any[]
  totalItems: number
  timestamp: string
}

export default function InventoryRequestsPage() {
  const [requestGroups, setRequestGroups] = useState<RequestGroup[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    setFadeIn(true)
    load()
  }, [])

  const load = async () => {
    const { data, error } = await supabase
      .from("kitchen_inventory_request")
      .select(`
        *,
        requester:requested_by(name, department)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error(error.message)
      return
    }

    // Group requests by requester and time (within 2 minutes)
    const grouped = groupRequests(data || [])
    setRequestGroups(grouped)
  }

  const groupRequests = (requests: any[]): RequestGroup[] => {
    const groups: RequestGroup[] = []
    const processedIds = new Set<string>()

    requests.forEach((request) => {
      if (processedIds.has(request.id)) return

      const requestTime = new Date(request.created_at).getTime()
      const groupRequests = requests.filter((r) => {
        if (processedIds.has(r.id)) return false
        
        const rTime = new Date(r.created_at).getTime()
        const timeDiff = Math.abs(requestTime - rTime)
        
        // Group if same requester and within 2 minutes
        return (
          r.requested_by === request.requested_by &&
          timeDiff <= 120000 // 2 minutes in milliseconds
        )
      })

      groupRequests.forEach((r) => processedIds.add(r.id))

      groups.push({
        groupId: `group-${request.id}`,
        date: request.date || new Date(request.created_at).toLocaleDateString(),
        requester: request.requester,
        requests: groupRequests,
        totalItems: groupRequests.length,
        timestamp: request.created_at,
      })
    })

    return groups
  }

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const approveGroup = async (group: RequestGroup) => {
    setLoading(true)
    const ids = group.requests.map((r) => r.id)

    const { error } = await supabase
      .from("kitchen_inventory_request")
      .update({
        status: "approved",
        approved_at: new Date().toISOString(),
      })
      .in("id", ids)

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Approved ${group.totalItems} item(s)`)
      load()
    }
  }

  const rejectGroup = async (group: RequestGroup) => {
    setLoading(true)
    const ids = group.requests.map((r) => r.id)

    const { error } = await supabase
      .from("kitchen_inventory_request")
      .update({ status: "rejected" })
      .in("id", ids)

    setLoading(false)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Rejected ${group.totalItems} item(s)`)
      load()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-700 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-700 border-orange-200"
      case "normal":
        return "bg-blue-100 text-blue-700 border-blue-200"
      default:
        return "bg-slate-100 text-slate-700 border-slate-200"
    }
  }

  const getPriorityDot = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "normal":
        return "bg-blue-500"
      default:
        return "bg-slate-500"
    }
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50 p-4 sm:p-8 transition-opacity duration-700 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                <Package className="w-8 h-8 text-white" />
              </div>
              Inventory Requests
            </h1>
            <p className="text-slate-600 mt-2">Review and manage pending inventory requests</p>
          </div>
          {requestGroups.length > 0 && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-4 py-2 text-lg">
              {requestGroups.reduce((acc, g) => acc + g.totalItems, 0)} Pending
            </Badge>
          )}
        </div>

        {/* Request Groups */}
        <div className="space-y-4">
          {requestGroups.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 bg-white/50 backdrop-blur-sm">
              <CardContent className="py-16 text-center">
                <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg">No pending requests</p>
                <p className="text-slate-400 text-sm mt-2">All caught up! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            requestGroups.map((group, index) => {
              const isExpanded = expandedGroups.has(group.groupId)
              const highestPriority = group.requests.reduce((max, r) => {
                const priorities = { urgent: 3, high: 2, normal: 1, low: 0 }
                return (priorities[r.priority] || 0) > (priorities[max] || 0) ? r.priority : max
              }, "low")

              return (
                <Card
                  key={group.groupId}
                  className="border-none shadow-xl bg-white hover:shadow-2xl transition-all duration-300 overflow-hidden group animate-in slide-in-from-top-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Card Header */}
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200 pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Priority Indicator */}
                        <div className={`p-3 rounded-xl ${getPriorityColor(highestPriority)} border-2 shadow-sm`}>
                          <div className={`w-3 h-3 rounded-full ${getPriorityDot(highestPriority)} animate-pulse`}></div>
                        </div>

                        {/* Request Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-800">
                              Request #{group.groupId.split("-")[1].slice(0, 8)}
                            </h3>
                            <Badge className={`${getPriorityColor(highestPriority)} border capitalize`}>
                              {highestPriority}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="font-medium">{group.requester?.name || "Unknown"}</span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500">{group.requester?.department || "Kitchen"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(group.timestamp).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4" />
                              <span className="font-semibold text-blue-600">{group.totalItems} Item(s)</span>
                            </div>
                          </div>
                        </div>

                        {/* Expand Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroup(group.groupId)}
                          className="hover:bg-blue-100 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-600" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Card Content */}
                  <CardContent className="p-6">
                    {/* Items List */}
                    {isExpanded && (
                      <div className="mb-6 space-y-3 animate-in fade-in-50 slide-in-from-top-2">
                        {group.requests.map((request, idx) => (
                          <div
                            key={request.id}
                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border-2 border-slate-200 hover:border-blue-300 transition-all duration-200"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-slate-800">{request.item_name}</div>
                              {request.reason && (
                                <div className="text-sm text-slate-600 mt-1 flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                                  <span>{request.reason}</span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{request.quantity}</div>
                              <div className="text-xs text-slate-500">{request.unit || "units"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        onClick={() => approveGroup(group)}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Approve All ({group.totalItems})
                      </Button>
                      <Button
                        onClick={() => rejectGroup(group)}
                        disabled={loading}
                        variant="destructive"
                        className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Reject All
                      </Button>
                    </div>

                    {!isExpanded && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGroup(group.groupId)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          View {group.totalItems} item(s) details
                          <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}