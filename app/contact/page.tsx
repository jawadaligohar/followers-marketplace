import { Mail } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PackageLinks from "@/components/shared/PackageLinks";
import PackageSupportForm from "@/components/service/PackageSupportForm";

export const metadata = { title: "Contact Us | Surgeon" };

export default function ContactPage() {
  const email = process.env.SUPPORT_EMAIL || "hello@surgeon.io";
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-background">
      <Header />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 via-background to-background" />
      
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-500">Contact Us</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            We&apos;re here to help
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Have a question about your order, our refill guarantee, or need custom solutions? Reach out to our 24/7 support team.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="flex flex-col justify-center space-y-8 rounded-3xl border border-border bg-card p-10 shadow-xl shadow-black/5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">Email support</p>
                <a href={`mailto:${email}`} className="text-sm text-brand-600 hover:underline">{email}</a>
              </div>
            </div>
            
            <p className="text-sm leading-relaxed text-muted-foreground">Include your checkout email, order ID, and package details so support can find your purchase.</p>
            <Link href="/dashboard/orders" className="text-sm font-semibold text-brand-600 hover:underline">View your orders &rarr;</Link>
            <PackageLinks slugs={["instagram-followers", "tiktok-likes", "facebook-page-likes", "twitter-votes"]} />
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-border bg-card p-10 shadow-xl shadow-black/5">
            <PackageSupportForm email={email} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
