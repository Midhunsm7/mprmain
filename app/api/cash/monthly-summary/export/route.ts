import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    
    const { searchParams } = new URL(req.url);

    const month = searchParams.get("month"); // YYYY-MM
    if (!month) {
      return new Response("Month is required (YYYY-MM)", {
        status: 400,
      });
    }

    /* ---------- Proper ISO date range ---------- */
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    /* ---------- Fetch cash expenditures ---------- */
    const { data, error } = await supabaseServer
      .from("expenditures")
      .select("created_at, description, amount")
      .eq("payment_method", "cash")
      .gte("created_at", startISO)
      .lt("created_at", endISO)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Export error:", error);
      return new Response("Failed to fetch data", { status: 500 });
    }

    /* ---------- Build CSV (Excel compatible) ---------- */
    const header = "Date,Reason,Amount\n";

    const rows =
      data && data.length > 0
        ? data
            .map(
              (r) =>
                `${new Date(r.created_at).toLocaleDateString("en-IN")},` +
                `"${(r.description ?? "")
                  .replace(/"/g, '""')}",` +
                `${r.amount}`
            )
            .join("\n")
        : "";

    const csv = header + rows;

    /* ---------- Return file ---------- */
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cash-local-purchases-${month}.csv"`,
      },
    });
  } catch (e: any) {
    console.error("Monthly export fatal error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
}
