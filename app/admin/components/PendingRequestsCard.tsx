import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Package, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export async function PendingRequestsCard() {
  // Fetch counts from API
  const purchaseCount = 5 // Replace with actual API call
  const inventoryCount = 3 // Replace with actual API call
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Pending Approvals</span>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700">
            {purchaseCount + inventoryCount} pending
          </Badge>
        </CardTitle>
        <CardDescription>
          Requests awaiting your approval
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Purchase Requests</p>
              <p className="text-sm text-muted-foreground">{purchaseCount} requests</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/purchases">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Inventory Requests</p>
              <p className="text-sm text-muted-foreground">{inventoryCount} requests</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/inventory">
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}