import {
  FaInstagram,
  FaTiktok,
  FaYoutube,
  FaFacebook,
  FaXTwitter,
  FaSpotify,
  FaTelegram,
  FaLinkedin,
} from "react-icons/fa6";

const LOGOS = [
  { name: "Instagram", icon: FaInstagram },
  { name: "TikTok", icon: FaTiktok },
  { name: "YouTube", icon: FaYoutube },
  { name: "Facebook", icon: FaFacebook },
  { name: "Twitter / X", icon: FaXTwitter },
  { name: "Spotify", icon: FaSpotify },
  { name: "Telegram", icon: FaTelegram },
  { name: "LinkedIn", icon: FaLinkedin },
];

export default function PlatformMarquee() {
  const items = [...LOGOS, ...LOGOS];
  return (
    <div className="border-y border-border bg-muted/40 py-6">
      <div
        className="mx-auto max-w-7xl overflow-hidden px-6"
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <div className="flex w-max animate-marquee gap-12">
          {items.map((item, i) => (
            <span
              key={`${item.name}-${i}`}
              className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold uppercase tracking-widest text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
