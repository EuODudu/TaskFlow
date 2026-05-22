import { create } from "zustand";
import { persist } from "zustand/middleware";

type UIState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
};

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),
    }),
    { name: "tf-ui", partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, selectedProjectId: s.selectedProjectId }) }
  )
);

type PomoKind = "focus" | "short_break" | "long_break";

type PersistedPomodoroState = Partial<{
  running: boolean;
  kind: PomoKind;
  endsAt: number | null;
  remaining: number;
  focusStartedAt: number | null;
  taskId: string | null;
  cyclesCompleted: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  soundEnabled: boolean;
}>;

function readPomodoroSnapshot(): PersistedPomodoroState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem("tf-pomodoro");
    if (!raw) return {};

    const parsed = JSON.parse(raw) as { state?: PersistedPomodoroState };
    const state = parsed.state ?? {};
    const validKind = state.kind === "focus" || state.kind === "short_break" || state.kind === "long_break";

    return {
      ...state,
      kind: validKind ? state.kind : undefined,
      remaining: typeof state.remaining === "number" && state.remaining > 0 ? state.remaining : undefined,
    };
  } catch {
    return {};
  }
}

type PomodoroState = {
  running: boolean;
  kind: PomoKind;
  endsAt: number | null;        // epoch ms
  remaining: number;            // seconds (refreshed each tick)
  focusStartedAt: number | null; // epoch ms when current focus session started
  completedFocusSession: {
    id: number;
    taskId: string | null;
    startedAt: number;
    durationSeconds: number;
  } | null;
  taskId: string | null;
  cyclesCompleted: number;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  soundEnabled: boolean;
  start: (kind?: PomoKind, taskId?: string | null) => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  setSettings: (s: Partial<Pick<PomodoroState, "focusMinutes" | "shortBreakMinutes" | "longBreakMinutes" | "soundEnabled">>) => void;
  setTaskId: (id: string | null) => void;
  next: (completedNaturally?: boolean) => void;
};

export const usePomodoro = create<PomodoroState>()(
  persist(
    (set, get) => {
      const saved = readPomodoroSnapshot();
      const focusMinutes = saved.focusMinutes ?? 25;
      const shortBreakMinutes = saved.shortBreakMinutes ?? 5;
      const longBreakMinutes = saved.longBreakMinutes ?? 15;
      const kind = saved.kind ?? "focus";
      const defaultRemaining = (kind === "focus" ? focusMinutes : kind === "short_break" ? shortBreakMinutes : longBreakMinutes) * 60;

      return {
        running: saved.running ?? false,
        kind,
        endsAt: saved.endsAt ?? null,
        remaining: saved.remaining ?? defaultRemaining,
        focusStartedAt: saved.focusStartedAt ?? null,
        completedFocusSession: null,
        taskId: saved.taskId ?? null,
        cyclesCompleted: saved.cyclesCompleted ?? 0,
        focusMinutes,
        shortBreakMinutes,
        longBreakMinutes,
        soundEnabled: saved.soundEnabled ?? true,
        start: (kind, taskId) => {
          const s = get();
          const k = kind ?? s.kind;
          const mins = k === "focus" ? s.focusMinutes : k === "short_break" ? s.shortBreakMinutes : s.longBreakMinutes;
          const fullSeconds = mins * 60;
          const seconds = s.kind === k && s.remaining > 0 && s.remaining < fullSeconds ? s.remaining : fullSeconds;
          set({
            running: true,
            kind: k,
            taskId: taskId ?? s.taskId,
            endsAt: Date.now() + seconds * 1000,
            remaining: seconds,
            // Track when focus session starts; keep existing value when resuming the same session
            focusStartedAt: k === "focus" && s.focusStartedAt === null ? Date.now() : s.focusStartedAt,
          });
        },
        pause: () => {
          const s = get();
          if (!s.running) return;
          set({ running: false, endsAt: null });
        },
        reset: () => {
          const s = get();
          const mins = s.kind === "focus" ? s.focusMinutes : s.kind === "short_break" ? s.shortBreakMinutes : s.longBreakMinutes;
          set({ running: false, endsAt: null, remaining: mins * 60, focusStartedAt: null });
        },
        tick: () => {
          const s = get();
          if (!s.running) return;
          if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
          const rem = Math.max(0, s.remaining - 1);
          if (rem <= 0) {
            get().next(true);
          } else {
            set({ remaining: rem });
          }
        },
        next: (completedNaturally = false) => {
          const s = get();
          if (s.soundEnabled && typeof window !== "undefined") {
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.frequency.value = 880;
              osc.connect(gain); gain.connect(ctx.destination);
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
              osc.start(); osc.stop(ctx.currentTime + 0.6);
            } catch {}
          }
          if (s.kind === "focus") {
            const nextCycles = completedNaturally ? s.cyclesCompleted + 1 : s.cyclesCompleted;
            const nextKind: PomoKind = completedNaturally && nextCycles % 4 === 0 ? "long_break" : "short_break";
            const mins = nextKind === "short_break" ? s.shortBreakMinutes : s.longBreakMinutes;
            set({
              kind: nextKind,
              cyclesCompleted: nextCycles,
              running: false,
              endsAt: null,
              remaining: mins * 60,
              focusStartedAt: null,
              completedFocusSession: completedNaturally
                ? {
                    id: Date.now(),
                    taskId: s.taskId,
                    startedAt: s.focusStartedAt ?? Date.now() - s.focusMinutes * 60 * 1000,
                    durationSeconds: s.focusMinutes * 60,
                  }
                : s.completedFocusSession,
            });
          } else {
            set({ kind: "focus", running: false, endsAt: null, remaining: s.focusMinutes * 60 });
          }
        },
        setSettings: (p) => set(p),
        setTaskId: (id) => set({ taskId: id }),
      };
    },
    {
      name: "tf-pomodoro",
      partialize: (s) => ({
        running: s.running,
        kind: s.kind,
        endsAt: s.endsAt,
        remaining: s.remaining,
        focusStartedAt: s.focusStartedAt,
        taskId: s.taskId,
        cyclesCompleted: s.cyclesCompleted,
        focusMinutes: s.focusMinutes,
        shortBreakMinutes: s.shortBreakMinutes,
        longBreakMinutes: s.longBreakMinutes,
        soundEnabled: s.soundEnabled,
      }),
    }
  )
);