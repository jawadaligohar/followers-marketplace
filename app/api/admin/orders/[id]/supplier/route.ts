import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { supplierOrderAction } from "@/lib/supplier/orderActions";
import { PROVIDERS } from "@/lib/supplier/providers";
const schema = z.object({
  action: z.enum(["sync", "cancel", "refill", "refillStatus", "reconcile"]),
  provider: z.enum(PROVIDERS).optional(),
  supplierOrderId: z
    .string()
    .regex(/^[\w-]{1,100}$/)
    .optional(),
});
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const data = schema.safeParse(await request.json().catch(() => null));
  if (!/^[a-f\d]{24}$/i.test(id) || !data.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  try {
    const result = await supplierOrderAction(
      id,
      data.data.action,
      data.data.provider && data.data.supplierOrderId
        ? {
            provider: data.data.provider,
            supplierOrderId: data.data.supplierOrderId,
          }
        : undefined,
    );
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Supplier action failed",
      },
      { status: 400 },
    );
  }
}
