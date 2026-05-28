import type { AvatarItem } from "@/lib/queries";

export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const CELL_SIZE = 64;
export const OFFICE_WALL_ROWS = 3;
export const OFFICE_FLOOR_ROWS = GRID_ROWS - OFFICE_WALL_ROWS;

export type PlacementZone = "floor" | "wall" | "surface" | "rug";

const LEGACY_WALL_SLUGS = new Set([
  "office_board",
  "office_whiteboard",
  "office_chandelier",
  "office_painting",
]);

const TABLE_SLUG_HINTS = ["desk", "table", "bench", "workstation", "console"];

function itemData(item: AvatarItem) {
  return item as AvatarItem & {
    grid_w?: number;
    grid_h?: number;
    placement_zone?: PlacementZone | null;
    surface_only?: boolean | null;
  };
}

export function getItemSize(item: AvatarItem) {
  const data = itemData(item);
  return {
    w: Math.max(1, data.grid_w ?? 1),
    h: Math.max(1, data.grid_h ?? 1),
  };
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
  if (item.slug.startsWith("office_wall_") || LEGACY_WALL_SLUGS.has(item.slug)) return "wall";
  if (item.slug.includes("rug")) return "rug";
  return "floor";
}

export function isSurfaceItem(item: AvatarItem) {
  return getPlacementZone(item) === "surface";
}

export function isWallDecorItem(item: AvatarItem) {
  return getPlacementZone(item) === "wall";
}

export function isRugItem(item: AvatarItem) {
  return getPlacementZone(item) === "rug";
}

export function isFloorPlacedItem(item: AvatarItem) {
  const zone = getPlacementZone(item);
  return zone === "floor" || zone === "rug";
}

export function canItemUseSurface(item: AvatarItem) {
  const data = itemData(item);
  return data.surface_only === true || getPlacementZone(item) === "surface";
}

export function isSurfaceHost(item: AvatarItem) {
  const slug = item.slug.toLowerCase();
  return TABLE_SLUG_HINTS.some((hint) => slug.includes(hint));
}
