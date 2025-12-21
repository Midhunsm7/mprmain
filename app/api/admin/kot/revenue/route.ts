import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let dateFilter: { start: string; end: string };
    const today = new Date();
    
    switch (range) {
      case "today":
        dateFilter = {
          start: today.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        };
        break;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFilter = {
          start: weekStart.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        };
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFilter = {
          start: monthStart.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        };
        break;
      case "custom":
        if (!start || !end) {
          return NextResponse.json(
            { error: "Custom range requires start and end dates" },
            { status: 400 }
          );
        }
        dateFilter = { start, end };
        break;
      default:
        dateFilter = {
          start: today.toISOString().split("T")[0],
          end: today.toISOString().split("T")[0],
        };
    }

    // Get previous period data for comparison
    const getPreviousPeriod = (currentStart: string, currentEnd: string) => {
      const startDate = new Date(currentStart);
      const endDate = new Date(currentEnd);
      const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1;
      
      const prevStart = new Date(startDate);
      prevStart.setDate(startDate.getDate() - diffDays);
      
      const prevEnd = new Date(endDate);
      prevEnd.setDate(endDate.getDate() - diffDays);
      
      return {
        start: prevStart.toISOString().split("T")[0],
        end: prevEnd.toISOString().split("T")[0]
      };
    };

    const previousPeriod = getPreviousPeriod(dateFilter.start, dateFilter.end);

    // Fetch current period data from kot_bills with order details
    const { data: currentBills, error: currentError } = await supabaseServer
      .from("kot_bills")
      .select(`
        id,
        order_id,
        bill_number,
        subtotal,
        discount,
        service_charge,
        gst,
        total,
        payment_method,
        payment_status,
        paid_at,
        created_at,
        kot_orders!inner (
          order_type,
          table_no,
          kot_items (
            item_name,
            price,
            quantity
          )
        )
      `)
      .gte("created_at", `${dateFilter.start}T00:00:00`)
      .lte("created_at", `${dateFilter.end}T23:59:59`)
      .eq("payment_status", "paid");

    if (currentError) {
      console.error("Error fetching current bills:", currentError);
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    // Fetch previous period data for comparison
    const { data: previousBills } = await supabaseServer
      .from("kot_bills")
      .select(`
        total,
        kot_orders!inner (
          order_type
        )
      `)
      .gte("created_at", `${previousPeriod.start}T00:00:00`)
      .lte("created_at", `${previousPeriod.end}T23:59:59`)
      .eq("payment_status", "paid");

    // Process current period data
    const dineInBills = currentBills?.filter(bill => 
      bill.kot_orders?.order_type === "dine_in"
    ) || [];
    
    const takeawayBills = currentBills?.filter(bill => 
      bill.kot_orders?.order_type === "takeaway"
    ) || [];

    // Calculate revenue with proper breakdown
    const dineInRevenue = dineInBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const takeawayRevenue = takeawayBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const totalRevenue = dineInRevenue + takeawayRevenue;

    // Calculate GST
    const dineInGST = dineInBills.reduce((sum, bill) => sum + (bill.gst || 0), 0);
    const takeawayGST = takeawayBills.reduce((sum, bill) => sum + (bill.gst || 0), 0);
    const totalGST = dineInGST + takeawayGST;

    // Calculate subtotals (before GST)
    const dineInSubtotal = dineInBills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0);
    const takeawaySubtotal = takeawayBills.reduce((sum, bill) => sum + (bill.subtotal || 0), 0);
    const totalSubtotal = dineInSubtotal + takeawaySubtotal;

    // Calculate service charges
    const dineInServiceCharge = dineInBills.reduce((sum, bill) => sum + (bill.service_charge || 0), 0);
    const takeawayServiceCharge = takeawayBills.reduce((sum, bill) => sum + (bill.service_charge || 0), 0);
    const totalServiceCharge = dineInServiceCharge + takeawayServiceCharge;

    // Calculate discounts
    const dineInDiscount = dineInBills.reduce((sum, bill) => sum + (bill.discount || 0), 0);
    const takeawayDiscount = takeawayBills.reduce((sum, bill) => sum + (bill.discount || 0), 0);
    const totalDiscount = dineInDiscount + takeawayDiscount;

    // Process previous period data for comparison
    const previousDineInBills = previousBills?.filter(bill => 
      bill.kot_orders?.order_type === "dine_in"
    ) || [];
    
    const previousTakeawayBills = previousBills?.filter(bill => 
      bill.kot_orders?.order_type === "takeaway"
    ) || [];

    const previousDineInRevenue = previousDineInBills.reduce((sum, bill) => sum + (bill.total || 0), 0);
    const previousTakeawayRevenue = previousTakeawayBills.reduce((sum, bill) => sum + (bill.total || 0), 0);

    // Calculate percentage changes
    const dineInPercentageChange = previousDineInRevenue === 0 
      ? (dineInRevenue > 0 ? 100 : 0)
      : ((dineInRevenue - previousDineInRevenue) / previousDineInRevenue) * 100;

    const takeawayPercentageChange = previousTakeawayRevenue === 0
      ? (takeawayRevenue > 0 ? 100 : 0)
      : ((takeawayRevenue - previousTakeawayRevenue) / previousTakeawayRevenue) * 100;

    // Calculate average order values
    const dineInAvgOrderValue = dineInBills.length > 0 ? dineInRevenue / dineInBills.length : 0;
    const takeawayAvgOrderValue = takeawayBills.length > 0 ? takeawayRevenue / takeawayBills.length : 0;

    // Get top items from all kot_items
    const itemRevenue: Record<string, { revenue: number; count: number }> = {};
    
    // First, get all order IDs from current bills
    const orderIds = currentBills?.map(bill => bill.order_id).filter(id => id) || [];
    
    if (orderIds.length > 0) {
      // Fetch kot_items for these orders
      const { data: kotItems } = await supabaseServer
        .from("kot_items")
        .select(`
          item_name,
          price,
          quantity,
          order_id
        `)
        .in("order_id", orderIds);

      // Process item revenue
      kotItems?.forEach((item: any) => {
        const itemName = item.item_name;
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        
        if (!itemRevenue[itemName]) {
          itemRevenue[itemName] = { revenue: 0, count: 0 };
        }
        
        itemRevenue[itemName].revenue += itemTotal;
        itemRevenue[itemName].count += item.quantity || 1;
      });
    }

    const topItems = Object.entries(itemRevenue)
      .map(([name, stats]) => ({
        name,
        revenue: stats.revenue,
        count: stats.count
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get hourly data
    const hourlyData: Record<string, { dine_in: number; takeaway: number }> = {};
    
    currentBills?.forEach(bill => {
      const hour = new Date(bill.created_at).getHours();
      const hourKey = `${hour}:00`;
      
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = { dine_in: 0, takeaway: 0 };
      }
      
      const orderType = bill.kot_orders?.order_type;
      if (orderType === "dine_in") {
        hourlyData[hourKey].dine_in += bill.total || 0;
      } else if (orderType === "takeaway") {
        hourlyData[hourKey].takeaway += bill.total || 0;
      }
    });

    const hourlyArray = Object.entries(hourlyData)
      .map(([hour, data]) => ({
        hour,
        dine_in: data.dine_in,
        takeaway: data.takeaway
      }))
      .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

    // Get payment method breakdown
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    currentBills?.forEach(bill => {
      const method = bill.payment_method || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += bill.total || 0;
    });

    const paymentMethodBreakdown = Object.entries(paymentMethods)
      .map(([method, stats]) => ({
        method,
        count: stats.count,
        amount: stats.amount
      }))
      .sort((a, b) => b.amount - a.amount);

    // Format period string
    const formatPeriod = () => {
      if (range === "today") {
        return `Today (${new Date(dateFilter.start).toLocaleDateString("en-IN")})`;
      } else if (range === "week") {
        return `This Week (${new Date(dateFilter.start).toLocaleDateString("en-IN")} - ${new Date(dateFilter.end).toLocaleDateString("en-IN")})`;
      } else if (range === "month") {
        return `This Month (${new Date(dateFilter.start).toLocaleDateString("en-IN", { month: "long", year: "numeric" })})`;
      } else {
        return `${new Date(dateFilter.start).toLocaleDateString("en-IN")} - ${new Date(dateFilter.end).toLocaleDateString("en-IN")}`;
      }
    };

    const result = {
      period: formatPeriod(),
      date_range: {
        start: dateFilter.start,
        end: dateFilter.end
      },
      summary: {
        total_bills: currentBills?.length || 0,
        total_revenue: totalRevenue,
        total_gst: totalGST,
        total_subtotal: totalSubtotal,
        total_service_charge: totalServiceCharge,
        total_discount: totalDiscount,
        net_revenue: totalRevenue - totalGST
      },
      dine_in: {
        bills: dineInBills.length,
        revenue: dineInRevenue,
        subtotal: dineInSubtotal,
        gst: dineInGST,
        service_charge: dineInServiceCharge,
        discount: dineInDiscount,
        avg_order_value: dineInAvgOrderValue,
        percentage_change: dineInPercentageChange,
        net_revenue: dineInRevenue - dineInGST
      },
      takeaway: {
        bills: takeawayBills.length,
        revenue: takeawayRevenue,
        subtotal: takeawaySubtotal,
        gst: takeawayGST,
        service_charge: takeawayServiceCharge,
        discount: takeawayDiscount,
        avg_order_value: takeawayAvgOrderValue,
        percentage_change: takeawayPercentageChange,
        net_revenue: takeawayRevenue - takeawayGST
      },
      top_items: topItems,
      hourly_data: hourlyArray,
      payment_methods: paymentMethodBreakdown,
      bill_details: currentBills?.slice(0, 50).map(bill => ({
        bill_number: bill.bill_number,
        order_type: bill.kot_orders?.order_type || 'unknown',
        subtotal: bill.subtotal || 0,
        discount: bill.discount || 0,
        service_charge: bill.service_charge || 0,
        gst: bill.gst || 0,
        total: bill.total || 0,
        payment_method: bill.payment_method || 'unknown',
        created_at: bill.created_at
      })) || []
    };

    return NextResponse.json({
      success: true,
      result,
      message: `KOT revenue data for ${range} loaded successfully`
    });

  } catch (error: any) {
    console.error("Error in KOT revenue API:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue data", details: error.message },
      { status: 500 }
    );
  }
}