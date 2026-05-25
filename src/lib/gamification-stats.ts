/** Mapeia condition_type legado do banco para as chaves usadas no app. */
const BADGE_CONDITION_ALIASES: Record<string, string> = {
  tasks_done: "tasks_completed",
  pomodoros_done: "pomodoro_sessions",
  tasks_early: "early_deliveries",
  level_reached: "level",
};

export function resolveBadgeProgress(
  conditionType: string,
  stats: Record<string, number>,
): number {
  const key = BADGE_CONDITION_ALIASES[conditionType] ?? conditionType;
  return stats[key] ?? 0;
}

export function withLegacyBadgeStats(stats: Record<string, number>): Record<string, number> {
  return {
    ...stats,
    tasks_done: stats.tasks_completed ?? 0,
    pomodoros_done: stats.pomodoro_sessions ?? 0,
    tasks_early: stats.early_deliveries ?? 0,
    level_reached: stats.level ?? 0,
  };
}
