import { CTAFinal } from "@/components/landing/CTAFinal";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { Nav } from "@/components/landing/Nav";
import { Social } from "@/components/landing/Social";
import { WhatsAppWidget } from "@/components/landing/WhatsAppWidget";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { ComoFuncionaSection } from "@/components/sections/ComoFunciona";
import { ContrasteSection } from "@/components/sections/Contraste";
import { ImpactoSection } from "@/components/sections/Impacto";
import { PlanesSection } from "@/components/sections/Planes";
import { ProductoresSection } from "@/components/sections/Productores";
import { TrazabilidadSection } from "@/components/sections/Trazabilidad";

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <TrazabilidadSection />
      <ContrasteSection />
      <ProductoresSection />
      <ComoFuncionaSection />
      <PlanesSection />
      <Social />
      <ImpactoSection />
      <FAQ />
      <CTAFinal />
      <Footer />
      <WhatsAppWidget />
      <SupportChatWidget />
    </>
  );
}
