import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import type { PostgrestError } from "@supabase/supabase-js";

type DailyActiveTimeRow = {
  active_seconds: number | null;
};

type DailyActiveTimeSelectBuilder = {
  eq(column: "user_id" | "activity_date", value: string): DailyActiveTimeSelectBuilder;
  maybeSingle(): Promise<{ data: DailyActiveTimeRow | null; error: PostgrestError | null }>;
};

type DailyActiveTimeTable = {
  upsert(
    values: {
      user_id: string;
      activity_date: string;
      active_seconds: number;
      updated_at: string;
    },
    options: { onConflict: string },
  ): Promise<{ error: PostgrestError | null }>;
  select(columns: "active_seconds"): DailyActiveTimeSelectBuilder;
};

function dailyActiveTimeTable() {
  return (supabase as unknown as { from(table: "daily_active_time"): DailyActiveTimeTable }).from(
    "daily_active_time",
  );
}

export function getDailyActiveTodayKey() {
  return format(new Date(), "yyyy-MM-dd");
}

export function dailyActiveTimeQueryKey(userId: string | undefined, todayKey: string) {
  return ["daily-active-time", userId ?? "", todayKey] as const;
}

function localKey(userId: string, todayKey: string) {
  return `orbit-daily-active-time:${userId}:${todayKey}`;
}

export function readLocalSeconds(userId: string, todayKey: string) {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(localKey(userId, todayKey));
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function writeLocalSeconds(userId: string, todayKey: string, seconds: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(localKey(userId, todayKey), String(Math.max(0, Math.floor(seconds))));
}

function resolveActiveSeconds(userId: string, todayKey: string, remote?: number | null) {
  return Math.max(readLocalSeconds(userId, todayKey), remote ?? 0);
}

export async function persistDailyActiveSeconds(userId: string, todayKey: string, seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  writeLocalSeconds(userId, todayKey, safeSeconds);

  const { error } = await dailyActiveTimeTable().upsert(
    {
      user_id: userId,
      activity_date: todayKey,
      active_seconds: safeSeconds,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,activity_date" },
  );

  if (
    error &&
    error.code !== "PGRST205" &&
    error.code !== "42P01" &&
    !/daily_active_time/i.test(error.message)
  ) {
    throw error;
  }
}

export function useDailyActiveSeconds(userId: string | undefined, todayKey: string) {
  return useQuery({
    queryKey: dailyActiveTimeQueryKey(userId, todayKey),
    enabled: !!userId,
    staleTime: 5000,
    initialData: () => (userId ? readLocalSeconds(userId, todayKey) : 0),
    queryFn: async () => {
      const { data, error } = await dailyActiveTimeTable()
        .select("active_seconds")
        .eq("user_id", userId!)
        .eq("activity_date", todayKey)
        .maybeSingle();

      if (error) {
        if (
          error.code === "PGRST205" ||
          error.code === "42P01" ||
          /daily_active_time/i.test(error.message)
        ) {
          return readLocalSeconds(userId!, todayKey);
        }
        throw error;
      }

      const resolved = resolveActiveSeconds(userId!, todayKey, data?.active_seconds);
      writeLocalSeconds(userId!, todayKey, resolved);
      return resolved;
    },
  });
}

export function DailyActiveTimeTracker() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const todayKey = getDailyActiveTodayKey();
  const { data = 0 } = useDailyActiveSeconds(user?.id, todayKey);
  const activeSecondsRef = useRef(0);
  const lastTickAtRef = useRef<number | null>(null);
  const pendingMsRef = useRef(0);
  const [ready, setReady] = useState(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setReady(false);
      hasHydratedRef.current = false;
      lastTickAtRef.current = null;
      pendingMsRef.current = 0;
      return;
    }

    const key = dailyActiveTimeQueryKey(user.id, todayKey);
    const cached = qc.getQueryData<number>(key);
    const localSeconds = readLocalSeconds(user.id, todayKey);
    const resolved = Math.max(localSeconds, cached ?? 0, data);

    activeSecondsRef.current = resolved;
    lastTickAtRef.current = Date.now();
    pendingMsRef.current = 0;
    writeLocalSeconds(user.id, todayKey, resolved);
    qc.setQueryData(key, resolved);
    hasHydratedRef.current = true;
    setReady(true);
  }, [data, qc, todayKey, user]);

  useEffect(() => {
    if (!user || !ready || !hasHydratedRef.current) return;

    const key = dailyActiveTimeQueryKey(user.id, todayKey);

    const syncCache = (seconds: number) => {
      writeLocalSeconds(user.id, todayKey, seconds);
      qc.setQueryData(key, seconds);
    };

    const persist = () => {
      void persistDailyActiveSeconds(user.id, todayKey, activeSecondsRef.current);
    };

    const advanceToNow = (now = Date.now()) => {
      const previous = lastTickAtRef.current ?? now;
      lastTickAtRef.current = now;

      const deltaMs = Math.max(0, now - previous);
      if (deltaMs === 0) return 0;

      pendingMsRef.current += deltaMs;
      const addedSeconds = Math.floor(pendingMsRef.current / 1000);
      if (addedSeconds === 0) return 0;

      pendingMsRef.current %= 1000;
      activeSecondsRef.current += addedSeconds;
      syncCache(activeSecondsRef.current);
      return addedSeconds;
    };

    let ticksSincePersist = 0;
    const id = window.setInterval(() => {
      ticksSincePersist += advanceToNow();

      if (ticksSincePersist >= 10) {
        ticksSincePersist = 0;
        persist();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        advanceToNow();
        writeLocalSeconds(user.id, todayKey, activeSecondsRef.current);
        persist();
      }
    };

    const handlePageHide = () => {
      advanceToNow();
      writeLocalSeconds(user.id, todayKey, activeSecondsRef.current);
      persist();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      if (hasHydratedRef.current) {
        advanceToNow();
        writeLocalSeconds(user.id, todayKey, activeSecondsRef.current);
        persist();
      }
    };
  }, [qc, ready, todayKey, user]);

  return null;
}
