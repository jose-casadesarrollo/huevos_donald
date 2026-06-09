import { CartDrawer } from "@/components/tienda/cart/CartDrawer";
import { CartProvider } from "@/lib/cart/CartProvider";

/**
 * Mounts the CartProvider over the whole /tienda subtree (grid, detail, carro,
 * checkout) so any tienda surface can read/mutate the cart. Server component:
 * children stay server-rendered; the provider is the only client island. The
 * drawer lives here (once) so it's available across every store page.
 */
export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  );
}
