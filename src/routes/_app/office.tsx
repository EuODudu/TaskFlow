import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useInvalidate, useOfficeItems, useOwnedOfficeItems } from "@/lib/queries";
import { getLevelFromXP } from "@/lib/gamification";
import { useProfile, useUserAvatar } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, Package, ChevronRight, Lock } from "lucide-react";
import {
  OfficeRoom,
  InventoryPlacer,
  type PlacedItem,
  GRID_COLS,
  GRID_ROWS,
  OFFICE_WALL_ROWS,
  isFloorCell,
  isWallCell,
  isWallDecorItem,
} from "@/components/gamification/office-room";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { LevelBadge } from "@/components/gamification/level-badge";
import type { AvatarItem } from "@/lib/queries";

export const Route = createFileRoute("/_app/office")({ component: OfficePage });

function OfficePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: avatar } = useUserAvatar(user?.id);
  const { data: rawOfficeItems = [], refetch: refetchOffice } = useOfficeItems(user?.id);
  const { data: ownedOfficeItems = [] } = useOwnedOfficeItems(user?.id);
  const inv = useInvalidate();
  const [saving, setSaving] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"inventory" | "info">("inventory");

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXP(xp);

  const activeTheme = rawOfficeItems.find((r) => r.item?.category === "office_theme")?.item ?? null;

  // Map DB data to PlacedItem format
  const placedItems: PlacedItem[] = rawOfficeItems
    .filter((r) => r.item?.category === "office_item")
    .map((r) => ({
      id: r.id,
      item: r.item,
      x: r.grid_x,
      y: r.grid_y,
      rotation: r.rotation,
    }));

  const getItemSize = (item: AvatarItem) => ({
    w: Math.max(1, (item as any).grid_w ?? 1),
    h: Math.max(1, (item as any).grid_h ?? 1),
  });

  const isOccupied = useCallback((x: number, y: number, exceptId?: string): boolean => {
    for (const p of placedItems) {
      if (p.id === exceptId) continue;
      const gw = (p.item as any).grid_w ?? 1;
      const gh = (p.item as any).grid_h ?? 1;
      for (let dx = 0; dx < gw; dx++) {
        for (let dy = 0; dy < gh; dy++) {
          if (p.x + dx === x && p.y + dy === y) return true;
        }
      }
    }
    return false;
  }, [placedItems]);

  const canPlaceAt = useCallback((item: AvatarItem, x: number, y: number, exceptId?: string): boolean => {
    const { w, h } = getItemSize(item);
    const wallDecor = isWallDecorItem(item);
    if (x < 0 || x + w > GRID_COLS) return false;
    if (wallDecor) {
      if (y < 0 || y + h > OFFICE_WALL_ROWS) return false;
    } else if (y < OFFICE_WALL_ROWS || y + h > GRID_ROWS) {
      return false;
    }

    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < h; dy++) {
        const cx = x + dx;
        const cy = y + dy;
        const validCell = wallDecor ? isWallCell(cy) : isFloorCell(cx, cy);
        if (!validCell || isOccupied(cx, cy, exceptId)) return false;
      }
    }
    return true;
  }, [isOccupied]);

  const handlePlaceItem = async (item: AvatarItem) => {
    if (!user) return;
    // Find first empty cell
    let placed = false;
    const { w, h } = getItemSize(item);
    const wallDecor = isWallDecorItem(item);
    const startY = wallDecor ? 0 : OFFICE_WALL_ROWS;
    const endY = wallDecor ? OFFICE_WALL_ROWS - h : GRID_ROWS - h;
    for (let y = startY; y <= endY && !placed; y++) {
      for (let x = 0; x <= GRID_COLS - w && !placed; x++) {
        if (canPlaceAt(item, x, y)) {
          setSaving(true);
          const { error } = await (supabase as any).from("office_items").insert({
            user_id: user.id,
            item_id: item.id,
            grid_x: x,
            grid_y: y,
            rotation: 0,
          });
          setSaving(false);
          if (error) {
            toast.error((error as any).message, {
              description: "Execute a migration/seed do escritório para habilitar a personalização.",
            });
          } else {
            inv.officeItems(user!.id);
            toast.success(`${item.name} colocado no escritório!`);
          }
          placed = true;
        }
      }
    }
    if (!placed) toast.error("Sem espaço para esse item. Remova ou mova algum móvel.");
  };

  const handleRemoveItem = async (placedId: string) => {
    if (!user) return;
    const { error } = await (supabase as any).from("office_items").delete().eq("id", placedId);
    if (error) return toast.error((error as any).message);
    inv.officeItems(user!.id);
    toast.success("Item removido");
  };

  const handleRotateItem = async (placedId: string) => {
    const current = placedItems.find((p) => p.id === placedId);
    if (!current) return;
    const newRot = (current.rotation + 90) % 360;
    const { error } = await (supabase as any).from("office_items").update({ rotation: newRot }).eq("id", placedId);
    if (error) return toast.error((error as any).message);
    inv.officeItems(user!.id);
  };

  const handleMoveItem = async (placedId: string, x: number, y: number) => {
    const current = placedItems.find((p) => p.id === placedId);
    if (!current) return;
    const wallDecor = isWallDecorItem(current.item);
    const validZone = wallDecor ? isWallCell(y) : isFloorCell(x, y);
    if (!validZone || !canPlaceAt(current.item, x, y, placedId)) {
      toast.error(wallDecor ? "Esse item só pode ficar na parede!" : "Móveis só podem ficar no piso!");
      return;
    }
    const { error } = await (supabase as any).from("office_items").update({ grid_x: x, grid_y: y }).eq("id", placedId);
    if (error) return toast.error((error as any).message);
    inv.officeItems(user!.id);
  };

  return (
    <div className="relative max-w-7xl space-y-6 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-56 rounded-[3rem] bg-primary/10 blur-3xl" />
      {/* Header */}
      <div className="relative flex items-center justify-between rounded-3xl border border-white/15 bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[linear-gradient(120deg,rgba(255,255,255,0.18),transparent_48%,rgba(255,255,255,0.06))]" />
        <div>
          <h1 className="relative text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 shadow-inner">
              <Home className="size-5 text-primary" />
            </span>
            Meu Escritório
          </h1>
          <p className="relative mt-1 text-sm text-muted-foreground">
            Decore seu espaço com itens da loja e crie um ambiente de foco premium.
          </p>
        </div>
        <div className="relative flex items-center gap-3 rounded-2xl border border-white/10 bg-background/45 px-3 py-2 shadow-inner backdrop-blur">
          {avatar && <Avatar2D avatar={avatar as any} size="sm" />}
          <LevelBadge xp={xp} size="sm" showTitle />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Room */}
        <div className="flex-1 min-w-0">
          <OfficeRoom
            placedItems={placedItems}
            themeItem={activeTheme}
            onPlace={handlePlaceItem}
            onRemove={handleRemoveItem}
            onRotate={handleRotateItem}
            onMove={handleMoveItem}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 flex-shrink-0 space-y-4">
          {/* Sidebar tabs */}
          <div className="flex overflow-hidden rounded-2xl border border-white/15 bg-card/65 p-1 shadow-xl backdrop-blur-xl">
            <button
              onClick={() => setSidebarTab("inventory")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all",
                sidebarTab === "inventory" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <Package className="size-3.5" /> Inventário
            </button>
            <button
              onClick={() => setSidebarTab("info")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all",
                sidebarTab === "info" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <Home className="size-3.5" /> Info
            </button>
          </div>

          {sidebarTab === "inventory" && (
            <Card className="overflow-hidden border-white/15 bg-card/70 p-3 shadow-2xl backdrop-blur-xl">
              <p className="mb-3 text-xs font-semibold text-muted-foreground">
                Itens disponíveis ({ownedOfficeItems.length})
              </p>
              <InventoryPlacer
                ownedOfficeItems={ownedOfficeItems}
                placedItemIds={placedItems.map((p) => p.item.id)}
                onPickItem={handlePlaceItem}
              />
              {ownedOfficeItems.length === 0 && (
                <div className="text-center pt-2">
                  <a href="/store" className="text-xs text-primary flex items-center justify-center gap-1 hover:underline">
                    <ShoppingBag className="size-3" /> Ir para a Loja
                    <ChevronRight className="size-3" />
                  </a>
                </div>
              )}
            </Card>
          )}

          {sidebarTab === "info" && (
            <Card className="space-y-4 overflow-hidden border-white/15 bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold mb-2">Visual ativo</p>
                <div className="mb-4 rounded-2xl border border-white/15 bg-background/45 p-3 shadow-inner">
                  <p className="text-sm font-semibold">{activeTheme?.name ?? "Clássico Produtivo"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Compre e equipe novos visuais na Loja.
                  </p>
                </div>

                <p className="text-xs font-semibold mb-2">Ocupação</p>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Itens colocados</span>
                  <span>{placedItems.length}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                  <div
                    className="h-full rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all"
                    style={{ width: `${Math.min(100, (placedItems.length / 20) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Dicas</p>
                <p>• Clique <strong>Editar</strong> para mover móveis</p>
                <p>• Selecione um item para rotacionar ou remover</p>
                <p>• Compre mais itens na Loja</p>
                <p>• Desbloqueie móveis raros subindo de nível</p>
              </div>

              {level < 5 && (
                <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-muted/50 p-3 text-xs shadow-inner">
                  <Lock className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">
                    Alcance nível 5 para desbloquear novos itens de decoração
                  </span>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
