import type { Metadata } from "next";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { CartView } from "@/components/tienda/cart/CartView";
import { TIENDA_TOKENS } from "@/components/tienda/tokens";

export const metadata: Metadata = {
  title: "Tu carro — Huevos Donald",
};

export default function CarroPage() {
  return (
    <>
      <Nav />
      <main
        style={TIENDA_TOKENS}
        className="bg-background px-6 pb-[100px] pt-[120px] md:pt-[132px]"
      >
        <CartView />
      </main>
      <Footer />
    </>
  );
}
