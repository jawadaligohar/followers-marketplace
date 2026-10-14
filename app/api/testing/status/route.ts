import { secureRoute } from "@/lib/security/request";
import { connection, NextResponse } from "next/server";
import { localTestDatabaseName } from "@/lib/testing";
async function getHandler() {
  await connection();
  if (process.env.NODE_ENV === "production" && process.env.ENABLE_TEST_ENDPOINT !== "true") return NextResponse.json({ error: "Not found" }, { status: 404 });
  const database = localTestDatabaseName();
  if (!database)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    database,
    supplierSandbox: process.env.PEAKERR_SANDBOX === "true",
    cryptoSandbox: process.env.NOWPAYMENTS_SANDBOX === "true",
  });
}

export const GET = secureRoute(getHandler);
