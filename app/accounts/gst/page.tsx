"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calculator, Download, FileText, IndianRupee, Percent } from "lucide-react"

export default function GSTPage() {
  const [gstRate, setGstRate] = useState(18)

  // Dummy data (will connect to DB later)
  const bookings = [
    { id: "BK101", guest: "Rahul Sharma", amount: 5200, date: "2025-05-10" },
    { id: "BK102", guest: "Anita Patel", amount: 7800, date: "2025-05-12" },
    { id: "BK103", guest: "John Matthew", amount: 4300, date: "2025-05-13" },
    { id: "BK104", guest: "Neha Gupta", amount: 6600, date: "2025-05-14" },
  ]

  const totalRevenue = bookings.reduce((sum, item) => sum + item.amount, 0)
  const totalGST = (totalRevenue * gstRate) / 100
  const netIncome = totalRevenue - totalGST

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 lg:p-6 space-y-6">
      
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">GST Report</h1>
              <p className="text-slate-600 mt-1">Tax breakdown and financial summary</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-4 py-3">
            <Percent className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700 whitespace-nowrap">GST Rate</span>
            <Input
              type="number"
              className="w-20 bg-white border-slate-300"
              value={gstRate}
              min="0"
              max="100"
              onChange={(e) => setGstRate(Number(e.target.value))}
            />
            <span className="text-sm text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Total Revenue</p>
                <p className="text-2xl lg:text-3xl font-bold text-slate-900">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">GST Collected</p>
                <p className="text-2xl lg:text-3xl font-bold text-red-600">
                  ₹{Math.round(totalGST).toLocaleString("en-IN")}
                </p>
                <Badge variant="secondary" className="mt-2 bg-red-50 text-red-700 border-red-200">
                  {gstRate}% Rate
                </Badge>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Percent className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-2">Net Income</p>
                <p className="text-2xl lg:text-3xl font-bold text-green-600">
                  ₹{Math.round(netIncome).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            GST Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-900">Booking ID</TableHead>
                  <TableHead className="font-semibold text-slate-900">Guest</TableHead>
                  <TableHead className="font-semibold text-slate-900">Date</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">Amount</TableHead>
                  <TableHead className="font-semibold text-slate-900 text-right">GST</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((item) => {
                  const gstValue = (item.amount * gstRate) / 100
                  return (
                    <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <TableCell className="font-medium text-slate-900">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {item.id}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{item.guest}</TableCell>
                      <TableCell className="text-slate-600">
                        {new Date(item.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-slate-900">
                        ₹{item.amount.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-red-600">
                            ₹{Math.round(gstValue).toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs text-slate-500">
                            {gstRate}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                
                {/* TOTAL ROW */}
                <TableRow className="bg-slate-50 border-t-2 border-slate-200">
                  <TableCell colSpan={3} className="font-bold text-slate-900 text-right">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    ₹{totalRevenue.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right font-bold text-red-600">
                    ₹{Math.round(totalGST).toLocaleString("en-IN")}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-end">
        <Button 
          variant="outline" 
          className="border-slate-300 text-slate-700 hover:bg-slate-50"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
        <Button 
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate PDF
        </Button>
      </div>

      {/* QUICK STATS FOOTER */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-slate-900">{bookings.length}</div>
            <div className="text-sm text-slate-600">Total Bookings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">
              ₹{Math.round(totalRevenue / bookings.length).toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-slate-600">Avg. Booking</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{gstRate}%</div>
            <div className="text-sm text-slate-600">Current GST Rate</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((netIncome / totalRevenue) * 100)}%
            </div>
            <div className="text-sm text-slate-600">Net Margin</div>
          </div>
        </div>
      </div>
    </div>
  )
}