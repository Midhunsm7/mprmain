import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";
import * as XLSX from "xlsx";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today";

    let dateFilter: { start: string; end: string };
    const today = new Date();
    
    switch (range) {
      case "today":
        dateFilter = { start: today.toISOString().split("T")[0], end: today.toISOString().split("T")[0] };
        break;
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateFilter = { start: weekStart.toISOString().split("T")[0], end: today.toISOString().split("T")[0] };
        break;
      case "month":
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateFilter = { start: monthStart.toISOString().split("T")[0], end: today.toISOString().split("T")[0] };
        break;
      default:
        dateFilter = { start: today.toISOString().split("T")[0], end: today.toISOString().split("T")[0] };
    }

    // Fetch data from kot_bills
    const { data: bills } = await supabaseServer
      .from("kot_bills")
      .select(`
        id,
        bill_number,
        subtotal,
        discount,
        service_charge,
        gst,
        total,
        payment_method,
        payment_status,
        created_at,
        kot_orders!inner (
          order_type,
          table_no
        )
      `)
      .gte("created_at", `${dateFilter.start}T00:00:00`)
      .lte("created_at", `${dateFilter.end}T23:59:59`)
      .eq("payment_status", "paid");

    // Prepare summary data
    const summaryData = [
      ["Restaurant KOT Revenue Report"],
      [`Period: ${range === "today" ? "Today" : range === "week" ? "This Week" : "This Month"}`],
      [`Date Range: ${new Date(dateFilter.start).toLocaleDateString("en-IN")} to ${new Date(dateFilter.end).toLocaleDateString("en-IN")}`],
      [`Report Generated: ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`],
      [""],
      ["SUMMARY"],
      ["Metric", "Dine-In", "Takeaway", "Total"],
    ];

    const dineInBills = bills?.filter(b => b.kot_orders?.order_type === "dine_in") || [];
    const takeawayBills = bills?.filter(b => b.kot_orders?.order_type === "takeaway") || [];

    const dineInRevenue = dineInBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const takeawayRevenue = takeawayBills.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalRevenue = dineInRevenue + takeawayRevenue;

    const dineInSubtotal = dineInBills.reduce((sum, b) => sum + (b.subtotal || 0), 0);
    const takeawaySubtotal = takeawayBills.reduce((sum, b) => sum + (b.subtotal || 0), 0);
    const totalSubtotal = dineInSubtotal + takeawaySubtotal;

    const dineInGST = dineInBills.reduce((sum, b) => sum + (b.gst || 0), 0);
    const takeawayGST = takeawayBills.reduce((sum, b) => sum + (b.gst || 0), 0);
    const totalGST = dineInGST + takeawayGST;

    const dineInService = dineInBills.reduce((sum, b) => sum + (b.service_charge || 0), 0);
    const takeawayService = takeawayBills.reduce((sum, b) => sum + (b.service_charge || 0), 0);
    const totalService = dineInService + takeawayService;

    const dineInDiscount = dineInBills.reduce((sum, b) => sum + (b.discount || 0), 0);
    const takeawayDiscount = takeawayBills.reduce((sum, b) => sum + (b.discount || 0), 0);
    const totalDiscount = dineInDiscount + takeawayDiscount;

    summaryData.push(
      ["Total Revenue", `₹${dineInRevenue.toLocaleString("en-IN")}`, `₹${takeawayRevenue.toLocaleString("en-IN")}`, `₹${totalRevenue.toLocaleString("en-IN")}`],
      ["Subtotal (Before Tax)", `₹${dineInSubtotal.toLocaleString("en-IN")}`, `₹${takeawaySubtotal.toLocaleString("en-IN")}`, `₹${totalSubtotal.toLocaleString("en-IN")}`],
      ["Service Charge", `₹${dineInService.toLocaleString("en-IN")}`, `₹${takeawayService.toLocaleString("en-IN")}`, `₹${totalService.toLocaleString("en-IN")}`],
      ["Discount", `₹${dineInDiscount.toLocaleString("en-IN")}`, `₹${takeawayDiscount.toLocaleString("en-IN")}`, `₹${totalDiscount.toLocaleString("en-IN")}`],
      ["GST", `₹${dineInGST.toLocaleString("en-IN")}`, `₹${takeawayGST.toLocaleString("en-IN")}`, `₹${totalGST.toLocaleString("en-IN")}`],
      ["Net Revenue", `₹${(dineInRevenue - dineInGST).toLocaleString("en-IN")}`, `₹${(takeawayRevenue - takeawayGST).toLocaleString("en-IN")}`, `₹${(totalRevenue - totalGST).toLocaleString("en-IN")}`],
      ["Number of Bills", dineInBills.length, takeawayBills.length, bills?.length || 0],
      ["Average Bill Value", `₹${(dineInBills.length ? dineInRevenue / dineInBills.length : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, 
       `₹${(takeawayBills.length ? takeawayRevenue / takeawayBills.length : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`, 
       `₹${(bills?.length ? totalRevenue / bills.length : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`],
      [""],
      ["Percentage Distribution", `${((dineInRevenue / totalRevenue) * 100).toFixed(1)}%`, `${((takeawayRevenue / totalRevenue) * 100).toFixed(1)}%`, "100%"]
    );

    // Bill details sheet
    const billDetails = bills?.map(bill => ({
      "Bill Number": bill.bill_number || 'N/A',
      "Date": new Date(bill.created_at).toLocaleDateString("en-IN"),
      "Time": new Date(bill.created_at).toLocaleTimeString("en-IN"),
      "Order Type": bill.kot_orders?.order_type === "dine_in" ? "Dine-In" : "Takeaway",
      "Table": bill.kot_orders?.table_no || "N/A",
      "Subtotal": `₹${(bill.subtotal || 0).toLocaleString("en-IN")}`,
      "Service Charge": `₹${(bill.service_charge || 0).toLocaleString("en-IN")}`,
      "Discount": `₹${(bill.discount || 0).toLocaleString("en-IN")}`,
      "GST": `₹${(bill.gst || 0).toLocaleString("en-IN")}`,
      "Total": `₹${(bill.total || 0).toLocaleString("en-IN")}`,
      "Payment Method": bill.payment_method || 'Unknown',
      "Status": bill.payment_status || 'Unknown'
    })) || [];

    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Bill details sheet
    if (billDetails.length > 0) {
      const detailsWs = XLSX.utils.json_to_sheet(billDetails);
      XLSX.utils.book_append_sheet(wb, detailsWs, "Bill Details");
    }

    // Payment method breakdown
    const paymentMethods: Record<string, { count: number; amount: number }> = {};
    bills?.forEach(bill => {
      const method = bill.payment_method || 'unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count++;
      paymentMethods[method].amount += bill.total || 0;
    });

    const paymentData = Object.entries(paymentMethods)
      .map(([method, stats]) => ({
        "Payment Method": method.toUpperCase(),
        "Transaction Count": stats.count,
        "Total Amount": `₹${stats.amount.toLocaleString("en-IN")}`,
        "Percentage": `${((stats.amount / totalRevenue) * 100).toFixed(2)}%`
      }))
      .sort((a, b) => {
        const amountA = parseFloat(a["Total Amount"].replace(/[^0-9.-]+/g, ""));
        const amountB = parseFloat(b["Total Amount"].replace(/[^0-9.-]+/g, ""));
        return amountB - amountA;
      });

    if (paymentData.length > 0) {
      const paymentWs = XLSX.utils.json_to_sheet(paymentData);
      XLSX.utils.book_append_sheet(wb, paymentWs, "Payment Methods");
    }

    // Generate buffer
    const excelBuffer = XLSX.write(wb, {
      type: "buffer",
      bookType: "xlsx"
    });

    const filename = `restaurant_revenue_${range}_${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(excelBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache"
      }
    });

  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to generate export" },
      { status: 500 }
    );
  }
}