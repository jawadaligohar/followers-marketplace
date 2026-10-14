const DOMAINS: Record<string, string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  facebook: ["facebook.com", "fb.watch"],
  twitter: ["twitter.com", "x.com"],
};
export function normalizeSocialTarget(
  value: string,
  platform: string,
  target: string,
) {
  let link = value.trim();
  if (target === "profile" && /^[\w.@-]+$/.test(link)) {
    const handle = link.replace(/^@/, "");
    if (!/^[a-z\d._-]{1,100}$/i.test(handle))
      throw new Error("Enter a valid public profile URL");
    const host = DOMAINS[platform]?.[0];
    if (!host) throw new Error("Unsupported platform");
    link = `https://${host}/${platform === "tiktok" ? "@" : ""}${handle}`;
  }
  let url: URL;
  try {
    url = new URL(link);
  } catch {
    throw new Error("Enter a complete HTTPS URL on the selected platform");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !(DOMAINS[platform] || []).some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    ) ||
    url.pathname === "/"
  )
    throw new Error(
      "Use a public HTTPS profile or post URL on the selected platform",
    );
  url.hash = "";
  return url.href;
}
