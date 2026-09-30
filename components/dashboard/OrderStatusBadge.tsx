const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-white/5 text-white/40 border-white/10",
};

export default function OrderStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-medium capitalize ${style}`}>
      {status}
    </span>
  );
}
