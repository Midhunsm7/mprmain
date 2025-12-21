"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import {
  Card, CardHeader, CardTitle, CardContent
} from "@/components/ui/card"
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type JournalRow = {
  id: string
  date: string
  account: string
  type: "Debit" | "Credit"
  amount: number
  note: string | null
}

export default function JournalPage() {
  const [rows, setRows] = useState<JournalRow[]>([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [loading, setLoading] = useState(true)

  async function loadJournal() {
    setLoading(true)

    let query = supabase
      .from("ledger")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false })

    if (fromDate) query = query.gte("date", fromDate)
    if (toDate) query = query.lte("date", toDate)

    const { data } = await query
    setRows((data ?? []) as JournalRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadJournal()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>📘 Journal (Day Book)</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          <Button onClick={loadJournal}>Filter</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              Loading journal…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Debit</TableHead>
                  <TableHead>Credit</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.account}</Badge>
                    </TableCell>
                    <TableCell className="text-green-600">
                      {r.type === "Debit" ? `₹${r.amount}` : "-"}
                    </TableCell>
                    <TableCell className="text-red-600">
                      {r.type === "Credit" ? `₹${r.amount}` : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.note}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
