import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PlatformMarquee from "@/components/PlatformMarquee";
import ShowcaseSection from "@/components/ShowcaseSection";
import Stats from "@/components/Stats";
import Services from "@/components/Services";
import HowItWorks from "@/components/HowItWorks";
import ComparisonTable from "@/components/ComparisonTable";
import Pricing from "@/components/Pricing";
import ExploreServices from "@/components/ExploreServices";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <Hero />
        <PlatformMarquee />
        <ShowcaseSection />
        <Stats />
        <Services />
        <HowItWorks />
        <ComparisonTable />
        <Pricing />
        <ExploreServices />
        <Testimonials />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
