import { Badge } from "@/components/ui/badge";
import type { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type StatusVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

const KNOWN_STATUSES = new Set(["pending", "processing", "completed", "failed", "cancelled"]);

export default function OrderStatusBadge({ status }: { status: string }) {
  const variant: StatusVariant = KNOWN_STATUSES.has(status)
    ? (status as StatusVariant)
    : "pending";

  return (
    <Badge variant={variant} className="rounded-full px-2.5 py-1 capitalize">
      {status}
    </Badge>
  );
}
