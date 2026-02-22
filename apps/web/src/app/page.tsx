import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FooterCTA } from "@/components/landing/FooterCTA";

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <LiveDemo />
      <Features />
      <Pricing />
      <FooterCTA />
    </main>
  );
}
