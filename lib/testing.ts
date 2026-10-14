export function localTestDatabaseName() {
  return (
    /^mongodb:\/\/(?:127\.0\.0\.1|localhost):\d+\/([a-z\d_-]+_test)(?:\?|$)/i.exec(
      process.env.MONGODB_URI || "",
    )?.[1] || null
  );
}
export function assertLocalTestEnvironment() {
  if (!localTestDatabaseName() || process.env.PEAKERR_SANDBOX !== "true")
    throw new Error(
      "Tests require a local database ending in _test and PEAKERR_SANDBOX=true. The configured environment was not modified.",
    );
}
export async function assertIsolatedTestServer(baseUrl: string) {
  assertLocalTestEnvironment();
  if (!["127.0.0.1", "localhost"].includes(new URL(baseUrl).hostname))
    throw new Error("Tests require a loopback test server");
  const response = await fetch(`${baseUrl}/api/testing/status`);
  const state = await response.json().catch(() => null);
  if (
    !response.ok ||
    state?.database !== localTestDatabaseName() ||
    !state?.supplierSandbox ||
    !state?.cryptoSandbox
  )
    throw new Error(
      "Start the test server with the same local test database and both supplier and crypto sandbox flags enabled before running integration tests",
    );
}
