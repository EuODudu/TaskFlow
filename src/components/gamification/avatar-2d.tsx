import { cn } from "@/lib/utils";
import { useId } from "react";
import type { UserAvatar } from "@/lib/queries";
import {
  getAvatarPose,
  getCollectionBonus,
  resolveAvatarAccessories,
  type AvatarPose,
} from "@/lib/avatar-cosmetics";
import type { ExtendedRarity } from "@/components/gamification/rarity-frame";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const SIZE_MAP: Record<AvatarSize, { outer: string }> = {
  xs: { outer: "size-8" },
  sm: { outer: "size-12" },
  md: { outer: "size-16" },
  lg: { outer: "size-24" },
  xl: { outer: "size-36" },
  "2xl": { outer: "size-48" },
};

type HairStyle = "casual" | "long" | "short" | "formal" | "hero" | "wizard" | "elegant" | "robot" | "rainbow";
type BodyStyle = "casual" | "formal" | "hero" | "wizard" | "elegant" | "tech" | "legendary";
type MascotKind =
  | "focus"
  | "planner"
  | "junior"
  | "strategist"
  | "hero"
  | "wizard"
  | "ranger"
  | "robot"
  | "unicorn"
  | "cosmic"
  | "ninja"
  | "astronaut"
  | "scientist"
  | "artist"
  | "racer"
  | "alien"
  | "smile"
  | "cool"
  | "nerd"
  | "fire"
  | "star"
  | "royalty"
  | "vampire"
  | "gossip";

export type CharConfig = {
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  eyeColor: string;
  bodyStyle: BodyStyle;
  mascot: MascotKind;
  accentColor: string;
  glowColor?: string;
};

export const CHAR_CONFIGS: Record<string, CharConfig> = {
  "🧑": { skinColor: "#FDBCB4", hairColor: "#5D3A1A", hairStyle: "casual", eyeColor: "#2C1810", bodyStyle: "casual", mascot: "focus", accentColor: "#3b82f6" },
  "👩": { skinColor: "#F0C27F", hairColor: "#1a0a00", hairStyle: "long", eyeColor: "#1a3a5e", bodyStyle: "casual", mascot: "planner", accentColor: "#ec4899" },
  "👦": { skinColor: "#FFD9B3", hairColor: "#8B4513", hairStyle: "short", eyeColor: "#2D5A27", bodyStyle: "casual", mascot: "junior", accentColor: "#22c55e" },
  "👨‍💼": { skinColor: "#C68642", hairColor: "#111827", hairStyle: "formal", eyeColor: "#111827", bodyStyle: "formal", mascot: "strategist", accentColor: "#0f172a" },
  "🦸": { skinColor: "#B8D4F0", hairColor: "#FFD700", hairStyle: "hero", eyeColor: "#0099ff", bodyStyle: "hero", mascot: "hero", accentColor: "#2563eb", glowColor: "#3b82f6" },
  "🧙": { skinColor: "#D4C5E2", hairColor: "#6B6B8D", hairStyle: "wizard", eyeColor: "#7B2FBE", bodyStyle: "wizard", mascot: "wizard", accentColor: "#8b5cf6", glowColor: "#8b5cf6" },
  "🧝": { skinColor: "#C8E6C9", hairColor: "#1B5E20", hairStyle: "elegant", eyeColor: "#558B2F", bodyStyle: "elegant", mascot: "ranger", accentColor: "#10b981", glowColor: "#10b981" },
  "🤖": { skinColor: "#90A4AE", hairColor: "#546E7A", hairStyle: "robot", eyeColor: "#00E5FF", bodyStyle: "tech", mascot: "robot", accentColor: "#06b6d4", glowColor: "#06b6d4" },
  "🦄": { skinColor: "#FFE0F0", hairColor: "#FF6B9D", hairStyle: "rainbow", eyeColor: "#9C27B0", bodyStyle: "legendary", mascot: "unicorn", accentColor: "#ec4899", glowColor: "#ec4899" },
  "🌌": { skinColor: "#1a1a3e", hairColor: "#7c3aed", hairStyle: "rainbow", eyeColor: "#a855f7", bodyStyle: "legendary", mascot: "cosmic", accentColor: "#a855f7", glowColor: "#a855f7" },
  "🥷": { skinColor: "#E6C3A3", hairColor: "#111827", hairStyle: "short", eyeColor: "#38bdf8", bodyStyle: "hero", mascot: "ninja", accentColor: "#0f172a", glowColor: "#38bdf8" },
  "🧑‍🚀": { skinColor: "#F5C7A9", hairColor: "#8B4513", hairStyle: "short", eyeColor: "#2563eb", bodyStyle: "tech", mascot: "astronaut", accentColor: "#f97316", glowColor: "#60a5fa" },
  "🧑‍🔬": { skinColor: "#F0C27F", hairColor: "#374151", hairStyle: "formal", eyeColor: "#16a34a", bodyStyle: "formal", mascot: "scientist", accentColor: "#14b8a6", glowColor: "#14b8a6" },
  "🎨": { skinColor: "#FFD9B3", hairColor: "#7c2d12", hairStyle: "long", eyeColor: "#be185d", bodyStyle: "elegant", mascot: "artist", accentColor: "#f43f5e", glowColor: "#f43f5e" },
  "🏁": { skinColor: "#F5C7A9", hairColor: "#111827", hairStyle: "short", eyeColor: "#fb923c", bodyStyle: "tech", mascot: "racer", accentColor: "#ef4444", glowColor: "#f97316" },
  "👽": { skinColor: "#a7f3d0", hairColor: "#064e3b", hairStyle: "short", eyeColor: "#111827", bodyStyle: "legendary", mascot: "alien", accentColor: "#22c55e", glowColor: "#86efac" },
  "😊": { skinColor: "#FFD9B3", hairColor: "#8B4513", hairStyle: "casual", eyeColor: "#92400e", bodyStyle: "casual", mascot: "smile", accentColor: "#f59e0b", glowColor: "#fbbf24" },
  "😎": { skinColor: "#D4A373", hairColor: "#111827", hairStyle: "formal", eyeColor: "#111827", bodyStyle: "casual", mascot: "cool", accentColor: "#0ea5e9", glowColor: "#38bdf8" },
  "🤓": { skinColor: "#F0C27F", hairColor: "#7c2d12", hairStyle: "short", eyeColor: "#2563eb", bodyStyle: "casual", mascot: "nerd", accentColor: "#2563eb", glowColor: "#93c5fd" },
  "🔥": { skinColor: "#FDBCB4", hairColor: "#f97316", hairStyle: "hero", eyeColor: "#dc2626", bodyStyle: "hero", mascot: "fire", accentColor: "#ef4444", glowColor: "#f97316" },
  "🥵": { skinColor: "#FDBCB4", hairColor: "#f97316", hairStyle: "hero", eyeColor: "#dc2626", bodyStyle: "hero", mascot: "fire", accentColor: "#ef4444", glowColor: "#f97316" },
  "⭐": { skinColor: "#FFE7BA", hairColor: "#b45309", hairStyle: "elegant", eyeColor: "#d97706", bodyStyle: "legendary", mascot: "star", accentColor: "#facc15", glowColor: "#facc15" },
  "🤩": { skinColor: "#FFE7BA", hairColor: "#b45309", hairStyle: "elegant", eyeColor: "#d97706", bodyStyle: "legendary", mascot: "star", accentColor: "#facc15", glowColor: "#facc15" },
  "👑": { skinColor: "#F0C27F", hairColor: "#3b1f08", hairStyle: "formal", eyeColor: "#7c2d12", bodyStyle: "formal", mascot: "royalty", accentColor: "#d97706", glowColor: "#facc15" },
  "🗣️": { skinColor: "#FFD9B3", hairColor: "#5D3A1A", hairStyle: "casual", eyeColor: "#7c2d12", bodyStyle: "casual", mascot: "gossip", accentColor: "#ec4899", glowColor: "#f9a8d4" },
  "🐉": { skinColor: "#C8E6C9", hairColor: "#14532d", hairStyle: "hero", eyeColor: "#f97316", bodyStyle: "legendary", mascot: "fire", accentColor: "#16a34a", glowColor: "#f97316" },
  "🧛": { skinColor: "#E5E7EB", hairColor: "#111827", hairStyle: "formal", eyeColor: "#dc2626", bodyStyle: "elegant", mascot: "vampire", accentColor: "#7f1d1d", glowColor: "#ef4444" },
  "🧚": { skinColor: "#FFE4E6", hairColor: "#f472b6", hairStyle: "elegant", eyeColor: "#16a34a", bodyStyle: "legendary", mascot: "ranger", accentColor: "#ec4899", glowColor: "#86efac" },
  "🧊": { skinColor: "#DBEAFE", hairColor: "#38bdf8", hairStyle: "short", eyeColor: "#0ea5e9", bodyStyle: "tech", mascot: "robot", accentColor: "#38bdf8", glowColor: "#bfdbfe" },
  "🐺": { skinColor: "#D1D5DB", hairColor: "#374151", hairStyle: "hero", eyeColor: "#facc15", bodyStyle: "hero", mascot: "ninja", accentColor: "#64748b", glowColor: "#facc15" },
  "🦅": { skinColor: "#F0C27F", hairColor: "#78350f", hairStyle: "formal", eyeColor: "#0f172a", bodyStyle: "elegant", mascot: "strategist", accentColor: "#b45309", glowColor: "#f59e0b" },
  "🧬": { skinColor: "#A7F3D0", hairColor: "#0891b2", hairStyle: "robot", eyeColor: "#06b6d4", bodyStyle: "tech", mascot: "cosmic", accentColor: "#14b8a6", glowColor: "#22d3ee" },
  "🕶️": { skinColor: "#D4A373", hairColor: "#020617", hairStyle: "formal", eyeColor: "#0ea5e9", bodyStyle: "tech", mascot: "cool", accentColor: "#111827", glowColor: "#38bdf8" },
  "💎": { skinColor: "#E0F2FE", hairColor: "#38bdf8", hairStyle: "elegant", eyeColor: "#2563eb", bodyStyle: "legendary", mascot: "royalty", accentColor: "#06b6d4", glowColor: "#67e8f9" },
  "🪐": { skinColor: "#111827", hairColor: "#a855f7", hairStyle: "rainbow", eyeColor: "#f472b6", bodyStyle: "legendary", mascot: "cosmic", accentColor: "#8b5cf6", glowColor: "#f472b6" },
};

const DEFAULT_CONFIG = CHAR_CONFIGS["🧑"];
const OUTLINE = "#243042";

type AvatarPaint = {
  skinFill: string;
  bodyFill: string;
  hairFill: string;
  hairShine: string;
  irisFill: string;
  eyeWhiteFill: string;
  cheekFill: string;
  shadowFilter: string;
};

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return { r, g, b };
}

function darken(hex: string, amount: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.max(0, r - amount)},${Math.max(0, g - amount)},${Math.max(0, b - amount)})`;
  } catch {
    return hex;
  }
}

function lighten(hex: string, amount: number): string {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
  } catch {
    return hex;
  }
}

function renderSparkles(cfg: CharConfig) {
  if (!cfg.glowColor) return null;
  return (
    <g opacity="0.75">
      <circle cx="16" cy="22" r="2" fill={cfg.glowColor} />
      <path d="M 65 18 L 67 24 L 73 26 L 67 28 L 65 34 L 63 28 L 57 26 L 63 24 Z" fill={cfg.glowColor} />
      <circle cx="67" cy="70" r="2.4" fill={lighten(cfg.glowColor, 35)} />
    </g>
  );
}

function renderBody(cfg: CharConfig, color: string, paint?: AvatarPaint) {
  const accent = cfg.accentColor;
  const bodyFill = paint?.bodyFill ?? color;
  const darkColor = darken(color, 28);

  if (cfg.mascot === "robot") {
    return (
      <g>
        <rect x="18" y="62" width="44" height="38" rx="11" fill="#607d8b" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="24" y="68" width="32" height="20" rx="5" fill="#263238" />
        <rect x="28" y="72" width="24" height="5" rx="2.5" fill={accent} opacity="0.85" />
        <circle cx="32" cy="84" r="3" fill="#ef4444" />
        <circle cx="40" cy="84" r="3" fill="#f59e0b" />
        <circle cx="48" cy="84" r="3" fill="#22c55e" />
        <rect x="22" y="96" width="15" height="8" rx="3" fill="#455a64" stroke={OUTLINE} strokeWidth="1.8" />
        <rect x="43" y="96" width="15" height="8" rx="3" fill="#455a64" stroke={OUTLINE} strokeWidth="1.8" />
      </g>
    );
  }

  if (cfg.mascot === "wizard") {
    return (
      <g>
        <path d="M 15 66 Q 27 58 40 62 Q 53 58 65 66 L 60 101 Q 40 108 20 101 Z" fill="#4c1d95" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M 22 67 Q 31 61 40 64 Q 49 61 58 67 L 54 85 Q 40 91 26 85 Z" fill={color} />
        <circle cx="40" cy="76" r="4" fill="#fbbf24" />
        <path d="M 20 82 L 8 72" stroke="#7c3aed" strokeWidth="5" strokeLinecap="round" />
        <circle cx="7" cy="71" r="5" fill="#c4b5fd" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "hero") {
    return (
      <g>
        <path d="M 14 69 Q 8 78 8 96 Q 21 90 23 74 Z" fill={darkColor} opacity="0.9" stroke={OUTLINE} strokeWidth="2" />
        <path d="M 66 69 Q 72 78 72 96 Q 59 90 57 74 Z" fill={darkColor} opacity="0.9" stroke={OUTLINE} strokeWidth="2" />
        <rect x="18" y="64" width="44" height="38" rx="10" fill={color} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="40" cy="78" r="8" fill={lighten(accent, 35)} />
        <path d="M 37 74 L 46 78 L 37 83 Z" fill={accent} />
        <rect x="20" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "ninja") {
    return (
      <g>
        <path d="M 13 68 Q 25 59 40 61 Q 55 59 67 68 L 60 102 Q 40 109 20 102 Z" fill="#111827" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M 20 70 Q 40 59 60 70 L 54 82 Q 40 88 26 82 Z" fill={color} opacity="0.35" />
        <path d="M 18 73 L 7 66" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <path d="M 62 73 L 73 66" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
        <rect x="21" y="97" width="16" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="16" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "astronaut") {
    return (
      <g>
        <rect x="16" y="62" width="48" height="40" rx="12" fill="#f8fafc" stroke={OUTLINE} strokeWidth="2.5" />
        <rect x="24" y="70" width="32" height="18" rx="5" fill="#dbeafe" />
        <circle cx="40" cy="79" r="6" fill={accent} />
        <path d="M 18 78 L 8 88" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
        <path d="M 62 78 L 72 88" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
        <rect x="22" y="97" width="15" height="8" rx="3" fill="#94a3b8" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="15" height="8" rx="3" fill="#94a3b8" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "scientist") {
    return (
      <g>
        <path d="M 17 64 Q 28 59 40 62 Q 52 59 63 64 L 60 101 Q 40 108 20 101 Z" fill="#f8fafc" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M 26 66 L 40 88 L 54 66" fill="#e0f2fe" />
        <rect x="37" y="72" width="6" height="17" rx="3" fill={accent} />
        <circle cx="26" cy="82" r="3" fill="#22c55e" />
        <circle cx="54" cy="82" r="3" fill="#3b82f6" />
        <rect x="20" y="97" width="17" height="8" rx="3" fill="#cbd5e1" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="17" height="8" rx="3" fill="#cbd5e1" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "artist") {
    return (
      <g>
        <path d="M 17 66 Q 27 60 40 61 Q 53 60 63 66 L 60 100 Q 40 107 20 100 Z" fill={color} stroke={OUTLINE} strokeWidth="2.5" />
        <circle cx="29" cy="78" r="3" fill="#facc15" />
        <circle cx="40" cy="75" r="3" fill="#22c55e" />
        <circle cx="51" cy="80" r="3" fill="#60a5fa" />
        <path d="M 62 78 L 73 69" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
        <circle cx="74" cy="68" r="4" fill="#f43f5e" stroke={OUTLINE} strokeWidth="1.4" />
        <rect x="20" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "racer") {
    return (
      <g>
        <path d="M 13 67 Q 25 58 40 61 Q 55 58 67 67 L 61 102 Q 40 109 19 102 Z" fill="#0f1f46" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M 20 69 Q 40 60 60 69 L 55 82 Q 40 88 25 82 Z" fill="#172554" />
        <path d="M 25 66 L 37 100" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        <path d="M 55 66 L 43 100" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
        <path d="M 31 72 L 49 72" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="82" r="8" fill="#f59e0b" stroke={OUTLINE} strokeWidth="1.7" />
        <path d="M 34 82 Q 40 76 46 82 Q 40 88 34 82 Z" fill="#ef4444" />
        <path d="M 18 76 L 7 68" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <path d="M 62 76 L 73 68" stroke="#0f172a" strokeWidth="6" strokeLinecap="round" />
        <rect x="20" y="97" width="17" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="17" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "alien") {
    return (
      <g>
        <path d="M 16 67 Q 27 59 40 61 Q 53 59 64 67 L 59 101 Q 40 108 21 101 Z" fill="#14532d" stroke={OUTLINE} strokeWidth="2.5" />
        <path d="M 23 69 Q 31 64 40 66 Q 49 64 57 69 L 53 83 Q 40 90 27 83 Z" fill="#22c55e" opacity="0.75" />
        <circle cx="40" cy="80" r="7" fill="#bbf7d0" stroke={OUTLINE} strokeWidth="1.6" />
        <path d="M 36 80 L 40 74 L 44 80 L 40 86 Z" fill="#16a34a" />
        <path d="M 20 76 L 10 69" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
        <path d="M 60 76 L 70 69" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
        <circle cx="9" cy="68" r="4" fill="#bbf7d0" stroke={OUTLINE} strokeWidth="1.5" />
        <circle cx="71" cy="68" r="4" fill="#bbf7d0" stroke={OUTLINE} strokeWidth="1.5" />
        <rect x="21" y="97" width="16" height="8" rx="3" fill="#064e3b" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="97" width="16" height="8" rx="3" fill="#064e3b" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "fire") {
    return (
      <g>
        <path d="M 12 69 Q 21 58 40 60 Q 59 58 68 69 L 61 103 Q 40 110 19 103 Z" fill="#7f1d1d" stroke={OUTLINE} strokeWidth="2.6" />
        <path d="M 19 70 Q 31 63 40 65 Q 49 63 61 70 L 56 83 Q 40 91 24 83 Z" fill="#991b1b" />
        <path d="M 28 66 L 18 75 L 11 90" stroke="#fde68a" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 52 66 L 62 75 L 69 90" stroke="#fde68a" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 27 86 L 38 77 L 34 100" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 53 86 L 42 77 L 46 100" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="81" r="9" fill="#111827" stroke="#fde68a" strokeWidth="2.2" />
        <path d="M 36 81 L 40 74 L 44 81 L 40 88 Z" fill="#f8fafc" />
        <path d="M 18 77 L 8 89" stroke="#7f1d1d" strokeWidth="8" strokeLinecap="round" />
        <path d="M 62 77 L 72 89" stroke="#7f1d1d" strokeWidth="8" strokeLinecap="round" />
        <circle cx="7" cy="90" r="7" fill="#fef3c7" opacity="0.95" />
        <circle cx="73" cy="90" r="7" fill="#fef3c7" opacity="0.95" />
        <circle cx="7" cy="90" r="10" fill="#f97316" opacity="0.32" />
        <circle cx="73" cy="90" r="10" fill="#f97316" opacity="0.32" />
        <rect x="21" y="98" width="16" height="8" rx="3" fill="#450a0a" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="43" y="98" width="16" height="8" rx="3" fill="#450a0a" stroke={OUTLINE} strokeWidth="1.6" />
      </g>
    );
  }

  if (cfg.mascot === "vampire") {
    return (
      <g>
        <path d="M 12 66 Q 22 58 40 60 Q 58 58 68 66 L 62 103 Q 40 111 18 103 Z" fill="#111827" stroke={OUTLINE} strokeWidth="2.4" />
        <path d="M 13 67 Q 6 80 9 98 Q 22 91 24 74 Z" fill="#4c0519" stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M 67 67 Q 74 80 71 98 Q 58 91 56 74 Z" fill="#4c0519" stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M 24 66 L 40 88 L 56 66" fill="#f8fafc" opacity="0.92" />
        <path d="M 34 68 L 40 84 L 46 68" fill="#7f1d1d" />
        <rect x="37" y="78" width="6" height="18" rx="3" fill="#991b1b" />
        <path d="M 23 70 Q 31 65 40 67 Q 49 65 57 70" stroke="#ffffff" strokeWidth="2" opacity="0.25" fill="none" strokeLinecap="round" />
        <rect x="21" y="98" width="16" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.5" />
        <rect x="43" y="98" width="16" height="8" rx="3" fill="#020617" stroke={OUTLINE} strokeWidth="1.5" />
      </g>
    );
  }

  return (
    <g>
      <path d="M 17 66 Q 26 60 40 61 Q 54 60 63 66 L 60 100 Q 40 107 20 100 Z" fill={bodyFill} stroke={OUTLINE} strokeWidth="2.1" />
      <path d="M 23 68 Q 31 64 40 66 Q 49 64 57 68 L 54 80 Q 40 86 26 80 Z" fill={lighten(color, 28)} opacity="0.65" />
      <path d="M 22 69 Q 32 63 40 65 Q 48 63 58 69" stroke="#ffffff" strokeWidth="2" opacity="0.32" fill="none" strokeLinecap="round" />
      <rect x="20" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
      <rect x="43" y="97" width="17" height="8" rx="3" fill={darkColor} stroke={OUTLINE} strokeWidth="1.6" />
      {cfg.mascot === "strategist" && (
        <>
          <path d="M 34 67 L 40 80 L 46 67" fill="#f8fafc" />
          <rect x="38" y="72" width="4" height="17" rx="2" fill="#e11d48" />
        </>
      )}
      {cfg.mascot === "ranger" && (
        <path d="M 28 76 Q 40 68 52 76 Q 43 86 28 76 Z" fill="#bbf7d0" opacity="0.7" />
      )}
      {cfg.mascot === "focus" && (
        <>
          <path d="M 35 67 L 40 82 L 45 67" fill="#f8fafc" />
          <rect x="38" y="73" width="4" height="17" rx="2" fill={accent} />
        </>
      )}
      {cfg.mascot === "planner" && (
        <rect x="48" y="73" width="12" height="16" rx="3" fill="#fdf2f8" stroke={OUTLINE} strokeWidth="1.4" />
      )}
      {cfg.mascot === "smile" && (
        <circle cx="40" cy="79" r="8" fill="#facc15" stroke={OUTLINE} strokeWidth="1.6" />
      )}
      {cfg.mascot === "cool" && (
        <>
          <path d="M 22 69 Q 40 61 58 69" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="28" y="82" width="24" height="5" rx="2.5" fill="#020617" opacity="0.6" />
        </>
      )}
      {cfg.mascot === "nerd" && (
        <g transform="translate(51 73) rotate(12)">
          <rect x="0" y="0" width="14" height="18" rx="2" fill="#dbeafe" stroke={OUTLINE} strokeWidth="1.4" />
          <line x1="3" y1="5" x2="11" y2="5" stroke="#2563eb" strokeWidth="1.5" />
          <line x1="3" y1="9" x2="10" y2="9" stroke="#2563eb" strokeWidth="1.5" />
        </g>
      )}
      {cfg.mascot === "fire" && (
        <path d="M 40 91 Q 31 84 35 75 Q 38 80 40 70 Q 48 78 45 85 Q 48 83 49 79 Q 54 90 40 96 Z" fill="#f97316" stroke={OUTLINE} strokeWidth="1.4" />
      )}
      {cfg.mascot === "star" && (
        <path d="M 40 70 L 43 77 L 51 78 L 45 83 L 47 91 L 40 87 L 33 91 L 35 83 L 29 78 L 37 77 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.5" />
      )}
      {cfg.mascot === "royalty" && (
        <path d="M 26 70 Q 40 60 54 70 L 57 99 Q 40 107 23 99 Z" fill="#7e22ce" opacity="0.65" />
      )}
      {cfg.mascot === "gossip" && (
        <>
          <path d="M 57 74 Q 69 68 72 79 Q 65 76 57 82 Z" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="1.4" />
          <circle cx="58" cy="73" r="2" fill="#ec4899" />
          <circle cx="64" cy="72" r="2" fill="#ec4899" />
          <circle cx="70" cy="74" r="2" fill="#ec4899" />
        </>
      )}
    </g>
  );
}

function renderHair(cfg: CharConfig, hairColor: string, paint?: AvatarPaint) {
  const primaryHair = paint?.hairFill ?? hairColor;
  const shineHair = paint?.hairShine ?? lighten(hairColor, 18);

  switch (cfg.mascot) {
    case "wizard":
      return (
        <g>
          <path d="M 25 39 L 40 -9 L 55 39 Z" fill="#4c1d95" stroke={OUTLINE} strokeWidth="2.2" strokeLinejoin="round" />
          <ellipse cx="40" cy="39" rx="18" ry="6" fill="#7c3aed" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="40" cy="19" r="3" fill="#fbbf24" />
          <circle cx="34" cy="9" r="1.7" fill="#93c5fd" />
          <circle cx="47" cy="12" r="1.7" fill="#f9a8d4" />
        </g>
      );
    case "hero":
      return (
        <g>
          <path d="M 12 40 Q 13 8 40 7 Q 65 8 69 38 Q 58 24 40 24 Q 23 24 12 40 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 39 8 Q 61 -2 72 14 Q 62 17 54 14" fill={hairColor} stroke={OUTLINE} strokeWidth="2" strokeLinejoin="round" />
          <path d="M 17 36 Q 40 48 63 36 L 63 44 Q 40 56 17 44 Z" fill={cfg.accentColor} stroke={OUTLINE} strokeWidth="1.9" />
        </g>
      );
    case "ranger":
      return (
        <g>
          <path d="M 13 40 Q 12 8 40 7 Q 68 8 67 40 Q 56 21 40 18 Q 24 21 13 40 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 10 39 L 3 32 L 14 34 Z" fill={cfg.skinColor} stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 70 39 L 77 32 L 66 34 Z" fill={cfg.skinColor} stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 26 16 Q 40 5 54 16" stroke="#86efac" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "unicorn":
      return (
        <g>
          <path d="M 38 9 L 42 9 L 40 -8 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.7" />
          <path d="M 11 41 Q 11 8 40 6 Q 69 8 69 41 Q 57 22 40 18 Q 23 22 11 41 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <circle cx="27" cy="26" r="4" fill="#60a5fa" />
          <circle cx="39" cy="20" r="4" fill="#f472b6" />
          <circle cx="52" cy="26" r="4" fill="#34d399" />
        </g>
      );
    case "cosmic":
      return (
        <g>
          <path d="M 11 42 Q 10 7 40 6 Q 70 7 69 42 Q 56 20 40 18 Q 24 20 11 42 Z" fill="#111827" stroke={OUTLINE} strokeWidth="2.2" />
          <circle cx="27" cy="22" r="2" fill="#c4b5fd" />
          <circle cx="52" cy="18" r="1.6" fill="#f0abfc" />
          <path d="M 42 7 Q 55 1 64 10" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      );
    case "robot":
      return null;
    case "ninja":
      return (
        <g>
          <path d="M 11 43 Q 12 11 40 8 Q 68 11 69 43 L 62 39 Q 57 27 40 26 Q 23 27 18 39 Z" fill="#020617" stroke={OUTLINE} strokeWidth="2.3" />
        </g>
      );
    case "astronaut":
      return (
        <g>
          <circle cx="40" cy="42" r="35" fill="none" stroke="#e2e8f0" strokeWidth="9" />
          <circle cx="40" cy="42" r="35" fill="none" stroke={OUTLINE} strokeWidth="2.3" />
          <path d="M 18 39 Q 40 18 62 39 Q 60 63 40 68 Q 20 63 18 39 Z" fill="#bfdbfe" opacity="0.22" />
        </g>
      );
    case "scientist":
      return (
        <g>
          <path d="M 13 42 Q 13 13 40 10 Q 67 13 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 23 40 Q 31 36 38 40" stroke="#111827" strokeWidth="1.8" fill="none" />
          <path d="M 42 40 Q 49 36 57 40" stroke="#111827" strokeWidth="1.8" fill="none" />
          <line x1="38" y1="40" x2="42" y2="40" stroke="#111827" strokeWidth="1.8" />
        </g>
      );
    case "racer":
      return (
        <g>
          <path d="M 11 42 Q 12 8 40 5 Q 68 8 69 42 Q 58 23 40 21 Q 22 23 11 42 Z" fill="#f8fafc" stroke={OUTLINE} strokeWidth="2.4" />
          <path d="M 17 28 Q 40 9 63 28" fill="#ef4444" stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 23 16 Q 40 6 57 16" stroke="#2563eb" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 14 38 Q 40 24 66 38 L 62 52 Q 40 61 18 52 Z" fill="#fb923c" stroke={OUTLINE} strokeWidth="1.9" opacity="0.95" />
          <path d="M 18 40 Q 40 30 62 40" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M 32 57 Q 40 61 48 57" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "alien":
      return (
        <g>
          <path d="M 31 12 Q 40 -2 49 12" stroke="#86efac" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="30" cy="10" r="3" fill="#bbf7d0" stroke={OUTLINE} strokeWidth="1.3" />
          <circle cx="50" cy="10" r="3" fill="#bbf7d0" stroke={OUTLINE} strokeWidth="1.3" />
          <path d="M 17 35 Q 19 8 40 5 Q 61 8 63 35 Q 57 18 40 17 Q 23 18 17 35 Z" fill="#86efac" stroke={OUTLINE} strokeWidth="2.2" />
          <circle cx="25" cy="25" r="2.2" fill="#dcfce7" opacity="0.75" />
          <circle cx="55" cy="25" r="2.2" fill="#dcfce7" opacity="0.75" />
        </g>
      );
    case "cool":
      return (
        <g>
          <path d="M 13 42 Q 13 12 40 8 Q 67 12 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 20 29 Q 38 7 62 22 Q 48 25 35 21 Q 26 24 20 29 Z" fill={lighten(hairColor, 18)} stroke={OUTLINE} strokeWidth="1.5" />
        </g>
      );
    case "fire":
      return (
        <g>
          <path d="M 14 43 Q 12 20 29 13 Q 29 23 36 16 Q 42 8 39 -2 Q 57 11 55 25 Q 62 22 66 13 Q 72 33 65 45 Q 52 25 40 23 Q 27 25 14 43 Z" fill="#f97316" stroke={OUTLINE} strokeWidth="2.1" />
          <path d="M 25 35 Q 31 18 40 15 Q 39 24 48 19 Q 53 27 55 37 Q 47 27 40 26 Q 33 27 25 35 Z" fill="#facc15" opacity="0.9" />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M 13 42 Q 13 12 40 10 Q 67 12 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 40 0 L 44 10 L 55 11 L 47 18 L 49 29 L 40 23 L 31 29 L 33 18 L 25 11 L 36 10 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.5" />
        </g>
      );
    case "royalty":
      return (
        <g>
          <path d="M 13 42 Q 13 12 40 9 Q 67 12 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 22 18 L 29 5 L 38 17 L 47 5 L 58 18 L 55 29 L 25 29 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.7" strokeLinejoin="round" />
          <circle cx="29" cy="16" r="2" fill="#ef4444" />
          <circle cx="40" cy="16" r="2" fill="#2563eb" />
          <circle cx="51" cy="16" r="2" fill="#22c55e" />
        </g>
      );
    case "vampire":
      return (
        <g>
          <path d="M 12 42 Q 12 14 36 9 Q 56 7 68 25 Q 61 21 54 23 Q 64 30 67 42 Q 56 25 40 23 Q 24 25 12 42 Z" fill={primaryHair} stroke={OUTLINE} strokeWidth="2" />
          <path d="M 21 29 Q 31 13 49 12 Q 41 18 31 22 Q 25 25 21 29 Z" fill={shineHair} stroke={OUTLINE} strokeWidth="1.2" opacity="0.85" />
          <path d="M 38 10 Q 35 22 40 28 Q 47 21 52 12 Q 45 16 38 10 Z" fill="#020617" opacity="0.65" />
          <path d="M 17 40 Q 13 58 17 72" stroke={primaryHair} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85" />
          <path d="M 64 39 Q 69 55 65 70" stroke={primaryHair} strokeWidth="5.5" fill="none" strokeLinecap="round" opacity="0.85" />
        </g>
      );
    case "gossip":
      return (
        <g>
          <path d="M 13 42 Q 13 12 40 10 Q 67 12 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={hairColor} stroke={OUTLINE} strokeWidth="2.2" />
          <path d="M 19 24 Q 32 8 48 12 Q 39 18 28 19 Q 22 22 19 24 Z" fill={lighten(hairColor, 22)} stroke={OUTLINE} strokeWidth="1.4" />
          <path d="M 58 16 Q 72 12 73 25 Q 67 22 60 25 Q 64 20 58 16 Z" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="1.4" />
        </g>
      );
    default:
      return (
        <g>
          <path d="M 13 42 Q 13 12 40 10 Q 67 12 67 42 Q 57 22 40 18 Q 23 22 13 42 Z" fill={primaryHair} stroke={OUTLINE} strokeWidth="2" />
          <path d="M 21 24 Q 36 11 54 17 Q 43 19 31 23 Q 24 27 19 34" stroke={shineHair} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.45" />
          {cfg.hairStyle === "short" && (
            <path d="M 21 24 Q 40 6 59 24 Q 51 19 40 20 Q 29 19 21 24 Z" fill={shineHair} stroke={OUTLINE} strokeWidth="1.2" opacity="0.82" />
          )}
          {cfg.hairStyle === "long" && (
            <>
              <path d="M 13 36 Q 7 55 11 78" stroke={hairColor} strokeWidth="9" fill="none" strokeLinecap="round" />
              <path d="M 67 36 Q 73 55 69 78" stroke={hairColor} strokeWidth="9" fill="none" strokeLinecap="round" />
            </>
          )}
          {cfg.hairStyle === "formal" && (
            <path d="M 18 30 Q 31 15 50 13 Q 58 15 64 28 Q 45 23 18 30 Z" fill={shineHair} stroke={OUTLINE} strokeWidth="1.3" />
          )}
          {cfg.mascot === "planner" && <path d="M 24 17 Q 32 9 43 13" stroke="#ffffff70" strokeWidth="2" fill="none" strokeLinecap="round" />}
          {cfg.mascot === "junior" && <ellipse cx="40" cy="10" rx="10" ry="5" fill={lighten(hairColor, 22)} stroke={OUTLINE} strokeWidth="1.4" />}
        </g>
      );
  }
}

function renderHead(cfg: CharConfig, skinColor: string, hairColor: string, paint?: AvatarPaint) {
  if (cfg.mascot === "robot") {
    return (
      <g>
        <line x1="40" y1="17" x2="40" y2="5" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="40" cy="4" r="4" fill="#ef4444" stroke={OUTLINE} strokeWidth="1.6" />
        <rect x="13" y="18" width="54" height="45" rx="13" fill="#90a4ae" stroke={OUTLINE} strokeWidth="2.8" />
        <rect x="20" y="31" width="40" height="17" rx="7" fill="#0f172a" />
        <rect x="26" y="36" width="9" height="5" rx="2.5" fill={cfg.eyeColor} />
        <rect x="45" y="36" width="9" height="5" rx="2.5" fill={cfg.eyeColor} />
        <path d="M 30 55 L 50 55" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        <rect x="14" y="23" width="52" height="8" rx="4" fill="#cbd5e1" opacity="0.35" />
      </g>
    );
  }

  if (cfg.mascot === "racer") {
    return (
      <g>
        <circle cx="40" cy="42" r="31" fill="#f8fafc" stroke={OUTLINE} strokeWidth="2.8" />
        <path d="M 16 31 Q 40 8 64 31 Q 58 16 40 10 Q 22 16 16 31 Z" fill="#ef4444" stroke={OUTLINE} strokeWidth="1.9" />
        <path d="M 22 18 Q 40 7 58 18" stroke="#2563eb" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M 19 34 Q 40 25 61 34 L 58 49 Q 40 57 22 49 Z" fill="#fb923c" stroke={OUTLINE} strokeWidth="2" />
        <path d="M 21 38 Q 40 31 59 38" stroke="#fde68a" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.85" />
        <path d="M 25 56 L 55 56 L 50 65 L 30 65 Z" fill="#e5e7eb" stroke={OUTLINE} strokeWidth="1.7" />
        <path d="M 34 60 Q 40 63 46 60" stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M 40 12 L 40 27" stroke="#f8fafc" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      </g>
    );
  }

  if (cfg.mascot === "alien") {
    return (
      <g>
        <ellipse cx="12" cy="43" rx="5" ry="7" fill="#86efac" stroke={OUTLINE} strokeWidth="1.7" />
        <ellipse cx="68" cy="43" rx="5" ry="7" fill="#86efac" stroke={OUTLINE} strokeWidth="1.7" />
        <path d="M 14 40 Q 17 9 40 7 Q 63 9 66 40 Q 63 68 40 71 Q 17 68 14 40 Z" fill="#a7f3d0" stroke={OUTLINE} strokeWidth="2.8" />
        <ellipse cx="30" cy="39" rx="9" ry="12" fill="#111827" transform="rotate(-18 30 39)" />
        <ellipse cx="50" cy="39" rx="9" ry="12" fill="#111827" transform="rotate(18 50 39)" />
        <circle cx="32" cy="35" r="2.2" fill="#d1fae5" opacity="0.85" />
        <circle cx="48" cy="35" r="2.2" fill="#d1fae5" opacity="0.85" />
        <path d="M 36 51 Q 40 54 44 51" stroke="#065f46" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M 32 59 Q 40 64 48 59" stroke="#064e3b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="22" cy="51" r="2.5" fill="#22c55e" opacity="0.25" />
        <circle cx="58" cy="51" r="2.5" fill="#22c55e" opacity="0.25" />
        {renderHair(cfg, hairColor, paint)}
      </g>
    );
  }

  if (cfg.mascot === "fire") {
    return (
      <g>
        <path d="M 23 36 Q 17 20 28 12 Q 29 24 36 13 Q 43 3 39 -9 Q 59 6 56 23 Q 65 18 67 7 Q 75 30 61 47 Q 52 60 40 61 Q 28 60 19 47 Q 12 37 23 36 Z" fill="#f97316" opacity="0.45" />
        <path d="M 28 33 Q 24 19 34 12 Q 35 22 41 11 Q 48 24 53 17 Q 58 31 51 43 Q 47 50 40 51 Q 33 50 29 43 Q 25 38 28 33 Z" fill="#fef3c7" opacity="0.8" />
        <path d="M 15 40 Q 18 14 40 10 Q 62 14 65 40 Q 62 66 40 69 Q 18 66 15 40 Z" fill="#7f1d1d" stroke={OUTLINE} strokeWidth="2.7" />
        <path d="M 20 34 Q 40 22 60 34 L 57 47 Q 40 56 23 47 Z" fill="#fff7ed" opacity="0.9" />
        <path d="M 25 35 Q 32 31 37 35" stroke="#991b1b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 43 35 Q 50 31 55 35" stroke="#991b1b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M 27 42 Q 33 49 39 42" fill="#7f1d1d" />
        <path d="M 41 42 Q 47 49 53 42" fill="#7f1d1d" />
        <path d="M 33 57 Q 40 63 48 57" stroke="#fff7ed" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M 22 28 L 34 26 L 30 46" stroke="#fde68a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 58 28 L 46 26 L 50 46" stroke="#fde68a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }

  if (cfg.mascot === "ninja") {
    return (
      <g>
        <circle cx="40" cy="42" r="29" fill="#111827" stroke={OUTLINE} strokeWidth="2.8" />
        <path d="M 17 34 Q 40 26 63 34 L 61 50 Q 40 58 19 50 Z" fill={skinColor} stroke={OUTLINE} strokeWidth="1.8" />
        <path d="M 25 39 Q 31 35 36 39" stroke="#020617" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <path d="M 44 39 Q 50 35 55 39" stroke="#020617" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        <circle cx="32" cy="43" r="3.5" fill={cfg.eyeColor} />
        <circle cx="49" cy="43" r="3.5" fill={cfg.eyeColor} />
        <path d="M 34 54 Q 40 58 46 54" stroke="#020617" strokeWidth="2" fill="none" strokeLinecap="round" />
        {renderHair(cfg, hairColor, paint)}
      </g>
    );
  }

  const cheek = cfg.mascot === "cosmic" ? "#7c3aed" : darken(skinColor, 18);
  const skinFill = paint?.skinFill ?? skinColor;
  const irisFill = paint?.irisFill ?? cfg.eyeColor;
  const eyeWhiteFill = paint?.eyeWhiteFill ?? "white";
  const cheekFill = paint?.cheekFill ?? cheek;
  return (
    <g>
      <ellipse cx="12" cy="42" rx="4.5" ry="6" fill={skinFill} stroke={OUTLINE} strokeWidth="1.5" />
      <ellipse cx="68" cy="42" rx="4.5" ry="6" fill={skinFill} stroke={OUTLINE} strokeWidth="1.5" />
      <circle cx="40" cy="42" r="29" fill={skinFill} stroke={OUTLINE} strokeWidth="2.35" />
      <path d="M 21 28 Q 38 13 59 27" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.24" />
      <path d="M 24 34 Q 31 30 36 33" stroke={hairColor} strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.88" />
      <path d="M 44 33 Q 51 30 56 34" stroke={hairColor} strokeWidth="2.1" fill="none" strokeLinecap="round" opacity="0.88" />
      <ellipse cx="31" cy="41" rx="6.8" ry="7.1" fill={eyeWhiteFill} stroke={OUTLINE} strokeWidth="1.2" />
      <ellipse cx="49" cy="41" rx="6.8" ry="7.1" fill={eyeWhiteFill} stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="32" cy="42" r="3.8" fill={irisFill} />
      <circle cx="50" cy="42" r="3.8" fill={irisFill} />
      <circle cx="32.7" cy="42.5" r="1.8" fill="#0f172a" opacity="0.55" />
      <circle cx="50.7" cy="42.5" r="1.8" fill="#0f172a" opacity="0.55" />
      <circle cx="30.4" cy="38.8" r="1.35" fill="white" />
      <circle cx="48.4" cy="38.8" r="1.35" fill="white" />
      <circle cx="34.3" cy="39.8" r="0.65" fill="white" opacity="0.78" />
      <circle cx="52.3" cy="39.8" r="0.65" fill="white" opacity="0.78" />
      <ellipse cx="24" cy="50" rx="3.8" ry="2.8" fill={cheekFill} opacity="0.2" />
      <ellipse cx="56" cy="50" rx="3.8" ry="2.8" fill={cheekFill} opacity="0.2" />
      <path d="M 38 49 Q 40 51 42 49" stroke={darken(skinColor, 22)} strokeWidth="1.7" fill="none" strokeLinecap="round" />
      {cfg.mascot === "gossip" ? (
        <ellipse cx="41" cy="57" rx="5" ry="4" fill="#7f1d1d" stroke={OUTLINE} strokeWidth="1.5" />
      ) : cfg.mascot === "vampire" ? (
        <>
          <path d="M 33 56 Q 40 61 47 56" stroke="#4c0519" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M 36 57 L 38 62 L 40 57 Z" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="0.5" />
          <path d="M 42 57 L 44 62 L 46 57 Z" fill="#f8fafc" stroke="#e5e7eb" strokeWidth="0.5" />
        </>
      ) : (
        <path d="M 33 56 Q 40 63 47 56" stroke={darken(skinColor, 28)} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {cfg.mascot === "smile" && (
        <>
          <path d="M 30 54 Q 40 68 50 54" stroke="#92400e" strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="24" cy="50" r="4" fill="#fb7185" opacity="0.35" />
          <circle cx="56" cy="50" r="4" fill="#fb7185" opacity="0.35" />
        </>
      )}
      {cfg.mascot === "cool" && (
        <>
          <rect x="23" y="35" width="15" height="10" rx="4" fill="#020617" stroke={OUTLINE} strokeWidth="1.8" />
          <rect x="43" y="35" width="15" height="10" rx="4" fill="#020617" stroke={OUTLINE} strokeWidth="1.8" />
          <line x1="38" y1="39" x2="43" y2="39" stroke={OUTLINE} strokeWidth="2" />
          <path d="M 31 56 Q 40 60 50 55" stroke="#020617" strokeWidth="2.3" fill="none" strokeLinecap="round" />
        </>
      )}
      {cfg.mascot === "nerd" && (
        <>
          <circle cx="31" cy="41" r="8" fill="none" stroke="#111827" strokeWidth="2" />
          <circle cx="49" cy="41" r="8" fill="none" stroke="#111827" strokeWidth="2" />
          <line x1="39" y1="41" x2="41" y2="41" stroke="#111827" strokeWidth="2" />
          <rect x="37" y="59" width="6" height="4" rx="1" fill="#f8fafc" stroke="#92400e" strokeWidth="1" />
        </>
      )}
      {cfg.mascot === "fire" && (
        <>
          <path d="M 25 36 Q 31 32 36 36" stroke="#dc2626" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M 44 36 Q 50 32 55 36" stroke="#dc2626" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      )}
      {cfg.mascot === "star" && (
        <>
          <path d="M 31 34 L 33 39 L 38 40 L 34 43 L 35 48 L 31 45 L 27 48 L 28 43 L 24 40 L 29 39 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1" />
          <path d="M 49 34 L 51 39 L 56 40 L 52 43 L 53 48 L 49 45 L 45 48 L 46 43 L 42 40 L 47 39 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1" />
        </>
      )}
      {cfg.mascot === "royalty" && (
        <path d="M 32 55 Q 40 61 49 55" stroke="#7c2d12" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      )}
      {cfg.mascot === "gossip" && (
        <path d="M 61 34 Q 74 24 77 38 Q 70 36 63 43 Z" fill="#fce7f3" stroke={OUTLINE} strokeWidth="1.3" />
      )}
      {renderHair(cfg, hairColor, paint)}
    </g>
  );
}

function renderAccessory(acc: string | null) {
  if (!acc) return null;
  switch (acc) {
    case "🕶️":
      return (
        <g>
          <circle cx="31" cy="42" r="7" fill="#111827" opacity="0.72" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="49" cy="42" r="7" fill="#111827" opacity="0.72" stroke={OUTLINE} strokeWidth="2" />
          <line x1="38" y1="42" x2="42" y2="42" stroke={OUTLINE} strokeWidth="2.2" />
        </g>
      );
    case "🎧":
      return (
        <g>
          <path d="M 14 42 Q 14 5 40 5 Q 66 5 66 42" stroke="#111827" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <rect x="8" y="38" width="11" height="17" rx="5" fill="#334155" stroke={OUTLINE} strokeWidth="1.7" />
          <rect x="61" y="38" width="11" height="17" rx="5" fill="#334155" stroke={OUTLINE} strokeWidth="1.7" />
        </g>
      );
    case "🎩":
      return (
        <g>
          <ellipse cx="40" cy="20" rx="25" ry="6" fill="#111827" stroke={OUTLINE} strokeWidth="1.8" />
          <rect x="21" y="2" width="38" height="20" rx="3" fill="#111827" stroke={OUTLINE} strokeWidth="1.8" />
          <rect x="22" y="15" width="36" height="5" rx="1" fill="#475569" />
        </g>
      );
    case "👑":
      return (
        <g>
          <path d="M 18 30 L 26 8 L 40 24 L 54 8 L 62 30 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="20" y="29" width="40" height="8" rx="3" fill="#f59e0b" stroke={OUTLINE} strokeWidth="1.4" />
          <circle cx="40" cy="17" r="4" fill="#ec4899" />
        </g>
      );
    case "⚡":
      return <path d="M 49 2 L 37 27 L 45 27 L 33 55 L 54 22 L 45 22 L 56 2 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.7" strokeLinejoin="round" />;
    case "💼":
      return (
        <g transform="translate(55, 78)">
          <rect x="0" y="4" width="20" height="16" rx="3" fill="#92400e" stroke={OUTLINE} strokeWidth="1.5" />
          <rect x="6" y="1" width="8" height="5" rx="1" fill="#78350f" stroke={OUTLINE} strokeWidth="1" />
          <line x1="1" y1="11" x2="19" y2="11" stroke="#78350f" strokeWidth="1.4" />
        </g>
      );
    case "🧢":
      return (
        <g>
          <path d="M 18 26 Q 27 10 44 12 Q 58 14 62 30 Q 41 23 18 30 Z" fill="#2563eb" stroke={OUTLINE} strokeWidth="1.8" />
          <path d="M 54 27 Q 67 26 72 31 Q 63 35 54 32 Z" fill="#1d4ed8" stroke={OUTLINE} strokeWidth="1.5" />
        </g>
      );
    case "🪄":
      return (
        <g>
          <path d="M 58 18 L 73 3" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
          <path d="M 71 1 L 73 7 L 79 9 L 73 11 L 71 17 L 69 11 L 63 9 L 69 7 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="1.2" />
        </g>
      );
    case "🌙":
      return <path d="M 59 11 Q 48 17 52 30 Q 58 43 71 38 Q 62 34 60 24 Q 58 17 59 11 Z" fill="#fef3c7" stroke={OUTLINE} strokeWidth="1.7" />;
    case "💎":
      return (
        <g>
          <path d="M 60 10 L 72 10 L 78 20 L 66 36 L 54 20 Z" fill="#67e8f9" stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 60 10 L 66 20 L 72 10" fill="#ffffff70" />
        </g>
      );
    case "🎒":
      return (
        <g transform="translate(56, 74)">
          <rect x="0" y="5" width="19" height="23" rx="5" fill="#ef4444" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M 5 5 Q 9 -3 14 5" stroke="#991b1b" strokeWidth="2" fill="none" />
          <rect x="3" y="15" width="13" height="7" rx="2" fill="#fecaca" />
        </g>
      );
    case "🧣":
      return (
        <g>
          <path d="M 23 62 Q 40 70 57 62" stroke="#dc2626" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M 49 63 Q 55 74 52 88" stroke="#b91c1c" strokeWidth="6" fill="none" strokeLinecap="round" />
          <line x1="52" y1="83" x2="58" y2="88" stroke="#fecaca" strokeWidth="1.3" />
        </g>
      );
    case "🛡️":
      return (
        <g transform="translate(56, 72)">
          <path d="M 10 0 L 22 5 L 20 19 Q 17 27 10 31 Q 3 27 0 19 L -2 5 Z" fill="#2563eb" stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 10 4 L 17 7 L 16 17 Q 14 23 10 26 Z" fill="#93c5fd" opacity="0.75" />
        </g>
      );
    case "🏅":
      return (
        <g transform="translate(54, 67)">
          <path d="M 6 0 L 13 0 L 10 12 Z" fill="#ef4444" stroke={OUTLINE} strokeWidth="1" />
          <path d="M 13 0 L 20 0 L 16 12 Z" fill="#3b82f6" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="13" cy="18" r="8" fill="#facc15" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M 13 13 L 15 17 L 19 17 L 16 20 L 17 24 L 13 22 L 9 24 L 10 20 L 7 17 L 11 17 Z" fill="#f59e0b" />
        </g>
      );
    case "☕":
      return (
        <g transform="translate(55, 78)">
          <rect x="0" y="8" width="18" height="16" rx="5" fill="#f8fafc" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M 18 12 Q 27 13 24 19 Q 22 24 18 22" stroke={OUTLINE} strokeWidth="2" fill="none" />
          <ellipse cx="9" cy="10" rx="7" ry="3" fill="#92400e" />
          <path d="M 6 0 Q 8 -5 10 0 M 13 1 Q 15 -4 17 1" stroke="#94a3b8" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      );
    case "🌸":
      return (
        <g transform="translate(58, 14)">
          <circle cx="8" cy="8" r="3" fill="#f472b6" />
          <ellipse cx="8" cy="1" rx="3" ry="5" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="0.8" />
          <ellipse cx="8" cy="15" rx="3" ry="5" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="0.8" />
          <ellipse cx="1" cy="8" rx="5" ry="3" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="0.8" />
          <ellipse cx="15" cy="8" rx="5" ry="3" fill="#f9a8d4" stroke={OUTLINE} strokeWidth="0.8" />
          <circle cx="8" cy="8" r="2" fill="#facc15" />
        </g>
      );
    case "📘":
      return (
        <g transform="translate(55, 76)">
          <path d="M 0 4 Q 8 0 18 4 L 18 27 Q 9 23 0 27 Z" fill="#2563eb" stroke={OUTLINE} strokeWidth="1.5" />
          <path d="M 18 4 Q 25 1 31 5 L 31 28 Q 25 24 18 27 Z" fill="#1d4ed8" stroke={OUTLINE} strokeWidth="1.5" />
          <line x1="5" y1="10" x2="14" y2="8" stroke="#bfdbfe" strokeWidth="1.2" />
          <line x1="22" y1="10" x2="28" y2="9" stroke="#bfdbfe" strokeWidth="1.2" />
        </g>
      );
    case "🧭":
      return (
        <g transform="translate(57, 12)">
          <circle cx="10" cy="10" r="10" fill="#f8fafc" stroke={OUTLINE} strokeWidth="1.6" />
          <path d="M 10 3 L 14 11 L 10 17 L 6 9 Z" fill="#ef4444" stroke={OUTLINE} strokeWidth="1" />
          <circle cx="10" cy="10" r="2" fill="#0f172a" />
        </g>
      );
    case "🎯":
      return (
        <g transform="translate(56, 73)">
          <circle cx="11" cy="11" r="11" fill="#f8fafc" stroke={OUTLINE} strokeWidth="1.5" />
          <circle cx="11" cy="11" r="7" fill="#ef4444" />
          <circle cx="11" cy="11" r="3" fill="#f8fafc" />
          <path d="M 11 11 L 24 -2" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
          <path d="M 24 -2 L 22 5 L 18 1 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="0.8" />
        </g>
      );
    case "🪽":
      return (
        <g opacity="0.98">
          <path d="M 18 61 Q -7 42 7 14 Q 26 23 29 57 Z" fill="#f8fafc" stroke={OUTLINE} strokeWidth="1.7" />
          <path d="M 62 61 Q 87 42 73 14 Q 54 23 51 57 Z" fill="#f8fafc" stroke={OUTLINE} strokeWidth="1.7" />
          <path d="M 18 57 Q 2 43 10 24" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 62 57 Q 78 43 70 24" stroke="#cbd5e1" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 20 50 Q 6 40 13 29" stroke="#e0f2fe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 60 50 Q 74 40 67 29" stroke="#e0f2fe" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 11 24 Q 20 26 25 36" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8" />
          <path d="M 69 24 Q 60 26 55 36" stroke="#ffffff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8" />
        </g>
      );
    case "⭕":
      return (
        <g>
          <ellipse cx="40" cy="5" rx="23" ry="6" fill="none" stroke="#fef3c7" strokeWidth="5" opacity="0.45" />
          <ellipse cx="40" cy="5" rx="22" ry="5" fill="none" stroke="#facc15" strokeWidth="2.8" opacity="0.95">
            <animate attributeName="opacity" values="0.72;1;0.72" dur="1.8s" repeatCount="indefinite" />
          </ellipse>
          <circle cx="20" cy="5" r="2" fill="#fff7ed" opacity="0.85" />
          <circle cx="60" cy="5" r="2" fill="#fff7ed" opacity="0.85" />
        </g>
      );
    case "🦸":
      return (
        <g>
          <path d="M 13 56 Q 2 78 7 109 Q 24 98 40 92 Q 56 98 73 109 Q 78 78 67 56 Q 55 66 40 67 Q 25 66 13 56 Z" fill="#dc2626" stroke={OUTLINE} strokeWidth="1.9" />
          <path d="M 17 61 Q 28 73 40 92 Q 52 73 63 61" fill="#ef4444" opacity="0.55" />
          <path d="M 40 67 L 40 94" stroke="#991b1b" strokeWidth="1.4" />
          <path d="M 15 66 Q 28 77 36 87" stroke="#fecaca" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.55" />
        </g>
      );
    case "🛸":
      return (
        <g transform="translate(51, 4)">
          <path d="M 14 23 Q 8 35 2 45" stroke="#22d3ee" strokeWidth="1.3" opacity="0.45" strokeLinecap="round" />
          <path d="M 14 23 Q 16 36 18 47" stroke="#67e8f9" strokeWidth="1.1" opacity="0.35" strokeLinecap="round" />
          <ellipse cx="15" cy="17" rx="18" ry="7" fill="#475569" stroke={OUTLINE} strokeWidth="1.6" />
          <ellipse cx="15" cy="13" rx="10" ry="6.5" fill="#22d3ee" opacity="0.9" stroke="#cffafe" strokeWidth="1" />
          <path d="M 5 17 Q 15 22 25 17" stroke="#cbd5e1" strokeWidth="1.2" fill="none" opacity="0.7" />
          <circle cx="15" cy="11" r="3.2" fill="#0f172a" />
          <circle cx="7" cy="22" r="2.2" fill="#38bdf8" className="avatar-blink" />
          <circle cx="15" cy="23" r="2.2" fill="#a7f3d0" className="avatar-blink" />
          <circle cx="23" cy="22" r="2.2" fill="#38bdf8" className="avatar-blink" />
        </g>
      );
    default:
      return null;
  }
}

function renderAura(aura: string | null) {
  if (!aura) return null;
  switch (aura) {
    case "✨":
      return (
        <g className="avatar-aura-pulse">
          <ellipse cx="40" cy="55" rx="31" ry="37" fill="none" stroke="#facc15" strokeWidth="1.4" opacity="0.32" strokeDasharray="2 8" />
          <path d="M 17 23 L 19 29 L 25 31 L 19 33 L 17 39 L 15 33 L 9 31 L 15 29 Z" fill="#fde68a" opacity="0.95" />
          <path d="M 65 18 L 67 24 L 73 26 L 67 28 L 65 34 L 63 28 L 57 26 L 63 24 Z" fill="#facc15" opacity="0.9" />
          <path d="M 61 76 L 63 81 L 68 83 L 63 85 L 61 90 L 59 85 L 54 83 L 59 81 Z" fill="#fff7ed" opacity="0.9" />
          <circle cx="29" cy="82" r="2.3" fill="#fbbf24" opacity="0.75" />
          <circle cx="48" cy="13" r="1.8" fill="#fef3c7" opacity="0.9" />
        </g>
      );
    case "🔥":
      return (
        <g className="avatar-aura-pulse">
          <ellipse cx="40" cy="58" rx="35" ry="42" fill="url(#auraFire)" opacity="0.42" />
          <path d="M 18 92 Q 10 69 22 52 Q 24 66 32 53 Q 39 40 36 25 Q 58 43 53 63 Q 62 58 66 47 Q 77 75 60 96 Q 49 104 40 102 Q 29 104 18 92 Z" fill="#f97316" opacity="0.28" />
          <path d="M 25 90 Q 19 72 29 60 Q 31 71 38 59 Q 45 69 51 61 Q 58 78 48 94 Q 40 99 32 95 Z" fill="#fef3c7" opacity="0.28" />
        </g>
      );
    case "❄️":
      return (
        <g className="avatar-aura-pulse">
          <ellipse cx="40" cy="55" rx="33" ry="39" fill="#e0f2fe" opacity="0.1" />
          <ellipse cx="40" cy="55" rx="32" ry="36" fill="none" stroke="#38bdf8" strokeWidth="1.7" opacity="0.62" strokeDasharray="7 5" />
          {[18, 40, 62].map((cx, i) => (
            <g key={cx} transform={`translate(${cx} ${22 + i * 26})`}>
              <path d="M -5 0 L 5 0 M 0 -5 L 0 5 M -4 -4 L 4 4 M 4 -4 L -4 4" stroke="#bae6fd" strokeWidth="1.3" strokeLinecap="round" />
            </g>
          ))}
        </g>
      );
    case "💫":
      return (
        <g className="avatar-aura-pulse">
          <ellipse cx="40" cy="55" rx="39" ry="24" fill="none" stroke="#8b5cf6" strokeWidth="2.1" opacity="0.55" transform="rotate(-18 40 55)" />
          <ellipse cx="40" cy="55" rx="26" ry="42" fill="none" stroke="#c4b5fd" strokeWidth="1.2" opacity="0.32" transform="rotate(26 40 55)" />
          <circle cx="13" cy="48" r="3.3" fill="#c4b5fd" />
          <circle cx="68" cy="38" r="2.8" fill="#a78bfa" />
          <circle cx="43" cy="12" r="2.2" fill="#ddd6fe" />
          <path d="M 57 75 L 61 79 L 57 83 L 53 79 Z" fill="#f0abfc" opacity="0.9" />
        </g>
      );
    case "🌀":
      return (
        <g className="avatar-aura-pulse">
          <path d="M 40 13 Q 68 18 72 47 Q 77 82 42 94 Q 12 89 10 60 Q 8 32 34 27 Q 57 27 59 50 Q 62 70 43 76 Q 25 74 24 57 Q 24 43 38 41" fill="none" stroke="#22d3ee" strokeWidth="2.7" opacity="0.68" strokeLinecap="round" />
          <path d="M 40 24 Q 59 29 61 49 Q 63 69 43 74 Q 27 71 28 57 Q 29 47 39 46" fill="none" stroke="#a5f3fc" strokeWidth="1.5" opacity="0.5" strokeLinecap="round" />
          <circle cx="40" cy="55" r="4" fill="#22d3ee" opacity="0.22" />
        </g>
      );
    case "🌈":
      return (
        <g className="avatar-aura-rainbow">
          <ellipse cx="40" cy="57" rx="39" ry="44" fill="url(#auraRainbow)" opacity="0.28" />
          <path d="M 4 63 Q 20 28 40 28 Q 60 28 76 63" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
          <path d="M 10 66 Q 23 37 40 37 Q 57 37 70 66" fill="none" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
          <path d="M 16 69 Q 26 46 40 46 Q 54 46 64 69" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
          <path d="M 22 72 Q 29 55 40 55 Q 51 55 58 72" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
        </g>
      );
    default:
      return null;
  }
}

const POSE_TRANSFORM: Record<AvatarPose, string | undefined> = {
  idle: undefined,
  hero: "translate(40, 55) scale(1.03, 1.03) translate(-40, -55)",
  cool: "translate(40, 55) rotate(-2) translate(-40, -55)",
  focus: "translate(40, 55) scale(0.99, 1.01) translate(-40, -55)",
  victory: "translate(40, 55) scale(1.02) translate(-40, -55)",
  sprint: "translate(42, 55) skewX(-4) translate(-40, -55)",
};

function renderPoseBackEffect(pose: AvatarPose, color: string) {
  switch (pose) {
    case "hero":
      return (
        <g className="avatar-pose-effect">
          <path d="M 16 96 Q 40 26 64 96" fill={color} opacity="0.13" />
          <path d="M 40 8 L 44 20 L 57 21 L 47 29 L 50 42 L 40 35 L 30 42 L 33 29 L 23 21 L 36 20 Z" fill={color} opacity="0.38" />
        </g>
      );
    case "focus":
      return (
        <g className="avatar-focus-ring">
          <circle cx="40" cy="53" r="33" fill="none" stroke={color} strokeWidth="1.6" opacity="0.45" />
          <circle cx="40" cy="53" r="24" fill="none" stroke={color} strokeWidth="1.2" opacity="0.28" />
          <circle cx="40" cy="53" r="4" fill={color} opacity="0.18" />
        </g>
      );
    case "victory":
      return (
        <g className="avatar-pose-effect">
          <path d="M 14 23 L 17 31 L 25 32 L 19 37 L 21 45 L 14 41 L 7 45 L 9 37 L 3 32 L 11 31 Z" fill="#facc15" stroke={OUTLINE} strokeWidth="0.9" />
          <path d="M 66 19 L 69 27 L 77 28 L 71 33 L 73 41 L 66 37 L 59 41 L 61 33 L 55 28 L 63 27 Z" fill="#f59e0b" stroke={OUTLINE} strokeWidth="0.9" />
          <circle cx="28" cy="12" r="2.5" fill={color} opacity="0.9" />
          <circle cx="54" cy="9" r="2" fill="#facc15" opacity="0.9" />
        </g>
      );
    case "sprint":
      return (
        <g className="avatar-sprint-lines">
          <path d="M 1 42 L 23 38" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.55" />
          <path d="M -2 62 L 20 59" stroke={color} strokeWidth="2.4" strokeLinecap="round" opacity="0.38" />
          <path d="M 4 82 L 28 78" stroke={color} strokeWidth="2.8" strokeLinecap="round" opacity="0.48" />
        </g>
      );
    default:
      return null;
  }
}

function renderPoseFrontEffect(pose: AvatarPose, color: string) {
  switch (pose) {
    case "victory":
      return (
        <g>
          <path d="M 22 71 Q 13 55 16 39" stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <path d="M 58 71 Q 67 55 64 39" stroke={color} strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <circle cx="16" cy="38" r="5" fill="#fef3c7" stroke={OUTLINE} strokeWidth="1.5" />
          <circle cx="64" cy="38" r="5" fill="#fef3c7" stroke={OUTLINE} strokeWidth="1.5" />
        </g>
      );
    case "focus":
      return (
        <g transform="translate(52, 75)">
          <rect x="0" y="0" width="17" height="21" rx="4" fill="#0f172a" stroke={OUTLINE} strokeWidth="1.5" />
          <rect x="3" y="4" width="11" height="11" rx="2" fill={color} opacity="0.45" />
          <circle cx="8.5" cy="18" r="1.4" fill="#e2e8f0" />
        </g>
      );
    case "sprint":
      return (
        <g>
          <path d="M 25 99 L 13 106" stroke={OUTLINE} strokeWidth="4.5" strokeLinecap="round" />
          <path d="M 54 99 L 70 103" stroke={OUTLINE} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

function renderPet(pet: string | null) {
  if (!pet) return null;
  switch (pet) {
    case "🐱":
      return <PetBody color="#f59e0b" accent="#fff7ed" ears="pointy" />;
    case "🐶":
      return <PetBody color="#a16207" accent="#fde68a" ears="floppy" />;
    case "🐹":
      return <PetBody color="#d6a76c" accent="#fee2e2" ears="round" />;
    case "🐠":
      return (
        <g transform="translate(55, 82) scale(0.55)">
          <ellipse cx="15" cy="17" rx="17" ry="13" fill="#38bdf8" stroke={OUTLINE} strokeWidth="2" />
          <path d="M -1 17 L -11 8 L -11 26 Z" fill="#fb923c" stroke={OUTLINE} strokeWidth="2" />
          <circle cx="21" cy="13" r="4" fill="white" stroke={OUTLINE} strokeWidth="1.4" />
          <circle cx="22" cy="13" r="2" fill="#0f172a" />
          <path d="M 7 22 Q 13 26 21 22" stroke="#0284c7" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </g>
      );
    case "🦊":
      return <PetBody color="#ea580c" accent="#ffedd5" ears="pointy" />;
    case "🤖":
      return (
        <g transform="translate(55, 82) scale(0.55)">
          <rect x="0" y="8" width="32" height="25" rx="6" fill="#64748b" stroke={OUTLINE} strokeWidth="2" />
          <rect x="6" y="14" width="20" height="8" rx="4" fill="#0f172a" />
          <rect x="9" y="17" width="5" height="3" rx="1.5" fill="#22d3ee" />
          <rect x="18" y="17" width="5" height="3" rx="1.5" fill="#22d3ee" />
        </g>
      );
    case "🐲":
      return <PetBody color="#16a34a" accent="#bbf7d0" ears="dragon" />;
    default:
      return null;
  }
}

function PetBody({ color, accent, ears }: { color: string; accent: string; ears: "pointy" | "floppy" | "round" | "dragon" }) {
  return (
    <g transform="translate(54, 82) scale(0.55)">
      {ears === "pointy" && (
        <>
          <path d="M 7 8 L 2 -4 L 14 5 Z" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
          <path d="M 25 8 L 30 -4 L 18 5 Z" fill={color} stroke={OUTLINE} strokeWidth="1.8" />
        </>
      )}
      {ears === "floppy" && (
        <>
          <ellipse cx="6" cy="14" rx="5" ry="9" fill={darken(color, 28)} stroke={OUTLINE} strokeWidth="1.8" />
          <ellipse cx="26" cy="14" rx="5" ry="9" fill={darken(color, 28)} stroke={OUTLINE} strokeWidth="1.8" />
        </>
      )}
      {ears === "round" && (
        <>
          <circle cx="7" cy="5" r="6" fill={accent} stroke={OUTLINE} strokeWidth="1.8" />
          <circle cx="25" cy="5" r="6" fill={accent} stroke={OUTLINE} strokeWidth="1.8" />
        </>
      )}
      {ears === "dragon" && (
        <>
          <path d="M 7 8 L 3 -5 L 15 6 Z" fill={darken(color, 20)} stroke={OUTLINE} strokeWidth="1.8" />
          <path d="M 25 8 L 29 -5 L 17 6 Z" fill={darken(color, 20)} stroke={OUTLINE} strokeWidth="1.8" />
        </>
      )}
      <ellipse cx="16" cy="25" rx="14" ry="11" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <circle cx="16" cy="13" r="12" fill={color} stroke={OUTLINE} strokeWidth="2" />
      <ellipse cx="16" cy="18" rx="7" ry="5" fill={accent} opacity="0.9" />
      <circle cx="11" cy="12" r="3.5" fill="white" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="21" cy="12" r="3.5" fill="white" stroke={OUTLINE} strokeWidth="1.2" />
      <circle cx="12" cy="12.5" r="1.8" fill="#0f172a" />
      <circle cx="22" cy="12.5" r="1.8" fill="#0f172a" />
      <path d="M 13 18 Q 16 21 19 18" stroke={OUTLINE} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </g>
  );
}

// Main Avatar2D Component

type Props = {
  avatar?: UserAvatar | null;
  size?: AvatarSize;
  animate?: boolean;
  className?: string;
  /** Slugs equipados — ativa brilho de coleção completa */
  equippedSlugs?: string[];
  /** Raridade mais alta equipada — intensifica o brilho */
  highlightRarity?: ExtendedRarity;
};

const RARITY_GLOW: Partial<Record<ExtendedRarity, string>> = {
  rare: "drop-shadow(0 0 6px #3b82f680)",
  epic: "drop-shadow(0 0 10px #a855f790)",
  legendary: "drop-shadow(0 0 14px #f59e0b95)",
  mythic: "drop-shadow(0 0 18px #ec4899aa)",
};

export function Avatar2D({
  avatar,
  size = "md",
  animate = true,
  className,
  equippedSlugs = [],
  highlightRarity,
}: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const face = avatar?.face_emoji ?? "🧑";
  const clothesColor = (avatar as any)?.clothes_color ?? avatar?.bg_color ?? "#3b82f6";
  const cfg: CharConfig = CHAR_CONFIGS[face] ?? DEFAULT_CONFIG;
  const s = SIZE_MAP[size];

  const skinColor = (avatar as any)?.skin_tone ?? cfg.skinColor;
  const hairColor = (avatar as any)?.hair_color ?? cfg.hairColor;
  const hairStyle = (avatar as any)?.hair_style ?? cfg.hairStyle;
  const displayCfg = { ...cfg, hairStyle: hairStyle as HairStyle };

  const pet = avatar?.pet_emoji ?? null;
  const slots = resolveAvatarAccessories(avatar);
  const aura = (avatar as { aura_emoji?: string | null })?.aura_emoji ?? null;
  const pose = getAvatarPose(avatar);
  const collectionBonus = getCollectionBonus(equippedSlugs);
  const poseColor = collectionBonus?.glow ?? displayCfg.accentColor;
  const ids = {
    skin: `avatar-skin-${uid}`,
    body: `avatar-body-${uid}`,
    hair: `avatar-hair-${uid}`,
    iris: `avatar-iris-${uid}`,
    eyeWhite: `avatar-eye-${uid}`,
    softShadow: `avatar-shadow-${uid}`,
    ambientGlow: `avatar-ambient-${uid}`,
  };
  const paint: AvatarPaint = {
    skinFill: `url(#${ids.skin})`,
    bodyFill: `url(#${ids.body})`,
    hairFill: `url(#${ids.hair})`,
    hairShine: lighten(hairColor, 28),
    irisFill: `url(#${ids.iris})`,
    eyeWhiteFill: `url(#${ids.eyeWhite})`,
    cheekFill: displayCfg.mascot === "cosmic" ? lighten(displayCfg.accentColor, 18) : darken(skinColor, 18),
    shadowFilter: `url(#${ids.softShadow})`,
  };

  const glowFilter =
    collectionBonus?.glow
      ? `drop-shadow(0 0 12px ${collectionBonus.glow}90)`
      : highlightRarity && highlightRarity !== "common"
        ? RARITY_GLOW[highlightRarity]
        : cfg.glowColor
          ? `drop-shadow(0 0 8px ${cfg.glowColor}60)`
          : undefined;

  const poseTransform = POSE_TRANSFORM[pose];

  return (
    <div
      className={cn("relative inline-flex shrink-0", s.outer, className)}
      style={glowFilter ? { filter: glowFilter } : undefined}
    >
      <svg
        viewBox="0 0 80 110"
        className={cn(
          "w-full h-full",
          animate && pose === "idle" && "avatar-idle",
          animate && pose === "hero" && "avatar-pose-hero",
          animate && pose === "cool" && "avatar-pose-cool",
          animate && pose === "focus" && "avatar-pose-focus",
          animate && pose === "victory" && "avatar-pose-victory",
          animate && pose === "sprint" && "avatar-pose-sprint",
        )}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id={ids.skin} x1="18" y1="14" x2="62" y2="70" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lighten(skinColor, 24)} />
            <stop offset="55%" stopColor={skinColor} />
            <stop offset="100%" stopColor={darken(skinColor, 22)} />
          </linearGradient>
          <linearGradient id={ids.body} x1="18" y1="60" x2="62" y2="106" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lighten(clothesColor, 34)} />
            <stop offset="54%" stopColor={clothesColor} />
            <stop offset="100%" stopColor={darken(clothesColor, 34)} />
          </linearGradient>
          <linearGradient id={ids.hair} x1="18" y1="8" x2="62" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={lighten(hairColor, 24)} />
            <stop offset="48%" stopColor={hairColor} />
            <stop offset="100%" stopColor={darken(hairColor, 24)} />
          </linearGradient>
          <radialGradient id={ids.iris} cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor={lighten(displayCfg.eyeColor, 62)} />
            <stop offset="48%" stopColor={displayCfg.eyeColor} />
            <stop offset="100%" stopColor={darken(displayCfg.eyeColor, 34)} />
          </radialGradient>
          <radialGradient id={ids.eyeWhite} cx="42%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </radialGradient>
          <radialGradient id={ids.ambientGlow} cx="50%" cy="38%" r="58%">
            <stop offset="0%" stopColor={lighten(poseColor, 40)} stopOpacity="0.18" />
            <stop offset="100%" stopColor={poseColor} stopOpacity="0" />
          </radialGradient>
          <filter id={ids.softShadow} x="-35%" y="-25%" width="170%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#0f172a" floodOpacity="0.18" />
            <feDropShadow dx="0" dy="0" stdDeviation="1.2" floodColor={poseColor} floodOpacity="0.13" />
          </filter>
          <radialGradient id="auraFire" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="auraRainbow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#22c55e" />
            <stop offset="75%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <ellipse cx="40" cy="56" rx="42" ry="48" fill={`url(#${ids.ambientGlow})`} />
        <ellipse cx="40" cy="108" rx="25" ry="5.5" fill="rgba(15,23,42,0.18)" />
        {renderAura(aura)}
        {collectionBonus && (
          <ellipse
            cx="40"
            cy="52"
            rx="36"
            ry="40"
            fill="none"
            stroke={collectionBonus.glow}
            strokeWidth="2"
            opacity="0.55"
            className="avatar-collection-ring"
          />
        )}
        <g transform={poseTransform} filter={paint.shadowFilter}>
          {renderPoseBackEffect(pose, poseColor)}
          {renderSparkles(displayCfg)}
          {renderAccessory(slots.back)}
          {renderBody(displayCfg, clothesColor, paint)}
          {displayCfg.mascot !== "robot" && (
            <rect x="34" y="61" width="12" height="13" rx="4" fill={paint.skinFill} stroke={OUTLINE} strokeWidth="1.25" />
          )}
          {renderAccessory(slots.chest)}
          {renderHead(displayCfg, skinColor, hairColor, paint)}
          {renderAccessory(slots.head)}
          {renderAccessory(slots.face)}
          {renderAccessory(slots.hand)}
          {renderPoseFrontEffect(pose, poseColor)}
        </g>
        {renderPet(pet)}
      </svg>
    </div>
  );
}
