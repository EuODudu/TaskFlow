import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useInvalidate,
  useOfficeItems,
  useOwnedOfficeItems,
  useOwnedOfficeThemes,
} from "@/lib/queries";
import { getLevelFromXP } from "@/lib/gamification";
import { useProfile, useUserAvatar } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Home, ShoppingBag, Package, ChevronRight, Lock } from "lucide-react";
import { OfficeRoom, DecorCatalog, type PlacedItem } from "@/components/gamification/office-room";
import { GRID_COLS, GRID_ROWS } from "@/components/gamification/office-layout";
import {
  canPlaceAt,
  canRotateInPlace,
  findFirstPlacement,
  getPlacementErrorMessage,
} from "@/components/gamification/office-placement";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { LevelBadge } from "@/components/gamification/level-badge";
import type { AvatarItem, UserAvatar } from "@/lib/queries";
import type { PostgrestError } from "@supabase/supabase-js";

export const Route = createFileRoute("/_app/office")({ component: OfficePage });

function OfficePage() {
  type OfficeItemsTable = {
    insert(values: {
      user_id: string;
      item_id: string;
      grid_x: number;
      grid_y: number;
      rotation: number;
    }): Promise<{ error: PostgrestError | null }>;
    delete(): {
      eq(column: "id", value: string): Promise<{ error: PostgrestError | null }>;
      in(column: "id", values: string[]): Promise<{ error: PostgrestError | null }>;
    };
    update(values: { rotation?: number; grid_x?: number; grid_y?: number }): {
      eq(column: "id", value: string): Promise<{ error: PostgrestError | null }>;
    };
  };

  const officeItemsTable = () =>
    (
      supabase as unknown as {
        from(table: "office_items"): OfficeItemsTable;
      }
    ).from("office_items");

  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: avatar } = useUserAvatar(user?.id);
  const { data: rawOfficeItems = [] } = useOfficeItems(user?.id);
  const { data: ownedOfficeItems = [] } = useOwnedOfficeItems(user?.id);
  const { data: ownedThemes = [] } = useOwnedOfficeThemes(user?.id);
  const inv = useInvalidate();
  const [sidebarTab, setSidebarTab] = useState<"catalog" | "info">("catalog");

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXP(xp);

  const activeThemeRow = rawOfficeItems.find((r) => r.item?.category === "office_theme");
  const activeTheme = activeThemeRow?.item ?? null;

  const placedItems: PlacedItem[] = rawOfficeItems
    .filter((r) => r.item?.category === "office_item")
    .map((r) => ({
      id: r.id,
      item: r.item,
      x: r.grid_x,
      y: r.grid_y,
      rotation: r.rotation,
    }));

  const ownedFurniture = ownedOfficeItems;

  const handlePlaceItem = async (item: AvatarItem) => {
    if (!user) return;
    const spot = findFirstPlacement(placedItems, item, 0);
    if (!spot) {
      toast.error("Sem espaço para esse item. Remova ou mova algum móvel.");
      return;
    }

    const { error } = await officeItemsTable().insert({
      user_id: user.id,
      item_id: item.id,
      grid_x: spot.x,
      grid_y: spot.y,
      rotation: 0,
    });
    if (error) {
      toast.error(error.message, {
        description: "Execute a migration do escritório Dream Setup no Supabase.",
      });
    } else {
      inv.officeItems(user.id);
      toast.success(`${item.name} colocado!`);
    }
  };

  const handleApplyTheme = async (item: AvatarItem) => {
    if (!user) return;
    const existingThemeIds = rawOfficeItems
      .filter((row) => row.item?.category === "office_theme")
      .map((row) => row.id);

    if (existingThemeIds.length > 0) {
      const { error: deleteError } = await (
        supabase as unknown as {
          from: (table: string) => {
            delete: () => {
              in: (column: string, values: string[]) => Promise<{ error: PostgrestError | null }>;
            };
          };
        }
      )
        .from("office_items")
        .delete()
        .in("id", existingThemeIds);
      if (deleteError) return toast.error(deleteError.message);
    }

    if (item.slug !== "office_theme_classic") {
      const { error: insertError } = await officeItemsTable().insert({
        user_id: user.id,
        item_id: item.id,
        grid_x: -1,
        grid_y: -1,
        rotation: 0,
      });
      if (insertError) return toast.error(insertError.message);
    }

    inv.officeItems(user.id);
    toast.success(`${item.name} aplicado!`);
  };

  const handleRemoveItem = async (placedId: string) => {
    if (!user) return;
    const { error } = await officeItemsTable().delete().eq("id", placedId);
    if (error) return toast.error(error.message);
    inv.officeItems(user.id);
    toast.success("Item removido");
  };

  const handleRotateItem = async (placedId: string) => {
    const current = placedItems.find((p) => p.id === placedId);
    if (!current) return;
    if (!canRotateInPlace(current, placedItems)) {
      toast.error("Não há espaço para rotacionar nesta posição.");
      return;
    }
    const newRot = (current.rotation + 90) % 360;
    const { error } = await officeItemsTable().update({ rotation: newRot }).eq("id", placedId);
    if (error) return toast.error(error.message);
    inv.officeItems(user.id);
  };

  const handleMoveItem = async (placedId: string, x: number, y: number) => {
    const current = placedItems.find((p) => p.id === placedId);
    if (!current) return;
    if (!canPlaceAt(placedItems, current.item, x, y, current.rotation, placedId)) {
      toast.error(getPlacementErrorMessage(current.item));
      return;
    }
    const { error } = await officeItemsTable().update({ grid_x: x, grid_y: y }).eq("id", placedId);
    if (error) return toast.error(error.message);
    inv.officeItems(user.id);
  };

  return (
    <div className="relative max-w-7xl space-y-6 overflow-hidden p-6">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-56 rounded-[3rem] bg-primary/10 blur-3xl" />
      <div className="relative flex items-center justify-between rounded-3xl border border-white/15 bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-primary/15 shadow-inner">
              <Home className="size-5 text-primary" />
            </span>
            Meu Escritório
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Construtor de ambiente — sala {GRID_COLS}×{GRID_ROWS}, zoom e catálogo por estilo.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-background/45 px-3 py-2 shadow-inner backdrop-blur">
          {avatar && <Avatar2D avatar={avatar as UserAvatar} size="sm" />}
          <LevelBadge xp={xp} size="sm" showTitle />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <OfficeRoom
            placedItems={placedItems}
            themeItem={activeTheme}
            onRemove={handleRemoveItem}
            onRotate={handleRotateItem}
            onMove={handleMoveItem}
          />
        </div>

        <div className="lg:w-80 flex-shrink-0 space-y-4">
          <div className="flex overflow-hidden rounded-2xl border border-white/15 bg-card/65 p-1 shadow-xl backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setSidebarTab("catalog")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all",
                sidebarTab === "catalog"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <Package className="size-3.5" /> Catálogo
            </button>
            <button
              type="button"
              onClick={() => setSidebarTab("info")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-all",
                sidebarTab === "info"
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:bg-muted/70",
              )}
            >
              <Home className="size-3.5" /> Info
            </button>
          </div>

          {sidebarTab === "catalog" && (
            <Card className="overflow-hidden border-white/15 bg-card/70 p-3 shadow-2xl backdrop-blur-xl">
              <DecorCatalog
                ownedItems={ownedFurniture}
                ownedThemes={ownedThemes}
                placedItemIds={placedItems.map((p) => p.item.id)}
                activeThemeSlug={activeTheme?.slug}
                onPickItem={handlePlaceItem}
                onApplyTheme={handleApplyTheme}
              />
              {ownedFurniture.length === 0 && (
                <div className="text-center pt-2">
                  <Link
                    to="/store"
                    className="text-xs text-primary flex items-center justify-center gap-1 hover:underline"
                  >
                    <ShoppingBag className="size-3" /> Ir para a Loja
                    <ChevronRight className="size-3" />
                  </Link>
                </div>
              )}
            </Card>
          )}

          {sidebarTab === "info" && (
            <Card className="space-y-4 overflow-hidden border-white/15 bg-card/70 p-4 shadow-2xl backdrop-blur-xl">
              <div>
                <p className="text-xs font-semibold mb-2">Visual ativo</p>
                <p className="text-sm font-semibold">{activeTheme?.name ?? "Clássico Produtivo"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Troque temas na aba Catálogo → Temas (após comprar na Loja).
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-2">Ocupação</p>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Itens colocados</span>
                  <span>{placedItems.length}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted shadow-inner">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (placedItems.length / 32) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Controles</p>
                <p>• Zoom +/- e reset na barra superior</p>
                <p>• Arraste o fundo para mover a cena (modo editar)</p>
                <p>• Verde/vermelho ao soltar item na grade</p>
                <p>• Rotação troca largura/altura do móvel</p>
              </div>
              {level < 5 && (
                <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-muted/50 p-3 text-xs">
                  <Lock className="size-3.5 mt-0.5 shrink-0" />
                  <span>Alcance nível 5 para mais itens de decoração na Loja.</span>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
