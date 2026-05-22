import { getLevelFromXP, getRankFromLevel } from "@/lib/gamification";
import { cn } from "@/lib/utils";

type Props = {
  xp: number;
  size?: "xs" | "sm" | "md" | "lg";
  showTitle?: boolean;
  className?: string;
};

export function LevelBadge({ xp, size = "md", showTitle = false, className }: Props) {
  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);

  const badge = (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold border",
        size === "xs" && "px-1.5 py-0.5 text-[10px]",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-1 text-sm",
        size === "lg" && "px-3 py-1.5 text-base",
        className,
      )}
      style={{ color: rank.color, borderColor: `${rank.color}40`, background: `${rank.color}15` }}
    >
      <span>{rank.emoji}</span>
      <span>Nv. {level}</span>
    </span>
  );

  if (!showTitle) return badge;

  return (
    <div className="flex flex-col items-start gap-0.5">
      {badge}
      <span className="text-xs text-muted-foreground font-medium">{rank.title}</span>
    </div>
  );
}
