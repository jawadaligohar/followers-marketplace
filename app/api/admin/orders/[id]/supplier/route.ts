import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/adminGuard";
import { supplierOrderAction } from "@/lib/supplier/orderActions";
import { PROVIDERS } from "@/lib/supplier/providers";
import {
  requestMerchantRefill,
  completeMerchantRefill,
} from "@/lib/supplier/merchantRefill";
const schema = z.object({
  action: z.enum([
    "sync",
    "cancel",
    "refill",
    "refillStatus",
    "reconcile",
    "requestReplacement",
    "completeReplacement",
  ]),
  quantity: z.number().int().positive().optional(),
  reason: z.string().trim().min(1).max(1000).optional(),
  targetLink: z.string().url().optional(),
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
    if (data.data.action === "requestReplacement") {
      const result = await requestMerchantRefill(
        id,
        data.data.quantity ?? 0,
        data.data.reason || "",
        data.data.targetLink,
      );
      return NextResponse.json({ result });
    }
    if (data.data.action === "completeReplacement") {
      const result = await completeMerchantRefill(
        id,
        data.data.supplierOrderId || "",
      );
      return NextResponse.json({ result });
    }
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
