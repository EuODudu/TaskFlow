import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { useAllTasks, useEvents, type CalendarEvent } from "@/lib/queries";
import { useTaskSoundNotifications } from "@/lib/stores";

const CHECK_INTERVAL_MS = 30_000;
const STORAGE_KEY = "tf-task-sound-notifications-fired";
const MS_PER_MINUTE = 60_000;

type AlertKind = "start" | "end";

let audioContext: AudioContext | null = null;

function readFiredKeys() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}

function persistFiredKeys(keys: Set<string>) {
  if (typeof window === "undefined") return;
  const recent = Array.from(keys).slice(-300);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
}

function unlockAudio() {
  if (typeof window === "undefined") return;
  try {
    audioContext ??= new window.AudioContext();
    void audioContext.resume();
  } catch {
    // Browsers can still block audio until a user gesture; toast remains as fallback.
  }
}

function playAlertSound(kind: AlertKind) {
  if (typeof window === "undefined") return;
  try {
    audioContext ??= new window.AudioContext();
    void audioContext.resume();

    const ctx = audioContext;
    const now = ctx.currentTime;
    const notes = kind === "start" ? [660, 880] : [880, 660, 520];

    notes.forEach((frequency, index) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      const startsAt = now + index * 0.14;

      oscillator.type = kind === "start" ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.001, startsAt);
      gain.gain.exponentialRampToValueAtTime(0.14, startsAt + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startsAt + 0.18);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.2);
    });
  } catch {
    // Keep notification flow silent if Web Audio is unavailable.
  }
}

function alertKey(event: CalendarEvent, kind: AlertKind) {
  const timestamp = kind === "start" ? event.starts_at : event.ends_at;
  return `${kind}:${event.id}:${timestamp}`;
}

export function TaskSoundNotifier() {
  const { user } = useAuth();
  const { enabled, startLeadMinutes, endLeadMinutes } = useTaskSoundNotifications();
  const shouldWatch = enabled && !!user;
  const { data: events = [] } = useEvents(shouldWatch);
  const { data: tasks = [] } = useAllTasks(shouldWatch);
  const firedKeysRef = useRef<Set<string>>(readFiredKeys());

  const activeTaskIds = useMemo(() => {
    return new Set(tasks.filter((task) => task.status !== "done" && !task.archived_at).map((task) => task.id));
  }, [tasks]);

  useEffect(() => {
    if (!enabled || !user) return;
    window.addEventListener("pointerdown", unlockAudio, { once: true });
    window.addEventListener("keydown", unlockAudio, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled || !user) return;

    const checkAlerts = () => {
      const now = Date.now();
      const startLeadMs = Math.max(1, startLeadMinutes) * MS_PER_MINUTE;
      const endLeadMs = Math.max(1, endLeadMinutes) * MS_PER_MINUTE;

      for (const event of events) {
        if (event.type !== "task" || !event.task_id || !activeTaskIds.has(event.task_id)) continue;
        const startsAt = new Date(event.starts_at).getTime();
        const endsAt = new Date(event.ends_at).getTime();
        if (!Number.isFinite(startsAt) || !Number.isFinite(endsAt)) continue;

        const untilStart = startsAt - now;
        const untilEnd = endsAt - now;

        if (untilStart > 0 && untilStart <= startLeadMs) {
          const key = alertKey(event, "start");
          if (!firedKeysRef.current.has(key)) {
            firedKeysRef.current.add(key);
            persistFiredKeys(firedKeysRef.current);
            playAlertSound("start");
            toast.info("Tarefa quase começando", {
              description: `${event.title} começa em ${Math.max(1, Math.ceil(untilStart / MS_PER_MINUTE))} min.`,
              duration: 7000,
            });
          }
        }

        if (now >= startsAt && untilEnd > 0 && untilEnd <= endLeadMs) {
          const key = alertKey(event, "end");
          if (!firedKeysRef.current.has(key)) {
            firedKeysRef.current.add(key);
            persistFiredKeys(firedKeysRef.current);
            playAlertSound("end");
            toast.warning("Tarefa perto do fim", {
              description: `${event.title} termina em ${Math.max(1, Math.ceil(untilEnd / MS_PER_MINUTE))} min.`,
              duration: 8000,
            });
          }
        }
      }
    };

    checkAlerts();
    const interval = window.setInterval(checkAlerts, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [activeTaskIds, enabled, endLeadMinutes, events, startLeadMinutes, user]);

  return null;
}
