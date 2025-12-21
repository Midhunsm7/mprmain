"use client";

import React from "react";
import { KOTOrder } from "@/lib/types/kot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Users, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Wine,
  Coffee,
  ChefHat,
  Timer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Props = {
  tableNumber: number;
  order?: KOTOrder | null;
  onClick?: () => void;
  capacity?: number;
  guests?: number;
  section?: string;
  tableType?: 'regular' | 'booth' | 'family' | 'bar' | 'outdoor';
};

export default function TableTile({ 
  tableNumber, 
  order, 
  onClick, 
  capacity = 4,
  guests = 0,
  section = 'Main',
  tableType = 'regular'
}: Props) {
  const isOccupied = !!order;
  const hasGuests = guests > 0;
  const displayLabel = `T${tableNumber.toString().padStart(2, '0')}`;
  
  // Calculate time since order was placed
  const getElapsedTime = () => {
    if (!order?.created_at) return null;
    const created = new Date(order.created_at);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / 60000); // minutes
    
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  // Get order status color
  const getOrderStatus = () => {
    if (!order) return 'vacant';
    if (order.status === 'served') return 'served';
    if (order.status === 'ready') return 'ready';
    if (order.status === 'preparing') return 'preparing';
    return 'ordered';
  };

  const status = getOrderStatus();
  
  // Status colors and configurations
  const statusConfig = {
    vacant: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      border: "border-green-200",
      icon: "🍽️",
      label: "Available",
      color: "text-green-700",
      badge: "bg-green-100 text-green-800 border-green-200"
    },
    ordered: {
      bg: "bg-gradient-to-br from-amber-50 to-amber-100",
      border: "border-amber-200",
      icon: "📝",
      label: "Ordered",
      color: "text-amber-700",
      badge: "bg-amber-100 text-amber-800 border-amber-200"
    },
    preparing: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      border: "border-blue-200",
      icon: "👨‍🍳",
      label: "Preparing",
      color: "text-blue-700",
      badge: "bg-blue-100 text-blue-800 border-blue-200"
    },
    ready: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      border: "border-orange-200",
      icon: "🔔",
      label: "Ready",
      color: "text-orange-700",
      badge: "bg-orange-100 text-orange-800 border-orange-200"
    },
    served: {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      border: "border-red-200",
      icon: "✅",
      label: "Served",
      color: "text-red-700",
      badge: "bg-red-100 text-red-800 border-red-200"
    }
  };

  const config = statusConfig[status];
  const elapsedTime = getElapsedTime();
  const orderTotal = order?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

  // Table type icons
  const tableTypeIcons = {
    regular: "◻️",
    booth: "🛋️",
    family: "👨‍👩‍👧‍👦",
    bar: "🍸",
    outdoor: "🌿"
  };

  return (
    <Card
      onClick={() => onClick?.()}
      className={`
        cursor-pointer transition-all duration-200 
        hover:shadow-lg hover:-translate-y-1
        ${config.bg} ${config.border} border-2
        w-full h-full min-h-[140px]
        relative overflow-hidden
      `}
    >
      {/* Top Status Indicator */}
      <div className={`absolute top-0 right-0 ${config.badge} text-xs px-2 py-1 rounded-bl-lg font-medium`}>
        {config.label}
      </div>

      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl ${status === 'vacant' ? 'bg-green-200' : 'bg-white shadow-sm'}`}>
              {tableTypeIcons[tableType]}
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-base font-bold">
                Table {tableNumber}
              </CardTitle>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">{displayLabel}</span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {hasGuests ? `${guests}/${capacity}` : capacity}
                </span>
                <span className="text-gray-400">•</span>
                <Badge variant="outline" className="h-5 text-[10px] px-1.5">
                  {section}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 pt-0">
        {isOccupied ? (
          <div className="space-y-2">
            {/* Order Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs font-medium">
                  <Clock className="h-3 w-3" />
                  {elapsedTime}
                </div>
                {order.status === 'ready' && (
                  <AlertCircle className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
                )}
              </div>
              
              <div className="flex items-center gap-1 text-xs font-medium">
                <DollarSign className="h-3 w-3" />
                ₹{orderTotal.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Items Preview */}
            <div className="space-y-1">
              {order.items?.slice(0, 2).map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="truncate pr-2">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="font-medium whitespace-nowrap">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              {order.items && order.items.length > 2 && (
                <div className="text-xs text-muted-foreground text-center">
                  +{order.items.length - 2} more items
                </div>
              )}
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-white/50">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Timer className="h-2.5 w-2.5" />
                <span>{order.status}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-white/50"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60px]">
            <div className="text-3xl mb-1 opacity-70">
              {config.icon}
            </div>
            <div className="text-xs text-center text-muted-foreground">
              Tap to seat guests
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
              <Users className="h-2.5 w-2.5" />
              Up to {capacity} guests
            </div>
          </div>
        )}

        {/* Table Type Indicator */}
        <div className="absolute bottom-1 left-2 text-xs text-gray-500">
          <span className="opacity-70">{tableTypeIcons[tableType]}</span>
        </div>
      </CardContent>

      {/* Guest indicator */}
      {hasGuests && (
        <div className="absolute bottom-1 right-2 flex items-center gap-1">
          <div className="relative">
            <Users className="h-4 w-4 text-gray-600" />
            <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-white rounded-full w-3 h-3 flex items-center justify-center">
              {guests}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}