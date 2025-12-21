"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  ChefHat, 
  Calendar, 
  Filter, 
  Download, 
  BarChart3,
  DollarSign,
  Package,
  TrendingDown,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StaffMealLog = {
  id: string;
  staff_id: string;
  staff: { name: string; department: string };
  item_name: string;
  quantity: number;
  price: number;
  department: string;
  meal_type: string;
  consumed_at: string;
  approved_by_staff: { name: string };
  notes: string;
};

type SummaryItem = {
  staff_id: string;
  name: string;
  department: string;
  total_items: number;
  total_amount: number;
  meals: any[];
};

export default function StaffMealsPage() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{
    date: string;
    logs: StaffMealLog[];
    summary: SummaryItem[];
    total_meals: number;
    total_amount: number;
  } | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date });
      if (department && department !== "all") params.append('department', department);
      
      const res = await fetch(`/api/kot/staff-meals/report?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setReport(data);
      }
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date, department]);

  const exportToCSV = () => {
    if (!report) return;
    
    const headers = ['Staff Name', 'Department', 'Item', 'Quantity', 'Price', 'Total', 'Meal Type', 'Time', 'Approved By', 'Notes'];
    const rows = report.logs.map(log => [
      log.staff?.name || 'Unknown',
      log.department,
      log.item_name,
      log.quantity,
      `₹${log.price}`,
      `₹${(log.price * log.quantity)}`,
      log.meal_type,
      new Date(log.consumed_at).toLocaleTimeString(),
      log.approved_by_staff?.name || 'Unknown',
      log.notes || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `staff-meals-${date}.csv`;
    a.click();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
              <ChefHat className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Staff Meals Report</h1>
              <p className="text-gray-600">Track non-chargeable employee meals</p>
            </div>
          </div>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Kitchen">Kitchen</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Housekeeping">Housekeeping</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadReport} disabled={loading} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Staff Meals</p>
                  <p className="text-2xl font-bold mt-2">{report.total_meals}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold mt-2">
                    ₹{report.total_amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-green-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Staff Members</p>
                  <p className="text-2xl font-bold mt-2">{report.summary.length}</p>
                </div>
                <Package className="h-10 w-10 text-purple-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. per Staff</p>
                  <p className="text-2xl font-bold mt-2">
                    ₹{report.summary.length > 0 
                      ? Math.round(report.total_amount / report.summary.length).toLocaleString('en-IN')
                      : 0}
                  </p>
                </div>
                <TrendingDown className="h-10 w-10 text-amber-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Summary Table */}
      {report && report.summary.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Staff Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">Staff Name</th>
                    <th className="p-3 text-left">Department</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3 text-right">Total Value</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {report.summary.map((staff, idx) => (
                    <motion.tr
                      key={staff.staff_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">{staff.name}</td>
                      <td className="p-3">
                        <Badge variant="outline">{staff.department}</Badge>
                      </td>
                      <td className="p-3 text-center">{staff.total_items}</td>
                      <td className="p-3 text-right font-bold">
                        ₹{staff.total_amount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="outline" size="sm" onClick={() => {
                          // Show detailed modal
                          console.log('Show details for:', staff.name);
                        }}>
                          View Details
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Logs */}
      {report && report.logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Consumption Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.logs.map((log, idx) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg">
                      <ChefHat className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.staff?.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {log.department}
                        </Badge>
                        <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                          {log.meal_type}
                        </Badge>
                      </div>
                      <p className="text-gray-600">{log.item_name} × {log.quantity}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(log.consumed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">₹{(log.price * log.quantity).toLocaleString('en-IN')}</p>
                    <p className="text-sm text-gray-500">
                      Approved by: {log.approved_by_staff?.name}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && report && report.logs.length === 0 && (
        <div className="text-center py-12">
          <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">No Staff Meals Recorded</h3>
          <p className="text-gray-500">No non-chargeable meals found for {date}</p>
        </div>
      )}
    </div>
  );
}