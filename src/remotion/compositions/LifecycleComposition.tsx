import type { FC } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { Bell, Check } from "../components/icons";
import { lifecycleNotifs, lifecycleStates, type LifecycleState } from "../data";
import { FONTS, PALETTE } from "../theme";

/**
 * "La vida útil de un pedido" — the full order lifecycle as a timeline. Six
 * states are visible at once with state 05 ("En ruta") highlighted as the
 * current step (pulsing ring), plus the 20'/5' notification markers.
 *
 * One component, two layouts: a horizontal track (desktop, 1080×220) and a
 * stacked vertical rail (mobile, 400×480). 300 frames @ 30fps (10s).
 */

export type LifecycleOrientation = "horizontal" | "vertical";
export interface LifecycleProps {
  orientation: LifecycleOrientation;
}

const TRACK_BG = "rgba(34,26,15,0.10)";

/** Pulsing ring for the `current` dot: scale 1→1.6, opacity 0.5→0 every 2s. */
const useRing = (frame: number) => {
  const t = (frame % 60) / 60;
  return { scale: 1 + 0.6 * t, opacity: interpolate(t, [0, 1], [0.5, 0]) };
};

const Dot: FC<{ state: LifecycleState; size: number; ringScale: number; ringOpacity: number }> = ({
  state,
  size,
  ringScale,
  ringOpacity,
}) => {
  const isDone = state.status === "done";
  const isCurrent = state.status === "current";
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            border: `2px solid ${PALETTE.red}`,
            transform: `scale(${ringScale})`,
            opacity: ringOpacity,
          }}
        />
      )}
      <div
        style={{
          position: "relative",
          width: size,
          height: size,
          borderRadius: 999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDone ? PALETTE.moss : isCurrent ? PALETTE.red : PALETTE.creamDeep,
          border: state.status === "pending" ? "1px solid rgba(34,26,15,0.20)" : "none",
        }}
      >
        {isDone && <Check color={PALETTE.shell} size={size * 0.5} />}
        {isCurrent && (
          <span
            style={{ width: size * 0.3, height: size * 0.3, borderRadius: 999, backgroundColor: PALETTE.shell }}
          />
        )}
      </div>
    </div>
  );
};

const Horizontal: FC = () => {
  const frame = useCurrentFrame();
  const ring = useRing(frame);

  const fillW = interpolate(frame % 150, [0, 75, 150], [55, 70, 55]);
  const trackTop = 104;
  const dotSize = 28;

  const floatY = (offset: number) => interpolate((frame + offset) % 100, [0, 50, 100], [0, -3, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.shell, fontFamily: FONTS.body }}>
      <div style={{ position: "absolute", left: 80, right: 80, top: 0, bottom: 0 }}>
        {/* Track + progress fill */}
        <div style={{ position: "absolute", left: 0, right: 0, top: trackTop, height: 2, backgroundColor: TRACK_BG }} />
        <div
          style={{
            position: "absolute",
            left: 0,
            top: trackTop,
            height: 3,
            width: `${fillW}%`,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PALETTE.moss}, ${PALETTE.red})`,
          }}
        />

        {/* State dots + labels */}
        {lifecycleStates.map((s, i) => {
          const pos = (i / (lifecycleStates.length - 1)) * 100;
          const isCurrent = s.status === "current";
          return (
            <div key={s.num}>
              <div
                style={{
                  position: "absolute",
                  left: `${pos}%`,
                  top: trackTop,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <Dot state={s} size={dotSize} ringScale={ring.scale} ringOpacity={ring.opacity} />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: `${pos}%`,
                  top: trackTop + 26,
                  transform: "translateX(-50%)",
                  width: 120,
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, color: PALETTE.inkSoft }}>
                  {s.num}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.display,
                    fontWeight: 700,
                    fontSize: 12,
                    lineHeight: 1.15,
                    marginTop: 3,
                    color: isCurrent ? PALETTE.red : PALETTE.ink,
                  }}
                >
                  {s.label}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 9, color: PALETTE.inkSoft, marginTop: 2 }}>
                  {s.time}
                </div>
              </div>
            </div>
          );
        })}

        {/* Notif markers floating above the track */}
        {lifecycleNotifs.map((n, i) => (
          <div
            key={n.label}
            style={{
              position: "absolute",
              left: `${n.position}%`,
              top: trackTop - 56,
              transform: `translateX(-50%) translateY(${floatY(i * 50)}px)`,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 9px",
                borderRadius: 999,
                backgroundColor: PALETTE.red,
                whiteSpace: "nowrap",
              }}
            >
              <Bell color={PALETTE.shell} size={11} />
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: PALETTE.shell,
                }}
              >
                {n.label}
              </span>
            </div>
            {/* down arrow pointing to the track */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: -5,
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `6px solid ${PALETTE.red}`,
              }}
            />
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Vertical: FC = () => {
  const frame = useCurrentFrame();
  const ring = useRing(frame);
  const dotSize = 26;
  const railX = 28;

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.shell, fontFamily: FONTS.body, padding: "26px 22px" }}>
      <div style={{ position: "relative", height: "100%" }}>
        {/* Dashed vertical rail */}
        <div
          style={{
            position: "absolute",
            left: railX - 1,
            top: 14,
            bottom: 14,
            width: 0,
            borderLeft: "2px dashed rgba(34,26,15,0.18)",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
          {lifecycleStates.map((s) => {
            const isCurrent = s.status === "current";
            return (
              <div key={s.num} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: railX + dotSize / 2,
                    display: "flex",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Dot state={s} size={dotSize} ringScale={ring.scale} ringOpacity={ring.opacity} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, color: PALETTE.inkSoft }}>
                      {s.num}
                    </span>
                    <span
                      style={{
                        fontFamily: FONTS.display,
                        fontWeight: 700,
                        fontSize: 16,
                        color: isCurrent ? PALETTE.red : PALETTE.ink,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: PALETTE.inkSoft, marginTop: 2 }}>
                    {s.time}
                  </div>
                  {isCurrent && (
                    <div style={{ fontFamily: FONTS.mono, fontSize: 10, fontWeight: 700, color: PALETTE.red, marginTop: 3 }}>
                      Notif · 20 min y 5 min
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const LifecycleComposition: FC<LifecycleProps> = ({ orientation }) =>
  orientation === "vertical" ? <Vertical /> : <Horizontal />;

// Prop-less variants — what the landing <Player> and the CLI Root actually
// register, so neither has to thread `orientation` through Remotion's input-prop
// generics. The web wrapper swaps between them by viewport (see LifecycleViz).
export const LifecycleHorizontal: FC = () => <Horizontal />;
export const LifecycleVertical: FC = () => <Vertical />;
