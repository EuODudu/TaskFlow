import { useEffect, useState } from "react";
import { usePomodoro } from "@/lib/stores";
import { checkAndAwardBadges, useAllTasks, useInvalidate } from "@/lib/queries";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pause, Play, RotateCcw, SkipForward, Timer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

export function PomodoroWidget() {
  const [open, setOpen] = useState(false);
  const p = usePomodoro();
  const { user } = useAuth();
  const { data: tasks = [] } = useAllTasks();
  const inv = useInvalidate();

  useEffect(() => {
    if (!p.running) return;
    const id = setInterval(() => p.tick(), 1000);
    return () => clearInterval(id);
  }, [p.running, p]);

  // Record only naturally completed focus sessions; manual skip does not grant XP.
  useEffect(() => {
    const completed = p.completedFocusSession;
    if (!user || !completed) return;
    void (async () => {
      const { error } = await supabase.from("pomodoro_sessions").insert({
        user_id: user.id,
        task_id: completed.taskId,
        started_at: new Date(completed.startedAt).toISOString(),
        ended_at: new Date().toISOString(),
        duration_seconds: completed.durationSeconds,
        kind: "focus",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      usePomodoro.setState({ completedFocusSession: null });
      inv.pomodoro();
      inv.profile();
      toast.success("+10 XP 🍅", { description: "Sessão Pomodoro concluída!", duration: 3000 });

      const newBadges = await checkAndAwardBadges(user.id);
      newBadges.forEach((badge) =>
        toast.success(`${badge.icon} Conquista desbloqueada!`, { description: badge.name, duration: 5000 }),
      );
      if (newBadges.length > 0) inv.userBadges(user.id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.completedFocusSession?.id]);

  const total = p.kind === "focus" ? p.focusMinutes * 60 : p.kind === "short_break" ? p.shortBreakMinutes * 60 : p.longBreakMinutes * 60;
  const pct = Math.max(0, Math.min(1, (total - p.remaining) / total));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-5 right-5 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex flex-col items-center justify-center hover:scale-105 transition-transform",
          p.running && "ring-4 ring-primary/30"
        )}
      >
        {p.running ? (
          <span className="text-[10px] font-bold tabular-nums">{fmt(p.remaining)}</span>
        ) : (
          <Timer className="size-5" />
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-5 right-5 z-40 w-80 p-4 shadow-xl">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="size-4 text-primary" />
        <span className="font-semibold text-sm">Pomodoro</span>
        <span className="text-xs text-muted-foreground ml-2">Ciclos: {p.cyclesCompleted}</span>
        <Button variant="ghost" size="icon" className="size-7 ml-auto" onClick={() => setOpen(false)}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="flex gap-1 mb-3">
        {(["focus", "short_break", "long_break"] as const).map((k) => (
          <button
            key={k}
            onClick={() => { p.pause(); usePomodoro.setState({ kind: k, remaining: (k === "focus" ? p.focusMinutes : k === "short_break" ? p.shortBreakMinutes : p.longBreakMinutes) * 60, endsAt: null, focusStartedAt: null }); }}
            className={cn(
              "flex-1 text-xs py-1.5 rounded-md transition-colors",
              p.kind === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {k === "focus" ? "Foco" : k === "short_break" ? "Pausa" : "Pausa longa"}
          </button>
        ))}
      </div>

      <div className="relative grid place-items-center my-4">
        <svg className="size-40 -rotate-90">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
          <circle
            cx="80" cy="80" r="70"
            stroke="currentColor" strokeWidth="6" fill="none"
            strokeDasharray={2 * Math.PI * 70}
            strokeDashoffset={2 * Math.PI * 70 * (1 - pct)}
            strokeLinecap="round"
            className="text-primary transition-all"
          />
        </svg>
        <div className="absolute text-3xl font-bold tabular-nums">{fmt(p.remaining)}</div>
      </div>

      <div className="space-y-2">
        <Select value={p.taskId ?? "none"} onValueChange={(v) => p.setTaskId(v === "none" ? null : v)}>
          <SelectTrigger className="text-xs"><SelectValue placeholder="Vincular tarefa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem vínculo</SelectItem>
            {tasks.slice(0, 50).map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {!p.running ? (
            <Button className="flex-1" onClick={() => p.start()}><Play className="size-4 mr-1" /> Iniciar</Button>
          ) : (
            <Button className="flex-1" variant="secondary" onClick={() => p.pause()}><Pause className="size-4 mr-1" /> Pausar</Button>
          )}
          <Button variant="outline" size="icon" onClick={() => p.reset()}><RotateCcw className="size-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => p.next()}><SkipForward className="size-4" /></Button>
        </div>
      </div>
    </Card>
  );
}