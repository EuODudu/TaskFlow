export type OfficeTheme = {
  slug: string;
  name: string;
  wall: string;
  floor: string;
  accent: string;
  trim: string;
  window: string;
  glow: string;
  surface: string;
  shadow: string;
  ambient: string;
  particle: string;
};

export const OFFICE_THEMES: Record<string, OfficeTheme> = {
  office_theme_classic: {
    slug: "office_theme_classic",
    name: "Clássico Produtivo",
    wall: "radial-gradient(circle at 22% 18%, #ffffffb8 0 9%, transparent 30%), linear-gradient(180deg, #dbeafe 0%, #eff6ff 58%, #bfdbfe 100%)",
    floor: "linear-gradient(160deg, #b98145 0 12%, #8b5a2b 12% 24%, #a66b35 24% 36%, #75401f 36% 48%, #b98145 48% 60%, #8b5a2b 60% 72%, #a66b35 72% 84%, #75401f 84% 100%)",
    accent: "#2563eb",
    trim: "#1e3a8a",
    window: "#93c5fd",
    glow: "#60a5fa",
    surface: "#eff6ff",
    shadow: "#172554",
    ambient: "#bfdbfe",
    particle: "#ffffff",
  },
  office_theme_minimal: {
    slug: "office_theme_minimal",
    name: "Minimalista Branco",
    wall: "radial-gradient(circle at 74% 18%, #ffffff 0 12%, transparent 30%), linear-gradient(180deg, #ffffff 0%, #f1f5f9 54%, #dbe3ee 100%)",
    floor: "linear-gradient(160deg, #cbd5e1 0 16%, #edf2f7 16% 32%, #d3dce8 32% 48%, #f8fafc 48% 64%, #cbd5e1 64% 80%, #e2e8f0 80% 100%)",
    accent: "#64748b",
    trim: "#334155",
    window: "#bae6fd",
    glow: "#94a3b8",
    surface: "#ffffff",
    shadow: "#1e293b",
    ambient: "#e2e8f0",
    particle: "#f8fafc",
  },
  office_theme_neon: {
    slug: "office_theme_neon",
    name: "Neon Gamer",
    wall: "radial-gradient(circle at 20% 20%, #7c3aed88, transparent 28%), radial-gradient(circle at 82% 18%, #22d3ee55, transparent 24%), linear-gradient(180deg, #111827 0%, #1e1b4b 100%)",
    floor: "linear-gradient(160deg, #020617 0 12%, #111827 12% 24%, #1e1b4b 24% 36%, #0f172a 36% 48%, #111827 48% 60%, #312e81 60% 72%, #020617 72% 84%, #111827 84% 100%)",
    accent: "#a855f7",
    trim: "#22d3ee",
    window: "#312e81",
    glow: "#22d3ee",
    surface: "#111827",
    shadow: "#020617",
    ambient: "#7c3aed",
    particle: "#67e8f9",
  },
  office_theme_nature: {
    slug: "office_theme_nature",
    name: "Natureza Zen",
    wall: "radial-gradient(circle at 18% 16%, #ecfccb99, transparent 28%), linear-gradient(180deg, #dcfce7 0%, #bbf7d0 55%, #86efac 100%)",
    floor: "linear-gradient(160deg, #365314 0 14%, #4d7c0f 14% 28%, #3f6212 28% 42%, #65a30d 42% 56%, #365314 56% 70%, #4d7c0f 70% 84%, #3f6212 84% 100%)",
    accent: "#16a34a",
    trim: "#166534",
    window: "#7dd3fc",
    glow: "#86efac",
    surface: "#ecfccb",
    shadow: "#14532d",
    ambient: "#bbf7d0",
    particle: "#dcfce7",
  },
  office_theme_luxury: {
    slug: "office_theme_luxury",
    name: "Executivo Luxo",
    wall: "radial-gradient(circle at 80% 15%, #facc1570, transparent 24%), radial-gradient(circle at 18% 28%, #fed7aa33, transparent 25%), linear-gradient(180deg, #451a03 0%, #78350f 100%)",
    floor: "linear-gradient(160deg, #422006 0 16%, #713f12 16% 32%, #92400e 32% 48%, #451a03 48% 64%, #713f12 64% 80%, #422006 80% 100%)",
    accent: "#f59e0b",
    trim: "#facc15",
    window: "#fed7aa",
    glow: "#fbbf24",
    surface: "#78350f",
    shadow: "#1c0f02",
    ambient: "#f59e0b",
    particle: "#fde68a",
  },
  office_theme_space: {
    slug: "office_theme_space",
    name: "Espacial Cósmico",
    wall: "radial-gradient(circle at 18% 24%, #f8fafc 0 1px, transparent 2px), radial-gradient(circle at 72% 18%, #c4b5fd 0 2px, transparent 3px), radial-gradient(circle at 45% 42%, #67e8f9 0 1px, transparent 2px), radial-gradient(circle at 78% 35%, #8b5cf655, transparent 30%), linear-gradient(180deg, #020617 0%, #1e1b4b 100%)",
    floor: "linear-gradient(160deg, #020617 0 14%, #111827 14% 28%, #1e1b4b 28% 42%, #312e81 42% 56%, #020617 56% 70%, #111827 70% 84%, #1e1b4b 84% 100%)",
    accent: "#8b5cf6",
    trim: "#67e8f9",
    window: "#0f172a",
    glow: "#a78bfa",
    surface: "#111827",
    shadow: "#020617",
    ambient: "#8b5cf6",
    particle: "#c4b5fd",
  },
  office_theme_industrial: {
    slug: "office_theme_industrial",
    name: "Café Industrial",
    wall: "radial-gradient(circle at 85% 18%, #f59e0b55, transparent 22%), linear-gradient(180deg, #57534e 0%, #292524 100%)",
    floor: "linear-gradient(160deg, #1c1917 0 14%, #292524 14% 28%, #3f3f46 28% 42%, #44403c 42% 56%, #1c1917 56% 70%, #292524 70% 84%, #3f3f46 84% 100%)",
    accent: "#f97316",
    trim: "#fed7aa",
    window: "#fb923c",
    glow: "#fdba74",
    surface: "#44403c",
    shadow: "#0c0a09",
    ambient: "#f97316",
    particle: "#fed7aa",
  },
  office_theme_ocean: {
    slug: "office_theme_ocean",
    name: "Oceano Profundo",
    wall: "radial-gradient(circle at 22% 28%, #67e8f975, transparent 26%), radial-gradient(circle at 80% 14%, #bae6fd44, transparent 22%), linear-gradient(180deg, #0c4a6e 0%, #082f49 100%)",
    floor: "linear-gradient(160deg, #082f49 0 14%, #0c4a6e 14% 28%, #075985 28% 42%, #0369a1 42% 56%, #082f49 56% 70%, #0c4a6e 70% 84%, #075985 84% 100%)",
    accent: "#06b6d4",
    trim: "#bae6fd",
    window: "#7dd3fc",
    glow: "#22d3ee",
    surface: "#0e7490",
    shadow: "#031c2c",
    ambient: "#06b6d4",
    particle: "#a5f3fc",
  },
  office_theme_aurora: {
    slug: "office_theme_aurora",
    name: "Aurora Criativa",
    wall: "radial-gradient(circle at 18% 18%, #f472b675, transparent 26%), radial-gradient(circle at 82% 24%, #22d3ee70, transparent 28%), radial-gradient(circle at 52% 10%, #f0abfc44, transparent 28%), linear-gradient(180deg, #581c87 0%, #831843 100%)",
    floor: "linear-gradient(160deg, #581c87 0 14%, #7e22ce 14% 28%, #be185d 28% 42%, #db2777 42% 56%, #581c87 56% 70%, #7e22ce 70% 84%, #be185d 84% 100%)",
    accent: "#ec4899",
    trim: "#f0abfc",
    window: "#a5f3fc",
    glow: "#f9a8d4",
    surface: "#86198f",
    shadow: "#2e1065",
    ambient: "#ec4899",
    particle: "#fbcfe8",
  },
  office_theme_cyber_exec: {
    slug: "office_theme_cyber_exec",
    name: "Cyberpunk Executivo",
    wall: "linear-gradient(90deg, #22d3ee18 1px, transparent 1px), radial-gradient(circle at 72% 20%, #fde04744, transparent 24%), linear-gradient(180deg, #020617 0%, #111827 100%)",
    floor: "linear-gradient(160deg, #020617 0 12%, #111827 12% 24%, #0f172a 24% 36%, #164e63 36% 48%, #020617 48% 60%, #111827 60% 72%, #0f172a 72% 84%, #164e63 84% 100%)",
    accent: "#22d3ee",
    trim: "#facc15",
    window: "#0891b2",
    glow: "#fde047",
    surface: "#0f172a",
    shadow: "#020617",
    ambient: "#22d3ee",
    particle: "#fef08a",
  },
};

export const DEFAULT_OFFICE_THEME = OFFICE_THEMES.office_theme_classic;

export function getOfficeTheme(slug?: string | null) {
  return (slug && OFFICE_THEMES[slug]) || DEFAULT_OFFICE_THEME;
}
