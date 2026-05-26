import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAllTasks, useEvents, usePomodoroSessions, useProfile, useInvalidate, priorityMeta } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ProgressionRoadmap } from "@/components/gamification/progression-roadmap";
import { MentalDesk } from "@/components/dashboard/mental-desk";
import { CheckCircle2, Clock, ListTodo, AlertCircle, Flame, Calendar as CalIcon, Gift } from "lucide-react";
import { format, isToday, startOfDay, differenceInCalendarDays, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  dailyActiveTimeQueryKey,
  getDailyActiveTodayKey,
  persistDailyActiveSeconds,
  readLocalSeconds,
  useDailyActiveSeconds,
} from "@/components/dashboard/daily-active-time-tracker";

type DailyMission = {
  key: "complete_3_tasks" | "focus_50_minutes" | "clear_overdue";
  label: string;
  icon: string;
  current: number;
  target: number;
  reward: string;
  unit?: "count" | "seconds";
};

function formatMissionTimer(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60).toString().padStart(2, "0");
  const secs = (safe % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

function localDateKey(value: string | Date | null | undefined) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)) {
    return value.slice(0, 10);
  }
  return format(new Date(value), "yyyy-MM-dd");
}

function isSameLocalDay(value: string | Date | null | undefined, dayKey: string) {
  return localDateKey(value) === dayKey;
}

function taskDayLabel(value: string | Date | null | undefined, fallback = "Hoje") {
  if (!value) return fallback;
  if (typeof value === "string" && (/^\d{4}-\d{2}-\d{2}$/.test(value) || /T00:00:00(?:\.000)?Z$/.test(value))) {
    return fallback;
  }
  return format(new Date(value), "HH:mm");
}

export function DashboardView() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: tasks = [] } = useAllTasks();
  const { data: events = [] } = useEvents();
  const { data: sessions = [] } = usePomodoroSessions();
  const inv = useInvalidate();
  const qc = useQueryClient();
  const [claiming, setClaiming] = useState<string | null>(null);
  const todayKey = getDailyActiveTodayKey();
  const { data: activeSecondsToday } = useDailyActiveSeconds(user?.id, todayKey);
  const resolvedActiveSecondsToday = activeSecondsToday ?? (user?.id ? readLocalSeconds(user.id, todayKey) : 0);

  const { data: claimedMissionKeys = [] } = useQuery({
    queryKey: ["daily-mission-claims", user?.id ?? "", todayKey],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("daily_mission_claims")
        .select("mission_key")
        .eq("user_id", user!.id)
        .eq("mission_date", todayKey);
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01" || /daily_mission_claims/i.test(error.message)) return [];
        throw error;
      }
      return (data ?? []).map((row: { mission_key: string }) => row.mission_key);
    },
  });

  const stats = useMemo(() => {
    const now = new Date();

    const pending = tasks.filter((t) => t.status !== "done").length;
    const completedToday = tasks.filter((t) => t.status === "done" && isSameLocalDay(t.completed_at ?? t.updated_at, todayKey)).length;
    const overdue = tasks.filter((t) => {
      const dueKey = localDateKey(t.due_date);
      return dueKey != null && t.status !== "done" && dueKey < todayKey;
    }).length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const todayStart = startOfDay(now);

    // streak: consecutive days with at least one completed focus session
    const focusDays = new Set(
      sessions.filter((s) => s.kind === "focus" && s.ended_at).map((s) => format(new Date(s.started_at), "yyyy-MM-dd")),
    );
    let streak = 0;
    for (let i = 0; i < 60; i++) {
      const d = format(subDays(now, i), "yyyy-MM-dd");
      if (focusDays.has(d)) streak++;
      else if (i > 0) break;
    }

    const focusSecondsToday = sessions
      .filter((s) => s.kind === "focus" && new Date(s.started_at) >= todayStart)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
    const focusMinutesToday = Math.floor(focusSecondsToday / 60);

    return { pending, completedToday, overdue, inProgress, streak, focusMinutesToday, focusSecondsToday };
  }, [tasks, sessions, todayKey]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => new Date(e.starts_at) >= now)
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))
      .slice(0, 6);
  }, [events]);

  const todayScheduleByTaskId = useMemo(() => {
    const map = new Map<string, (typeof events)[number]>();
    const todayTaskEvents = events
      .filter((e) => e.type === "task" && e.task_id && isSameLocalDay(e.starts_at, todayKey))
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));

    for (const event of todayTaskEvents) {
      if (event.task_id && !map.has(event.task_id)) map.set(event.task_id, event);
    }

    return map;
  }, [events, todayKey]);

  const todays = useMemo(() => {
    return tasks
      .filter((t) => {
        const plannedFor = (t as typeof t & { planned_for?: string | null }).planned_for;
        const plannedToday = isSameLocalDay(plannedFor, todayKey);
        const dueToday = isSameLocalDay(t.due_date, todayKey);
        const scheduledToday = todayScheduleByTaskId.has(t.id);
        return (plannedToday || dueToday || scheduledToday) && t.status !== "done";
      })
      .sort((a, b) => {
        const aSchedule = todayScheduleByTaskId.get(a.id);
        const bSchedule = todayScheduleByTaskId.get(b.id);
        const aDue = aSchedule ? +new Date(aSchedule.starts_at) : a.due_date ? +new Date(a.due_date) : Number.MAX_SAFE_INTEGER;
        const bDue = bSchedule ? +new Date(bSchedule.starts_at) : b.due_date ? +new Date(b.due_date) : Number.MAX_SAFE_INTEGER;
        return aDue - bDue;
      })
      .slice(0, 6);
  }, [tasks, todayKey, todayScheduleByTaskId]);

  const overdueBacklog = useMemo(() => {
    return tasks
      .filter((t) => {
        const dueKey = localDateKey(t.due_date);
        return dueKey != null && dueKey < todayKey && t.status !== "done";
      })
      .sort((a, b) => (localDateKey(a.due_date) ?? "").localeCompare(localDateKey(b.due_date) ?? ""))
      .slice(0, 6);
  }, [tasks, todayKey]);

  const recent = useMemo(() => {
    return [...tasks]
      .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
      .slice(0, 5);
  }, [tasks]);

  const claimedSet = new Set(claimedMissionKeys);
  const liveFocusSecondsToday = Math.min(50 * 60, resolvedActiveSecondsToday);

  const dailyMissions: DailyMission[] = [
    { key: "complete_3_tasks", label: "Concluir 3 tarefas", icon: "📋", current: stats.completedToday, target: 3, reward: "+30 moedas" },
    { key: "focus_50_minutes", label: "Focar 50 minutos", icon: "🍅", current: liveFocusSecondsToday, target: 50 * 60, reward: "+50 XP", unit: "seconds" },
    {
      key: "clear_overdue",
      label: "Zerar atrasadas",
      icon: "🚀",
      current: stats.overdue === 0 && stats.completedToday > 0 ? 1 : 0,
      target: 1,
      reward: "+25 XP e +15 moedas",
    },
  ];

  const claimMission = async (mission: DailyMission) => {
    if (!user) return;
    const complete = mission.current >= mission.target;
    if (!complete || claimedSet.has(mission.key)) return;
    setClaiming(mission.key);
    try {
      if (mission.key === "focus_50_minutes") {
        const focusSecondsForClaim = Math.max(resolvedActiveSecondsToday, stats.focusSecondsToday, mission.target);
        await persistDailyActiveSeconds(user.id, todayKey, focusSecondsForClaim);
        qc.setQueryData(dailyActiveTimeQueryKey(user.id, todayKey), focusSecondsForClaim);
      }
    } catch (error) {
      setClaiming(null);
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar o tempo de foco.");
      return;
    }
    const { data, error } = await (supabase as any).rpc("claim_daily_mission", { p_mission_key: mission.key });
    setClaiming(null);
    if (error) {
      if (error.code === "42883" || /claim_daily_mission|daily_mission/i.test(error.message)) {
        toast.error("Execute a migration de missões diárias no Supabase para habilitar o resgate.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    const reward = Array.isArray(data) ? data[0] : null;
    const xp = reward?.xp_reward ?? 0;
    const coins = reward?.coins_reward ?? 0;
    toast.success("Missão resgatada!", {
      description: `${xp > 0 ? `+${xp} XP` : ""}${xp > 0 && coins > 0 ? " • " : ""}${coins > 0 ? `+${coins} moedas` : ""}`,
    });
    inv.profile();
    qc.invalidateQueries({ queryKey: ["daily-mission-claims", user.id, todayKey] });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bom dia 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pendentes" value={stats.pending} icon={ListTodo} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard label="Concluídas hoje" value={stats.completedToday} icon={CheckCircle2} color="text-emerald-500" bg="bg-emerald-500/10" />
        <StatCard label="Atrasadas" value={stats.overdue} icon={AlertCircle} color="text-red-500" bg="bg-red-500/10" />
        <StatCard label="Em andamento" value={stats.inProgress} icon={Clock} color="text-amber-500" bg="bg-amber-500/10" />
      </div>

      <ProgressionRoadmap xp={profile?.xp ?? 0} compact />

      {user && <MentalDesk userId={user.id} />}

      {overdueBacklog.length > 0 && (
        <Card className="border-red-500/25 bg-red-500/5 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-lg bg-red-500/10 text-red-500">
                <AlertCircle className="size-4" />
              </div>
              <div>
                <h2 className="font-semibold">Backlog de atrasadas</h2>
                <p className="text-xs text-muted-foreground">Tarefas vencidas que precisam voltar para o radar.</p>
              </div>
            </div>
            <Link to="/board" className="text-xs text-primary hover:underline">Abrir Kanban</Link>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {overdueBacklog.map((t) => {
              const dueKey = localDateKey(t.due_date);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-red-500/15 bg-background/60 p-2.5">
                  <span className="size-2 rounded-full" style={{ background: priorityMeta[t.priority].color }} />
                  <span className="min-w-0 flex-1 truncate text-sm">{t.title}</span>
                  <span className="shrink-0 text-xs font-medium text-red-500">
                    {dueKey ? format(new Date(`${dueKey}T12:00:00`), "d MMM", { locale: ptBR }) : "Atrasada"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Missões de hoje</h2>
            <p className="text-xs text-muted-foreground">Objetivos rápidos com recompensa real e resgate único por dia.</p>
          </div>
          <Link to="/achievements" className="text-xs text-primary hover:underline">Ver conquistas</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {dailyMissions.map((mission) => {
            const progress = Math.min(1, mission.current / mission.target);
            const complete = progress >= 1;
            const claimed = claimedSet.has(mission.key);
            const ready = complete && !claimed;
            const isTimeMission = mission.unit === "seconds";
            const remainingSeconds = isTimeMission ? Math.max(0, mission.target - mission.current) : 0;
            const statusLabel = claimed ? "Concluída" : ready ? "Aguardando resgate" : "Em progresso";
            const statusClass = claimed
              ? "text-emerald-500"
              : ready
                ? "text-amber-500"
                : "text-muted-foreground";
            return (
              <div
                key={mission.label}
                className={cn(
                  "rounded-xl border p-3 flex flex-col gap-3 transition-colors",
                  claimed
                    ? "border-emerald-500/35 bg-emerald-500/10"
                    : "border-border bg-muted/20",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xl">{claimed ? "✅" : mission.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{mission.label}</p>
                      <p className="text-[10px] text-muted-foreground">{mission.reward}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn("block text-xs font-bold", statusClass)}>{statusLabel}</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {isTimeMission
                        ? `${Math.floor(Math.min(mission.current, mission.target) / 60)}/${Math.floor(mission.target / 60)} min`
                        : `${Math.min(mission.current, mission.target)}/${mission.target}`}
                    </span>
                  </div>
                </div>
                {isTimeMission && !claimed && (
                  <div className="flex items-center justify-between rounded-lg border bg-background/45 px-3 py-2 text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5" />
                      Tempo restante
                    </span>
                    <span className={cn("font-bold tabular-nums", ready ? "text-amber-500" : "text-foreground")}>
                      {ready ? "00:00" : formatMissionTimer(remainingSeconds)}
                    </span>
                  </div>
                )}
                <div className="h-2 rounded-full bg-background overflow-hidden">
                  <div
                    className={claimed ? "h-full rounded-full bg-emerald-500" : "h-full rounded-full bg-primary/50"}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <Button
                  size="sm"
                  variant={claimed ? "secondary" : "outline"}
                  className={cn(
                    "h-8 w-full gap-1.5 text-xs",
                    ready && "border-amber-500/45 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
                  )}
                  disabled={!complete || claimed || claiming === mission.key}
                  onClick={() => claimMission(mission)}
                >
                  {claimed ? <CheckCircle2 className="size-3.5" /> : <Gift className="size-3.5" />}
                  {claimed ? "Concluída" : claiming === mission.key ? "Resgatando..." : ready ? "Resgatar recompensa" : "Em progresso"}
                </Button>
                {mission.key === "clear_overdue" && !ready && !claimed && (
                  <p className="text-[10px] text-muted-foreground">
                    Requer 0 atrasadas e pelo menos 1 tarefa concluída hoje.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Para hoje</h2>
            <Link to="/board" className="text-xs text-primary hover:underline">Ver tudo</Link>
          </div>
          <div className="space-y-2">
            {todays.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Nada vencendo hoje. Aproveite ✨</p>}
            {todays.map((t) => {
              const scheduled = todayScheduleByTaskId.get(t.id);
              return (
                <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent">
                  <span className="size-2 rounded-full" style={{ background: priorityMeta[t.priority].color }} />
                  <span className="text-sm flex-1">{t.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {scheduled ? taskDayLabel(scheduled.starts_at) : taskDayLabel(t.due_date)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="size-4 text-orange-500" />
            <h2 className="font-semibold text-sm">Produtividade</h2>
          </div>
          <div className="text-center py-3">
            <div className="text-4xl font-bold">{stats.streak}</div>
            <div className="text-xs text-muted-foreground mt-1">dias seguidos com foco</div>
          </div>
          <div className="text-center text-xs text-muted-foreground border-t pt-3 mt-3">
            <span className="font-medium text-foreground">{stats.focusMinutesToday}</span> min focado hoje
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Próximos compromissos</h2>
            <Link to="/calendar" className="text-xs text-primary hover:underline">Ver calendário</Link>
          </div>
          <div className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground py-6 text-center">Sem compromissos agendados.</p>}
            {upcoming.map((e) => {
              const start = new Date(e.starts_at);
              const dayLabel = isToday(start) ? "Hoje" : differenceInCalendarDays(start, new Date()) === 1 ? "Amanhã" : format(start, "d MMM", { locale: ptBR });
              return (
                <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-accent">
                  <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center">
                    <CalIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{dayLabel} • {format(start, "HH:mm")}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 text-sm">Calendário</h2>
          <Calendar mode="single" selected={new Date()} className="rounded-md" />
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="font-semibold mb-3">Atividades recentes</h2>
        <div className="space-y-2">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-3 text-sm py-1.5">
              <span className="size-2 rounded-full" style={{ background: priorityMeta[t.priority].color }} />
              <span className="flex-1 truncate">{t.title}</span>
              <span className="text-xs text-muted-foreground">{format(new Date(t.updated_at), "d MMM HH:mm", { locale: ptBR })}</span>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Crie sua primeira tarefa para começar.</p>}
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }: { label: string; value: number; icon: any; color: string; bg: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className={`size-9 rounded-lg grid place-items-center ${bg}`}>
          <Icon className={`size-4 ${color}`} />
        </div>
      </div>
    </Card>
  );
}