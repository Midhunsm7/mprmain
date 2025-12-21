"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SupervisorDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>My Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/supervisor/team" className="text-blue-600">
            View & Manage Staff
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/supervisor/leaves" className="text-blue-600">
            Review Leave Requests
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/supervisor/attendance" className="text-blue-600">
            Mark Attendance
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Leave</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/supervisor/my-leave" className="text-blue-600">
            Apply for Leave
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
