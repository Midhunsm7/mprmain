"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Printer, Download, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react"

export default function StockPage() {
  const [search, setSearch] = useState("")

  // Enhanced dummy stock data
  const stockData = [
    { id: 1, item: "Rice Bag", category: "Kitchen", quantity: 5, level: 10, unit: "bags" },
    { id: 2, item: "Cooking Oil", category: "Kitchen", quantity: 20, level: 10, unit: "liters" },
    { id: 3, item: "Hand Soap", category: "Housekeeping", quantity: 30, level: 15, unit: "bottles" },
    { id: 4, item: "Bed Sheets", category: "Rooms", quantity: 8, level: 12, unit: "sets" },
    { id: 5, item: "Tea Powder", category: "Kitchen", quantity: 3, level: 10, unit: "kg" },
    { id: 6, item: "Bath Towels", category: "Rooms", quantity: 25, level: 15, unit: "pieces" },
    { id: 7, item: "Toilet Paper", category: "Housekeeping", quantity: 12, level: 20, unit: "rolls" },
    { id: 8, item: "Coffee Beans", category: "Kitchen", quantity: 18, level: 10, unit: "kg" },
  ]

  const filteredStock = stockData.filter((item) =>
    item.item.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const getStatus = (quantity: number, level: number) => {
    if (quantity <= level / 2) return "Low"
    if (quantity <= level) return "Medium"
    return "Good"
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Low": return "destructive"
      case "Medium": return "secondary"
      case "Good": return "default"
      default: return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Low": return <AlertTriangle className="h-4 w-4" />
      case "Medium": return <TrendingUp className="h-4 w-4" />
      case "Good": return <CheckCircle className="h-4 w-4" />
      default: return null
    }
  }

  const lowStockItems = filteredStock.filter(item => item.quantity <= item.level / 2).length
  const goodStockItems = filteredStock.filter(item => item.quantity > item.level).length
  const mediumStockItems = filteredStock.filter(item => 
    item.quantity > item.level / 2 && item.quantity <= item.level
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-2">
              Inventory Management
            </h1>
            <p className="text-slate-600 text-lg">
              Current stock levels and inventory status
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                className="pl-10 pr-4 py-2 w-full sm:w-64 bg-white border-slate-200 focus:border-slate-300"
                placeholder="Search items or categories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-slate-200 hover:bg-slate-50"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              <Button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Items
              </CardTitle>
              <div className="h-4 w-4 rounded-full bg-slate-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{filteredStock.length}</div>
              <p className="text-xs text-slate-500">Active inventory items</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Low Stock
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockItems}</div>
              <p className="text-xs text-slate-500">Requires immediate attention</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Medium Stock
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{mediumStockItems}</div>
              <p className="text-xs text-slate-500">Monitor closely</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Good Stock
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{goodStockItems}</div>
              <p className="text-xs text-slate-500">Adequate inventory</p>
            </CardContent>
          </Card>
        </div>

        {/* STOCK TABLE */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              Inventory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-b border-slate-100 hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-700 py-4">Item Name</TableHead>
                    <TableHead className="font-semibold text-slate-700">Category</TableHead>
                    <TableHead className="font-semibold text-slate-700">Current Stock</TableHead>
                    <TableHead className="font-semibold text-slate-700">Minimum Level</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStock.map((item) => {
                    const status = getStatus(item.quantity, item.level)
                    const statusVariant = getStatusVariant(status)
                    const StatusIcon = getStatusIcon(status)

                    return (
                      <TableRow 
                        key={item.id} 
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <TableCell className="font-medium text-slate-800 py-4">
                          {item.item}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-slate-600 border-slate-200">
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-800">{item.quantity}</span>
                          <span className="text-sm text-slate-500 ml-1">{item.unit}</span>
                        </TableCell>
                        <TableCell className="text-slate-600">{item.level} {item.unit}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={statusVariant as any} 
                            className="flex items-center gap-1.5 justify-end w-fit ml-auto px-3 py-1.5"
                          >
                            {StatusIcon}
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredStock.length === 0 && (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">
                  <Search className="h-12 w-12 mx-auto" />
                </div>
                <p className="text-slate-500 font-medium">No items found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 text-center sm:text-left">
            Showing {filteredStock.length} of {stockData.length} items
            {search && ` • Filtered by "${search}"`}
          </p>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print Report
            </Button>
            <Button className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700">
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}