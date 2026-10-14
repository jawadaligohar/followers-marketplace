import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import SessionProvider from "@/components/providers/SessionProvider";
import { CartProvider } from "@/lib/cart/CartContext";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import { connection } from "next/server";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Surgeon | Real Growth, Real People",
  description:
    "Buy real Instagram, TikTok, Facebook and X (Twitter) followers, likes, views, comments and auto likes. Fast delivery, secure checkout, 24/7 support.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Every HTML response must render with its own CSP nonce, never a cached nonce.
  await connection();
  return (
    <html lang="en" className={cn("h-full", "antialiased", "font-sans", outfit.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <CartProvider>{children}</CartProvider>
        </SessionProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
