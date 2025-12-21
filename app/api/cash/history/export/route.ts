import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET() {
 

  const { data, error } = await supabaseServer
    .from("expenditures")
    .select("description, amount, created_at")
    .eq("source_type", "local_purchase")
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const csvHeader = "Date,Reason,Amount\n";
  const csvRows = data
    .map(
      (r) =>
        `${new Date(r.created_at).toLocaleDateString()},` +
        `"${r.description.replace(/"/g, '""')}",` +
        `${r.amount}`
    )
    .join("\n");

  const csv = csvHeader + csvRows;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="local-purchases.csv"`,
    },
  });
}
