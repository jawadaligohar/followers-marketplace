export type OrderExtrasData = {
  postsCovered?: number | null;
  pollOption?: number | null;
  comments?: string[];
};

/** Kind-specific order details (auto plan length, poll option, custom comments). */
export default function OrderExtras({ order, showComments = false }: { order: OrderExtrasData; showComments?: boolean }) {
  const comments = order.comments ?? [];
  if (!order.postsCovered && !order.pollOption && comments.length === 0) return null;

  return (
    <div className="mt-0.5 text-xs text-muted-foreground">
      {order.postsCovered && <div>Per post · next {order.postsCovered} posts (30 days)</div>}
      {order.pollOption && <div>Vote for option {order.pollOption}</div>}
      {comments.length > 0 &&
        (showComments ? (
          <details>
            <summary className="cursor-pointer text-brand-600 hover:underline">{comments.length} custom comments</summary>
            <ol className="mt-1 max-h-48 list-decimal space-y-0.5 overflow-y-auto pl-5 text-foreground/80">
              {comments.map((c, i) => (
                <li key={i} className="break-words">
                  {c}
                </li>
              ))}
            </ol>
          </details>
        ) : (
          <div>{comments.length} custom comments</div>
        ))}
    </div>
  );
}
