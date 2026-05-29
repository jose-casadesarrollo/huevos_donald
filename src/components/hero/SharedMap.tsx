"use client";

import maplibregl, { Map, Marker } from "maplibre-gl";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const EXIT_MS = 500; // pin leaves
const FLY_MS = 4000; // camera glides between locations
// Pin entry overlaps the tail of the fly so they land together. With the spring
// settling in ~0.5–0.6s, dropping the pin while ~500ms of fly remains means
// camera-landing and pin-landing coincide visually.
const PIN_ENTRY_LEAD_MS = 500;

type Coords = [number, number]; // [lng, lat]

interface Producer {
  coords: Coords;
  label: string;
}

const PRODUCERS: Record<string, Producer> = {
  SE: { coords: [-70.5854, -32.792], label: "San Esteban" },
  TT: { coords: [-70.936, -33.0875], label: "Til Til" },
  MP: { coords: [-71.1467, -33.6889], label: "Mallarauco" },
  PN: { coords: [-70.7383, -33.8077], label: "Paine" },
};

const SANTIAGO: Coords = [-70.6693, -33.4489];

// MapTiler satellite — set NEXT_PUBLIC_MAPTILER_KEY in .env.local.
// Falls back to OpenFreeMap Positron if the key is missing so dev doesn't break.
const MAP_STYLE = process.env.NEXT_PUBLIC_MAPTILER_KEY
  ? `https://api.maptiler.com/maps/satellite/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`
  : "https://tiles.openfreemap.org/styles/positron";
// Satellite-grade detail: z14 shows individual fields and farm structures.
// MapTiler satellite tiles go up to ~z19 if you want even closer.
const ACTIVE_ZOOM = 14;

function codeFromId(id: string): string {
  return id.split("-").pop() ?? "";
}

// Slippy-map tile math: convert (lng, lat, zoom) → integer tile (x, y).
function lonToTile(lng: number, z: number): number {
  return Math.floor(((lng + 180) / 360) * 2 ** z);
}
function latToTile(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z,
  );
}

/**
 * Warm the browser HTTP cache by prefetching satellite tiles around every
 * producer + Santiago at the three zooms the flyTo arc passes through
 * (z9 high altitude, z11 mid-arc, z14 landing). Once cached, MapLibre's tile
 * requests during flyTo resolve instantly — no gray squares mid-animation.
 */
function prefetchSatelliteTiles(): () => void {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (!key || typeof document === "undefined") return () => {};

  const template = `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${key}`;
  const links: HTMLLinkElement[] = [];
  const seen = new Set<string>();

  function add(z: number, x: number, y: number) {
    const url = template
      .replace("{z}", String(z))
      .replace("{x}", String(x))
      .replace("{y}", String(y));
    if (seen.has(url)) return;
    seen.add(url);
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = url;
    link.crossOrigin = "anonymous";
    document.head.appendChild(link);
    links.push(link);
  }

  const targets: Coords[] = [...Object.values(PRODUCERS).map((p) => p.coords), SANTIAGO];

  // Square grid of tiles around (cx, cy) at zoom z, radius r (so side = 2r+1)
  function fill(z: number, lng: number, lat: number, radius: number) {
    const cx = lonToTile(lng, z);
    const cy = latToTile(lat, z);
    for (let dx = -radius; dx <= radius; dx++)
      for (let dy = -radius; dy <= radius; dy++) add(z, cx + dx, cy + dy);
  }

  for (const [lng, lat] of targets) {
    fill(14, lng, lat, 3); // 7×7 = 49 high-detail landing tiles
    fill(13, lng, lat, 2); // 5×5 = 25 mid-detail
    fill(12, lng, lat, 1); // 3×3 = 9 mid-arc
    fill(11, lng, lat, 1); // 3×3 = 9 high mid-arc
    add(9, lonToTile(lng, 9), latToTile(lat, 9));
  }

  return () => {
    for (const link of links) link.remove();
  };
}

interface SharedMapProps {
  activeId: string;
  distanceKm: number;
}

/**
 * Cinematic drop-pin: the SVG pin falls from above with spring physics,
 * an impact ring snaps out on landing, and the producer-name label fades up
 * underneath the pin head. Re-mounts (via key={producerCode}) on every
 * carousel swap so the whole sequence replays.
 */
function AnimatedDropPin({ name }: { name: string }) {
  // Tween easings for entry vs. exit so the exit reads as "yanked away":
  // entry uses spring physics, exit uses a fast ease-in.
  const exitEase = [0.7, 0, 0.84, 0] as const;

  return (
    <div className="pointer-events-none flex flex-col items-center">
      {/* Producer name label — appears after the pin lands; vanishes first on exit */}
      <motion.div
        className="mb-2 rounded-md bg-[#FFFBF0] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#221A0F] shadow-[0_2px_8px_rgba(0,0,0,0.25)] whitespace-nowrap"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
        initial={{ y: 6, opacity: 0, scale: 0.85 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 6, opacity: 0, scale: 0.85 }}
        transition={{ delay: 0.7, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        {name}
      </motion.div>

      {/* The dropping pin — falls in with spring, rises out with ease-in */}
      <motion.div
        className="relative"
        initial={{ y: -200, scale: 0.55, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{
          y: -200,
          scale: 0.55,
          opacity: 0,
          transition: { duration: EXIT_MS / 1000, ease: exitEase },
        }}
        transition={{
          y: { type: "spring", stiffness: 320, damping: 17, mass: 1.1, delay: 0.05 },
          scale: { type: "spring", stiffness: 320, damping: 17, mass: 1.1, delay: 0.05 },
          opacity: { duration: 0.15, delay: 0.05 },
        }}
      >
        <svg width="32" height="44" viewBox="0 0 32 44" fill="none" aria-hidden>
          <defs>
            <filter id="pin-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodOpacity="0.4" />
            </filter>
          </defs>
          {/* Teardrop body — tip at (16, 42) which is the marker anchor point */}
          <path
            d="M16 2 C8.27 2 2 8.27 2 16 C2 25 16 42 16 42 C16 42 30 25 30 16 C30 8.27 23.73 2 16 2 Z"
            fill="#E61A27"
            stroke="#FFFBF0"
            strokeWidth="2.5"
            filter="url(#pin-shadow)"
          />
          <circle cx="16" cy="15" r="5.5" fill="#FFFBF0" />
          <circle cx="16" cy="15" r="2.8" fill="#E61A27" />
        </svg>
      </motion.div>

      {/* Impact ring — only on entry; fades quietly on exit */}
      <motion.div
        className="pointer-events-none absolute left-1/2 rounded-full border-2 border-[#E61A27]"
        style={{ bottom: -6, transformOrigin: "center center" }}
        initial={{ width: 0, height: 0, opacity: 0, x: "-50%" }}
        animate={{ width: 32, height: 8, opacity: [0.65, 0] }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.55, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export function SharedMap({ activeId, distanceKm }: SharedMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const pinMarkerRef = useRef<Marker | null>(null);
  const firstLoadRef = useRef(true);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const [pinEl, setPinEl] = useState<HTMLDivElement | null>(null);
  const [pinVisible, setPinVisible] = useState(false);

  const code = codeFromId(activeId);
  const active = PRODUCERS[code] ?? { coords: SANTIAGO, label: "Santiago" };

  // Capture the initial coords once so the init effect doesn't re-fire on activeId changes.
  const initial = useMemo(() => active, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warm the browser HTTP cache for satellite tiles as soon as the component
  // mounts — runs in parallel with map init.
  useEffect(() => prefetchSatelliteTiles(), []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: initial.coords,
      zoom: ACTIVE_ZOOM,
      attributionControl: false,
      interactive: false,
      pitchWithRotate: false,
      dragRotate: false,
      // Keep a generous tile cache resident in memory so already-seen areas
      // (especially the 4 producer locations at z14) survive multiple flyTos
      // without reloading. Default auto-sizes ~10 tiles.
      maxTileCacheSize: 1024,
    });

    mapRef.current = map;

    // The aspect-[16/10] container often hasn't reached its final size when
    // the map is constructed (zero/tiny width on first paint). Observe the
    // container and call resize() on every layout change so the canvas grows
    // to fill the box. This also covers fonts loading + parent reflows.
    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(containerRef.current);

    map.on("load", () => {
      // Strip every text/symbol label from the Positron basemap so the tiles
      // become a quiet visual canvas. We add a single "closest city" label
      // marker below, controlled per active producer.
      const layers = map.getStyle().layers ?? [];
      for (const layer of layers) {
        if (layer.type === "symbol") {
          map.setLayoutProperty(layer.id, "visibility", "none");
        }
      }

      // Reference dots for all 4 producers (small + neutral)
      Object.values(PRODUCERS).forEach((p) => {
        const el = document.createElement("div");
        el.style.cssText =
          "width:8px;height:8px;border-radius:50%;background:rgba(74,61,42,0.55);border:1px solid rgba(255,251,240,0.9);pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,0.18);";
        new maplibregl.Marker({ element: el }).setLngLat(p.coords).addTo(map);
      });

      // Active producer marker — empty wrapper. The animated drop-pin (SVG +
      // label) renders into this element via React Portal so Framer Motion
      // can re-trigger the drop animation on each activeId change.
      const pinWrap = document.createElement("div");
      pinWrap.style.cssText = "pointer-events:none;";
      pinMarkerRef.current = new maplibregl.Marker({
        element: pinWrap,
        anchor: "bottom",
      })
        .setLngLat(initial.coords)
        .addTo(map);
      setPinEl(pinWrap);

      setStyleLoaded(true);
    });

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
      pinMarkerRef.current = null;
      setPinEl(null);
      setStyleLoaded(false);
    };
  }, [initial.coords]);

  // Sequenced swap: pin EXIT → camera flyTo → pin ENTRY. The map only starts
  // moving after the pin has cleared, and the new pin doesn't drop until the
  // camera has landed. Skips the exit phase on the very first load.
  useEffect(() => {
    if (!styleLoaded || !mapRef.current) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // First time the map is ready — drop the pin in place at the initial
    // producer with no exit needed.
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      pinMarkerRef.current?.setLngLat(active.coords);
      setPinVisible(true);
      return;
    }

    if (reduced) {
      pinMarkerRef.current?.setLngLat(active.coords);
      mapRef.current.flyTo({
        center: active.coords,
        zoom: ACTIVE_ZOOM,
        duration: 0,
        essential: true,
      });
      setPinVisible(true);
      return;
    }

    // Phase 1 — kick off pin exit AND camera fly at the same moment. The pin
    // stays anchored to its OLD coords during exit; we only relocate the marker
    // once it has fully faded so it never visibly teleports.
    setPinVisible(false);
    mapRef.current.flyTo({
      center: active.coords,
      zoom: ACTIVE_ZOOM,
      duration: FLY_MS,
      essential: true,
      curve: 1.7,
      speed: 0.7,
    });

    // Phase 2 — once the pin has finished exiting, move the (invisible) marker
    // to the new producer. No visible jump because there's nothing rendered
    // into the marker right now.
    const relocateTimer = window.setTimeout(() => {
      pinMarkerRef.current?.setLngLat(active.coords);
    }, EXIT_MS);

    // Phase 3 — drop the new pin while the camera still has ~500ms of fly
    // remaining, so the pin's spring settle and the camera's landing happen at
    // the same moment.
    const entryTimer = window.setTimeout(
      () => setPinVisible(true),
      FLY_MS - PIN_ENTRY_LEAD_MS,
    );

    return () => {
      window.clearTimeout(relocateTimer);
      window.clearTimeout(entryTimer);
    };
  }, [active.coords, styleLoaded]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[rgba(34,26,15,0.06)] bg-[var(--ink)]">
      <div ref={containerRef} className="h-full w-full" />

      {/* Animated drop-pin lives inside the MapLibre marker element. The pin
        * mounts under <AnimatePresence> so its exit animation plays before the
        * marker is relocated and the next pin drops in. The key={code} ensures
        * the entry sequence replays from scratch for each producer. */}
      {pinEl &&
        createPortal(
          <AnimatePresence mode="wait">
            {pinVisible && <AnimatedDropPin key={code} name={active.label} />}
          </AnimatePresence>,
          pinEl,
        )}

      {/* Soft inner shadow blends the satellite into the cream card edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ boxShadow: "inset 0 0 40px rgba(34,26,15,0.35)" }}
      />

      {/* Origin label — corner */}
      <div
        className="absolute left-3 top-3 rounded-sm bg-[var(--shell)]/90 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink)]"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        {active.label} → RM
      </div>

      {/* Distance chip — bottom right */}
      <div
        className="absolute bottom-3 right-3 flex items-baseline gap-1 rounded-md border border-[rgba(34,26,15,0.1)] bg-[var(--shell)] px-2.5 py-1"
        style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
      >
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          DIST
        </span>
        <span className="text-sm font-bold leading-none text-[var(--red)]">{distanceKm}</span>
        <span className="text-[10px] font-bold tracking-[0.1em] text-[var(--ink-soft)]">KM</span>
      </div>
    </div>
  );
}
