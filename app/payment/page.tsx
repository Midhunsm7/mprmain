"use client";

import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

/* ---------------------------
  Types
--------------------------- */
type AccountKey =
  | "Cash"
  | "Bank"
  | "AccountsReceivable"
  | "Revenue_Room"
  | "Revenue_Restaurant"
  | "Revenue_Banquet"
  | "Expense_Food"
  | "Expense_Supplies"
  | "Expense_Maintenance"
  | "Inventory"
  | "AccountsPayable"
  | "Capital";

type PaymentType = "Room" | "Restaurant" | "Banquet" | "Purchase";

interface Attachment {
  id: string;
  name: string;
  dataUrl: string; // base64 preview
  size: number;
}

interface Transaction {
  id: string;
  type: PaymentType;
  date: string;
  description: string;
  amount: number;
  paymentMode: "Cash" | "Card" | "UPI" | "Credit";
  payer?: string; // customer or vendor
  attachments?: Attachment[];
  debits: { account: AccountKey; amount: number }[]; // bookkeeping entries
  credits: { account: AccountKey; amount: number }[];
  status: "Paid" | "Pending";
}

/* ---------------------------
  Helper utilities
--------------------------- */
const ACCOUNT_LIST: AccountKey[] = [
  "Cash",
  "Bank",
  "AccountsReceivable",
  "Revenue_Room",
  "Revenue_Restaurant",
  "Revenue_Banquet",
  "Expense_Food",
  "Expense_Supplies",
  "Expense_Maintenance",
  "Inventory",
  "AccountsPayable",
  "Capital",
];

const LOCAL_KEY = "hotel_accounts_data_v1";

function uid(prefix = "") {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 9999)}`;
}

/* ---------------------------
  Component
--------------------------- */
export default function PaymentsAccountingPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "Room" as PaymentType,
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    paymentMode: "Card" as Transaction["paymentMode"],
    payer: "",
    status: "Paid" as Transaction["status"],
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [selectedDebit, setSelectedDebit] = useState<AccountKey>("Expense_Supplies");
  const [selectedCredit, setSelectedCredit] = useState<AccountKey>("Cash");
  const [filterType, setFilterType] = useState<PaymentType | "All">("All");

  // Load stored
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) setTransactions(JSON.parse(raw));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load stored accounting data.");
    }
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(transactions));
  }, [transactions]);

  // dropzone for attachments
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    maxFiles: 5,
    onDrop: (files) => {
      files.forEach((f) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = String(reader.result);
          const att: Attachment = { id: uid("att_"), name: f.name, dataUrl, size: f.size };
          setAttachments((s) => [...s, att]);
        };
        reader.readAsDataURL(f);
      });
    },
  });

  /* ---------------------------
    Accounting logic: create transaction and ledger posting
  --------------------------- */
  function addTransaction() {
    const amount = Number(newTx.amount);
    if (!newTx.description || !amount || amount <= 0) {
      toast.error("Please enter a valid description & amount.");
      return;
    }

    // Basic double-entry: debit selectedDebit, credit selectedCredit
    const tx: Transaction = {
      id: uid("tx_"),
      type: newTx.type,
      date: newTx.date,
      description: newTx.description,
      amount,
      paymentMode: newTx.paymentMode,
      payer: newTx.payer,
      attachments: attachments,
      debits: [{ account: selectedDebit, amount }],
      credits: [{ account: selectedCredit, amount }],
      status: newTx.status,
    };

    setTransactions((t) => [tx, ...t]);
    toast.success("Transaction recorded.");
    // reset
    setOpenNewDialog(false);
    setNewTx({
      type: "Room",
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      paymentMode: "Card",
      payer: "",
      status: "Paid",
    });
    setAttachments([]);
    setSelectedDebit("Expense_Supplies");
    setSelectedCredit("Cash");
  }

  /* ---------------------------
    Derived: ledger balances
  --------------------------- */
  function computeLedger() {
    const balances: Record<AccountKey, number> = Object.fromEntries(
      ACCOUNT_LIST.map((a) => [a, 0])
    ) as Record<AccountKey, number>;

    transactions.forEach((tx) => {
      tx.debits.forEach((d) => {
        balances[d.account] = (balances[d.account] || 0) + d.amount;
      });
      tx.credits.forEach((c) => {
        balances[c.account] = (balances[c.account] || 0) - c.amount;
      });
    });

    return balances;
  }

  const ledger = computeLedger();

  /* ---------------------------
    Helpers: filtering and totals
  --------------------------- */
  const filteredPayments = transactions.filter((t) => (filterType === "All" ? true : t.type === filterType));

  const totalsByType = (type: PaymentType | "All") => {
    const list = type === "All" ? transactions : transactions.filter((t) => t.type === type);
    return list.reduce((s, t) => s + t.amount, 0);
  };

  const trendData = transactions
    .slice()
    .reverse()
    .map((t) => ({ date: t.date, amount: t.amount }));

  /* ---------------------------
    UI: render
  --------------------------- */
  return (
    <div className="min-h-screen p-8 bg-gray-50 space-y-6">
      <h1 className="text-3xl font-bold text-center">🏦 Accounts & Payments — General Ledger</h1>

      {/* Summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Collected</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">
            ₹{totalsByType("All").toLocaleString("en-IN")}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rooms / Restaurant / Banquet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div>Room revenue: ₹{totalsByType("Room").toLocaleString("en-IN")}</div>
              <div>Restaurant revenue: ₹{totalsByType("Restaurant").toLocaleString("en-IN")}</div>
              <div>Banquet revenue: ₹{totalsByType("Banquet").toLocaleString("en-IN")}</div>
              <div>Purchases/Expenses: ₹{totalsByType("Purchase").toLocaleString("en-IN")}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button onClick={() => setOpenNewDialog(true)}>+ New Transaction / Bill</Button>
            <Button variant="outline" onClick={() => {
              const w = window.open("", "_blank");
              w?.document.write(`<pre>${JSON.stringify(transactions, null, 2)}</pre>`);
              w?.print();
            }}>Print Transactions</Button>
            <Button variant="ghost" onClick={() => {
              const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = `transactions_${Date.now()}.json`; a.click();
              URL.revokeObjectURL(url);
            }}>Export JSON</Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Payments / Purchases / Ledger */}
      <Tabs defaultValue="Payments" className="">
        <div className="flex justify-between items-center gap-4">
          <TabsList>
            <TabsTrigger value="Payments">Payments</TabsTrigger>
            <TabsTrigger value="Purchases">Purchases</TabsTrigger>
            <TabsTrigger value="Ledger">General Ledger</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Label>Filter:</Label>
            <select value={String(filterType)} onChange={(e) => setFilterType(e.target.value as any)} className="p-2 border rounded">
              <option value="All">All</option>
              <option value="Room">Room</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Banquet">Banquet</option>
              <option value="Purchase">Purchase</option>
            </select>
            <Button onClick={() => {
              // quick import of booking as payments (if bookingData exists)
              const stored = localStorage.getItem("bookingData");
              if (!stored) { toast.error("No booking data to import."); return; }
              const parsed = JSON.parse(stored);
              // create one transaction per booking (room revenue)
              const created: Transaction[] = parsed.selectedRooms.map((room: any, idx: number) => {
                const amt = Math.round((parsed.totalPrice || 0) / Math.max(parsed.selectedRooms.length, 1));
                return {
                  id: uid("imp_"),
                  type: "Room" as PaymentType,
                  date: new Date().toISOString().split("T")[0],
                  description: `Import: ${room.name} (${room.category})`,
                  amount: amt,
                  paymentMode: "Card",
                  payer: parsed.form?.name || "Guest",
                  attachments: [],
                  debits: [{ account: "Cash", amount: amt }],
                  credits: [{ account: "Revenue_Room", amount: amt }],
                  status: "Paid",
                };
              });
              setTransactions((t) => [...created, ...t]);
              toast.success("Imported booking data as payments.");
            }}>Import booking → payments</Button>
          </div>
        </div>

        <TabsContent value="Payments">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="text-left">
                    <tr className="border-b">
                      <th className="p-2">Date</th>
                      <th>Description</th>
                      <th>Amt</th>
                      <th>Mode</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => (
                      <tr key={p.id} className="border-b">
                        <td className="p-2">{p.date}</td>
                        <td>{p.description}</td>
                        <td>₹{p.amount.toLocaleString("en-IN")}</td>
                        <td>{p.paymentMode}</td>
                        <td>{p.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Daily Trend (recent)</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-sm text-gray-500">No transactions yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="amount" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Purchases">
          <div className="mt-4 grid grid-cols-1 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>New Purchase / Vendor Bill</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div>
                    <Label>Vendor / Store</Label>
                    <Input placeholder="Vendor name" value={newTx.payer} onChange={(e) => setNewTx((s) => ({ ...s, payer: e.target.value }))} />
                  </div>
                  <div>
                    <Label>Purchase Date</Label>
                    <Input type="date" value={newTx.date} onChange={(e) => setNewTx((s) => ({ ...s, date: e.target.value }))} />
                  </div>

                  <div>
                    <Label>Amount (₹)</Label>
                    <Input type="number" placeholder="Total amount" value={newTx.amount} onChange={(e) => setNewTx((s) => ({ ...s, amount: e.target.value }))} />
                  </div>

                  <div>
                    <Label>Payment Mode</Label>
                    <select className="w-full p-2 border rounded" value={newTx.paymentMode} onChange={(e) => setNewTx((s) => ({ ...s, paymentMode: e.target.value as any }))}>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                      <option>Credit</option>
                    </select>
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Description / Items</Label>
                    <Input placeholder="e.g., Rice 50kg, Vegetables, Cleaning supplies..." value={newTx.description} onChange={(e) => setNewTx((s) => ({ ...s, description: e.target.value }))} />
                  </div>

                  <div className="lg:col-span-2">
                    <Label>Attach Bill (drag & drop or click)</Label>
                    <div {...getRootProps()} className={`border-dashed border-2 p-4 rounded text-center ${isDragActive ? "border-blue-400" : "border-gray-300"}`}>
                      <input {...getInputProps()} />
                      {isDragActive ? <p>Drop files...</p> : <p>Drag & drop bill images here or click to select</p>}
                    </div>

                    {attachments.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {attachments.map((a) => (
                          <div key={a.id} className="w-28 border rounded overflow-hidden p-1 bg-white">
                            <img src={a.dataUrl} alt={a.name} className="w-full h-20 object-cover" />
                            <div className="text-xs truncate">{a.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-2 flex justify-end gap-2">
                    <Button onClick={() => {
                      // post as purchase: debit Expense_Supplies (or Inventory) and credit Cash/Bank
                      const amt = Number(newTx.amount);
                      if (!newTx.description || !amt) { toast.error("Fill description & amount"); return; }
                      const tx: Transaction = {
                        id: uid("tx_"),
                        type: "Purchase",
                        date: newTx.date,
                        description: newTx.description,
                        amount: amt,
                        paymentMode: newTx.paymentMode as Transaction["paymentMode"],
                        payer: newTx.payer,
                        attachments: attachments,
                        debits: [{ account: "Expense_Supplies", amount: amt }],
                        credits: [{ account: newTx.paymentMode === "Cash" ? "Cash" : "Bank", amount: amt }],
                        status: "Paid",
                      };
                      setTransactions((s) => [tx, ...s]);
                      setAttachments([]);
                      setNewTx((s) => ({ ...s, description: "", amount: "", payer: "" }));
                      toast.success("Purchase recorded.");
                    }}>Record Purchase</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* List of Purchases */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Bills</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">Date</th>
                      <th>Vendor</th>
                      <th>Desc</th>
                      <th>Amount</th>
                      <th>Attach</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.filter(t => t.type === "Purchase").map(t => (
                      <tr key={t.id} className="border-b">
                        <td className="p-2">{t.date}</td>
                        <td>{t.payer}</td>
                        <td>{t.description}</td>
                        <td>₹{t.amount.toLocaleString("en-IN")}</td>
                        <td>
                          {t.attachments?.map(a => (
                            <a key={a.id} href={a.dataUrl} target="_blank" rel="noreferrer" className="text-xs underline mr-2">View</a>
                          )) || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="Ledger">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Chart of Accounts (Balances)</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">Account</th>
                      <th className="p-2 text-right">Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ACCOUNT_LIST.map((a) => (
                      <tr key={a} className="border-b">
                        <td className="p-2">{a}</td>
                        <td className="p-2 text-right">{(ledger[a] || 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ledger Entries (Recent)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="p-3 border rounded bg-white">
                      <div className="flex justify-between">
                        <div>
                          <div className="font-semibold">{tx.description}</div>
                          <div className="text-xs text-gray-500">{tx.date} • {tx.type} • {tx.paymentMode}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₹{tx.amount.toLocaleString("en-IN")}</div>
                          <div className="text-xs">{tx.status}</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs">
                        Debits: {tx.debits.map(d => `${d.account}(${d.amount})`).join(", ")}<br />
                        Credits: {tx.credits.map(c => `${c.account}(${c.amount})`).join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* New transaction modal (generic) */}
      <Dialog open={openNewDialog} onOpenChange={setOpenNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Transaction / Payment</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label>Type</Label>
                <select className="w-full p-2 border rounded" value={newTx.type} onChange={(e) => setNewTx((s) => ({ ...s, type: e.target.value as PaymentType }))}>
                  <option>Room</option>
                  <option>Restaurant</option>
                  <option>Banquet</option>
                  <option>Purchase</option>
                </select>
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={newTx.date} onChange={(e) => setNewTx((s) => ({ ...s, date: e.target.value }))} />
              </div>

              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input value={newTx.description} onChange={(e) => setNewTx((s) => ({ ...s, description: e.target.value }))} />
              </div>

              <div>
                <Label>Amount (₹)</Label>
                <Input type="number" value={newTx.amount} onChange={(e) => setNewTx((s) => ({ ...s, amount: e.target.value }))} />
              </div>

              <div>
                <Label>Payment Mode</Label>
                <select className="w-full p-2 border rounded" value={newTx.paymentMode} onChange={(e) => setNewTx((s) => ({ ...s, paymentMode: e.target.value as any }))}>
                  <option>Cash</option>
                  <option>Card</option>
                  <option>UPI</option>
                  <option>Credit</option>
                </select>
              </div>

              <div>
                <Label>Payer / Vendor</Label>
                <Input value={newTx.payer} onChange={(e) => setNewTx((s) => ({ ...s, payer: e.target.value }))} />
              </div>

              <div>
                <Label>Status</Label>
                <select className="w-full p-2 border rounded" value={newTx.status} onChange={(e) => setNewTx((s) => ({ ...s, status: e.target.value as any }))}>
                  <option>Paid</option>
                  <option>Pending</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Debit Account (what gets debited)</Label>
                <select className="w-full p-2 border rounded" value={selectedDebit} onChange={(e) => setSelectedDebit(e.target.value as AccountKey)}>
                  {ACCOUNT_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Credit Account (what gets credited)</Label>
                <select className="w-full p-2 border rounded" value={selectedCredit} onChange={(e) => setSelectedCredit(e.target.value as AccountKey)}>
                  {ACCOUNT_LIST.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <Label>Attach receipts (drag or click)</Label>
                <div {...getRootProps()} className="p-3 border-dashed border-2 rounded text-center">
                  <input {...getInputProps()} />
                  <div>{isDragActive ? "Drop files..." : "Drop files here or click"}</div>
                </div>

                {attachments.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {attachments.map(a => (
                      <div key={a.id} className="w-24 border rounded overflow-hidden">
                        <img src={a.dataUrl} alt={a.name} className="w-full h-20 object-cover" />
                        <div className="text-xs p-1">{a.name}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setOpenNewDialog(false); setAttachments([]); }}>Cancel</Button>
                <Button onClick={addTransaction}>Save Transaction</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
