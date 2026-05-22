import { Card } from "@/components/ui/card";
import {
  getLevelFromXP,
  getMilestoneProgress,
  getNextMilestone,
  PROGRESSION_MILESTONES,
  type ProgressionMilestone,
} from "@/lib/gamification";
import { RARITY_STYLES, type ExtendedRarity } from "@/components/gamification/rarity-frame";
import { cn } from "@/lib/utils";
import { Lock, Sparkles, Trophy } from "lucide-react";

type Props = {
  xp: number;
  compact?: boolean;
};

export function ProgressionRoadmap({ xp, compact = false }: Props) {
  const level = getLevelFromXP(xp);
  const next = getNextMilestone(level);
  const milestoneProgress = Math.round(getMilestoneProgress(level) * 100);

  return (
    <Card className="p-5 overflow-hidden relative">
      <div className="absolute right-0 top-0 size-32 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Trilha de Progressão
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Marcos de nível desbloqueiam itens, coleções, temas e recompensas visuais.
            </p>
          </div>
          <div className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-right">
            <p className="text-[10px] text-muted-foreground">Nível atual</p>
            <p className="text-lg font-bold text-primary">{level}</p>
          </div>
        </div>

        {next ? (
          <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Próximo marco: nível {next.level}</p>
                <p className="font-semibold truncate">{next.icon} {next.title}</p>
                <p className="text-xs text-muted-foreground">{next.reward}</p>
              </div>
              <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold">
                {Math.max(0, next.level - level)} níveis
              </span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                style={{ width: `${milestoneProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="font-semibold flex items-center gap-2">
              <Trophy className="size-4 text-amber-500" />
              Trilha completa
            </p>
            <p className="text-xs text-muted-foreground">Você chegou no topo da progressão atual.</p>
          </div>
        )}

        {!compact && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            {PROGRESSION_MILESTONES.map((milestone) => (
              <MilestoneCard key={milestone.level} milestone={milestone} currentLevel={level} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function MilestoneCard({ milestone, currentLevel }: { milestone: ProgressionMilestone; currentLevel: number }) {
  const unlocked = currentLevel >= milestone.level;
  const rarity = milestone.rarity as ExtendedRarity;
  const rs = RARITY_STYLES[rarity];

  return (
    <div
      className={cn(
        "relative rounded-xl border p-3 min-h-28 overflow-hidden transition-all",
        unlocked ? cn(rs.border, rs.bg, "shadow-sm") : "border-border bg-muted/20 opacity-70",
      )}
    >
      {unlocked ? (
        <div className="absolute right-2 top-2 size-5 rounded-full bg-primary text-primary-foreground grid place-items-center">
          <Trophy className="size-3" />
        </div>
      ) : (
        <Lock className="absolute right-2 top-2 size-3.5 text-muted-foreground" />
      )}
      <div className={cn("text-2xl", !unlocked && "grayscale")}>{milestone.icon}</div>
      <p className="mt-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: unlocked ? rs.color : undefined }}>
        Nv. {milestone.level}
      </p>
      <p className="text-xs font-semibold leading-tight">{milestone.title}</p>
      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{milestone.reward}</p>
    </div>
  );
}
