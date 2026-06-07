import { useEffect, useRef, useState } from "react";

/**
 * One-shot in-view detector. Returns a ref to attach and a boolean that flips
 * `true` the first time the element intersects the viewport, then stops
 * observing — so the metric count-ups fire once, on scroll-in, never on load
 * and never re-firing. Mirrors the Productores section's hook.
 */
export function useInView<T extends Element = HTMLDivElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}
