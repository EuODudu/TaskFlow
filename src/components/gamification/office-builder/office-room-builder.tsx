import { useState, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { getOfficeTheme } from "../office-themes";
import type { AvatarItem } from "@/lib/queries";
import {
  DEFAULT_ZOOM,
  ZOOM_STEP,
  clampPan,
  clampZoom,
  isFloorCell,
  isWallCell,
  isWallDecorItem,
  type PlacedItem,
} from "../office-layout";
import { RoomCanvas } from "./room-canvas";
import { RoomControls, EditHintsBar } from "./room-controls";
import { DragGhostFurniture } from "./placed-furniture";

export type { PlacedItem } from "../office-layout";

export {
  CELL_SIZE,
  GRID_COLS,
  GRID_ROWS,
  OFFICE_WALL_ROWS,
  WALL_HEIGHT_PX,
} from "../office-layout";

type OfficeRoomBuilderProps = {
  placedItems: PlacedItem[];
  themeItem?: AvatarItem | null;
  onRemove: (placedId: string) => void;
  onRotate: (placedId: string) => void;
  onMove: (placedId: string, x: number, y: number) => void;
  className?: string;
};

export function OfficeRoomBuilder({
  placedItems,
  themeItem,
  onRemove,
  onRotate,
  onMove,
  className,
}: OfficeRoomBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const panStart = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const isPanning = useRef(false);

  const theme = getOfficeTheme(themeItem?.slug);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setSelectedId(String(event.active.id));
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const overId = event.over?.id;
    if (!overId || !String(overId).startsWith("cell-")) {
      setHoverCell(null);
      return;
    }
    const [, cx, cy] = String(overId).split("-");
    setHoverCell({ x: parseInt(cx, 10), y: parseInt(cy, 10) });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    setHoverCell(null);
    const { active, over } = event;
    if (!over) return;

    const overId = String(over.id);
    if (!overId.startsWith("cell-")) return;

    const [, cx, cy] = overId.split("-");
    const x = parseInt(cx, 10);
    const y = parseInt(cy, 10);

    const placed = placedItems.find((p) => p.id === active.id);
    if (!placed) return;

    const wallDecor = isWallDecorItem(placed.item);
    const validZone = wallDecor ? isWallCell(y) : isFloorCell(x, y);
    if (validZone) onMove(placed.id, x, y);
  };

  const handlePanPointerDown = (e: React.PointerEvent) => {
    if (!isEditing || e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-draggable-furniture]")) return;
    isPanning.current = true;
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePanPointerMove = (e: React.PointerEvent) => {
    if (!isPanning.current || !panStart.current) return;
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    setPan(clampPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy }, zoom));
  };

  const handlePanPointerUp = () => {
    isPanning.current = false;
    panStart.current = null;
  };

  const activePlaced = activeDragId ? placedItems.find((p) => p.id === activeDragId) : null;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <RoomControls
        isEditing={isEditing}
        onToggleEdit={() => {
          setIsEditing(!isEditing);
          setSelectedId(null);
        }}
        theme={theme}
        themeItem={themeItem}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
        onZoomOut={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
        onResetView={() => {
          setZoom(DEFAULT_ZOOM);
          setPan({ x: 0, y: 0 });
        }}
      />

      <div
        className="relative w-full overflow-hidden rounded-[2rem] border border-white/15 bg-black/20"
        style={{ minHeight: 420 }}
        onPointerDown={handlePanPointerDown}
        onPointerMove={handlePanPointerMove}
        onPointerUp={handlePanPointerUp}
        onPointerLeave={handlePanPointerUp}
      >
        <div
          className="flex items-center justify-center py-6 transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
          >
            <RoomCanvas
              placedItems={placedItems}
              theme={theme}
              isEditing={isEditing}
              selectedId={selectedId}
              activeDragId={activeDragId}
              hoverCell={hoverCell}
              onSelect={setSelectedId}
              onRemove={onRemove}
              onRotate={onRotate}
            />
            <DragOverlay>
              {activePlaced && <DragGhostFurniture placed={activePlaced} />}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {isEditing && <EditHintsBar />}
    </div>
  );
}
