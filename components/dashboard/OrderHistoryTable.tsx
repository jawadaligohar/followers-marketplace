"use client";

import { motion } from "motion/react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import OrderStatusBadge from "./OrderStatusBadge";

export type OrderRow = {
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
            <TableHead>Service</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order, i) => (
            <motion.tr
              key={order._id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.4) }}
              className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.02]"
            >
              <TableCell>
                {order.platformLabel} {order.category}
              </TableCell>
              <TableCell className="text-white/70">{order.qtyValue.toLocaleString()}</TableCell>
              <TableCell className="capitalize text-white/70">{order.paymentSource}</TableCell>
              <TableCell className="text-white/70">${(order.priceCents / 100).toFixed(2)}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
