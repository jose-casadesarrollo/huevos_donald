import type { Metadata } from "next";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { CheckoutView } from "@/components/tienda/checkout/CheckoutView";
import { TIENDA_TOKENS } from "@/components/tienda/tokens";
import { getActiveZones, getCheckoutPrefill } from "@/lib/checkout/queries";

export const metadata: Metadata = {
  title: "Checkout — Huevos Donald",
};

// Reads the cart cookie, delivery zones and (optional) user per request.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, prefill] = await Promise.all([getActiveZones(), getCheckoutPrefill()]);
  return (
    <>
      <Nav />
      <main
        style={TIENDA_TOKENS}
        className="bg-background px-6 pb-[100px] pt-[120px] md:pt-[132px]"
      >
        <CheckoutView zones={zones} prefill={prefill} />
      </main>
      <Footer />
    </>
  );
}
