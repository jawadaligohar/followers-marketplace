// Full service catalog, mirrored from megafollowers.uk (scraped 2026-10-14).
// Prices are kept in the original GBP and converted to USD with GBP_TO_USD, so a
// rate change is a one-line edit followed by `npm run seed`.
//
// This file seeds the Service collection (scripts/seed.ts) and supplies the
// marketing copy for service pages. At runtime the Service collection is the
// source of truth for prices; the server never trusts catalog prices sent by a client.

export const GBP_TO_USD = 1.3247; // ECB reference rate, 2026-10-13

export type PlatformId = "instagram" | "tiktok" | "facebook" | "twitter";

/**
 * standard  one-off delivery to a single link
 * auto      30-day subscription: `qty` is delivered to every new post, `postsCovered` caps the posts
 * comments  customer supplies one comment per unit of `qty`
 * poll      customer picks which poll option receives the votes
 */
export type ServiceKind = "standard" | "auto" | "comments" | "poll";

/** What the customer's link must point at. Drives input labels and placeholders. */
export type LinkTarget = "profile" | "post" | "video" | "reel" | "live" | "page" | "tweet" | "space";

export type CatalogTier = {
  qty: number;
  gbp: number;
  highlight?: boolean;
  /** Auto plans only: extra GBP charged to cover more than the included 30 posts. */
  posts?: Record<number, number>;
};

export type CatalogService = {
  slug: string;
  platformId: PlatformId;
  category: string;
  kind: ServiceKind;
  target: LinkTarget;
  tagline: string;
  description: string;
  tiers: CatalogTier[];
};

export const INCLUDED_AUTO_POSTS = 30;
export const POLL_OPTIONS = [1, 2, 3, 4] as const;

export const PLATFORMS: Record<PlatformId, { label: string; hostname: string }> = {
  instagram: { label: "Instagram", hostname: "instagram.com" },
  tiktok: { label: "TikTok", hostname: "tiktok.com" },
  facebook: { label: "Facebook", hostname: "facebook.com" },
  twitter: { label: "X (Twitter)", hostname: "x.com" },
};

export const PLATFORM_ORDER: PlatformId[] = ["instagram", "tiktok", "facebook", "twitter"];

export const CATALOG: CatalogService[] = [
  {
    slug: "instagram-likes",
    platformId: "instagram",
    category: "Likes",
    kind: "standard",
    target: "post",
    tagline: "Give every post a lift",
    description: "Real likes from active Instagram profiles on any public post, Reel or carousel.",
    tiers: [
      { qty: 100, gbp: 3.49 },
      { qty: 300, gbp: 4.09 },
      { qty: 500, gbp: 5.83 },
      { qty: 1000, gbp: 8.49 },
      { qty: 2500, gbp: 12.99 },
      { qty: 5000, gbp: 24.99, highlight: true },
      { qty: 10000, gbp: 47.99 },
      { qty: 15000, gbp: 69.00 },
      { qty: 25000, gbp: 119.99 },
      { qty: 50000, gbp: 214.99 },
    ],
  },
  {
    slug: "instagram-followers",
    platformId: "instagram",
    category: "Followers",
    kind: "standard",
    target: "profile",
    tagline: "Grow your audience",
    description: "Real followers that build on the audience your profile already has.",
    tiers: [
      { qty: 100, gbp: 1.99 },
      { qty: 250, gbp: 4.69 },
      { qty: 500, gbp: 9.05 },
      { qty: 1000, gbp: 10.50, highlight: true },
      { qty: 2500, gbp: 24.00 },
      { qty: 5000, gbp: 37.00 },
      { qty: 10000, gbp: 84.00 },
    ],
  },
  {
    slug: "instagram-uk-followers",
    platformId: "instagram",
    category: "UK Followers",
    kind: "standard",
    target: "profile",
    tagline: "UK-based followers",
    description: "Followers from UK-based accounts, ideal for local businesses and British creators.",
    tiers: [
      { qty: 1000, gbp: 30.00 },
      { qty: 2500, gbp: 70.00 },
      { qty: 4000, gbp: 99.00, highlight: true },
      { qty: 5000, gbp: 125.00 },
      { qty: 20000, gbp: 399.00 },
    ],
  },
  {
    slug: "instagram-views",
    platformId: "instagram",
    category: "Views",
    kind: "standard",
    target: "video",
    tagline: "Push videos further",
    description: "Views on any Instagram video: feed videos, Reels, IGTV and live replays.",
    tiers: [
      { qty: 100, gbp: 1.14 },
      { qty: 500, gbp: 3.99 },
      { qty: 1000, gbp: 6.99 },
      { qty: 2500, gbp: 15.00 },
      { qty: 5000, gbp: 25.00, highlight: true },
      { qty: 10000, gbp: 45.00 },
      { qty: 25000, gbp: 79.00 },
      { qty: 50000, gbp: 98.99 },
    ],
  },
  {
    slug: "instagram-comments",
    platformId: "instagram",
    category: "Comments",
    kind: "comments",
    target: "post",
    tagline: "Get the conversation going",
    description: "Custom comments you write yourself, posted word-for-word on your chosen post.",
    tiers: [
      { qty: 10, gbp: 5.84 },
      { qty: 25, gbp: 11.69 },
      { qty: 50, gbp: 17.54, highlight: true },
      { qty: 100, gbp: 23.39 },
    ],
  },
  {
    slug: "instagram-auto-likes",
    platformId: "instagram",
    category: "Auto Likes",
    kind: "auto",
    target: "profile",
    tagline: "Likes on every new post",
    description: "Every new post you publish over the next 30 days receives your chosen number of likes automatically.",
    tiers: [
      { qty: 50, gbp: 8.00, posts: { 60: 6.00, 90: 11.00, 120: 15.00 } },
      { qty: 100, gbp: 15.14, posts: { 60: 11.00, 90: 21.00, 120: 29.00 } },
      { qty: 250, gbp: 23.99, posts: { 60: 26.00, 90: 49.00, 120: 70.00 } },
      { qty: 500, gbp: 41.99, posts: { 60: 47.00, 90: 90.00, 120: 127.00 } },
      { qty: 1000, gbp: 72.99, highlight: true, posts: { 60: 84.00, 90: 160.00, 120: 225.00 } },
      { qty: 3000, gbp: 169.00, posts: { 60: 220.00, 90: 410.00, 120: 580.00 } },
      { qty: 5000, gbp: 259.00, posts: { 60: 320.00, 90: 585.00, 120: 810.00 } },
      { qty: 10000, gbp: 485.00, posts: { 60: 510.00, 90: 910.00, 120: 1196.00 } },
    ],
  },
  {
    slug: "instagram-auto-views",
    platformId: "instagram",
    category: "Auto Views",
    kind: "auto",
    target: "profile",
    tagline: "Views on every new post",
    description: "Every new video you publish over the next 30 days receives your chosen number of views, with impressions and reach included.",
    tiers: [
      { qty: 100, gbp: 8.00, posts: { 60: 7.00, 90: 13.00, 120: 18.00 } },
      { qty: 500, gbp: 34.00, posts: { 60: 29.00, 90: 55.00, 120: 75.00 } },
      { qty: 1000, gbp: 59.00, posts: { 60: 50.00, 90: 96.00, 120: 136.00 } },
      { qty: 2500, gbp: 125.00, posts: { 60: 110.00, 90: 210.00, 120: 294.00 } },
      { qty: 5000, gbp: 215.00, highlight: true, posts: { 60: 190.00, 90: 364.00, 120: 514.00 } },
      { qty: 10000, gbp: 375.00, posts: { 60: 334.00, 90: 640.00, 120: 890.00 } },
      { qty: 25000, gbp: 875.00, posts: { 60: 775.00, 90: 1460.00, 120: 2075.00 } },
      { qty: 50000, gbp: 1625.00, posts: { 60: 1425.00, 90: 2570.00, 120: 3650.00 } },
    ],
  },
  {
    slug: "instagram-female-followers",
    platformId: "instagram",
    category: "Female Followers",
    kind: "standard",
    target: "profile",
    tagline: "Female-profile followers",
    description: "Followers from female-presenting profiles, sourced from premium USA and EU accounts.",
    tiers: [
      { qty: 250, gbp: 17.99 },
      { qty: 500, gbp: 33.99 },
      { qty: 1000, gbp: 65.99 },
      { qty: 2500, gbp: 97.99, highlight: true },
      { qty: 5000, gbp: 190.99 },
      { qty: 10000, gbp: 375.99 },
    ],
  },
  {
    slug: "instagram-reel-views",
    platformId: "instagram",
    category: "Reel Views",
    kind: "standard",
    target: "reel",
    tagline: "More plays on your Reels",
    description: "High-retention views on any public Reel, paced to look like natural viewing.",
    tiers: [
      { qty: 250, gbp: 1.49 },
      { qty: 500, gbp: 2.74 },
      { qty: 1000, gbp: 4.50 },
      { qty: 5000, gbp: 14.99, highlight: true },
      { qty: 10000, gbp: 21.99 },
      { qty: 50000, gbp: 89.99 },
    ],
  },
  {
    slug: "instagram-uk-likes",
    platformId: "instagram",
    category: "UK Likes",
    kind: "standard",
    target: "post",
    tagline: "UK-based likes",
    description: "Likes from UK-based profiles on any public post you choose.",
    tiers: [
      { qty: 500, gbp: 14.99 },
      { qty: 1000, gbp: 24.99 },
      { qty: 1500, gbp: 34.99 },
      { qty: 2500, gbp: 54.99, highlight: true },
      { qty: 3000, gbp: 64.99 },
      { qty: 4000, gbp: 84.99 },
      { qty: 5000, gbp: 99.99 },
    ],
  },
  {
    slug: "instagram-uk-auto-likes",
    platformId: "instagram",
    category: "UK Auto Likes",
    kind: "auto",
    target: "profile",
    tagline: "UK-based auto likes",
    description: "UK-based likes delivered automatically on every new post for 30 days.",
    tiers: [
      { qty: 50, gbp: 55.00, posts: { 60: 50.00, 90: 100.00, 120: 144.00 } },
      { qty: 100, gbp: 99.00, posts: { 60: 91.00, 90: 176.00, 120: 251.00 } },
      { qty: 150, gbp: 145.00, posts: { 60: 115.00, 90: 220.00, 120: 315.00 } },
      { qty: 300, gbp: 250.00, highlight: true, posts: { 60: 210.00, 90: 390.00, 120: 549.00 } },
      { qty: 500, gbp: 380.00, posts: { 60: 319.00, 90: 600.00, 120: 870.00 } },
      { qty: 1000, gbp: 650.00, posts: { 60: 549.00, 90: 1050.00, 120: 1500.00 } },
      { qty: 1500, gbp: 825.00, posts: { 60: 725.00, 90: 1425.00, 120: 2010.00 } },
    ],
  },
  {
    slug: "tiktok-likes",
    platformId: "tiktok",
    category: "Likes",
    kind: "standard",
    target: "video",
    tagline: "Give every post a lift",
    description: "Real likes on any TikTok video, delivered at a pace that reads as natural early engagement.",
    tiers: [
      { qty: 100, gbp: 1.99 },
      { qty: 300, gbp: 3.49 },
      { qty: 500, gbp: 5.45 },
      { qty: 1000, gbp: 8.49, highlight: true },
      { qty: 2500, gbp: 12.99 },
      { qty: 5000, gbp: 23.99 },
      { qty: 10000, gbp: 44.99 },
    ],
  },
  {
    slug: "tiktok-views",
    platformId: "tiktok",
    category: "Views",
    kind: "standard",
    target: "video",
    tagline: "Push videos further",
    description: "Views on any TikTok video, with even large orders completing quickly.",
    tiers: [
      { qty: 250, gbp: 1.49 },
      { qty: 500, gbp: 2.99 },
      { qty: 1000, gbp: 5.45 },
      { qty: 2500, gbp: 9.99 },
      { qty: 5000, gbp: 14.99, highlight: true },
      { qty: 10000, gbp: 26.99 },
      { qty: 20000, gbp: 48.99 },
      { qty: 30000, gbp: 59.99 },
      { qty: 50000, gbp: 79.99 },
    ],
  },
  {
    slug: "tiktok-followers",
    platformId: "tiktok",
    category: "Followers",
    kind: "standard",
    target: "profile",
    tagline: "Grow your audience",
    description: "Real followers to help you cross the 1,000 follower threshold for bio links and LIVE.",
    tiers: [
      { qty: 100, gbp: 1.99 },
      { qty: 250, gbp: 3.99 },
      { qty: 500, gbp: 7.00 },
      { qty: 1000, gbp: 11.50, highlight: true },
      { qty: 2000, gbp: 20.00 },
      { qty: 5000, gbp: 45.00 },
      { qty: 10000, gbp: 80.00 },
    ],
  },
  {
    slug: "tiktok-auto-likes",
    platformId: "tiktok",
    category: "Auto Likes",
    kind: "auto",
    target: "profile",
    tagline: "Likes on every new post",
    description: "Every new video you post over the next 30 days receives your chosen number of likes inside the first-hour window.",
    tiers: [
      { qty: 50, gbp: 6.00 },
      { qty: 100, gbp: 11.14 },
      { qty: 250, gbp: 22.99, highlight: true },
      { qty: 500, gbp: 41.99 },
      { qty: 1000, gbp: 69.99 },
    ],
  },
  {
    slug: "tiktok-auto-views",
    platformId: "tiktok",
    category: "Auto Views",
    kind: "auto",
    target: "profile",
    tagline: "Views on every new post",
    description: "Every new video you post over the next 30 days receives your chosen number of views automatically.",
    tiers: [
      { qty: 100, gbp: 7.00 },
      { qty: 300, gbp: 15.00 },
      { qty: 500, gbp: 27.00, highlight: true },
      { qty: 1000, gbp: 43.99 },
      { qty: 2000, gbp: 79.99 },
    ],
  },
  {
    slug: "tiktok-comments",
    platformId: "tiktok",
    category: "Comments",
    kind: "comments",
    target: "video",
    tagline: "Get the conversation going",
    description: "Custom comments you write yourself, posted word-for-word on your TikTok video.",
    tiers: [
      { qty: 10, gbp: 9.84 },
      { qty: 20, gbp: 14.54 },
      { qty: 25, gbp: 11.69, highlight: true },
      { qty: 30, gbp: 19.39 },
    ],
  },
  {
    slug: "tiktok-live-stream-views",
    platformId: "tiktok",
    category: "Live Stream Views",
    kind: "standard",
    target: "live",
    tagline: "Busier live streams",
    description: "Real-time viewers that join your TikTok LIVE and stay for around 30 minutes.",
    tiers: [
      { qty: 250, gbp: 9.00 },
      { qty: 500, gbp: 12.00 },
      { qty: 1000, gbp: 19.00, highlight: true },
      { qty: 2500, gbp: 49.50 },
      { qty: 5000, gbp: 95.00 },
    ],
  },
  {
    slug: "tiktok-uk-likes",
    platformId: "tiktok",
    category: "UK Likes",
    kind: "standard",
    target: "video",
    tagline: "UK-based likes",
    description: "Likes from UK-based accounts for a regional For You page push.",
    tiers: [
      { qty: 100, gbp: 3.00 },
      { qty: 250, gbp: 6.00 },
      { qty: 500, gbp: 10.00 },
      { qty: 1000, gbp: 18.00 },
      { qty: 2000, gbp: 32.00, highlight: true },
      { qty: 5000, gbp: 72.00 },
      { qty: 10000, gbp: 125.00 },
      { qty: 20000, gbp: 205.00 },
    ],
  },
  {
    slug: "tiktok-uk-views",
    platformId: "tiktok",
    category: "UK Views",
    kind: "standard",
    target: "video",
    tagline: "UK-based views",
    description: "Views from UK-based viewers for a regional For You page push.",
    tiers: [
      { qty: 1000, gbp: 2.15 },
      { qty: 2000, gbp: 3.10 },
      { qty: 5000, gbp: 6.15 },
      { qty: 10000, gbp: 11.00 },
      { qty: 25000, gbp: 23.00, highlight: true },
      { qty: 50000, gbp: 41.00 },
      { qty: 100000, gbp: 75.00 },
      { qty: 250000, gbp: 139.00 },
    ],
  },
  {
    slug: "facebook-followers",
    platformId: "facebook",
    category: "Followers",
    kind: "standard",
    target: "profile",
    tagline: "Grow your audience",
    description: "Real followers on your Facebook profile or business page.",
    tiers: [
      { qty: 250, gbp: 3.99 },
      { qty: 500, gbp: 5.90 },
      { qty: 1000, gbp: 11.50 },
      { qty: 2500, gbp: 17.99, highlight: true },
      { qty: 5000, gbp: 34.00 },
      { qty: 10000, gbp: 64.00 },
    ],
  },
  {
    slug: "facebook-page-likes",
    platformId: "facebook",
    category: "Page Likes",
    kind: "standard",
    target: "page",
    tagline: "Build page credibility",
    description: "Page likes for your business page, delivered as Page followers (what Facebook Pages display today).",
    tiers: [
      { qty: 500, gbp: 11.45 },
      { qty: 1000, gbp: 21.49 },
      { qty: 2500, gbp: 39.99, highlight: true },
      { qty: 5000, gbp: 74.99 },
      { qty: 10000, gbp: 129.00 },
    ],
  },
  {
    slug: "facebook-post-likes",
    platformId: "facebook",
    category: "Post Likes",
    kind: "standard",
    target: "post",
    tagline: "Lift individual posts",
    description: "Real likes on any public Facebook post.",
    tiers: [
      { qty: 250, gbp: 3.49 },
      { qty: 500, gbp: 5.45 },
      { qty: 1000, gbp: 8.49 },
      { qty: 2500, gbp: 12.99, highlight: true },
      { qty: 5000, gbp: 23.99 },
      { qty: 10000, gbp: 47.99 },
    ],
  },
  {
    slug: "facebook-video-views",
    platformId: "facebook",
    category: "Video Views",
    kind: "standard",
    target: "video",
    tagline: "Push videos further",
    description: "Views on any public Facebook video post.",
    tiers: [
      { qty: 300, gbp: 3.19 },
      { qty: 500, gbp: 4.19 },
      { qty: 1000, gbp: 5.45 },
      { qty: 2500, gbp: 9.99 },
      { qty: 5000, gbp: 17.99, highlight: true },
      { qty: 10000, gbp: 28.99 },
      { qty: 25000, gbp: 57.99 },
      { qty: 50000, gbp: 109.99 },
    ],
  },
  {
    slug: "facebook-uk-page-likes",
    platformId: "facebook",
    category: "UK Page Likes",
    kind: "standard",
    target: "page",
    tagline: "UK-based page likes",
    description: "UK-based Page likes for local business pages, delivered as Page followers.",
    tiers: [
      { qty: 50, gbp: 5.00 },
      { qty: 100, gbp: 9.00 },
      { qty: 150, gbp: 13.00 },
      { qty: 250, gbp: 19.00, highlight: true },
      { qty: 500, gbp: 35.00 },
      { qty: 1000, gbp: 55.00 },
      { qty: 1500, gbp: 72.00 },
    ],
  },
  {
    slug: "facebook-uk-post-likes",
    platformId: "facebook",
    category: "UK Post Likes",
    kind: "standard",
    target: "post",
    tagline: "UK-based post likes",
    description: "Likes from UK-based accounts on any public Facebook post.",
    tiers: [
      { qty: 50, gbp: 5.00 },
      { qty: 100, gbp: 9.00 },
      { qty: 150, gbp: 13.00, highlight: true },
      { qty: 250, gbp: 19.00 },
      { qty: 500, gbp: 35.00 },
    ],
  },
  {
    slug: "facebook-uk-followers",
    platformId: "facebook",
    category: "UK Followers",
    kind: "standard",
    target: "profile",
    tagline: "UK-based followers",
    description: "Followers from UK-based accounts on your Facebook profile or page.",
    tiers: [
      { qty: 50, gbp: 5.00 },
      { qty: 100, gbp: 9.00 },
      { qty: 150, gbp: 13.00 },
      { qty: 250, gbp: 19.00, highlight: true },
      { qty: 500, gbp: 35.00 },
      { qty: 1000, gbp: 55.00 },
      { qty: 1500, gbp: 72.00 },
    ],
  },
  {
    slug: "twitter-followers",
    platformId: "twitter",
    category: "Followers",
    kind: "standard",
    target: "profile",
    tagline: "Grow your audience",
    description: "Real followers on any public X (Twitter) profile.",
    tiers: [
      { qty: 100, gbp: 2.45 },
      { qty: 250, gbp: 4.99 },
      { qty: 500, gbp: 7.90 },
      { qty: 1000, gbp: 14.50 },
      { qty: 2000, gbp: 26.99 },
      { qty: 3000, gbp: 37.99, highlight: true },
      { qty: 5000, gbp: 54.00 },
      { qty: 7500, gbp: 79.00 },
      { qty: 10000, gbp: 114.00 },
      { qty: 20000, gbp: 198.00 },
    ],
  },
  {
    slug: "twitter-likes",
    platformId: "twitter",
    category: "Likes",
    kind: "standard",
    target: "tweet",
    tagline: "Give every post a lift",
    description: "Real likes on any public tweet.",
    tiers: [
      { qty: 100, gbp: 2.45 },
      { qty: 250, gbp: 4.49 },
      { qty: 500, gbp: 6.99 },
      { qty: 1000, gbp: 9.99, highlight: true },
      { qty: 2500, gbp: 19.00 },
      { qty: 5000, gbp: 34.00 },
      { qty: 10000, gbp: 54.00 },
    ],
  },
  {
    slug: "twitter-retweets",
    platformId: "twitter",
    category: "Retweets",
    kind: "standard",
    target: "tweet",
    tagline: "Spread your posts further",
    description: "Real retweets to push any public tweet to new timelines.",
    tiers: [
      { qty: 100, gbp: 3.49 },
      { qty: 250, gbp: 5.49 },
      { qty: 500, gbp: 8.40 },
      { qty: 1000, gbp: 14.49, highlight: true },
      { qty: 2500, gbp: 27.99 },
      { qty: 5000, gbp: 39.99 },
    ],
  },
  {
    slug: "twitter-views",
    platformId: "twitter",
    category: "Views",
    kind: "standard",
    target: "tweet",
    tagline: "Push videos further",
    description: "Impressions on any public tweet or video.",
    tiers: [
      { qty: 250, gbp: 2.89 },
      { qty: 500, gbp: 4.19 },
      { qty: 1000, gbp: 8.45 },
      { qty: 2500, gbp: 12.99, highlight: true },
      { qty: 5000, gbp: 22.99 },
      { qty: 10000, gbp: 34.99 },
    ],
  },
  {
    slug: "twitter-votes",
    platformId: "twitter",
    category: "Votes",
    kind: "poll",
    target: "tweet",
    tagline: "Back your poll option",
    description: "Votes on any live public poll, added to the option you choose.",
    tiers: [
      { qty: 100, gbp: 2.99 },
      { qty: 250, gbp: 4.49 },
      { qty: 500, gbp: 6.49, highlight: true },
      { qty: 1000, gbp: 9.49 },
      { qty: 2500, gbp: 19.99 },
    ],
  },
  {
    slug: "twitter-female-followers",
    platformId: "twitter",
    category: "Female Followers",
    kind: "standard",
    target: "profile",
    tagline: "Female-profile followers",
    description: "Followers from female-presenting profiles on any public X (Twitter) account.",
    tiers: [
      { qty: 100, gbp: 6.47 },
      { qty: 500, gbp: 10.45 },
      { qty: 1000, gbp: 15.45, highlight: true },
      { qty: 2500, gbp: 34.99 },
      { qty: 5000, gbp: 64.99 },
    ],
  },
  {
    slug: "twitter-space-listeners",
    platformId: "twitter",
    category: "Space Listeners",
    kind: "standard",
    target: "space",
    tagline: "Fill your Space",
    description: "Real-time listeners that join your live X Space and stay for at least 30 minutes.",
    tiers: [
      { qty: 250, gbp: 3.50 },
      { qty: 500, gbp: 5.45 },
      { qty: 750, gbp: 8.40, highlight: true },
      { qty: 1000, gbp: 9.99 },
      { qty: 1500, gbp: 14.99 },
    ],
  },
];

export function gbpToUsdCents(gbp: number) {
  return Math.round(gbp * GBP_TO_USD * 100);
}

export function getCatalogService(slug: string) {
  return CATALOG.find((s) => s.slug === slug);
}

export function catalogByPlatform(platformId: PlatformId) {
  return CATALOG.filter((s) => s.platformId === platformId);
}

export function formatQty(qty: number) {
  return qty.toLocaleString("en-US");
}

export function compactQty(qty: number) {
  if (qty >= 1000) return `${qty / 1000}K`;
  return String(qty);
}

const TARGET_LABELS: Record<LinkTarget, string> = {
  profile: "profile link",
  post: "post link",
  video: "video link",
  reel: "Reel link",
  live: "live stream link",
  page: "page link",
  tweet: "post link",
  space: "Space link",
};

const TARGET_PATHS: Record<PlatformId, Partial<Record<LinkTarget, string>>> = {
  instagram: { profile: "yourprofile", post: "p/CZ2mAFcjP-n", video: "p/CZ2mAFcjP-n", reel: "reel/CZ2mAFcjP-n" },
  tiktok: { profile: "@yourprofile", video: "@yourprofile/video/7312345678901234567", live: "@yourprofile/live" },
  facebook: { profile: "yourprofile", page: "yourpage", post: "yourpage/posts/123456789", video: "watch?v=123456789" },
  twitter: { profile: "yourprofile", tweet: "yourprofile/status/1834567890123456789", space: "i/spaces/1ABCdefGHIjkl" },
};

export function linkLabel(platformId: PlatformId, target: LinkTarget) {
  return `${PLATFORMS[platformId]?.label ?? ""} ${TARGET_LABELS[target]}`.trim();
}

export function linkPlaceholder(platformId: PlatformId, target: LinkTarget) {
  const host = PLATFORMS[platformId]?.hostname ?? "example.com";
  const path = TARGET_PATHS[platformId]?.[target] ?? TARGET_PATHS[platformId]?.profile ?? "yourprofile";
  return `https://${host}/${path}`;
}

export function serviceTitle(platformId: string, category: string) {
  const label = PLATFORMS[platformId as PlatformId]?.label ?? platformId;
  return `${label} ${category}`;
}

/** Lowest USD price for a platform, in cents. Used for "from $x" teasers. */
export function platformFromCents(platformId: PlatformId) {
  return Math.min(...catalogByPlatform(platformId).flatMap((s) => s.tiers.map((t) => gbpToUsdCents(t.gbp))));
}
