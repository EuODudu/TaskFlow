// XP needed to START each level (index = level - 1)
export const LEVEL_XP_THRESHOLDS = [
  0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100,
  5000, 6000, 7100, 8300, 9600, 11000, 12500, 14100, 15800, 17600,
  19500, 21500, 23600, 25800, 28100, 30500, 33000, 35600, 38300, 41100,
] as const;

export const MAX_LEVEL = 100;

export type Rank = {
  title: string;
  minLevel: number;
  color: string;
  bg: string;
  emoji: string;
};

export const RANKS: Rank[] = [
  { title: "Estagiário",              minLevel: 1,  color: "#94a3b8", bg: "bg-slate-500/15",   emoji: "🌱" },
  { title: "Assistente",              minLevel: 3,  color: "#64748b", bg: "bg-slate-600/15",   emoji: "📋" },
  { title: "Analista Júnior",         minLevel: 5,  color: "#3b82f6", bg: "bg-blue-500/15",    emoji: "💼" },
  { title: "Analista Pleno",          minLevel: 8,  color: "#6366f1", bg: "bg-indigo-500/15",  emoji: "🔷" },
  { title: "Analista Sênior",         minLevel: 11, color: "#8b5cf6", bg: "bg-violet-500/15",  emoji: "⚡" },
  { title: "Especialista",            minLevel: 14, color: "#f59e0b", bg: "bg-amber-500/15",   emoji: "⭐" },
  { title: "Coordenador",             minLevel: 17, color: "#ef4444", bg: "bg-red-500/15",     emoji: "🔥" },
  { title: "Gerente Estratégico",     minLevel: 20, color: "#10b981", bg: "bg-emerald-500/15", emoji: "👑" },
  { title: "Mestre da Produtividade", minLevel: 25, color: "#ec4899", bg: "bg-pink-500/15",    emoji: "🏆" },
  { title: "Lenda Operacional",       minLevel: 35, color: "#06b6d4", bg: "bg-cyan-500/15",    emoji: "💎" },
  { title: "Arquiteto do Foco",       minLevel: 50, color: "#a855f7", bg: "bg-purple-500/15",  emoji: "🔮" },
  { title: "Titã da Execução",        minLevel: 75, color: "#f97316", bg: "bg-orange-500/15",  emoji: "🐉" },
  { title: "Ícone da Produtividade",  minLevel: 100,color: "#facc15", bg: "bg-yellow-500/15",  emoji: "🌟" },
];

export type ProgressionMilestone = {
  level: number;
  title: string;
  reward: string;
  icon: string;
  rarity: BadgeRarity;
  category: "skin" | "outfit" | "office" | "badge" | "feature";
};

export const PROGRESSION_MILESTONES: ProgressionMilestone[] = [
  { level: 5,   title: "Primeiro salto",       reward: "Roupas raras e escritório básico",          icon: "💼", rarity: "common",    category: "outfit" },
  { level: 10,  title: "Foco especializado",   reward: "Skins raras e Operações Sombra",            icon: "🥷", rarity: "rare",      category: "skin" },
  { level: 15,  title: "Estilo avançado",      reward: "Temas raros e roupas neon",                 icon: "⚡", rarity: "rare",      category: "office" },
  { level: 20,  title: "Classe lendária",      reward: "Biohacker, Diamante e móveis lendários",    icon: "🧬", rarity: "legendary", category: "skin" },
  { level: 25,  title: "Coleção mítica",       reward: "Galáxia Real e visuais cósmicos",            icon: "🪐", rarity: "mythic",    category: "outfit" },
  { level: 30,  title: "Entusiasta supremo",   reward: "Skin mítica Entusiasta da Produtividade",   icon: "🏁", rarity: "mythic",    category: "skin" },
  { level: 40,  title: "Prestígio visual",     reward: "Coleções exclusivas de escritório",          icon: "🏢", rarity: "legendary", category: "office" },
  { level: 50,  title: "Arquiteto do foco",    reward: "Título e aura de progressão",                icon: "🔮", rarity: "legendary", category: "badge" },
  { level: 75,  title: "Titã da execução",     reward: "Itens de prestígio e coleção dragão",        icon: "🐉", rarity: "mythic",    category: "skin" },
  { level: 100, title: "Ícone da produtividade", reward: "Marco máximo, selo e progresso completo", icon: "🌟", rarity: "mythic",    category: "badge" },
];

export function getLevelFromXP(xp: number): number {
  for (let level = MAX_LEVEL; level >= 1; level--) {
    if (xp >= getXPForLevel(level)) return level;
  }
  return 1;
}

export function getRankFromLevel(level: number): Rank {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) rank = r;
    else break;
  }
  return rank;
}

export function getXPForLevel(level: number): number {
  const safeLevel = Math.min(Math.max(1, level), MAX_LEVEL);
  if (safeLevel <= LEVEL_XP_THRESHOLDS.length) return LEVEL_XP_THRESHOLDS[safeLevel - 1];

  let xp = LEVEL_XP_THRESHOLDS[LEVEL_XP_THRESHOLDS.length - 1];
  for (let currentLevel = LEVEL_XP_THRESHOLDS.length + 1; currentLevel <= safeLevel; currentLevel++) {
    xp += 2900 + (currentLevel - 31) * 100;
  }
  return xp;
}

export function getXPForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return getXPForLevel(MAX_LEVEL);
  return getXPForLevel(level + 1);
}

export function getLevelProgress(xp: number): number {
  const level = getLevelFromXP(xp);
  if (level >= MAX_LEVEL) return 1;
  const current = getXPForLevel(level);
  const next = getXPForNextLevel(level);
  return Math.min(1, (xp - current) / (next - current));
}

export function getNextMilestone(level: number): ProgressionMilestone | null {
  return PROGRESSION_MILESTONES.find((milestone) => milestone.level > level) ?? null;
}

export function getMilestoneProgress(level: number): number {
  const next = getNextMilestone(level);
  if (!next) return 1;

  const previous = [...PROGRESSION_MILESTONES].reverse().find((milestone) => milestone.level <= level);
  const start = previous?.level ?? 1;
  return Math.min(1, Math.max(0, (level - start) / (next.level - start)));
}

export const XP_REWARDS = {
  TASK_COMPLETED: 50,
  TASK_EARLY: 25,
  POMODORO_SESSION: 10,
} as const;

export const COIN_REWARDS = {
  TASK_COMPLETED: 10,
  TASK_EARLY: 5,
  POMODORO_SESSION: 2,
} as const;

export type BadgeRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY_META: Record<BadgeRarity, { label: string; color: string; border: string; glow: string }> = {
  common:    { label: "Comum",    color: "#94a3b8", border: "border-slate-400/50",  glow: "" },
  rare:      { label: "Raro",     color: "#3b82f6", border: "border-blue-400/60",   glow: "shadow-blue-500/20" },
  epic:      { label: "Épico",    color: "#a855f7", border: "border-purple-400/60", glow: "shadow-purple-500/20" },
  legendary: { label: "Lendário", color: "#f59e0b", border: "border-amber-400/70",  glow: "shadow-amber-500/30" },
  mythic:    { label: "Mítico",   color: "#ec4899", border: "border-pink-400/80",   glow: "shadow-pink-500/40" },
};

export const AVATAR_BG_COLORS = [
  { label: "Índigo",    value: "#6366f1" },
  { label: "Esmeralda", value: "#10b981" },
  { label: "Rosa",      value: "#ec4899" },
  { label: "Âmbar",     value: "#f59e0b" },
  { label: "Vermelho",  value: "#ef4444" },
  { label: "Ciano",     value: "#06b6d4" },
  { label: "Slate",     value: "#64748b" },
  { label: "Violeta",   value: "#8b5cf6" },
];

export function formatXP(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}k`;
  return String(n);
}
