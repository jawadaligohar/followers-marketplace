import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { readLimitedBody, RequestSecurityError } from "@/lib/security/request";

export const GET = handlers.GET;
export async function POST(request: NextRequest) {
  try {
    const body = await readLimitedBody(request, 16384);
    return await handlers.POST(new NextRequest(request.url, { method: request.method, headers: request.headers, body }));
  } catch (error) {
    if (error instanceof RequestSecurityError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: "Unable to authenticate" }, { status: 500 });
  }
}
