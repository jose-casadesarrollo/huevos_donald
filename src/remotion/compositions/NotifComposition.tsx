import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

import { Bell } from "../components/icons";
import { FONTS, PALETTE } from "../theme";

/**
 * Step 03 — "Sigues tu pedido". Two delivery notifications slide in/out,
 * overlapping briefly: the 20-minute heads-up, then the urgent 5-minute alert.
 * 150 frames @ 30fps (5s), 400×160.
 */

interface NotifCard {
  title: string;
  msg: string;
  badge: string;
  iconColor: string;
  iconBg: string;
}

const CARDS: NotifCard[] = [
  {
    title: "Tu pedido está en camino",
    msg: "Llegará en aprox. 20 minutos",
    badge: "20m",
    iconColor: PALETTE.ink,
    iconBg: PALETTE.cream,
  },
  {
    title: "A 5 minutos de tu casa",
    msg: "Mantente atento al timbre",
    badge: "5m",
    iconColor: PALETTE.shell,
    iconBg: PALETTE.red,
  },
];

// Per-card slide + fade keyframes: enter from the left, hold, exit to the right.
const useCardAnim = (
  frame: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number,
) => {
  const opacity = interpolate(frame, [enterStart, enterEnd, exitStart, exitEnd], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(frame, [enterStart, enterEnd, exitStart, exitEnd], [-44, 0, 0, 44], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity, x };
};

const NotifPill: FC<{ card: NotifCard; opacity: number; x: number }> = ({ card, opacity, x }) => (
  <div
    style={{
      position: "absolute",
      left: 20,
      right: 20,
      top: "50%",
      transform: `translateY(-50%) translateX(${x}px)`,
      opacity,
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "12px 14px",
      borderRadius: 14,
      backgroundColor: PALETTE.shell,
      border: "1px solid rgba(34,26,15,0.08)",
      boxShadow: "0 14px 28px -16px rgba(34,26,15,0.30)",
    }}
  >
    <div
      style={{
        flexShrink: 0,
        width: 38,
        height: 38,
        borderRadius: 11,
        backgroundColor: card.iconBg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Bell color={card.iconColor} size={18} />
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontFamily: FONTS.display,
          fontWeight: 700,
          fontSize: 13,
          lineHeight: 1.1,
          color: PALETTE.ink,
        }}
      >
        {card.title}
      </div>
      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: PALETTE.inkSoft, marginTop: 2 }}>
        {card.msg}
      </div>
    </div>

    <span
      style={{
        flexShrink: 0,
        fontFamily: FONTS.mono,
        fontSize: 12,
        fontWeight: 700,
        color: PALETTE.red,
      }}
    >
      {card.badge}
    </span>
  </div>
);

export const NotifComposition: FC = () => {
  const frame = useCurrentFrame();

  const a1 = useCardAnim(frame, 0, 15, 90, 105);
  const a2 = useCardAnim(frame, 45, 60, 130, 150);

  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.cream }}>
      <NotifPill card={CARDS[0]} opacity={a1.opacity} x={a1.x} />
      <NotifPill card={CARDS[1]} opacity={a2.opacity} x={a2.x} />
    </AbsoluteFill>
  );
};
