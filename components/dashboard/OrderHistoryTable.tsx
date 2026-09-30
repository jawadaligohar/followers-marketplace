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
          {orders.map((order) => (
            <TableRow key={order._id} className="border-white/5">
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
