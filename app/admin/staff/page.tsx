"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Briefcase,
  Building,
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  Award,
  Shield,
  Trash2,
  Edit2,
  Plus,
  ChevronRight,
  Sparkles,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  Star,
  Download,
  RefreshCw
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*                           PRESET DEPARTMENTS                           */
/* ---------------------------------------------------------------------- */
const DEPARTMENTS = [
  "Front Desk",
  "Housekeeping",
  "Kitchen",
  "Maintenance",
  "Security",
  "Management",
  "HR",
  "Accounts",
  "Events & Booking",
  "Restaurant Service",
];

/* ---------------------------------------------------------------------- */
/*                               SPARKLINE                                */
/* ---------------------------------------------------------------------- */
function Sparkline({ values }: { values: number[] }) {
  const w = 80,
    h = 24;
  if (!values || values.length === 0)
    return (
      <div className="text-xs text-gray-400 flex items-center">
        <Clock className="w-3 h-3 mr-1" />
        No data
      </div>
    );

  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * h;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="drop-shadow-sm">
      <defs>
        <linearGradient id="sparkline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="url(#sparkline-gradient)"
        strokeWidth={2}
        points={points}
        className="animate-pulse-slow"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------------- */
/*                                PAGE                                    */
/* ---------------------------------------------------------------------- */
export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setRefreshing(true);
    setError(null);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fetch(`/api/staff/list?t=${Date.now()}`).then((r) => r.json()),
        fetch(`/api/roles?t=${Date.now()}`).then((r) => r.json())
      ]);
      setStaff(staffRes || []);
      setRoles(rolesRes || []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  async function deleteStaff(id: string) {
    if (!confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await fetch("/api/staff/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      load(); // Refresh the list
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete staff member");
    }
  }

  // Filter staff based on search and department
  const filteredStaff = staff.filter(s => {
    const matchesSearch = searchQuery === "" || 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDept = selectedDept === "all" || s.department === selectedDept;
    
    return matchesSearch && matchesDept;
  });

  // Get unique departments for filter
  const departments = ["all", ...new Set(staff.map(s => s.department).filter(Boolean))];

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={load}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Staff Management
                </h1>
                <p className="text-gray-500 text-sm md:text-base mt-1">
                  Manage your team, assign roles, and track performance
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span>Live Updates</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">
                Last synced: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {refreshing && (
                <span className="text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AddStaffButton onAdded={load} />
            <RoleCreator onCreate={load} />
            <button
              onClick={load}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-300 shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Total Staff</div>
                <div className="text-3xl font-bold text-gray-800">{staff.length}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {filteredStaff.length} visible
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Roles Available</div>
                <div className="text-3xl font-bold text-gray-800">{roles.length}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Departments</div>
                <div className="text-3xl font-bold text-gray-800">
                  {[...new Set(staff.map((s) => s.department).filter(Boolean))].length}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl">
                <Building className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-5 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-500 font-medium mb-1">Active Staff</div>
                <div className="text-3xl font-bold text-gray-800">
                  {staff.filter(s => s.status === 'active').length}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-50 rounded-xl">
                <CheckCircle className="h-6 w-6 text-amber-600" />
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
                  placeholder="Search staff by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl w-full md:w-96 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-gray-50 border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="all">All Departments</option>
                  {departments.filter(d => d !== "all").map((dept) => (
                    <option key={dept} value={dept}>{dept || "No Department"}</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  const dataStr = JSON.stringify(filteredStaff, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `staff_data_${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                <Download className="h-4 w-4" />
                <span className="font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Staff List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">No Staff Members Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchQuery || selectedDept !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Add your first staff member to get started"}
            </p>
            {!searchQuery && selectedDept === "all" && (
              <div className="mt-4">
                <AddStaffButton onAdded={load} />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredStaff.map((s) => (
              <div
                key={s.id}
                className="group bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                {/* Staff Card Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-xl font-bold">
                            {s.name?.split(' ').map((n: string) => n[0]).join('') || "NA"}
                          </span>
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'} rounded-full border-2 border-white flex items-center justify-center`}>
                          <CheckCircle className="h-3 w-3 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-700 transition-colors">
                          {s.name || "Unnamed Staff"}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Briefcase className="h-3 w-3 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {s.department || "No department assigned"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="text-sm text-gray-600 truncate max-w-xs">
                            {s.email || "No email provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-gray-500">ID</div>
                        <div className="text-sm font-mono text-gray-700">{s.employee_id || s.id?.substring(0, 8)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Staff Card Body */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        Assigned Roles
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Array.isArray(s.roles) && s.roles.length > 0 ? (
                          s.roles.map((r: any) => (
                            <span
                              key={r.roles?.id || r}
                              className="px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                            >
                              {r.roles?.name || r}
                            </span>
                          ))
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                            No roles assigned
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                        Performance
                      </div>
                      <Sparkline values={[Math.random() * 10, Math.random() * 10, Math.random() * 10, Math.random() * 10, Math.random() * 10]} />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <AssignRoleDropdown staff={s} roles={roles} onAssigned={load} />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a
                        href={`/admin/staff/${s.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </a>
                      
                      <button
                        onClick={() => deleteStaff(s.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-lg transition-all duration-200 font-medium text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Stats Bar */}
      {!loading && staff.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-slideUp">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{staff.length}</div>
              <div className="text-xs text-gray-500">Total Staff</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{roles.length}</div>
              <div className="text-xs text-gray-500">Roles</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">
                {[...new Set(staff.map((s) => s.department).filter(Boolean))].length}
              </div>
              <div className="text-xs text-gray-500">Departments</div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-pulse-slow {
          animation: pulseSlow 2s infinite;
        }
      `}</style>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                             ROLE CREATOR                               */
/* ---------------------------------------------------------------------- */
function RoleCreator({ onCreate }: { onCreate: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function create() {
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      await fetch("/api/roles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setName("");
      setOpen(false);
      onCreate();
    } catch (error) {
      console.error("Failed to create role:", error);
      alert("Failed to create role");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        <Plus className="h-4 w-4" />
        <span>Create Role</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Create New Role</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={creating}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Senior Manager, Team Lead..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  onKeyPress={(e) => e.key === 'Enter' && !creating && create()}
                  disabled={creating}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={!name.trim() || creating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------------------------------------------------------------------- */
/*                          ASSIGN ROLE DROPDOWN                          */
/* ---------------------------------------------------------------------- */
function AssignRoleDropdown({
  staff,
  roles,
  onAssigned,
}: {
  staff: any;
  roles: any[];
  onAssigned: () => void;
}) {
  const [sel, setSel] = useState("");
  const [assigning, setAssigning] = useState(false);

  async function assign() {
    if (!sel) return;

    setAssigning(true);
    try {
      await fetch("/api/staff/assign-role", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ staff_id: staff.id, role_id: sel }),
      });

      setSel("");
      onAssigned();
    } catch (error) {
      console.error("Failed to assign role:", error);
      alert("Failed to assign role");
    } finally {
      setAssigning(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm"
        disabled={assigning}
      >
        <option value="">Assign Role</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>

      <button
        onClick={assign}
        disabled={!sel || assigning}
        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-lg shadow-sm hover:shadow transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {assigning ? (
          <span className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
          </span>
        ) : "Assign"}
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*                          ADD STAFF MODAL                               */
/* ---------------------------------------------------------------------- */
function AddStaffButton({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
  });
  const [creating, setCreating] = useState(false);

  async function submit() {
    if (!form.name.trim()) return;
    
    setCreating(true);
    try {
      await fetch("/api/staff/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      setForm({ name: "", email: "", department: "" });
      setOpen(false);
      onAdded();
    } catch (error) {
      console.error("Failed to create staff:", error);
      alert("Failed to create staff member");
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
      >
        <UserPlus className="h-4 w-4" />
        <span>Add Staff</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Add New Staff</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={creating}
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter staff member's name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="staff@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={creating}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={creating}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                  <option value="custom">Other (Specify)</option>
                </select>
              </div>

              {form.department === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Department
                  </label>
                  <input
                    type="text"
                    placeholder="Enter custom department name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    disabled={creating}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all duration-200 font-medium disabled:opacity-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={!form.name.trim() || creating}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </span>
                ) : "Add Staff Member"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}