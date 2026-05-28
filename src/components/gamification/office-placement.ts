import type { AvatarItem } from "@/lib/queries";
import {
  GRID_COLS,
  GRID_ROWS,
  OFFICE_WALL_ROWS,
  getPlacementZone,
  getRotatedItemSize,
  isFloorCell,
  isFloorPlacedItem,
  isRugItem,
  isSurfaceHost,
  isSurfaceItem,
  isWallCell,
  isWallDecorItem,
  type PlacedItem,
  type PlacementZone,
} from "./office-layout";

export function buildOccupiedCells(placedItems: PlacedItem[], exceptId?: string) {
  const cells = new Set<string>();
  for (const p of placedItems) {
    if (p.id === exceptId) continue;
    const { w, h } = getRotatedItemSize(p.item, p.rotation);
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        cells.add(`${p.x + dx}-${p.y + dy}`);
      }
    }
  }
  return cells;
}

function getSupportSurfaceHostId(
  placedItems: PlacedItem[],
  item: AvatarItem,
  x: number,
  y: number,
  rotation: number,
  exceptId?: string,
) {
  if (!isSurfaceItem(item)) return null;
  const { w, h } = getRotatedItemSize(item, rotation);
  for (const p of placedItems) {
    if (p.id === exceptId) continue;
    if (!isFloorPlacedItem(p.item) || isRugItem(p.item) || !isSurfaceHost(p.item)) continue;
    const { w: gw, h: gh } = getRotatedItemSize(p.item, p.rotation);
    const containsX = x >= p.x && x + w <= p.x + gw;
    const containsY = y >= p.y && y + h <= p.y + gh;
    if (containsX && containsY) return p.id;
  }
  return null;
}

function isCellBlockedByZone(
  placedItems: PlacedItem[],
  zone: PlacementZone,
  x: number,
  y: number,
  exceptId?: string,
) {
  for (const p of placedItems) {
    if (p.id === exceptId) continue;
    const otherZone = getPlacementZone(p.item);
    const { w: gw, h: gh } = getRotatedItemSize(p.item, p.rotation);
    const coversCell = x >= p.x && x < p.x + gw && y >= p.y && y < p.y + gh;
    if (!coversCell) continue;

    if (zone === "surface") {
      if (otherZone === "surface") return true;
      continue;
    }
    if (zone === "rug") {
      if (otherZone === "rug" || otherZone === "wall" || otherZone === "lighting") return true;
      continue;
    }
    if (zone === "flooring") {
      if (otherZone === "flooring" || otherZone === "rug") return true;
      continue;
    }
    if (zone === "wallpaper") {
      if (otherZone === "wallpaper" || otherZone === "wall") return true;
      continue;
    }
    if (zone === "lighting") {
      if (otherZone === "lighting" || otherZone === "wall") return true;
      continue;
    }
    if (zone === "floor") {
      if (
        otherZone === "floor" ||
        otherZone === "wall" ||
        otherZone === "lighting" ||
        otherZone === "wallpaper"
      )
        return true;
      continue;
    }
    if (zone === "wall") {
      if (otherZone === "wall" || otherZone === "wallpaper" || otherZone === "lighting")
        return true;
    }
  }
  return false;
}

export function canPlaceAt(
  placedItems: PlacedItem[],
  item: AvatarItem,
  x: number,
  y: number,
  rotation = 0,
  exceptId?: string,
): boolean {
  const { w, h } = getRotatedItemSize(item, rotation);
  const zone = getPlacementZone(item);
  const wallDecor = zone === "wall" || zone === "wallpaper" || zone === "lighting";

  if (x < 0 || x + w > GRID_COLS) return false;
  if (wallDecor || zone === "wallpaper") {
    if (y < 0 || y + h > OFFICE_WALL_ROWS) return false;
  } else if (y < OFFICE_WALL_ROWS || y + h > GRID_ROWS) {
    return false;
  }

  for (let dx = 0; dx < w; dx++) {
    for (let dy = 0; dy < h; dy++) {
      const cx = x + dx;
      const cy = y + dy;
      const validCell = wallDecor || zone === "wallpaper" ? isWallCell(cy) : isFloorCell(cx, cy);
      if (!validCell || isCellBlockedByZone(placedItems, zone, cx, cy, exceptId)) return false;
    }
  }

  if (zone === "surface" && !getSupportSurfaceHostId(placedItems, item, x, y, rotation, exceptId))
    return false;

  return true;
}

export function findFirstPlacement(
  placedItems: PlacedItem[],
  item: AvatarItem,
  rotation = 0,
): { x: number; y: number } | null {
  const { w, h } = getRotatedItemSize(item, rotation);
  const zone = getPlacementZone(item);
  const wallDecor = isWallDecorItem(item) || zone === "wallpaper" || zone === "lighting";
  const startY = wallDecor ? 0 : OFFICE_WALL_ROWS;
  const endY = wallDecor ? OFFICE_WALL_ROWS - h : GRID_ROWS - h;

  for (let y = startY; y <= endY; y++) {
    for (let x = 0; x <= GRID_COLS - w; x++) {
      if (canPlaceAt(placedItems, item, x, y, rotation)) return { x, y };
    }
  }
  return null;
}

export function getPlacementErrorMessage(item: AvatarItem) {
  const zone = getPlacementZone(item);
  if (zone === "surface") return "Esse item precisa ficar sobre uma mesa ou bancada.";
  if (zone === "wall" || zone === "lighting") return "Esse item só pode ficar na parede!";
  if (zone === "wallpaper") return "Papel de parede só na área da parede.";
  if (zone === "flooring") return "Revestimento só no piso.";
  return "Móveis só podem ficar no piso!";
}

export function canRotateInPlace(placed: PlacedItem, placedItems: PlacedItem[]) {
  const newRot = (placed.rotation + 90) % 360;
  return canPlaceAt(placedItems, placed.item, placed.x, placed.y, newRot, placed.id);
}
