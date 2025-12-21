"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Expenditure = {
  id: string;
  source_type: string;
  category: string;
  amount: number;
  payment_method: string;
  spent_at: string;
  vendor_name?: string;
};

export default function ExpendituresPage() {
  const [data, setData] = useState<Expenditure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

const { data } = await supabase
  .from("expenditures")
  .select(`
    id,
    source_type,
    category,
    description,
    amount,
    payment_method,
    paid_at,
    vendor_bill:vendor_bills (
      vendors (
        name
      )
    )
  `)
  .order("paid_at", { ascending: false });


    setData(
      (data || []).map((d: any) => ({
        ...d,
        vendor_name: d.vendors?.name,
      }))
    );

    setLoading(false);
  }

  if (loading) return <div className="p-6">Loading expenditures…</div>;

  const total = data.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Expenditures</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Summary title="Total Spent" value={total} />
        <Summary
          title="Cash"
          value={data
            .filter((e) => e.payment_method === "cash")
            .reduce((s, e) => s + Number(e.amount), 0)}
        />
        <Summary
          title="Bank / UPI"
          value={data
            .filter((e) => e.payment_method !== "cash")
            .reduce((s, e) => s + Number(e.amount), 0)}
        />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Vendor</th>
              <th className="p-3">Category</th>
              <th className="p-3">Method</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.map((e) => (
              <tr key={e.id} className="border-t">
                <td className="p-3">{e.vendor_name ?? "—"}</td>
                <td className="p-3">
                  <Badge>{e.category}</Badge>
                </td>
                <td className="p-3">{e.payment_method}</td>
                <td className="p-3">₹{e.amount}</td>
                <td className="p-3">
                  {new Date(e.spent_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        ₹{value}
      </CardContent>
    </Card>
  );
}
