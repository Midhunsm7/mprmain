"use client";

import { useState } from "react";
import {
  Wrench,
  Plus,
  IndianRupee,
  Home,
  Bed,
  Building2,
  CalendarDays,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MaintenanceItem {
  id: number;
  area: string;
  reference: string;
  description: string;
  cost: number;
  date: string;
}

export default function MaintenancePage() {
  const [items, setItems] = useState<MaintenanceItem[]>([]);

  const [form, setForm] = useState({
    area: "Room",
    reference: "",
    description: "",
    cost: "",
  });

  function addMaintenance() {
    if (!form.description || !form.cost) return;

    setItems((prev) => [
      {
        id: Date.now(),
        area: form.area,
        reference: form.reference,
        description: form.description,
        cost: Number(form.cost),
        date: new Date().toLocaleDateString(),
      },
      ...prev,
    ]);

    setForm({ area: "Room", reference: "", description: "", cost: "" });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Maintenance Management
          </h1>
          <p className="text-muted-foreground">
            Track maintenance work, locations, and expenses across the resort
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2">
              <Plus className="h-4 w-4" /> Add Maintenance
            </Button>
          </DialogTrigger>

          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <select
                className="w-full rounded-xl border bg-background p-2"
                value={form.area}
                onChange={(e) =>
                  setForm({ ...form, area: e.target.value })
                }
              >
                <option>Room</option>
                <option>Common Area</option>
                <option>Restaurant</option>
                <option>Electrical</option>
                <option>Plumbing</option>
              </select>

              <Input
                placeholder="Room number / Area name"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
              />

              <Textarea
                placeholder="Maintenance description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <Input
                type="number"
                placeholder="Cost (₹)"
                value={form.cost}
                onChange={(e) =>
                  setForm({ ...form, cost: e.target.value })
                }
              />

              <Button className="w-full" onClick={addMaintenance}>
                Save Record
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3">
            <Wrench className="text-orange-500" />
            <CardTitle>Total Jobs</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {items.length}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3">
            <IndianRupee className="text-emerald-500" />
            <CardTitle>Total Expense</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            ₹{items.reduce((s, i) => s + i.cost, 0)}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center gap-3">
            <CalendarDays className="text-sky-500" />
            <CardTitle>Last Updated</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {items[0]?.date ?? "—"}
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Area</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No maintenance records yet
                  </TableCell>
                </TableRow>
              )}

              {items.map((i) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.area}</TableCell>
                  <TableCell>{i.reference}</TableCell>
                  <TableCell>{i.description}</TableCell>
                  <TableCell>{i.date}</TableCell>
                  <TableCell className="text-right">₹{i.cost}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
