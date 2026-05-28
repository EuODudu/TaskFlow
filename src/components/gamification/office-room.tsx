import { useState, useCallback } from "react";
import {
  DndContext,
  useDraggable,
  useDroppable,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit3, Check, Trash2, RotateCw, Lock, Move, Sparkles } from "lucide-react";
import { RARITY_STYLES, type ExtendedRarity } from "./rarity-frame";
import { FurnitureSVG } from "./furniture-sprites";
import { getOfficeTheme, type OfficeTheme } from "./office-themes";
import type { AvatarItem } from "@/lib/queries";
import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  OFFICE_WALL_ROWS,
  isFloorCell,
  getItemSize,
  getPlacementZone,
  isSurfaceItem,
  isWallCell,
  isWallDecorItem,
} from "./office-layout";

export { CELL_SIZE, GRID_COLS, GRID_ROWS, OFFICE_WALL_ROWS } from "./office-layout";
export type { PlacementZone } from "./office-layout";

export const WALL_HEIGHT_PX = OFFICE_WALL_ROWS * CELL_SIZE;

export type PlacedItem = {
  id: string;
  item: AvatarItem;
  x: number;
  y: number;
  rotation: number;
};

type OfficeRoomProps = {
  placedItems: PlacedItem[];
  themeItem?: AvatarItem | null;
  onPlace?: (item: AvatarItem) => void;
  onRemove: (placedId: string) => void;
  onRotate: (placedId: string) => void;
  onMove: (placedId: string, x: number, y: number) => void;
  className?: string;
};

// ─── Draggable placed item ───────────────────────────────────────────────────

function DraggableFurniture({
  placed,
  isEditing,
  onRemove,
  onRotate,
  onSelect,
  isSelected,
}: {
  placed: PlacedItem;
  isEditing: boolean;
  onRemove: () => void;
  onRotate: () => void;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: placed.id,
    disabled: !isEditing,
  });

  const rarity = (placed.item.rarity ?? "common") as ExtendedRarity;
  const rs = RARITY_STYLES[rarity];
  const { w: gw, h: gh } = getItemSize(placed.item);
  const zone = getPlacementZone(placed.item);
  const spriteScale = zone === "surface" ? 0.9 : zone === "wall" ? 0.94 : 1;

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

      {/* Edit controls */}
      {isEditing && isSelected && !isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          <button
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

      {/* Rarity glow for legendary/mythic */}
      {(rarity === "legendary" || rarity === "mythic") && (
        <div
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{ boxShadow: `0 0 12px ${rs.color}50` }}
        />
      )}
    </div>
  );
}

// ─── Drop cell ───────────────────────────────────────────────────────────────

function DropCell({
  x,
  y,
  isOccupied,
  isWall,
}: {
  x: number;
  y: number;
  isOccupied: boolean;
  isWall: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${x}-${y}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-transparent transition-all duration-150 backdrop-blur-[1px]",
        isWall ? "bg-transparent" : "bg-transparent",
        isOver &&
          !isOccupied &&
          "scale-[0.98] bg-primary/25 border-primary/60 shadow-[inset_0_0_18px_rgba(255,255,255,0.28)]",
        isOver && isOccupied && "bg-red-500/20 border-red-500/50",
      )}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    />
  );
}

function getRenderLayer(placed: PlacedItem) {
  const zone = getPlacementZone(placed.item);
  if (zone === "wall") return 1;
  if (zone === "rug") return 2;
  if (zone === "floor") return 3;
  if (zone === "surface") return 4;
  return 3;
}

const PARTICLES = [
  { left: "10%", top: "18%", size: 3, delay: 0.1 },
  { left: "19%", top: "58%", size: 2, delay: 0.8 },
  { left: "31%", top: "26%", size: 4, delay: 1.3 },
  { left: "45%", top: "14%", size: 2, delay: 0.4 },
  { left: "59%", top: "48%", size: 3, delay: 1.7 },
  { left: "71%", top: "20%", size: 2, delay: 0.2 },
  { left: "84%", top: "38%", size: 4, delay: 1.1 },
  { left: "92%", top: "68%", size: 2, delay: 1.9 },
];

function AmbientParticles({ theme }: { theme: OfficeTheme }) {
  return (
    <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
      {PARTICLES.map((particle, index) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute rounded-full blur-[0.5px]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            background: theme.particle,
            boxShadow: `0 0 14px ${theme.glow}`,
          }}
          animate={{ y: [-2, -12, -2], opacity: [0.2, 0.65, 0.2], scale: [0.75, 1.2, 0.75] }}
          transition={{
            duration: 5 + index * 0.35,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// ─── Main OfficeRoom ─────────────────────────────────────────────────────────

export function OfficeRoom({
  placedItems,
  themeItem,
  onPlace,
  onRemove,
  onRotate,
  onMove,
  className,
}: OfficeRoomProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const occupiedCells = useCallback((): Set<string> => {
    const cells = new Set<string>();
    for (const p of placedItems) {
      const { w: gw, h: gh } = getItemSize(p.item);
      for (let dx = 0; dx < gw; dx++) {
        for (let dy = 0; dy < gh; dy++) {
          cells.add(`${p.x + dx}-${p.y + dy}`);
        }
      }
    }
    return cells;
  }, [placedItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("cell-")) return;

    const [, cx, cy] = overId.split("-");
    const x = parseInt(cx);
    const y = parseInt(cy);

    const placed = placedItems.find((p) => p.id === active.id);
    const validZone = placed && (isWallDecorItem(placed.item) ? isWallCell(y) : isFloorCell(x, y));
    if (placed && validZone) {
      onMove(placed.id, x, y);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setSelectedId(String(event.active.id));
  };

  const occupied = occupiedCells();
  const activePlaced = activeDragId ? placedItems.find((p) => p.id === activeDragId) : null;
  const theme = getOfficeTheme(themeItem?.slug);
  const layeredPlacedItems = [...placedItems].sort((a, b) => {
    const layerDiff = getRenderLayer(a) - getRenderLayer(b);
    if (layerDiff !== 0) return layerDiff;
    return a.y - b.y;
  });

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Toolbar */}
      <div
        className="relative overflow-hidden rounded-3xl border border-white/20 bg-card/70 p-4 shadow-2xl backdrop-blur-xl sm:flex sm:items-center sm:justify-between"
        style={{ boxShadow: `0 18px 60px ${theme.shadow}18, inset 0 1px 0 #ffffff33` }}
      >
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_42%,rgba(255,255,255,0.08))]" />
        <div>
          <p className="relative text-sm font-semibold flex items-center gap-2">
            <span
              className="grid size-8 place-items-center rounded-2xl border border-white/25 shadow-lg"
              style={{ background: `${theme.glow}25`, boxShadow: `0 0 28px ${theme.glow}35` }}
            >
              <Sparkles className="size-4" style={{ color: theme.accent }} />
            </span>
            Tema: {themeItem?.name ?? theme.name}
          </p>
          <p className="relative mt-1 text-xs text-muted-foreground">
            {isEditing
              ? "Piso: móveis e tapetes • Parede: decorações • Mesa: itens de superfície."
              : "Seu escritório personalizado de produtividade."}
          </p>
        </div>
        <Button
          size="sm"
          variant={isEditing ? "default" : "outline"}
          onClick={() => {
            setIsEditing(!isEditing);
            setSelectedId(null);
          }}
          className="relative mt-3 gap-2 rounded-2xl border-white/20 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:mt-0"
        >
          {isEditing ? (
            <>
              <Check className="size-3.5" /> Concluir
            </>
          ) : (
            <>
              <Edit3 className="size-3.5" /> Editar
            </>
          )}
        </Button>
      </div>

      {/* Room — fundo em largura total; grade centralizada no chão */}
      <div
        className="relative w-full overflow-hidden rounded-[2rem] border border-white/20 shadow-2xl"
        style={{
          minHeight: GRID_ROWS * CELL_SIZE,
          background: theme.shadow,
          boxShadow: `0 30px 90px ${theme.shadow}45, inset 0 1px 0 #ffffff33`,
        }}
      >
        {/* Camadas de cenário premium: base, parede, piso, luz e profundidade */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            minHeight: GRID_ROWS * CELL_SIZE,
            background: `radial-gradient(circle at 50% 8%, ${theme.glow}24, transparent 34%), linear-gradient(180deg, ${theme.trim}22 0%, transparent 18%), ${theme.floor}`,
          }}
        />
        <div
          className="absolute inset-x-0 top-0 z-0 pointer-events-none"
          style={{
            height: WALL_HEIGHT_PX,
            background: theme.wall,
            boxShadow: `inset 0 -28px 38px ${theme.shadow}22, inset 0 1px 0 #ffffff30`,
          }}
        />
        <div
          className="absolute inset-x-0 z-[1] pointer-events-none"
          style={{
            top: WALL_HEIGHT_PX - 5,
            height: 10,
            background: `linear-gradient(90deg, ${theme.trim}, ${theme.glow}, ${theme.trim})`,
            boxShadow: `0 12px 28px ${theme.shadow}35, 0 0 24px ${theme.glow}28`,
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
          style={{
            top: WALL_HEIGHT_PX,
            background: `
              radial-gradient(ellipse at 50% 15%, ${theme.glow}22, transparent 48%),
              linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 20%, rgba(0,0,0,0.24) 100%),
              ${theme.floor}
            `,
          }}
        />
        <div
          className="absolute left-1/2 z-[1] pointer-events-none -translate-x-1/2 rounded-full blur-sm"
          style={{
            top: WALL_HEIGHT_PX + 24,
            width: "min(100%, 720px)",
            height: 200,
            background: `radial-gradient(ellipse, ${theme.glow}38, transparent 68%)`,
          }}
        />
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 42%, transparent 0 55%, ${theme.shadow}28 100%), linear-gradient(115deg, #ffffff22 0%, transparent 22%, transparent 72%, ${theme.glow}12 100%)`,
          }}
        />
        <AmbientParticles theme={theme} />

        <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
          <div
            className="relative z-[3] mx-auto"
            style={{ width: GRID_COLS * CELL_SIZE, height: GRID_ROWS * CELL_SIZE }}
          >
            {/* Faixa de parede na grade (sem drops) */}
            <div
              className="absolute inset-x-0 top-0 z-[1] pointer-events-none border-b border-black/10"
              style={{
                height: WALL_HEIGHT_PX,
                background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 100%)",
              }}
            />

            {/* Grid overlay in edit mode */}
            {isEditing && (
              <div
                className="absolute inset-0 grid z-[2]"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
                }}
              >
                {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
                  const x = i % GRID_COLS;
                  const y = Math.floor(i / GRID_COLS);
                  const wall = isWallCell(y);
                  return (
                    <DropCell
                      key={`${x}-${y}`}
                      x={x}
                      y={y}
                      isWall={wall}
                      isOccupied={occupied.has(`${x}-${y}`)}
                    />
                  );
                })}
              </div>
            )}

            {/* Placed items */}
            <AnimatePresence>
              {layeredPlacedItems.map((placed) => (
                <motion.div
                  key={placed.id}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: getRenderLayer(placed) + 1,
                    pointerEvents: "none",
                  }}
                >
                  <DraggableFurniture
                    placed={placed}
                    isEditing={isEditing}
                    onRemove={() => onRemove(placed.id)}
                    onRotate={() => onRotate(placed.id)}
                    onSelect={() => setSelectedId(placed.id)}
                    isSelected={selectedId === placed.id}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Empty state */}
            {placedItems.length === 0 && (
              <div
                className="absolute inset-x-0 z-[3] flex items-center justify-center pointer-events-none"
                style={{ top: WALL_HEIGHT_PX, bottom: 0 }}
              >
                <div
                  className="relative overflow-hidden rounded-3xl border border-white/30 bg-background/75 px-6 py-5 text-center shadow-2xl backdrop-blur-xl"
                  style={{ boxShadow: `0 22px 70px ${theme.shadow}32, inset 0 1px 0 #ffffff55` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.24),transparent_50%,rgba(255,255,255,0.08))]" />
                  <div className="relative text-5xl drop-shadow-lg">🏢</div>
                  <p className="mt-2 text-sm font-semibold">Escritório pronto para decorar</p>
                  <p className="text-xs text-muted-foreground">
                    Coloque móveis no piso, decorações na parede e itens pequenos sobre a mesa.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DragOverlay>
            {activePlaced && (
              <div className="opacity-80">
                <FurnitureSVG
                  item={activePlaced.item}
                  size={isSurfaceItem(activePlaced.item) ? CELL_SIZE * 0.9 : CELL_SIZE - 6}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {isEditing && (
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
            <Move className="size-3.5" /> Arraste para reposicionar.
          </div>
          <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
            <RotateCw className="size-3.5" /> Selecione e rotacione.
          </div>
          <div className="rounded-2xl border border-white/15 bg-card/60 p-3 flex items-center gap-2 shadow-lg backdrop-blur">
            <Trash2 className="size-3.5" /> Remova para voltar ao inventário.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory sidebar for placing items ────────────────────────────────────

type InventoryPlacerProps = {
  ownedOfficeItems: AvatarItem[];
  placedItemIds: string[];
  onPickItem: (item: AvatarItem) => void;
};

export function InventoryPlacer({
  ownedOfficeItems,
  placedItemIds,
  onPickItem,
}: InventoryPlacerProps) {
  if (ownedOfficeItems.length === 0) {
    return (
      <div className="rounded-2xl border border-white/15 bg-muted/30 py-8 text-center text-sm text-muted-foreground shadow-inner">
        <Lock className="size-8 mx-auto mb-2 opacity-30" />
        Compre itens de escritório na Loja
      </div>
    );
  }

  const placed = new Set(placedItemIds);

  return (
    <div className="grid grid-cols-2 gap-2">
      {ownedOfficeItems.map((item) => {
        const rarity = (item.rarity ?? "common") as ExtendedRarity;
        const rs = RARITY_STYLES[rarity];
        const isPlaced = placed.has(item.id);
        return (
          <button
            key={item.id}
            onClick={() => onPickItem(item)}
            disabled={isPlaced}
            className={cn(
              "relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border p-2.5 text-center text-xs shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:hover:scale-100",
              rs.border,
              rs.bg,
            )}
          >
            <span className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24),transparent_45%,rgba(255,255,255,0.08))]" />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-background/40 shadow-inner">
              <FurnitureSVG item={item} size={42} />
            </span>
            <span className="relative font-medium leading-tight text-[11px]">{item.name}</span>
            <span className="relative rounded-full bg-background/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
              {getPlacementZone(item) === "wall"
                ? "parede"
                : getPlacementZone(item) === "surface"
                  ? "mesa"
                  : getPlacementZone(item) === "rug"
                    ? "tapete"
                    : "piso"}
            </span>
            {isPlaced && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground shadow-lg">
                colocado
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
