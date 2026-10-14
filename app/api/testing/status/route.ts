import { connection, NextResponse } from "next/server";
import { localTestDatabaseName } from "@/lib/testing";
export async function GET() {
  await connection();
  const database = localTestDatabaseName();
  if (!database)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    database,
    supplierSandbox: process.env.PEAKERR_SANDBOX === "true",
    cryptoSandbox: process.env.NOWPAYMENTS_SANDBOX === "true",
  });
}
