import type { Metadata } from "next";
import { Geist } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Surgeon | Grow Your Social Media, Instantly",
  description:
    "Buy real Instagram, TikTok, YouTube and Facebook followers, likes and views. Fast delivery, secure checkout, 24/7 support.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>{children}</SessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
