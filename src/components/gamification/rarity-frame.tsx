import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { BadgeRarity } from "@/lib/gamification";

export type ExtendedRarity = BadgeRarity | "mythic";

export const RARITY_STYLES: Record<ExtendedRarity, {
  label: string;
  color: string;
  border: string;
  bg: string;
  glow: string;
  gradient: string;
  shimmer: boolean;
}> = {
  common: {
    label: "Comum",
    color: "#94a3b8",
    border: "border-slate-400/40",
    bg: "bg-slate-500/5",
    glow: "",
    gradient: "from-slate-500/10 to-slate-400/5",
    shimmer: false,
  },
  rare: {
    label: "Raro",
    color: "#3b82f6",
    border: "border-blue-400/50",
    bg: "bg-blue-500/8",
    glow: "shadow-blue-500/25",
    gradient: "from-blue-500/15 to-blue-400/5",
    shimmer: false,
  },
  epic: {
    label: "Épico",
    color: "#a855f7",
    border: "border-purple-400/60",
    bg: "bg-purple-500/10",
    glow: "shadow-purple-500/30",
    gradient: "from-purple-500/20 to-purple-400/5",
    shimmer: true,
  },
  legendary: {
    label: "Lendário",
    color: "#f59e0b",
    border: "border-amber-400/70",
    bg: "bg-amber-500/10",
    glow: "shadow-amber-500/40",
    gradient: "from-amber-500/20 to-orange-400/5",
    shimmer: true,
  },
  mythic: {
    label: "Mítico",
    color: "#ec4899",
    border: "border-pink-400/80",
    bg: "bg-pink-500/10",
    glow: "shadow-pink-500/50",
    gradient: "from-pink-500/25 to-purple-400/10",
    shimmer: true,
  },
};

type Props = {
  rarity: ExtendedRarity;
  children: ReactNode;
  className?: string;
  showLabel?: boolean;
  hoverEffect?: boolean;
};

export function RarityFrame({ rarity, children, className, showLabel = false, hoverEffect = false }: Props) {
  const s = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;

  return (
    <div
      className={cn(
        "relative rounded-xl border overflow-hidden transition-all duration-300",
        s.border,
        s.bg,
        s.glow && `shadow-lg ${s.glow}`,
        hoverEffect && "hover:scale-[1.03] hover:shadow-xl cursor-pointer",
        className,
      )}
    >
      {/* Gradient overlay */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", s.gradient)} />

      {/* Shimmer effect for epic/legendary/mythic */}
      {s.shimmer && (
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl"
          aria-hidden
        >
          <div
            className="absolute inset-0 shimmer-sweep"
            style={{
              background: `linear-gradient(105deg, transparent 40%, ${s.color}20 50%, transparent 60%)`,
            }}
          />
        </div>
      )}

      {/* Mythic extra ring */}
      {rarity === "mythic" && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 20px ${s.color}30`,
          }}
        />
      )}

      <div className="relative">{children}</div>

      {showLabel && (
        <div
          className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
          style={{ color: s.color, background: `${s.color}22` }}
        >
          {s.label}
        </div>
      )}
    </div>
  );
}

export function RarityBadge({ rarity, className }: { rarity: ExtendedRarity; className?: string }) {
  const s = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
  return (
    <span
      className={cn("inline-flex items-center text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full", className)}
      style={{ color: s.color, background: `${s.color}22` }}
    >
      {s.label}
    </span>
  );
}
