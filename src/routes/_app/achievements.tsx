import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useBadges, useUserBadges, useProfile, useXpEvents } from "@/lib/queries";
import { getLevelFromXP } from "@/lib/gamification";
import { withLegacyBadgeStats } from "@/lib/gamification-stats";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RARITY_STYLES, type ExtendedRarity } from "@/components/gamification/rarity-frame";
import { ProgressionRoadmap } from "@/components/gamification/progression-roadmap";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Lock, Star, Zap, Target, Clock, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_app/achievements")({ component: AchievementsPage });

const CATEGORIES = [
  { key: "all",               label: "Todas",     icon: Trophy  },
  { key: "tasks_completed",   label: "Tarefas",   icon: Target  },
  { key: "pomodoro_sessions", label: "Pomodoro",  icon: Clock   },
  { key: "streak_days",       label: "Streak",    icon: Zap     },
  { key: "early_deliveries",  label: "Velocidade",icon: TrendingUp },
  { key: "level",             label: "Nível",     icon: Star    },
  { key: "xp_total",          label: "XP",        icon: Zap     },
];

const CONDITION_LABELS: Record<string, string> = {
  tasks_completed:   "tarefas",
  early_deliveries:  "entregas",
  streak_days:       "dias",
  pomodoro_sessions: "sessões",
  level:             "nível",
  xp_total:          "XP",
};

function AchievementsPage() {
  const { user } = useAuth();
  const { data: allBadges = [], isLoading } = useBadges();
  const { data: userBadges = [] } = useUserBadges(user?.id);
  const { data: profile } = useProfile(user?.id);
  const { data: xpEvents = [] } = useXpEvents(user?.id);
  const [filter, setFilter] = useState("all");

  const earnedMap = useMemo(
    () => new Map(userBadges.map((b) => [b.badge_id, b.earned_at])),
    [userBadges],
  );

  const filtered = useMemo(
    () => filter === "all" ? allBadges : allBadges.filter((b) => b.condition_type === filter),
    [allBadges, filter],
  );

  const earned = filtered.filter((b) => earnedMap.has(b.id));
  const locked = filtered.filter((b) => !earnedMap.has(b.id));

  // Compute user stats for progress bars
  const xp = profile?.xp ?? 0;
  const level = getLevelFromXP(xp);
  const totalTasks = xpEvents.filter((e) => e.reason === "task_completed").length;
  const totalPomodoro = xpEvents.filter((e) => e.reason === "pomodoro_session").length;
  const earlyDeliveries = xpEvents.filter((e) => e.reason === "early_delivery").length;

  const stats = withLegacyBadgeStats({
    tasks_completed: totalTasks,
    early_deliveries: earlyDeliveries,
    streak_days: profile?.streak_days ?? 0,
    pomodoro_sessions: totalPomodoro,
    level,
    xp_total: xp,
  });

  const pct = allBadges.length ? Math.round((earnedMap.size / allBadges.length) * 100) : 0;

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="size-6 text-amber-500" /> Conquistas
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {earnedMap.size} / {allBadges.length} desbloqueadas · {pct}% completo
        </p>
      </div>

      {/* Overall progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold">Progresso geral</span>
          <span className="text-sm font-bold text-primary">{pct}%</span>
        </div>
        <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>

        {/* Rarity breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
          {(["common","rare","epic","legendary","mythic"] as ExtendedRarity[]).map((r) => {
            const total = allBadges.filter((b) => b.rarity === r).length;
            const got = [...earnedMap.keys()].filter((id) => {
              const b = allBadges.find((b) => b.id === id);
              return b?.rarity === r;
            }).length;
            const rs = RARITY_STYLES[r];
            return (
              <div
                key={r}
                className={cn("p-2 rounded-lg border text-center", rs.border, rs.bg)}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: rs.color }}>
                  {rs.label}
                </p>
                <p className="text-base font-bold">{got}<span className="text-xs text-muted-foreground">/{total}</span></p>
              </div>
            );
          })}
        </div>
      </Card>

      <ProgressionRoadmap xp={xp} />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all",
                filter === c.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              <Icon className="size-3" /> {c.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Earned */}
      {earned.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Desbloqueadas ({earned.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <AnimatePresence>
              {earned.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <BadgeCard
                    badge={badge}
                    earnedAt={earnedMap.get(badge.id)}
                    currentProgress={stats[badge.condition_type] ?? 0}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Bloqueadas ({locked.length})
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {locked.map((badge, i) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <BadgeCard
                  badge={badge}
                  earnedAt={undefined}
                  currentProgress={stats[badge.condition_type] ?? 0}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeCard({ badge, earnedAt, currentProgress }: {
  badge: any;
  earnedAt?: string;
  currentProgress: number;
}) {
  const earned = !!earnedAt;
  const rarity = (badge.rarity ?? "common") as ExtendedRarity;
  const rs = RARITY_STYLES[rarity];

  const progress = Math.min(1, currentProgress / badge.condition_value);
  const progressPct = Math.round(progress * 100);

  return (
    <div
      className={cn(
        "rounded-xl p-4 border space-y-2 transition-all relative overflow-hidden",
        earned
          ? cn("bg-card shadow-sm hover:shadow-md hover:-translate-y-0.5", rs.border, rs.glow && `shadow-lg ${rs.glow}`)
          : "border-border/50 bg-muted/20",
      )}
    >
      {/* Shimmer for legendary/mythic earned */}
      {earned && (rarity === "legendary" || rarity === "mythic") && (
        <div
          className="absolute inset-0 shimmer-sweep pointer-events-none"
          style={{ background: `linear-gradient(105deg, transparent 40%, ${rs.color}15 50%, transparent 60%)` }}
        />
      )}

      <div className={cn("text-3xl", !earned && "grayscale opacity-40")}>
        {badge.icon}
      </div>

      <div>
        <p className={cn("text-xs font-bold leading-tight", !earned && "text-muted-foreground")}>
          {badge.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
          {badge.description}
        </p>
      </div>

      <span
        className="inline-block text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
        style={{ color: rs.color, background: `${rs.color}22` }}
      >
        {rs.label}
      </span>

      {earned && earnedAt ? (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Trophy className="size-3 text-amber-500" />
          {format(new Date(earnedAt), "dd MMM yyyy", { locale: ptBR })}
        </p>
      ) : (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{currentProgress} / {badge.condition_value} {CONDITION_LABELS[badge.condition_type] ?? ""}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: rs.color,
              }}
            />
          </div>
        </div>
      )}

      {!earned && (
        <div className="absolute top-2 right-2">
          <Lock className="size-3 text-muted-foreground/50" />
        </div>
      )}
    </div>
  );
}
