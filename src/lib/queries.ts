import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { getLevelFromXP } from "@/lib/gamification";
import { resolveBadgeProgress } from "@/lib/gamification-stats";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type BoardColumn = Database["public"]["Tables"]["board_columns"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type ChecklistItem = Database["public"]["Tables"]["checklist_items"]["Row"];
export type CalendarEvent = Database["public"]["Tables"]["calendar_events"]["Row"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Badge = Database["public"]["Tables"]["badges"]["Row"];
export type UserBadge = Database["public"]["Tables"]["user_badges"]["Row"];
export type AvatarItem = Database["public"]["Tables"]["avatar_items"]["Row"];
export type UserAvatar = Database["public"]["Tables"]["user_avatar"]["Row"];
export type XpEvent = Database["public"]["Tables"]["xp_events"]["Row"];
export type MentalNoteRow = Database["public"]["Tables"]["mental_notes"]["Row"];

export type LeaderboardEntry = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  xp: number;
  coins: number;
  streak_days: number;
  tasks_completed: number;
  rank_position: number;
  total_users: number;
  face_emoji: string;
  bg_color: string;
  accessory_emoji: string | null;
  pet_emoji: string | null;
  skin_tone: string | null;
  hair_color: string | null;
  hair_style: string | null;
  clothes_color: string | null;
  accessory_head: string | null;
  accessory_face: string | null;
  accessory_back: string | null;
  accessory_hand: string | null;
  accessory_chest: string | null;
  aura_emoji: string | null;
  pose: string | null;
};

export const qk = {
  projects: ["projects"] as const,
  columns: (projectId: string) => ["columns", projectId] as const,
  tasks: (projectId: string) => ["tasks", projectId] as const,
  allTasks: ["tasks", "all"] as const,
  events: ["events"] as const,
  tags: ["tags"] as const,
  profile: ["profile"] as const,
  checklist: (taskId: string) => ["checklist", taskId] as const,
  activity: (taskId: string) => ["activity", taskId] as const,
  pomodoroSessions: ["pomodoro-sessions"] as const,
  mentalNotes: (userId: string) => ["mental-notes", userId] as const,
};

export function useProjects() {
  return useQuery({
    queryKey: qk.projects,
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").is("archived_at", null).order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useColumns(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.columns(projectId ?? ""),
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase.from("board_columns").select("*").eq("project_id", projectId!).order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.tasks(projectId ?? ""),
    enabled: !!projectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId!)
        .is("archived_at", null)
        .order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAllTasks(enabled = true) {
  return useQuery({
    queryKey: qk.allTasks,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("tasks").select("*").is("archived_at", null).order("due_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useEvents(enabled = true) {
  return useQuery({
    queryKey: qk.events,
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase.from("calendar_events").select("*").order("starts_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTaskSchedule(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-schedule", taskId ?? ""],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("task_id", taskId!)
        .eq("type", "task")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: qk.profile,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useChecklist(taskId: string | undefined) {
  return useQuery({
    queryKey: qk.checklist(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase.from("checklist_items").select("*").eq("task_id", taskId!).order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActivity(taskId: string | undefined) {
  return useQuery({
    queryKey: qk.activity(taskId ?? ""),
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activity")
        .select("*")
        .eq("task_id", taskId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePomodoroSessions() {
  return useQuery({
    queryKey: qk.pomodoroSessions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pomodoro_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: qk.tags,
    queryFn: async () => {
      const { data, error } = await supabase.from("tags").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTaskTags(taskId: string | undefined) {
  return useQuery({
    queryKey: ["task-tags", taskId ?? ""],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_tags")
        .select("tag_id")
        .eq("task_id", taskId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.tag_id);
    },
  });
}

export function useInvalidate() {
  const qc = useQueryClient();
  return {
    tasks: (projectId?: string) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      if (projectId) qc.invalidateQueries({ queryKey: qk.tasks(projectId) });
    },
    columns: (projectId: string) => qc.invalidateQueries({ queryKey: qk.columns(projectId) }),
    projects: () => qc.invalidateQueries({ queryKey: qk.projects }),
    events: () => qc.invalidateQueries({ queryKey: qk.events }),
    taskSchedule: (taskId: string) => qc.invalidateQueries({ queryKey: ["task-schedule", taskId] }),
    profile: () => qc.invalidateQueries({ queryKey: qk.profile }),
    checklist: (taskId: string) => qc.invalidateQueries({ queryKey: qk.checklist(taskId) }),
    activity: (taskId: string) => qc.invalidateQueries({ queryKey: qk.activity(taskId) }),
    taskTags: (taskId: string) => qc.invalidateQueries({ queryKey: ["task-tags", taskId] }),
    tags: () => qc.invalidateQueries({ queryKey: qk.tags }),
    pomodoro: () => qc.invalidateQueries({ queryKey: qk.pomodoroSessions }),
    leaderboard: () => qc.invalidateQueries({ queryKey: ["leaderboard"] }),
    userBadges: (userId: string) => qc.invalidateQueries({ queryKey: ["user-badges", userId] }),
    userInventory: (userId: string) => qc.invalidateQueries({ queryKey: ["user-inventory", userId] }),
    userAvatar: (userId: string) => qc.invalidateQueries({ queryKey: ["user-avatar", userId] }),
    xpEvents: (userId: string) => qc.invalidateQueries({ queryKey: ["xp-events", userId] }),
    officeItems: (userId: string) => qc.invalidateQueries({ queryKey: ["office-items", userId] }),
    ownedOfficeItems: (userId: string) => qc.invalidateQueries({ queryKey: ["owned-office-items", userId] }),
    mentalNotes: (userId: string) => qc.invalidateQueries({ queryKey: qk.mentalNotes(userId) }),
    all: () => qc.invalidateQueries(),
  };
}

export function useMentalNotes(userId: string | undefined) {
  return useQuery({
    queryKey: qk.mentalNotes(userId ?? ""),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mental_notes")
        .select("*")
        .eq("user_id", userId!)
        .is("archived_at", null)
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });
      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01" || /mental_notes/i.test(error.message)) {
          return [];
        }
        throw error;
      }
      return (data ?? []) as MentalNoteRow[];
    },
  });
}

export const priorityMeta: Record<TaskPriority, { label: string; color: string }> = {
  low: { label: "Baixa", color: "#10b981" },
  medium: { label: "Média", color: "#3b82f6" },
  high: { label: "Alta", color: "#f59e0b" },
  urgent: { label: "Urgente", color: "#ef4444" },
};

// ─── Gamification queries ───────────────────────────────────────────────────

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_leaderboard");
      if (error) throw error;
      return (data ?? []) as LeaderboardEntry[];
    },
  });
}

export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("badges").select("*").order("condition_value");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-badges", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badges(*)")
        .eq("user_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAvatarItems(category?: string) {
  return useQuery({
    queryKey: ["avatar-items", category ?? "all"],
    queryFn: async () => {
      let q = supabase.from("avatar_items").select("*").order("price_coins");
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUserInventory(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-inventory", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_inventory")
        .select("item_id")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).map((r) => r.item_id);
    },
  });
}

export function useUserAvatar(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-avatar", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_avatar")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useXpEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ["xp-events", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("xp_events")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ─── Office queries ──────────────────────────────────────────────────────────

export type OfficeItem = {
  id: string;
  item_id: string;
  grid_x: number;
  grid_y: number;
  rotation: number;
  item: AvatarItem;
};

export function useOfficeItems(userId: string | undefined) {
  return useQuery({
    queryKey: ["office-items", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      // office_items table is added via migration; cast to bypass generated types
      const { data, error } = await (supabase as any)
        .from("office_items")
        .select("*, item:avatar_items(*)")
        .eq("user_id", userId!);
      if (error) {
        if ((error as any).code === "PGRST205" || /office_items/i.test(error.message)) return [];
        throw error;
      }
      return (data ?? []) as OfficeItem[];
    },
  });
}

export function useOwnedOfficeItems(userId: string | undefined) {
  return useQuery({
    queryKey: ["owned-office-items", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const [inventoryRes, defaultsRes] = await Promise.all([
        supabase
          .from("user_inventory")
          .select("item:avatar_items(*)")
          .eq("user_id", userId!),
        supabase
          .from("avatar_items")
          .select("*")
          .eq("category", "office_item")
          .eq("is_default", true),
      ]);
      if (inventoryRes.error) throw inventoryRes.error;
      if (defaultsRes.error) throw defaultsRes.error;

      const map = new Map<string, AvatarItem>();
      for (const item of defaultsRes.data ?? []) {
        map.set(item.id, item as AvatarItem);
      }
      for (const row of inventoryRes.data ?? []) {
        const item = (row as any).item as AvatarItem | null;
        if (item?.category === "office_item") map.set(item.id, item);
      }

      return Array.from(map.values());
    },
  });
}

export function useOwnedOfficeThemes(userId: string | undefined) {
  return useQuery({
    queryKey: ["owned-office-themes", userId ?? ""],
    enabled: !!userId,
    queryFn: async () => {
      const [inventoryRes, defaultsRes] = await Promise.all([
        supabase
          .from("user_inventory")
          .select("item:avatar_items(*)")
          .eq("user_id", userId!),
        supabase
          .from("avatar_items")
          .select("*")
          .eq("category", "office_theme")
          .eq("is_default", true),
      ]);
      if (inventoryRes.error) throw inventoryRes.error;
      if (defaultsRes.error) throw defaultsRes.error;

      const map = new Map<string, AvatarItem>();
      for (const item of defaultsRes.data ?? []) {
        map.set(item.id, item as AvatarItem);
      }
      for (const row of inventoryRes.data ?? []) {
        const item = (row as { item: AvatarItem | null }).item;
        if (item?.category === "office_theme") map.set(item.id, item);
      }
      return Array.from(map.values());
    },
  });
}

// ─── Badge logic ──────────────────────────────────────────────────────────────

export async function checkAndAwardBadges(
  userId: string,
): Promise<Array<{ name: string; icon: string; rarity: string }>> {
  const [badgesRes, userBadgesRes, profileRes, taskCountRes, pomodoroCountRes, earlyCountRes] =
    await Promise.all([
      supabase.from("badges").select("*"),
      supabase.from("user_badges").select("badge_id").eq("user_id", userId),
      supabase.from("profiles").select("xp, streak_days, coins").eq("id", userId).single(),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("owner_id", userId).eq("status", "done"),
      supabase.from("pomodoro_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("kind", "focus"),
      supabase.from("xp_events").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("reason", "early_delivery"),
    ]);

  const existingIds = new Set((userBadgesRes.data ?? []).map((b) => b.badge_id));
  const profile = profileRes.data;
  if (!profile) return [];

  const stats: Record<string, number> = {
    tasks_completed: taskCountRes.count ?? 0,
    early_deliveries: earlyCountRes.count ?? 0,
    streak_days: profile.streak_days,
    pomodoro_sessions: pomodoroCountRes.count ?? 0,
    level: getLevelFromXP(profile.xp),
    xp_total: profile.xp,
  };

  const newBadges: Array<{ name: string; icon: string; rarity: string }> = [];
  for (const badge of badgesRes.data ?? []) {
    if (existingIds.has(badge.id)) continue;
    const stat = resolveBadgeProgress(badge.condition_type, stats);
    if (stat >= badge.condition_value) {
      const { error } = await supabase.from("user_badges").insert({ user_id: userId, badge_id: badge.id });
      if (!error) {
        newBadges.push({ name: badge.name, icon: badge.icon, rarity: badge.rarity });
        if (badge.xp_reward > 0 || badge.coins_reward > 0) {
          await supabase.from("xp_events").insert({
            user_id: userId,
            amount: badge.xp_reward,
            reason: "badge_earned",
          });
          await supabase
            .from("profiles")
            .update({ xp: profile.xp + badge.xp_reward, coins: profile.coins + badge.coins_reward })
            .eq("id", userId);
          profile.xp += badge.xp_reward;
          profile.coins += badge.coins_reward;
        }
      }
    }
  }
  return newBadges;
}