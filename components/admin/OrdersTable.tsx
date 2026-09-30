"use client";

import { useState } from "react";
import { toast } from "sonner";
import { motion } from "motion/react";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminOrderRow = {
  _id: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  priceCents: number;
  status: string;
  paymentSource: string;
  createdAt: string;
  userId: { name?: string; email?: string } | string | null;
};

const STATUSES = ["pending", "processing", "completed", "failed", "cancelled"];

export default function OrdersTable({ orders }: { orders: AdminOrderRow[] }) {
  const [rows, setRows] = useState(orders);
  const [updating, setUpdating] = useState<string | null>(null);

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);

    if (res.ok) {
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
      toast.success("Order status updated");
    } else {
      toast.error("Failed to update order status");
    }
  }

  if (rows.length === 0) {
    return (
      <Card className="border-white/10 bg-white/[0.03] p-10 text-center text-sm text-muted-foreground">
        No orders yet.
      </Card>
    );
  }

  return (
    <Card className="overflow-x-auto border-white/10 bg-white/[0.03] p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-white/10">
            <TableHead>Customer</TableHead>
            <TableHead>Service</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((order, i) => {
            const user = typeof order.userId === "object" ? order.userId : null;
            return (
              <motion.tr
                key={order._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
                className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]"
              >
                <TableCell>
                  <div>{user?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email}</div>
                </TableCell>
                <TableCell>
                  {order.platformLabel} {order.category}
                </TableCell>
                <TableCell className="text-white/70">{order.qtyValue.toLocaleString()}</TableCell>
                <TableCell className="capitalize text-white/70">{order.paymentSource}</TableCell>
                <TableCell className="text-white/70">${(order.priceCents / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <Select
                      value={order.status}
                      disabled={updating === order._id}
                      onValueChange={(value) => handleStatusChange(order._id, value as string)}
                    >
                      <SelectTrigger size="sm" className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
              </motion.tr>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
