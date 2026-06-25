import Navigation from "@/components/Navigation";
import Hero from "@/components/sections/Hero";
import LiveTicker from "@/components/sections/LiveTicker";
import Features from "@/components/sections/Features";
import HowItWorks from "@/components/sections/HowItWorks";
import AIDemoSection from "@/components/sections/AIDemoSection";
import Stats from "@/components/sections/Stats";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navigation />
      <Hero />
      <LiveTicker />
      <Stats />
      <Features />
      <HowItWorks />
      <AIDemoSection />
      <CTA />
      <Footer />
    </main>
  );
}
