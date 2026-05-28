import { CTAFinal } from "@/components/landing/CTAFinal";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Nav } from "@/components/landing/Nav";
import { Origin } from "@/components/landing/Origin";
import { Pricing } from "@/components/landing/Pricing";
import { Social } from "@/components/landing/Social";
import { WhatsAppWidget } from "@/components/landing/WhatsAppWidget";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <HowItWorks />
      <Pricing />
      <Origin />
      <Social />
      <FAQ />
      <CTAFinal />
      <Footer />
      <WhatsAppWidget />
    </>
  );
}
