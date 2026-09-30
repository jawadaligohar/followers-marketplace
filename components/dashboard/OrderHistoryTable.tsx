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
            <th className="px-4 py-3 font-medium">Service</th>
            <th className="px-4 py-3 font-medium">Quantity</th>
            <th className="px-4 py-3 font-medium">Payment</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3">
                {order.platformLabel} {order.category}
              </td>
              <td className="px-4 py-3 text-white/70">{order.qtyValue.toLocaleString()}</td>
              <td className="px-4 py-3 capitalize text-white/70">{order.paymentSource}</td>
              <td className="px-4 py-3 text-white/70">${(order.priceCents / 100).toFixed(2)}</td>
              <td className="px-4 py-3">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="px-4 py-3 text-white/40">
                {new Date(order.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
