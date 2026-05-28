import type { AvatarItem } from "@/lib/queries";

/** Sala maior estilo My Dream Setup */
export const GRID_COLS = 16;
export const GRID_ROWS = 10;
export const CELL_SIZE = 56;
export const OFFICE_WALL_ROWS = 3;
export const OFFICE_FLOOR_ROWS = GRID_ROWS - OFFICE_WALL_ROWS;

export const MIN_ZOOM = 0.45;
export const MAX_ZOOM = 1.35;
export const DEFAULT_ZOOM = 0.72;
export const ZOOM_STEP = 0.08;

export const ROOM_WIDTH_PX = GRID_COLS * CELL_SIZE;
export const ROOM_HEIGHT_PX = GRID_ROWS * CELL_SIZE;
export const WALL_HEIGHT_PX = OFFICE_WALL_ROWS * CELL_SIZE;

export type PlacementZone =
  | "floor"
  | "wall"
  | "surface"
  | "rug"
  | "flooring"
  | "wallpaper"
  | "lighting";

export type DecorStyle = "minimal" | "gamer" | "cozy" | "tech" | "nature";

export const DECOR_STYLES: { id: DecorStyle | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "minimal", label: "Minimal" },
  { id: "gamer", label: "Gamer" },
  { id: "cozy", label: "Aconchego" },
  { id: "tech", label: "Tech" },
  { id: "nature", label: "Natureza" },
];

export const PLACEMENT_ZONE_LABELS: Record<PlacementZone, string> = {
  floor: "piso",
  wall: "parede",
  surface: "mesa",
  rug: "tapete",
  flooring: "piso (overlay)",
  wallpaper: "parede (fundo)",
  lighting: "iluminação",
};

const LEGACY_WALL_SLUGS = new Set([
  "office_board",
  "office_whiteboard",
  "office_chandelier",
  "office_painting",
]);

const TABLE_SLUG_HINTS = ["desk", "table", "bench", "workstation", "console"];

const SLUG_ZONE_FALLBACK: Record<string, PlacementZone> = {
  office_rug: "rug",
  office_rgb_strip: "lighting",
  office_floor_lamp: "lighting",
  office_ceiling_light: "lighting",
  office_wall_sconce: "lighting",
  office_flooring_wood: "flooring",
  office_flooring_marble: "flooring",
  office_flooring_carpet: "flooring",
  office_wallpaper_brick: "wallpaper",
  office_wallpaper_neon: "wallpaper",
  office_wallpaper_plants: "wallpaper",
};

const SLUG_STYLE_FALLBACK: Record<string, DecorStyle> = {
  office_gaming: "gamer",
  office_arcade: "gamer",
  office_rgb_strip: "gamer",
  office_wall_neon_sign: "gamer",
  office_wallpaper_neon: "gamer",
  office_theme_neon: "gamer",
  office_sofa: "cozy",
  office_rug: "cozy",
  office_minibar: "cozy",
  office_flooring_carpet: "cozy",
  office_plant: "nature",
  office_table_plant: "nature",
  office_wallpaper_plants: "nature",
  office_theme_nature: "nature",
  office_monitor: "tech",
  office_laptop: "tech",
  office_keyboard: "tech",
  office_hologram: "tech",
  office_robot_helper: "tech",
  office_desk: "minimal",
  office_theme_minimal: "minimal",
  office_whiteboard: "minimal",
};

export type PlacedItem = {
  id: string;
  item: AvatarItem;
  x: number;
  y: number;
  rotation: number;
};

function itemData(item: AvatarItem) {
  return item as AvatarItem & {
    grid_w?: number;
    grid_h?: number;
    placement_zone?: PlacementZone | null;
    surface_only?: boolean | null;
    decor_style?: DecorStyle | null;
  };
}

export function getBaseItemSize(item: AvatarItem) {
  const data = itemData(item);
  return {
    w: Math.max(1, data.grid_w ?? 1),
    h: Math.max(1, data.grid_h ?? 1),
  };
}

/** Footprint na grade considerando rotação (90°/270° troca largura e altura). */
export function getRotatedItemSize(item: AvatarItem, rotation: number) {
  const { w, h } = getBaseItemSize(item);
  const rot = ((rotation % 360) + 360) % 360;
  if (rot === 90 || rot === 270) return { w: h, h: w };
  return { w, h };
}

/** @deprecated use getRotatedItemSize */
export function getItemSize(item: AvatarItem, rotation = 0) {
  return getRotatedItemSize(item, rotation);
}

export function isWallCell(y: number) {
  return y < OFFICE_WALL_ROWS;
}

export function isFloorCell(x: number, y: number) {
  return x >= 0 && x < GRID_COLS && y >= OFFICE_WALL_ROWS && y < GRID_ROWS;
}

export function getPlacementZone(item: AvatarItem): PlacementZone {
  const data = itemData(item);
  if (data.placement_zone) return data.placement_zone;
  if (SLUG_ZONE_FALLBACK[item.slug]) return SLUG_ZONE_FALLBACK[item.slug];
  if (item.slug.startsWith("office_wall_") || LEGACY_WALL_SLUGS.has(item.slug)) return "wall";
  if (item.slug.includes("rug")) return "rug";
  if (item.slug.includes("flooring")) return "flooring";
  if (item.slug.includes("wallpaper")) return "wallpaper";
  return "floor";
}

export function getDecorStyle(item: AvatarItem): DecorStyle | null {
  const data = itemData(item);
  if (data.decor_style) return data.decor_style;
  return SLUG_STYLE_FALLBACK[item.slug] ?? null;
}

export function matchesDecorFilter(item: AvatarItem, filter: DecorStyle | "all") {
  if (filter === "all") return true;
  const style = getDecorStyle(item);
  return style === filter || style === null;
}

export function isSurfaceItem(item: AvatarItem) {
  return getPlacementZone(item) === "surface";
}

export function isWallDecorItem(item: AvatarItem) {
  const zone = getPlacementZone(item);
  return zone === "wall" || zone === "wallpaper" || zone === "lighting";
}

export function isRugItem(item: AvatarItem) {
  return getPlacementZone(item) === "rug";
}

export function isFlooringItem(item: AvatarItem) {
  return getPlacementZone(item) === "flooring";
}

export function isWallpaperItem(item: AvatarItem) {
  return getPlacementZone(item) === "wallpaper";
}

export function isLightingItem(item: AvatarItem) {
  return getPlacementZone(item) === "lighting";
}

export function isFloorPlacedItem(item: AvatarItem) {
  const zone = getPlacementZone(item);
  return zone === "floor" || zone === "rug" || zone === "flooring";
}

export function canItemUseSurface(item: AvatarItem) {
  const data = itemData(item);
  return data.surface_only === true || getPlacementZone(item) === "surface";
}

export function isSurfaceHost(item: AvatarItem) {
  const slug = item.slug.toLowerCase();
  return TABLE_SLUG_HINTS.some((hint) => slug.includes(hint));
}

export function getRenderLayer(placed: PlacedItem) {
  const zone = getPlacementZone(placed.item);
  if (zone === "wallpaper") return 0;
  if (zone === "wall" || zone === "lighting") return 1;
  if (zone === "rug" || zone === "flooring") return 2;
  if (zone === "floor") return 3;
  if (zone === "surface") return 4;
  return 3;
}

export function clampZoom(zoom: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function clampPan(pan: { x: number; y: number }, zoom: number) {
  const maxX = ROOM_WIDTH_PX * zoom * 0.35;
  const maxY = ROOM_HEIGHT_PX * zoom * 0.35;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}
