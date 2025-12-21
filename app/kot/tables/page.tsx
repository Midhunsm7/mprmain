import React from "react";
import TableTile from "../components/TableTile";
import { supabaseServer } from "@/lib/supabaseServer";
import { KOTOrder } from "@/lib/types/kot";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  PlusCircle, 
  RefreshCw, 
  Users, 
  Coffee, 
  ShoppingBag, 
  BarChart3, 
  Filter,
  Home,
  Bell,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type TableMap = Record<number, KOTOrder | null>;

async function fetchOpenOrdersForTables(): Promise<TableMap> {
  const { data: orders, error } = await supabaseServer
    .from("kot_orders")
    .select("*")
    .in("status", ["open", "ready"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load kot orders", error);
    return {};
  }

  const map: TableMap = {};
  for (let i = 1; i <= 12; i++) map[i] = null;

  (orders ?? []).forEach((o: any) => {
    const t = o.table_or_room;
    if (!t) return;
    const match = t.match(/^T(\d+)$/i);
    if (!match) return;
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 12) map[num] = o as KOTOrder;
  });

  return map;
}

async function fetchStats() {
  const { data: orders, error } = await supabaseServer
    .from("kot_orders")
    .select("status, total_amount")
    .gte("created_at", new Date().toISOString().split('T')[0]);

  if (error) return { occupied: 0, revenue: 0, activeOrders: 0 };

  const occupied = orders?.filter(o => o.status !== 'completed').length || 0;
  const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const activeOrders = orders?.length || 0;

  return { occupied, revenue, activeOrders };
}

export default async function TablesPage() {
  const tableMap = await fetchOpenOrdersForTables();
  const stats = await fetchStats();
  const occupiedTables = Object.values(tableMap).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 rounded-lg">
              <Coffee className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Tables</h1>
              <p className="text-gray-600 mt-1">Manage orders across 12 dining tables</p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">{12 - occupiedTables} Available</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="font-medium">{occupiedTables} Occupied</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="font-medium">{stats.activeOrders} Active Orders</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Link href="/kot/tables">
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </Link>
          </div>
          
          <div className="flex gap-2">
            <Link href="/kot/order/new">
              <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <PlusCircle className="h-4 w-4" />
                New Order
              </Button>
            </Link>
            <Link href="/kot/order/new">
              <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50">
                <ShoppingBag className="h-4 w-4" />
                Takeaway
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Occupied Tables</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-bold text-gray-900">{occupiedTables}</span>
                  <span className="text-gray-500">/ 12</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {Math.round((occupiedTables / 12) * 100)}% occupancy
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  ₹{stats.revenue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  From {stats.activeOrders} orders
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Active Orders</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.activeOrders}</p>
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-orange-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((occupiedTables / 12) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Table Layout</h2>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-8">
        {Array.from({ length: 12 }).map((_, idx) => {
          const tableNumber = idx + 1;
          const order = tableMap[tableNumber] ?? null;
          
          // Determine table type based on number (for variety)
          const tableTypes = ['regular', 'booth', 'family', 'bar', 'outdoor'] as const;
          const tableType = tableTypes[tableNumber % 5];
          const capacity = [2, 4, 6, 4, 8, 4, 6, 2, 4, 6, 8, 4][tableNumber - 1];
          const section = tableNumber <= 4 ? 'Main Hall' : tableNumber <= 8 ? 'Terrace' : 'Private';
          
          return (
            <React.Fragment key={tableNumber}>
              <TableTile 
                tableNumber={tableNumber}
                order={order}
                capacity={capacity}
                guests={order ? Math.floor(Math.random() * capacity) + 1 : 0}
                section={section}
                tableType={tableType}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend & Help */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-dashed">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Table Status Guide</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span className="text-sm">Ordered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">Preparing</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm">Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Served</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">
                Need help? <Link href="/help" className="text-blue-600 hover:underline">View guide</Link>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Click any table to manage orders
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            <p>Restaurant POS System v2.0</p>
            <p className="text-xs mt-1">Real-time table management</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/kot/history" className="hover:text-blue-600 hover:underline">
              Order History
            </Link>
            <Link href="/kot/analytics" className="hover:text-blue-600 hover:underline">
              Analytics
            </Link>
            <Link href="/kot/settings" className="hover:text-blue-600 hover:underline">
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}