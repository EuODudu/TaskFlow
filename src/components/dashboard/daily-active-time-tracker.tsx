import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

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

  const { error } = await (supabase as any)
    .from("daily_active_time")
    .upsert({
      user_id: userId,
      activity_date: todayKey,
      active_seconds: safeSeconds,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,activity_date" });

  if (error && error.code !== "PGRST205" && error.code !== "42P01" && !/daily_active_time/i.test(error.message)) {
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
      const { data, error } = await (supabase as any)
        .from("daily_active_time")
        .select("active_seconds")
        .eq("user_id", userId!)
        .eq("activity_date", todayKey)
        .maybeSingle();

      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01" || /daily_active_time/i.test(error.message)) {
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
  const [ready, setReady] = useState(false);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!user) {
      setReady(false);
      hasHydratedRef.current = false;
      return;
    }

    const key = dailyActiveTimeQueryKey(user.id, todayKey);
    const cached = qc.getQueryData<number>(key);
    const localSeconds = readLocalSeconds(user.id, todayKey);
    const resolved = Math.max(localSeconds, cached ?? 0, data);

    activeSecondsRef.current = resolved;
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

    let ticksSincePersist = 0;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;

      activeSecondsRef.current += 1;
      ticksSincePersist += 1;
      syncCache(activeSecondsRef.current);

      if (ticksSincePersist >= 10) {
        ticksSincePersist = 0;
        persist();
      }
    }, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        writeLocalSeconds(user.id, todayKey, activeSecondsRef.current);
        persist();
      }
    };

    const handlePageHide = () => {
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
        writeLocalSeconds(user.id, todayKey, activeSecondsRef.current);
        persist();
      }
    };
  }, [qc, ready, todayKey, user]);

  return null;
}
