"use client"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  selectedDate: Date
  onChange: (date: Date) => void
}

export default function CalendarPanel({ selectedDate, onChange }: Props) {
  // Disable past days
  const disabledDays = (day: Date) => {
    const today = new Date()
    return day < new Date(today.setHours(0, 0, 0, 0))
  }

  return (
    <Card className="border border-black shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Select Date
        </CardTitle>
      </CardHeader>

      <CardContent className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onChange(date)}
          disabled={disabledDays}
          className="rounded-md border border-black"
        />
      </CardContent>
    </Card>
  )
}
