/** Client-safe: reject protocol-relative URLs, backslashes and control characters. */
export function safeCallbackPath(value: string | null | undefined) {
  if (
    !value?.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  )
    return "/dashboard";
  try {
    const url = new URL(value, "https://app.invalid");
    return url.origin === "https://app.invalid"
      ? url.pathname + url.search + url.hash
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
