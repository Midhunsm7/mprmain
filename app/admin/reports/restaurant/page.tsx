"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, TrendingUp, ShoppingCart, DollarSign, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ItemSale {
  item_name: string;
  category: string;
  quantity: number;
  price: number;
  total: number;
  prepared?: number;
  sold?: number;
  wastage?: number;
}

interface CategorySummary {
  category: string;
  items: ItemSale[];
  totalQuantity: number;
  totalPrepared: number;
  totalSold: number;
  totalWastage: number;
  totalAmount: number;
}

export default function RestaurantAdminDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [categorySales, setCategorySales] = useState<CategorySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  async function loadSummary() {
    setLoading(true);
    try {
      // Load category sales first to calculate actual revenue
      await loadCategorySales();
      
      // Then load API summary data
      const res = await fetch("/api/admin/restaurant/summary");
      const data = await res.json();
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    }
    setLoading(false);
  }

  async function loadCategorySales() {
    try {
      // Get all active dishes with their details
      const { data: allDishes, error: dishesError } = await supabase
        .from("dishes")
        .select("*")
        .eq("active", true)
        .order("category", { ascending: true });

      if (dishesError) throw dishesError;

      // Get all closed orders with items for the selected date
      const { data: orders, error: ordersError } = await supabase
        .from("kot_orders")
        .select(`
          id,
          created_at,
          status,
          total,
          billing_type,
          order_type,
          table_no,
          kot_items (
            id,
            item_name,
            quantity,
            price,
            total,
            billing_type,
            dish_id,
            dishes (
              id,
              name,
              category,
              base_price,
              gst_percentage
            )
          )
        `)
        .gte("created_at", `${selectedDate}T00:00:00`)
        .lte("created_at", `${selectedDate}T23:59:59`)
        .eq("status", "closed");

      if (ordersError) throw ordersError;

      // Get kitchen daily reports for the same date
      const { data: kitchenReports, error: reportsError } = await supabase
        .from("kitchen_daily_report")
        .select("*")
        .eq("date", selectedDate);

      if (reportsError) throw reportsError;

      // Create a map of kitchen reports by dish name
      const reportsMap = new Map();
      kitchenReports?.forEach((report: any) => {
        reportsMap.set(report.dish_name, {
          prepared: report.prepared_quantity,
          sold: report.sold_quantity,
          wastage: report.wastage,
          cost: report.cost_estimate,
        });
      });

      // Store all dishes info for Excel export
      (window as any).allDishesData = allDishes;

      // Process and group by category
      const categoryMap = new Map<string, ItemSale[]>();

      orders?.forEach((order) => {
        order.kot_items?.forEach((item: any) => {
          const category = item.dishes?.category || "Uncategorized";
          const reportData = reportsMap.get(item.item_name);
          
          const itemSale: ItemSale = {
            item_name: item.item_name,
            category: category,
            quantity: item.quantity,
            price: parseFloat(item.price || 0),
            total: parseFloat(item.total || 0),
            prepared: reportData?.prepared || 0,
            sold: reportData?.sold || 0,
            wastage: reportData?.wastage || 0,
          };

          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          
          // Check if item already exists in category
          const existingItems = categoryMap.get(category)!;
          const existingItem = existingItems.find(
            (i) => i.item_name === item.item_name
          );

          if (existingItem) {
            existingItem.quantity += item.quantity;
            existingItem.total += parseFloat(item.total || 0);
            // Keep the max prepared/sold/wastage from kitchen reports
            if (reportData) {
              existingItem.prepared = Math.max(existingItem.prepared || 0, reportData.prepared);
              existingItem.sold = Math.max(existingItem.sold || 0, reportData.sold);
              existingItem.wastage = Math.max(existingItem.wastage || 0, reportData.wastage);
            }
          } else {
            categoryMap.get(category)!.push(itemSale);
          }
        });
      });

      // Convert to CategorySummary array
      const categorySummaries: CategorySummary[] = Array.from(
        categoryMap.entries()
      ).map(([category, items]) => ({
        category,
        items: items.sort((a, b) => b.total - a.total),
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        totalPrepared: items.reduce((sum, item) => sum + (item.prepared || 0), 0),
        totalSold: items.reduce((sum, item) => sum + (item.sold || 0), 0),
        totalWastage: items.reduce((sum, item) => sum + (item.wastage || 0), 0),
        totalAmount: items.reduce((sum, item) => sum + item.total, 0),
      }));

      setCategorySales(categorySummaries.sort((a, b) => b.totalAmount - a.totalAmount));
    } catch (error) {
      console.error("Error loading category sales:", error);
    }
  }

  useEffect(() => {
    loadSummary();

    const channel = supabase
      .channel("kot-orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kot_orders" },
        () => loadSummary()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "kitchen_daily_report" },
        () => loadSummary()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [selectedDate]);

  const exportToExcel = () => {
    // Check if there's data to export
    if (categorySales.length === 0) {
      alert("No sales data to export for this date");
      return;
    }

    const wb = XLSX.utils.book_new();

    // ============= SUMMARY SHEET =============
    const summaryData = [
      ["RESTAURANT SALES REPORT"],
      [""],
      ["Report Date:", selectedDate],
      ["Generated On:", new Date().toLocaleString('en-IN')],
      [""],
      [""],
      ["SUMMARY METRICS"],
      [""],
      ["Metric", "Value"],
      ["Total Revenue", actualRevenue.toFixed(2)],
      ["GST Collected", actualGst.toFixed(2)],
      ["Total Items Sold", totalItems],
      ["Total Items Prepared", totalPrepared],
      ["Total Wastage", totalWastage],
      [""],
      ["ORDER DETAILS"],
      [""],
      ["Type", "Count"],
      ["Closed Orders", summary?.closedOrders || 0],
      ["Open Orders", summary?.openOrders || 0],
      ["Total Categories", categorySales.length],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Styling for summary sheet
    ws1["!cols"] = [{ wch: 25 }, { wch: 20 }];
    
    // Merge cells for title
    ws1["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Title row
      { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // Summary metrics header
      { s: { r: 15, c: 0 }, e: { r: 15, c: 1 } }, // Order details header
    ];
    
    XLSX.utils.book_append_sheet(wb, ws1, "Summary");

    // ============= CATEGORY SALES SHEET =============
    const detailedData: any[][] = [
      ["CATEGORY-WISE SALES BREAKDOWN"],
      [""],
      ["Category", "Item Name", "Qty Sold", "Prepared", "Actual Sold", "Wastage", "Unit Price", "Total Amount"],
      [],
    ];

    let exportGrandTotal = 0;
    let exportTotalQty = 0;
    let exportTotalPrepared = 0;
    let exportTotalSold = 0;
    let exportTotalWastage = 0;
    
    let currentRow = 4; // Track row for merging

    categorySales.forEach((category, catIndex) => {
      // Category header with summary
      detailedData.push([
        `${category.category.toUpperCase()}`,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]);
      
      detailedData.push([
        "Category Summary:",
        `${category.items.length} items`,
        `${category.totalQuantity} qty`,
        `${category.totalPrepared} prepared`,
        `${category.totalSold} sold`,
        `${category.totalWastage} wasted`,
        "",
        category.totalAmount.toFixed(2),
      ]);
      
      // Empty row before items
      detailedData.push(["", "", "", "", "", "", "", ""]);

      // Items in category
      category.items.forEach((item, itemIndex) => {
        detailedData.push([
          itemIndex === 0 ? "" : "", // Empty category column for items
          item.item_name,
          item.quantity,
          item.prepared || 0,
          item.sold || 0,
          item.wastage || 0,
          item.price.toFixed(2),
          item.total.toFixed(2),
        ]);
      });

      // Category total row
      detailedData.push([
        "",
        "Category Total →",
        category.totalQuantity,
        category.totalPrepared,
        category.totalSold,
        category.totalWastage,
        "",
        category.totalAmount.toFixed(2),
      ]);
      
      // Double empty row between categories
      detailedData.push(["", "", "", "", "", "", "", ""]);
      detailedData.push(["", "", "", "", "", "", "", ""]);
      
      exportGrandTotal += category.totalAmount;
      exportTotalQty += category.totalQuantity;
      exportTotalPrepared += category.totalPrepared;
      exportTotalSold += category.totalSold;
      exportTotalWastage += category.totalWastage;
    });

    // Grand totals section
    detailedData.push(["", "", "", "", "", "", "", ""]);
    detailedData.push([
      "GRAND TOTAL",
      "",
      exportTotalQty,
      exportTotalPrepared,
      exportTotalSold,
      exportTotalWastage,
      "",
      exportGrandTotal.toFixed(2),
    ]);

    const ws2 = XLSX.utils.aoa_to_sheet(detailedData);
    
    // Set column widths
    ws2["!cols"] = [
      { wch: 22 }, // Category
      { wch: 35 }, // Item Name
      { wch: 12 }, // Quantity Sold
      { wch: 12 }, // Prepared
      { wch: 12 }, // Actual Sold
      { wch: 12 }, // Wastage
      { wch: 12 }, // Unit Price
      { wch: 15 }, // Total Amount
    ];

    // Merge title row
    ws2["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // Title
    ];

    XLSX.utils.book_append_sheet(wb, ws2, "Category Sales");

    // ============= ALL ITEMS SHEET (SIMPLIFIED) =============
    const itemsData: any[][] = [
      ["COMPLETE ITEMS LIST"],
      [""],
      ["Item Name", "Category", "Quantity", "Unit Price", "Total Amount"],
      [],
    ];

    let itemsTotal = 0;

    categorySales.forEach((category) => {
      category.items.forEach((item) => {
        itemsData.push([
          item.item_name,
          category.category,
          item.quantity,
          item.price.toFixed(2),
          item.total.toFixed(2),
        ]);
        itemsTotal += item.total;
      });
    });

    // Total row
    itemsData.push(["", "", "", "", ""]);
    itemsData.push([
      "TOTAL",
      "",
      totalItems,
      "",
      itemsTotal.toFixed(2),
    ]);

    const ws3 = XLSX.utils.aoa_to_sheet(itemsData);
    ws3["!cols"] = [
      { wch: 35 }, // Item Name
      { wch: 20 }, // Category
      { wch: 12 }, // Quantity
      { wch: 12 }, // Unit Price
      { wch: 15 }, // Total Amount
    ];
    
    // Merge title
    ws3["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws3, "All Items");

    // ============= MENU MASTER SHEET (ALL DISHES) =============
    const allDishes = (window as any).allDishesData || [];
    
    // Create a map of sales by dish name
    const salesMap = new Map();
    categorySales.forEach((category) => {
      category.items.forEach((item) => {
        salesMap.set(item.item_name, {
          quantity: item.quantity,
          total: item.total,
          prepared: item.prepared,
          sold: item.sold,
          wastage: item.wastage,
        });
      });
    });

    const menuData: any[][] = [
      ["COMPLETE MENU MASTER WITH SALES"],
      [""],
      ["Dish Name", "Category", "Base Price", "GST %", "Status", "Qty Sold", "Revenue", "Prepared", "Kitchen Sold", "Wastage"],
      [],
    ];

    let menuTotal = 0;
    let menuQty = 0;

    // Group dishes by category
    const dishesByCategory = new Map();
    allDishes.forEach((dish: any) => {
      const cat = dish.category || "Uncategorized";
      if (!dishesByCategory.has(cat)) {
        dishesByCategory.set(cat, []);
      }
      dishesByCategory.get(cat).push(dish);
    });

    // Add dishes category by category
    Array.from(dishesByCategory.entries()).forEach(([category, dishes]: [string, any]) => {
      // Category header
      menuData.push([category.toUpperCase(), "", "", "", "", "", "", "", "", ""]);
      
      (dishes as any[]).forEach((dish: any) => {
        const salesData = salesMap.get(dish.name);
        const qtySold = salesData?.quantity || 0;
        const revenue = salesData?.total || 0;
        
        menuData.push([
          dish.name,
          category,
          dish.base_price?.toFixed(2) || "0.00",
          dish.gst_percentage || 0,
          dish.active ? "Active" : "Inactive",
          qtySold,
          revenue.toFixed(2),
          salesData?.prepared || 0,
          salesData?.sold || 0,
          salesData?.wastage || 0,
        ]);

        if (qtySold > 0) {
          menuTotal += revenue;
          menuQty += qtySold;
        }
      });

      menuData.push(["", "", "", "", "", "", "", "", "", ""]);
    });

    // Total row
    menuData.push(["", "", "", "", "", "", "", "", "", ""]);
    menuData.push([
      "TOTAL",
      "",
      "",
      "",
      "",
      menuQty,
      menuTotal.toFixed(2),
      "",
      "",
      "",
    ]);

    const ws4 = XLSX.utils.aoa_to_sheet(menuData);
    ws4["!cols"] = [
      { wch: 30 }, // Dish Name
      { wch: 20 }, // Category
      { wch: 12 }, // Base Price
      { wch: 10 }, // GST %
      { wch: 10 }, // Status
      { wch: 12 }, // Qty Sold
      { wch: 15 }, // Revenue
      { wch: 12 }, // Prepared
      { wch: 12 }, // Kitchen Sold
      { wch: 12 }, // Wastage
    ];
    
    // Merge title
    ws4["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
    ];
    
    XLSX.utils.book_append_sheet(wb, ws4, "Menu Master");

    // Generate file
    XLSX.writeFile(
      wb,
      `Restaurant_Sales_${selectedDate.replace(/-/g, "")}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const grandTotal = categorySales.reduce((sum, cat) => sum + cat.totalAmount, 0);
  const totalItems = categorySales.reduce((sum, cat) => sum + cat.totalQuantity, 0);
  const totalPrepared = categorySales.reduce((sum, cat) => sum + cat.totalPrepared, 0);
  const totalWastage = categorySales.reduce((sum, cat) => sum + cat.totalWastage, 0);
  
  // Calculate actual revenue from category sales (this is the real revenue)
  const actualRevenue = grandTotal;
  const actualGst = summary?.gst || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Restaurant Sales Report</h1>
          <p className="text-gray-600 mt-1">Category-wise sales analysis with kitchen production data</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="outline-none"
            />
          </div>
          <Button onClick={loadSummary} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Today's Revenue"
          value={`₹${actualRevenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="bg-green-500"
        />
        <StatCard
          label="Items Sold"
          value={totalItems}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Prepared"
          value={totalPrepared}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-purple-500"
        />
        <StatCard
          label="Total Wastage"
          value={totalWastage}
          icon={<TrendingUp className="h-5 w-5" />}
          color="bg-red-500"
        />
        <StatCard
          label="GST Collected"
          value={`₹${actualGst.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          color="bg-orange-500"
        />
      </div>

      {/* Category Sales Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Category-wise Sales Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="all">All Categories</TabsTrigger>
              {categorySales.map((cat) => (
                <TabsTrigger key={cat.category} value={cat.category}>
                  {cat.category}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {categorySales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">No sales data for this date</p>
                </div>
              ) : (
                <>
                  {categorySales.map((category) => (
                    <CategoryCard key={category.category} category={category} />
                  ))}
                  <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Grand Total</span>
                        <div className="text-2xl font-bold text-blue-600">
                          ₹{grandTotal.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Items</span>
                        <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Prepared</span>
                        <div className="text-2xl font-bold text-gray-900">{totalPrepared}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Wastage</span>
                        <div className="text-2xl font-bold text-red-600">{totalWastage}</div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {categorySales.map((category) => (
              <TabsContent key={category.category} value={category.category}>
                <CategoryCard category={category} expanded />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Orders List */}
      {summary?.orders && (
        <Card>
          <CardHeader>
            <CardTitle>Today's Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Order ID</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {summary.orders.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-xs">{order.id.slice(0, 8)}...</td>
                      <td className="px-4 py-3 font-semibold">
                        ₹{Number(order.total).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={order.status === "closed" ? "default" : "secondary"}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium">{label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({
  category,
  expanded = false,
}: {
  category: CategorySummary;
  expanded?: boolean;
}) {
  const efficiency = category.totalPrepared > 0 
    ? ((category.totalSold / category.totalPrepared) * 100).toFixed(1)
    : "0";

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">{category.category}</h3>
            <p className="text-blue-100 text-sm mt-1">
              {category.totalQuantity} items sold
              {category.totalPrepared > 0 && ` • ${category.totalPrepared} prepared`}
              {category.totalWastage > 0 && ` • ${category.totalWastage} wasted`}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">₹{category.totalAmount.toFixed(2)}</p>
            {category.totalPrepared > 0 && (
              <Badge className="mt-2 bg-white text-blue-600">
                {efficiency}% efficiency
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                Item Name
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Sold
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Prepared
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Wastage
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Price
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {category.items.map((item, idx) => {
              const itemEfficiency = item.prepared && item.prepared > 0
                ? ((item.sold || 0) / item.prepared * 100).toFixed(1)
                : null;

              return (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-900">{item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700 font-medium">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-700">
                    {item.prepared || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span
                      className={
                        item.wastage && item.wastage > 0
                          ? "text-red-600 font-medium"
                          : "text-gray-400"
                      }
                    >
                      {item.wastage || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-700">
                    ₹{item.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold text-gray-900">
                        ₹{item.total.toFixed(2)}
                      </span>
                      {itemEfficiency && (
                        <span className="text-xs text-gray-500">
                          {itemEfficiency}% eff.
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50 border-t-2">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">
                Category Total
              </td>
              <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                {category.totalQuantity}
              </td>
              <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">
                {category.totalPrepared}
              </td>
              <td className="px-4 py-3 text-sm text-center font-bold text-red-600">
                {category.totalWastage}
              </td>
              <td></td>
              <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                ₹{category.totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}