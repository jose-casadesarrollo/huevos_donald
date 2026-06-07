import type { FC } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { FONTS, PALETTE } from "../theme";

/**
 * Step 01 — "Eliges tu plan". A monthly egg balance that ticks down (24 → 22)
 * while a yolk-gradient progress bar breathes, and a points dot pulses. 180
 * frames @ 30fps (6s), 400×160.
 */
export const SaldoComposition: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rawCount = interpolate(frame, [0, 60, 90, 120, 180], [24, 24, 23, 22, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const count = Math.round(rawCount);

  // A quick spring bob (-3px → 0) each time the counter ticks down, to
  // emphasise the decrement.
  const tickBob = (center: number) => {
    if (frame < center) return 0;
    const s = spring({
      frame: frame - center,
      fps,
      config: { damping: 14, stiffness: 220, mass: 0.6 },
      durationInFrames: 14,
    });
    return -3 * (1 - s);
  };
  const countY = tickBob(75) + tickBob(105);

  const barW = interpolate(frame, [0, 90, 180], [75, 35, 75], {
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dotOpacity = interpolate(frame % 48, [0, 24, 48], [1, 0.5, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: PALETTE.cream,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: FONTS.body,
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: PALETTE.inkSoft,
        }}
      >
        Saldo disponible
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 6,
          transform: `translateY(${countY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: FONTS.display,
            fontWeight: 700,
            fontSize: 46,
            lineHeight: 1,
            color: PALETTE.ink,
          }}
        >
          {count}
        </span>
        <span
          style={{
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 20,
            color: PALETTE.inkSoft,
          }}
        >
          huevos
        </span>
      </div>

      <div
        style={{
          marginTop: 14,
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(34,26,15,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barW}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PALETTE.yolk}, ${PALETTE.yolkDeep})`,
          }}
        />
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 500, color: PALETTE.inkSoft }}>
          Plan Familia · 36 al mes
        </span>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: FONTS.mono,
            fontSize: 10,
            fontWeight: 700,
            color: PALETTE.ink,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: PALETTE.red,
              opacity: dotOpacity,
            }}
          />
          + 340 puntos
        </span>
      </div>
    </AbsoluteFill>
  );
};
