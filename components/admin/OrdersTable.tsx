"use client";

import { useState } from "react";
import OrderStatusBadge from "@/components/dashboard/OrderStatusBadge";

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
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/40">
        No orders yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-white/40">
            <th className="px-4 py-3 font-medium">Customer</th>
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Qty</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => {
            const user = typeof order.userId === "object" ? order.userId : null;
            return (
              <tr key={order._id} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3">
                  <div>{user?.name ?? "—"}</div>
                  <div className="text-xs text-white/40">{user?.email}</div>
                </td>
                <td className="px-4 py-3">
                  {order.platformLabel} {order.category}
                </td>
                <td className="px-4 py-3 text-white/70">{order.qtyValue.toLocaleString()}</td>
                <td className="px-4 py-3 capitalize text-white/70">{order.paymentSource}</td>
                <td className="px-4 py-3 text-white/70">${(order.priceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    <select
                      value={order.status}
                      disabled={updating === order._id}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#0d0f1d]">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-white/40">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
