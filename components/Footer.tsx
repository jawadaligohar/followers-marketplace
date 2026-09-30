import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const FOOTER_LINKS = {
  Services: ["Instagram", "TikTok", "YouTube", "Facebook", "Telegram"],
  Company: ["About Us", "Contact", "Blog", "Careers"],
  Legal: ["Terms of Service", "Privacy Policy", "Refund Policy"],
};

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-white/[0.02]">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-accent-500">
                <Sparkles className="h-4 w-4 text-white" />
              </span>
              <span className="text-base font-bold">Surgeon</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/40">
              The fastest way to grow your social media presence — trusted by
              creators and brands worldwide.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white/80">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/40 transition hover:text-white/70"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="mt-12 bg-white/10" />
        <div className="flex flex-col items-center justify-between gap-4 pt-8 text-xs text-white/30 sm:flex-row">
          <p>© {new Date().getFullYear()} Surgeon. All rights reserved.</p>
          <p>Not affiliated with Instagram, TikTok, YouTube or Facebook.</p>
        </div>
      </div>
    </footer>
  );
}
