"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select"

type LedgerRow = {
  id: string
  date: string
  type: "Debit" | "Credit"
  amount: number
  note: string | null
}

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<string[]>([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [rows, setRows] = useState<LedgerRow[]>([])

  useEffect(() => {
    supabase
      .from("ledger")
      .select("account")
      .then(({ data }) => {
        if (data) {
          setAccounts([...new Set(data.map(r => r.account))])
        }
      })
  }, [])

  async function loadLedger(account: string) {
    setSelectedAccount(account)

    const { data } = await supabase
      .from("ledger")
      .select("*")
      .eq("account", account)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true })

    setRows((data ?? []) as LedgerRow[])
  }

  let balance = 0

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📗 Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={loadLedger}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(acc => (
                <SelectItem key={acc} value={acc}>
                  {acc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAccount && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedAccount}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => {
                  balance += r.type === "Debit" ? r.amount : -r.amount
                  return (
                    <TableRow key={r.id}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        {r.type === "Debit" ? `₹${r.amount}` : "-"}
                      </TableCell>
                      <TableCell>
                        {r.type === "Credit" ? `₹${r.amount}` : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₹{balance}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.note}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
