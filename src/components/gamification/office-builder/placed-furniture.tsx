import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { RotateCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FurnitureSVG } from "../furniture-sprites";
import { RARITY_STYLES, type ExtendedRarity } from "../rarity-frame";
import {
  CELL_SIZE,
  getPlacementZone,
  getRotatedItemSize,
  isSurfaceItem,
  type PlacedItem,
} from "../office-layout";

type PlacedFurnitureProps = {
  placed: PlacedItem;
  isEditing: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onRotate: () => void;
};

export function PlacedFurniture({
  placed,
  isEditing,
  isSelected,
  onSelect,
  onRemove,
  onRotate,
}: PlacedFurnitureProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    disabled: !isEditing,
  });

  const rarity = (placed.item.rarity ?? "common") as ExtendedRarity;
  const rs = RARITY_STYLES[rarity];
  const { w: gw, h: gh } = getRotatedItemSize(placed.item, placed.rotation);
  const zone = getPlacementZone(placed.item);
  const spriteScale = zone === "surface" ? 0.9 : zone === "wall" || zone === "lighting" ? 0.94 : 1;

  const style = {
    position: "absolute" as const,
    left: placed.x * CELL_SIZE,
    top: placed.y * CELL_SIZE,
    width: gw * CELL_SIZE,
    height: gh * CELL_SIZE,
    transform: CSS.Translate.toString(transform),
    rotate: `${placed.rotation}deg`,
    zIndex: isDragging ? 1000 : isSelected ? 10 : 1,
    transition: isDragging ? "none" : "left 0.15s, top 0.15s",
  };

  return (
    <div
      ref={setNodeRef}
      data-draggable-furniture
      style={style}
      className={cn(
        "group pointer-events-auto flex items-center justify-center rounded-lg overflow-visible",
        isEditing && "cursor-grab active:cursor-grabbing",
        isSelected && !isDragging && cn("ring-2 ring-offset-1", rs.border),
        isDragging && "opacity-50",
      )}
      onClick={isEditing ? onSelect : undefined}
      {...(isEditing ? { ...listeners, ...attributes } : {})}
    >
      <div className="absolute bottom-1 left-1/2 h-4 w-4/5 -translate-x-1/2 rounded-full bg-black/25 blur-md" />
      <div
        className="absolute inset-1 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ boxShadow: `0 0 24px ${rs.color}33` }}
      />
      <FurnitureSVG item={placed.item} size={Math.min(gw, gh) * CELL_SIZE * spriteScale - 6} />

      {isEditing && isSelected && !isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          <button
            type="button"
            className="size-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg hover:bg-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            title="Rotacionar"
          >
            <RotateCw className="size-3" />
          </button>
          <button
            type="button"
            className="size-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remover"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      )}

      {(rarity === "legendary" || rarity === "mythic") && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ boxShadow: `0 0 12px ${rs.color}50` }}
        />
      )}
    </div>
  );
}

export function DragGhostFurniture({ placed }: { placed: PlacedItem }) {
  const { w: gw, h: gh } = getRotatedItemSize(placed.item, placed.rotation);
  const size = isSurfaceItem(placed.item) ? CELL_SIZE * 0.9 : Math.min(gw, gh) * CELL_SIZE - 6;
  return (
    <div className="opacity-80">
      <FurnitureSVG item={placed.item} size={size} />
    </div>
  );
}
