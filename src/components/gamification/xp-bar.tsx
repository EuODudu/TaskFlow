import { getLevelFromXP, getLevelProgress, getXPForLevel, getXPForNextLevel, MAX_LEVEL, formatXP } from "@/lib/gamification";
import { cn } from "@/lib/utils";

type Props = {
  xp: number;
  size?: "sm" | "md" | "lg";
  showNumbers?: boolean;
  className?: string;
};

export function XPBar({ xp, size = "md", showNumbers = true, className }: Props) {
  const level = getLevelFromXP(xp);
  const progress = getLevelProgress(xp);
  const current = getXPForLevel(level);
  const next = getXPForNextLevel(level);
  const isMaxLevel = level >= MAX_LEVEL;

  const trackH = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className={cn("w-full", className)}>
      {showNumbers && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            {isMaxLevel ? "Nível máximo!" : `${formatXP(xp - current)} / ${formatXP(next - current)} XP`}
          </span>
          <span className="text-xs font-semibold text-primary">{formatXP(xp)} XP total</span>
        </div>
      )}
      <div className={cn("w-full rounded-full bg-muted overflow-hidden", trackH)}>
        <div
          className={cn("h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700")}
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
    </div>
  );
}
