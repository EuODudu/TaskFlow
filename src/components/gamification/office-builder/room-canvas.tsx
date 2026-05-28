import { useDroppable } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ROOM_HEIGHT_PX,
  ROOM_WIDTH_PX,
  WALL_HEIGHT_PX,
  getRenderLayer,
  isWallCell,
  type PlacedItem,
} from "../office-layout";
import { canPlaceAt } from "../office-placement";
import type { OfficeTheme } from "../office-themes";
import { PlacedFurniture } from "./placed-furniture";

function DropCell({
  x,
  y,
  isWall,
  highlight,
}: {
  x: number;
  y: number;
  isWall: boolean;
  highlight: "none" | "valid" | "invalid";
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `cell-${x}-${y}` });
  const activeHighlight = isOver ? highlight : "none";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border border-white/0 transition-all duration-150",
        isWall ? "bg-white/[0.025]" : "bg-black/[0.018]",
        activeHighlight === "valid" &&
          "bg-emerald-500/30 border-emerald-400/70 shadow-[inset_0_0_14px_rgba(52,211,153,0.35)]",
        activeHighlight === "invalid" &&
          "bg-red-500/25 border-red-400/60 shadow-[inset_0_0_12px_rgba(248,113,113,0.3)]",
        isOver && activeHighlight === "none" && "bg-primary/20 border-primary/50",
      )}
      style={{ width: CELL_SIZE, height: CELL_SIZE }}
    />
  );
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

type RoomCanvasProps = {
  placedItems: PlacedItem[];
  theme: OfficeTheme;
  isEditing: boolean;
  selectedId: string | null;
  activeDragId: string | null;
  hoverCell: { x: number; y: number } | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onRotate: (id: string) => void;
};

export function RoomCanvas({
  placedItems,
  theme,
  isEditing,
  selectedId,
  activeDragId,
  hoverCell,
  onSelect,
  onRemove,
  onRotate,
}: RoomCanvasProps) {
  const activePlaced = activeDragId ? placedItems.find((p) => p.id === activeDragId) : null;

  const layeredPlacedItems = [...placedItems].sort((a, b) => {
    const layerDiff = getRenderLayer(a) - getRenderLayer(b);
    if (layerDiff !== 0) return layerDiff;
    return a.y - b.y;
  });

  const getCellHighlight = (x: number, y: number): "none" | "valid" | "invalid" => {
    if (!isEditing || !activePlaced || !hoverCell) return "none";
    if (hoverCell.x !== x || hoverCell.y !== y) return "none";
    const ok = canPlaceAt(
      placedItems,
      activePlaced.item,
      x,
      y,
      activePlaced.rotation,
      activePlaced.id,
    );
    return ok ? "valid" : "invalid";
  };

  return (
    <div
      className="relative rounded-[2rem] border border-white/20 shadow-2xl overflow-hidden"
      style={{
        width: ROOM_WIDTH_PX,
        height: ROOM_HEIGHT_PX,
        background: theme.shadow,
        boxShadow: `0 30px 90px ${theme.shadow}45, inset 0 1px 0 #ffffff33`,
      }}
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 5%, ${theme.glow}24, transparent 34%), linear-gradient(180deg, ${theme.trim}20 0%, transparent 21%), ${theme.floor}`,
        }}
      />
      <div
        className="absolute inset-x-0 top-0 z-0 pointer-events-none"
        style={{
          height: WALL_HEIGHT_PX,
          background: `
            radial-gradient(circle at 18% 18%, #ffffff42, transparent 22%),
            radial-gradient(circle at 82% 16%, ${theme.glow}24, transparent 24%),
            linear-gradient(90deg, ${theme.shadow}18, transparent 18%, transparent 82%, ${theme.shadow}16),
            ${theme.wall}
          `,
          boxShadow: `inset 0 -34px 46px ${theme.shadow}20, inset 0 1px 0 #ffffff30`,
        }}
      />
      <div
        className="absolute inset-x-10 z-[1] pointer-events-none"
        style={{
          top: 20,
          height: WALL_HEIGHT_PX - 42,
          borderRadius: 36,
          background: `linear-gradient(180deg, #ffffff1f, transparent 45%, ${theme.shadow}10)`,
          boxShadow: `inset 0 1px 0 #ffffff30, inset 0 -1px 0 ${theme.shadow}18`,
        }}
      />
      <div
        className="absolute left-0 top-0 z-[1] pointer-events-none"
        style={{
          width: 130,
          height: WALL_HEIGHT_PX + 24,
          background: `linear-gradient(90deg, ${theme.shadow}26, transparent 78%)`,
          clipPath: "polygon(0 0, 100% 0, 70% 100%, 0 100%)",
        }}
      />
      <div
        className="absolute right-0 top-0 z-[1] pointer-events-none"
        style={{
          width: 130,
          height: WALL_HEIGHT_PX + 24,
          background: `linear-gradient(270deg, ${theme.shadow}24, transparent 78%)`,
          clipPath: "polygon(0 0, 100% 0, 100% 100%, 30% 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 z-[1] pointer-events-none"
        style={{
          top: WALL_HEIGHT_PX - 5,
          height: 14,
          background: `linear-gradient(180deg, #ffffff44, transparent 35%), linear-gradient(90deg, ${theme.trim}, ${theme.glow}, ${theme.trim})`,
          boxShadow: `0 14px 32px ${theme.shadow}40, 0 0 24px ${theme.glow}28`,
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-0 pointer-events-none"
        style={{
          top: WALL_HEIGHT_PX,
          background: `
              radial-gradient(ellipse at 50% 10%, ${theme.glow}24, transparent 46%),
              linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 22%, rgba(0,0,0,0.25) 100%),
              linear-gradient(135deg, rgba(255,255,255,0.14) 0 7%, transparent 7% 15%, rgba(0,0,0,0.075) 15% 23%, transparent 23% 31%, rgba(255,255,255,0.08) 31% 39%, transparent 39% 100%),
              ${theme.floor}
            `,
        }}
      />
      <div
        className="absolute inset-x-0 z-[1] pointer-events-none"
        style={{
          top: WALL_HEIGHT_PX + 2,
          height: 96,
          background: `linear-gradient(180deg, ${theme.shadow}16, transparent 68%)`,
        }}
      />
      <div
        className="absolute inset-x-8 z-[1] pointer-events-none rounded-[45%] blur-sm"
        style={{
          top: WALL_HEIGHT_PX + 18,
          height: 180,
          background: `radial-gradient(ellipse, ${theme.glow}2f, transparent 68%)`,
        }}
      />
      <div
        className="absolute inset-0 z-[2] pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 42%, transparent 0 58%, ${theme.shadow}22 100%), linear-gradient(115deg, #ffffff24 0%, transparent 22%, transparent 72%, ${theme.glow}12 100%)`,
        }}
      />
      <AmbientParticles theme={theme} />

      <div className="relative z-[3] w-full h-full">
        <div
          className="absolute inset-x-0 top-0 z-[1] pointer-events-none border-b border-black/10"
          style={{
            height: WALL_HEIGHT_PX,
            background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, transparent 100%)",
          }}
        />

        {isEditing && (
          <div
            className="absolute inset-0 grid z-[2] opacity-80"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
            }}
          >
            {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, i) => {
              const x = i % GRID_COLS;
              const y = Math.floor(i / GRID_COLS);
              return (
                <DropCell
                  key={`${x}-${y}`}
                  x={x}
                  y={y}
                  isWall={isWallCell(y)}
                  highlight={getCellHighlight(x, y)}
                />
              );
            })}
          </div>
        )}

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
              <PlacedFurniture
                placed={placed}
                isEditing={isEditing}
                isSelected={selectedId === placed.id}
                onSelect={() => onSelect(placed.id)}
                onRemove={() => onRemove(placed.id)}
                onRotate={() => onRotate(placed.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {placedItems.length === 0 && (
          <div
            className="absolute inset-x-0 z-[3] flex items-center justify-center pointer-events-none"
            style={{ top: WALL_HEIGHT_PX, bottom: 0 }}
          >
            <div
              className="relative overflow-hidden rounded-3xl border border-white/30 bg-background/75 px-6 py-5 text-center shadow-2xl backdrop-blur-xl"
              style={{ boxShadow: `0 22px 70px ${theme.shadow}32, inset 0 1px 0 #ffffff55` }}
            >
              <div className="text-5xl drop-shadow-lg">🏢</div>
              <p className="mt-2 text-sm font-semibold">Sala pronta para decorar</p>
              <p className="text-xs text-muted-foreground">
                Use o inventário, zoom e arraste itens como no My Dream Setup.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
