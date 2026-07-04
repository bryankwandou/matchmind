import Navigation from "@/components/Navigation";
import Hero from "@/components/sections/Hero";
import LiveTicker from "@/components/sections/LiveTicker";
import Features from "@/components/sections/Features";
import OnChain from "@/components/sections/OnChain";
import HowItWorks from "@/components/sections/HowItWorks";
import AIDemoSection from "@/components/sections/AIDemoSection";
import Stats from "@/components/sections/Stats";
import Monetization from "@/components/sections/Monetization";
import CTA from "@/components/sections/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main style={{ background: "transparent", minHeight: "100vh", position: "relative", zIndex: 1 }}>
      <Navigation />
      <Hero />
      <LiveTicker />
      <Stats />
      <Features />
      <OnChain />
      <HowItWorks />
      <AIDemoSection />
      <Monetization />
      <CTA />
      <Footer />
    </main>
  );
}
