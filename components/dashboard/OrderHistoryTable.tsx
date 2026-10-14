"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { PackageOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import OrderExtras, { type OrderExtrasData } from "@/components/shared/OrderExtras";
import OrderStatusBadge from "./OrderStatusBadge";
import { formatDateTime } from "@/lib/format";

export type OrderRow = OrderExtrasData & {
  _id: string;
  platformLabel: string;
  category: string;
  qtyValue: number;
  priceCents: number;
  status: string;
  paymentSource: string;
  createdAt: string;
};

export default function OrderHistoryTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="No orders yet"
        description="Your first order will show up here once you place it."
      >
        <Button variant="default" className="mt-5" render={<Link href="/dashboard/orders/new" />} nativeButton={false}>
          Place your first order
        </Button>
      </EmptyState>
    );
  }

  return (
    <Card className="overflow-x-auto border-border bg-card p-0">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead>Service</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date & Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => (
            <motion.tr
              key={order._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              className="border-b border-border transition-colors last:border-0 hover:bg-muted/50"
            >
              <TableCell>
                {order.platformLabel} {order.category}
                <OrderExtras order={order} />
                <Link href={`/track-order?orderId=${order._id}`} className="mt-1 block text-xs text-brand-600 hover:underline">Track order · {order._id}</Link>
              </TableCell>
              <TableCell className="text-foreground/80">{order.qtyValue.toLocaleString()}</TableCell>
              <TableCell className="capitalize text-foreground/80">{order.paymentSource}</TableCell>
              <TableCell className="text-foreground/80">${(order.priceCents / 100).toFixed(2)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                <div className="font-medium text-foreground">{formatDateTime(order.createdAt).date}</div>
                <div className="text-[11px] text-muted-foreground/75 font-mono">{formatDateTime(order.createdAt).time}</div>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
