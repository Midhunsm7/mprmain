"use client";

import React, { useEffect, useState } from "react"; 
import { supabase } from "@/lib/supabaseClient";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import {
  Shield,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Key,
  Database,
  Clock,
  ChevronDown,
  ChevronUp,
  Globe,
  Terminal,
  MoreVertical,
  Copy,
  ExternalLink
} from "lucide-react";

type AuditLog = {
  id: number;
  actor_uuid: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  table_name: string | null;
  record_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

type ActionType = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "OTHER";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());
  const [timeRange, setTimeRange] = useState<string>("all");
  const [liveUpdates, setLiveUpdates] = useState(true);

  // Action types for filtering
  const actionTypes = ["all", "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "OTHER"];

  // Role Check based on staff_roles
  async function checkAccess(): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      setUnauthorized(true);
      return false;
    }

    const userId = auth.user.id;

    // Get role IDs assigned to this staff
    const { data: staffRoleRows, error: staffRoleErr } = await supabase
      .from("staff_roles")
      .select("role_id")
      .eq("staff_id", userId);

    if (staffRoleErr || !staffRoleRows?.length) {
      setUnauthorized(true);
      return false;
    }

    const roleIds = staffRoleRows.map((r) => r.role_id);

    // Get roles with those IDs
    const { data: roleRows, error: rolesErr } = await supabase
      .from("roles")
      .select("name")
      .in("id", roleIds);

    if (rolesErr || !roleRows?.length) {
      setUnauthorized(true);
      return false;
    }

    const roleNames = roleRows.map((r) => r.name);

    if (!roleNames.includes("superadmin")) {
      setUnauthorized(true);
      return false;
    }

    return true;
  }

  async function fetchAuditLogs() {
    const res = await fetch(`/api/audit?limit=500&timeRange=${timeRange}`);
    const data = await res.json();
    if (Array.isArray(data)) setLogs(data as AuditLog[]);
    setLoading(false);
  }

  // Toggle log details expansion
  const toggleLogExpansion = (logId: number) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(logId)) {
        newSet.delete(logId);
      } else {
        newSet.add(logId);
      }
      return newSet;
    });
  };

  // Get action icon and color
  const getActionInfo = (action: string) => {
    switch(action.toUpperCase()) {
      case "CREATE":
        return { icon: <CheckCircle className="h-4 w-4" />, color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "UPDATE":
        return { icon: <AlertCircle className="h-4 w-4" />, color: "bg-amber-100 text-amber-700 border-amber-200" };
      case "DELETE":
        return { icon: <XCircle className="h-4 w-4" />, color: "bg-red-100 text-red-700 border-red-200" };
      case "LOGIN":
        return { icon: <Key className="h-4 w-4" />, color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "LOGOUT":
        return { icon: <Key className="h-4 w-4" />, color: "bg-indigo-100 text-indigo-700 border-indigo-200" };
      default:
        return { icon: <Terminal className="h-4 w-4" />, color: "bg-gray-100 text-gray-700 border-gray-200" };
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const allowed = await checkAccess();
      if (!allowed) return;

      await fetchAuditLogs();

      if (liveUpdates) {
        channel = supabase
          .channel("audit-logs-stream")
          .on<RealtimePostgresChangesPayload<AuditLog>>(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "audit_logs" },
            (payload) => {
              if (payload.new) {
                setLogs((prev) => [payload.new as AuditLog, ...prev.slice(0, 499)]);
              }
            }
          )
          .subscribe();
      }
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [liveUpdates, timeRange]);

  // Filter logs based on search, action, and table
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchQuery === "" ||
      log.actor_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor_role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.table_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.record_id?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = selectedAction === "all" || log.action === selectedAction;
    const matchesTable = selectedTable === "all" || log.table_name === selectedTable;

    return matchesSearch && matchesAction && matchesTable;
  });

  // Get unique tables for filter
  const tables = ["all", ...new Set(logs.map(log => log.table_name).filter(Boolean) as string[])];

  if (loading)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading audit logs…</p>
        </div>
      </div>
    );

  if (unauthorized)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You do not have the required permissions to view audit logs. Superadmin access is required.
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl hover:from-gray-800 hover:to-gray-600 transition-all duration-200 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Audit Logs
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Real-time security monitoring and activity tracking
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <div className={`h-2 w-2 rounded-full ${liveUpdates ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>{liveUpdates ? 'Live Updates' : 'Updates Paused'}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                {filteredLogs.length} logs found
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLiveUpdates(!liveUpdates)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 font-medium ${
                liveUpdates
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${liveUpdates ? 'bg-emerald-500' : 'bg-gray-400'}`}></div>
              <span>Live {liveUpdates ? 'On' : 'Off'}</span>
            </button>

            <button
              onClick={fetchAuditLogs}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all duration-200 font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gray-900 to-gray-700 hover:from-gray-800 hover:to-gray-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Total Logs</div>
                <div className="text-3xl font-bold text-gray-800">{logs.length}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Unique Users</div>
                <div className="text-3xl font-bold text-gray-800">
                  {new Set(logs.map(l => l.actor_email).filter(Boolean)).size}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
                <User className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Tables Monitored</div>
                <div className="text-3xl font-bold text-gray-800">
                  {new Set(logs.map(l => l.table_name).filter(Boolean)).size}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <Terminal className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Most Active</div>
                <div className="text-2xl font-bold text-gray-800 truncate">
                  {(() => {
                    const emails = logs.map(l => l.actor_email).filter(Boolean);
                    const counts = emails.reduce((acc: Record<string, number>, email) => {
                      acc[email!] = (acc[email!] || 0) + 1;
                      return acc;
                    }, {});
                    const mostActive = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
                    return mostActive ? mostActive[0].split('@')[0] : '-';
                  })()}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center w-full md:w-auto">
              <div className="relative flex-1 md:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs by user, action, table, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
                >
                  {actionTypes.map(action => (
                    <option key={action} value={action}>
                      {action === "all" ? "All Actions" : action}
                    </option>
                  ))}
                </select>
              </div>
              
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
              >
                {tables.map(table => (
                  <option key={table} value={table}>
                    {table === "all" ? "All Tables" : table}
                  </option>
                ))}
              </select>
              
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-gray-700" />
              <h2 className="text-xl font-bold text-gray-800">Activity Timeline</h2>
            </div>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Time</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Action</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Table</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Record ID</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IP Address</th>
                <th className="p-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Database className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Audit Logs Found</h3>
                    <p className="text-gray-500">
                      {searchQuery || selectedAction !== "all" || selectedTable !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "No audit logs have been recorded yet"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  const isExpanded = expandedLogs.has(log.id);

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`group hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                        onClick={() => toggleLogExpansion(log.id)}
                      >
                        <td className="p-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleLogExpansion(log.id);
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {new Date(log.created_at).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(log.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.actor_email || 'System'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.actor_role || 'Unknown Role'}
                            </div>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${actionInfo.color}`}>
                              {actionInfo.icon}
                              {log.action}
                            </span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Database className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {log.table_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        
                        <td className="p-4">
                          {log.record_id ? (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded">
                                {log.record_id.slice(0, 8)}...
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(log.record_id!);
                                }}
                                className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy ID"
                              >
                                <Copy className="h-3 w-3 text-gray-500" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        
                        <td className="p-4">
                          {log.ip_address ? (
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-mono text-gray-900">
                                {log.ip_address}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        
                        <td className="p-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleLogExpansion(log.id);
                            }}
                            className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                              isExpanded ? 'text-indigo-600' : 'text-gray-600 hover:text-indigo-600'
                            }`}
                          >
                            <Eye className="h-4 w-4" />
                            {isExpanded ? 'Hide Details' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-blue-50/30">
                          <td colSpan={7} className="p-4 border-t border-blue-100">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">Full Details</h4>
                                <button
                                  onClick={() => copyToClipboard(JSON.stringify(log.details, null, 2))}
                                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                >
                                  <Copy className="h-3 w-3" />
                                  Copy JSON
                                </button>
                              </div>
                              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <pre className="text-xs p-4 overflow-auto max-h-64">
                                  {JSON.stringify(log.details || {}, null, 2)}
                                </pre>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-500">Log ID</div>
                                  <div className="font-mono">{log.id}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Actor UUID</div>
                                  <div className="font-mono truncate">{log.actor_uuid || '-'}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Timestamp</div>
                                  <div>{new Date(log.created_at).toISOString()}</div>
                                </div>
                                <div>
                                  <div className="text-gray-500">Record ID</div>
                                  <div className="font-mono truncate">{log.record_id || '-'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination/Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {Math.min(filteredLogs.length, 50)} of {filteredLogs.length} logs
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm">
              1
            </button>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              2
            </button>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Floating Stats */}
      <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{logs.length}</div>
            <div className="text-xs text-gray-500">Total Logs</div>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {new Set(logs.map(l => l.actor_email).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-500">Users</div>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">
              {new Set(logs.map(l => l.table_name).filter(Boolean)).size}
            </div>
            <div className="text-xs text-gray-500">Tables</div>
          </div>
        </div>
      </div>
    </div>
  );
}