"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function InventoryPage() {
  const [search, setSearch] = useState("")

  // Dummy inventory data (connect to DB later)
  const inventoryData = [
    {
      id: 1,
      item: "Vegetables",
      category: "Kitchen",
      vendor: "Fresh Farm",
      lastRestocked: "2025-05-10",
      quantity: 25,
      value: 1500,
    },
    {
      id: 2,
      item: "Bed Sheets",
      category: "Rooms",
      vendor: "Royal Linens",
      lastRestocked: "2025-05-08",
      quantity: 40,
      value: 8000,
    },
    {
      id: 3,
      item: "Cleaning Liquid",
      category: "Housekeeping",
      vendor: "CleanPro",
      lastRestocked: "2025-05-05",
      quantity: 15,
      value: 2100,
    },
  ]

  const filteredInventory = inventoryData.filter((item) =>
    item.item.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.vendor.toLowerCase().includes(search.toLowerCase())
  )

  const totalValue = filteredInventory.reduce((sum, item) => sum + item.value, 0)

  const getStatus = (qty: number) => {
    if (qty < 10) return "Low"
    if (qty < 25) return "Medium"
    return "High"
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
        <h1 className="text-3xl font-bold">Inventory Report</h1>

        <Input
          className="md:w-64"
          placeholder="Search item / category / vendor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <Card>
          <CardHeader>
            <CardTitle>Total Items</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {filteredInventory.length}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-green-600">
            ₹{totalValue}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold text-red-600">
            {filteredInventory.filter(item => item.quantity < 10).length}
          </CardContent>
        </Card>

      </div>

      {/* INVENTORY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Details</CardTitle>
        </CardHeader>

        <CardContent>
          <Table>

            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Last Restocked</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredInventory.map((item) => {
                const status = getStatus(item.quantity)

                return (
                  <TableRow key={item.id}>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.vendor}</TableCell>
                    <TableCell>{item.lastRestocked}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>₹{item.value}</TableCell>

                    <TableCell>
                      {status === "Low" && <Badge variant="destructive">Low</Badge>}
                      {status === "Medium" && <Badge variant="secondary">Medium</Badge>}
                      {status === "High" && <Badge>High</Badge>}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>

          </Table>

          {filteredInventory.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              No inventory records found
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

    </div>
  )
}
