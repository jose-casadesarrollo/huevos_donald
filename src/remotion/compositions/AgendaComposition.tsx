import type { FC } from "react";
import {
  AbsoluteFill,
  interpolate,
  interpolateColors,
  useCurrentFrame,
} from "remotion";

import { FONTS, PALETTE } from "../theme";

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const ACTIVE = 2; // miércoles — día de despacho asignado

/**
 * Step 02 — "Configuras tu agenda". A week strip with the assigned delivery day
 * (Wednesday) breathing between red/red-deep, an expanding ring every 4s, and a
 * delivery-window bar. 180 frames @ 30fps, 400×160.
 */
export const AgendaComposition: FC = () => {
  const frame = useCurrentFrame();

  const activeBg = interpolateColors(
    frame % 60,
    [0, 30, 60],
    [PALETTE.red, PALETTE.redDeep, PALETTE.red],
  );

  const ringT = interpolate(frame % 120, [0, 45], [0, 1], { extrapolateRight: "clamp" });
  const ringScale = 1 + 0.35 * ringT;
  const ringOpacity = interpolate(ringT, [0, 1], [0.5, 0]);

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
      {/* Comuna row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: PALETTE.inkSoft,
          }}
        >
          Comuna
        </span>
        <span
          style={{
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: 18,
            color: PALETTE.ink,
          }}
        >
          Las Condes
        </span>
      </div>

      {/* Week strip */}
      <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
        {DAYS.map((d, i) => {
          const active = i === ACTIVE;
          return (
            <div key={i} style={{ position: "relative", flex: 1 }}>
              {active && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 9,
                    border: `2px solid ${PALETTE.red}`,
                    transform: `scale(${ringScale})`,
                    opacity: ringOpacity,
                  }}
                />
              )}
              <div
                style={{
                  position: "relative",
                  height: 36,
                  borderRadius: 9,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: active ? activeBg : PALETTE.shell,
                  color: active ? PALETTE.shell : PALETTE.inkSoft,
                  border: active ? "none" : "1px solid rgba(34,26,15,0.08)",
                }}
              >
                {d}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery window bar */}
      <div
        style={{
          marginTop: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "9px 12px",
          borderRadius: 10,
          backgroundColor: PALETTE.shell,
          border: "1px solid rgba(34,26,15,0.08)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: FONTS.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: PALETTE.inkSoft,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: PALETTE.moss }} />
          Tu ventana
        </span>
        <span style={{ fontFamily: FONTS.mono, fontSize: 13, fontWeight: 700, color: PALETTE.ink }}>
          09:00 — 12:00
        </span>
      </div>
    </AbsoluteFill>
  );
};
