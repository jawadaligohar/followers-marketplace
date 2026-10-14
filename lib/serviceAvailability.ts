/** Shared by checkout and its controls. Keep unsupported offers visible without
 * collecting payment for quantities no reviewed supplier can deliver. */
export function serviceAvailability(
  slug: string,
  quantity: number,
): string | null {
  if (slug === "instagram-uk-likes" && quantity > 2000)
    return "UK Likes above 2,000 are temporarily unavailable. Choose a smaller package.";
  return null;
}
