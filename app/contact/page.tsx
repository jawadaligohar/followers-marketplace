import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Contact Us | Surgeon" };

export default function ContactPage() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-background">
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
                <p className="text-sm text-muted-foreground">hello@surgeon.io</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">24/7 Phone</p>
                <p className="text-sm text-muted-foreground">+44 123 456 7890</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold">London Office</p>
                <p className="text-sm text-muted-foreground">123 Market St, London, UK</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-3xl border border-border bg-card p-10 shadow-xl shadow-black/5">
            <form className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First name</Label>
                  <Input id="first-name" placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last name</Label>
                  <Input id="last-name" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="jane@example.com" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <textarea 
                  id="message" 
                  rows={4} 
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How can we help you?"
                />
              </div>

              <Button type="button" className="w-full gap-2 py-6 text-base">
                Send message <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
