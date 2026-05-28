import { useMemo, useState } from "react";
import { Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FurnitureSVG } from "../furniture-sprites";
import { RARITY_STYLES, type ExtendedRarity } from "../rarity-frame";
import {
  DECOR_STYLES,
  PLACEMENT_ZONE_LABELS,
  getPlacementZone,
  matchesDecorFilter,
  type DecorStyle,
} from "../office-layout";
import type { AvatarItem } from "@/lib/queries";

type CatalogTab = "furniture" | "themes";

type DecorCatalogProps = {
  ownedItems: AvatarItem[];
  ownedThemes: AvatarItem[];
  placedItemIds: string[];
  activeThemeSlug?: string | null;
  onPickItem: (item: AvatarItem) => void;
  onApplyTheme: (item: AvatarItem) => void;
};

export function DecorCatalog({
  ownedItems,
  ownedThemes,
  placedItemIds,
  activeThemeSlug,
  onPickItem,
  onApplyTheme,
}: DecorCatalogProps) {
  const [tab, setTab] = useState<CatalogTab>("furniture");
  const [styleFilter, setStyleFilter] = useState<DecorStyle | "all">("all");
  const [search, setSearch] = useState("");
  const placed = new Set(placedItemIds);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ownedItems.filter((item) => {
      if (!matchesDecorFilter(item, styleFilter)) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.slug.toLowerCase().includes(q);
    });
  }, [ownedItems, styleFilter, search]);

  const filteredThemes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ownedThemes.filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [ownedThemes, search]);

  if (ownedItems.length === 0 && ownedThemes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/15 bg-muted/30 py-8 text-center text-sm text-muted-foreground shadow-inner">
        <Lock className="size-8 mx-auto mb-2 opacity-30" />
        Compre itens de escritório na Loja
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-2xl border border-white/15 bg-background/40 p-0.5">
        <button
          type="button"
          onClick={() => setTab("furniture")}
          className={cn(
            "flex-1 rounded-xl py-1.5 text-[11px] font-medium transition-all",
            tab === "furniture"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground",
          )}
        >
          Móveis ({ownedItems.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("themes")}
          className={cn(
            "flex-1 rounded-xl py-1.5 text-[11px] font-medium transition-all",
            tab === "themes"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground",
          )}
        >
          Temas ({ownedThemes.length})
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar..."
          className="h-8 pl-8 text-xs rounded-xl bg-background/50"
        />
      </div>

      {tab === "furniture" && (
        <>
          <div className="flex flex-wrap gap-1">
            {DECOR_STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyleFilter(s.id)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium border transition-all",
                  styleFilter === s.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-white/15 text-muted-foreground hover:bg-muted/60",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum item neste filtro.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredItems.map((item) => {
                const rarity = (item.rarity ?? "common") as ExtendedRarity;
                const rs = RARITY_STYLES[rarity];
                const isPlaced = placed.has(item.id);
                const zone = getPlacementZone(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onPickItem(item)}
                    disabled={isPlaced}
                    className={cn(
                      "relative flex flex-col items-center gap-1 overflow-hidden rounded-2xl border p-2 text-center text-xs shadow-lg backdrop-blur transition-all hover:-translate-y-0.5 disabled:opacity-55 disabled:hover:translate-y-0",
                      rs.border,
                      rs.bg,
                    )}
                  >
                    <span className="grid size-11 place-items-center rounded-xl bg-background/40 shadow-inner">
                      <FurnitureSVG item={item} size={38} />
                    </span>
                    <span className="font-medium leading-tight text-[10px] line-clamp-2">
                      {item.name}
                    </span>
                    <span className="rounded-full bg-background/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                      {PLACEMENT_ZONE_LABELS[zone]}
                    </span>
                    {isPlaced && (
                      <span className="absolute right-1 top-1 rounded-full bg-primary px-1 py-0.5 text-[8px] font-semibold text-primary-foreground">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "themes" && (
        <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto">
          {filteredThemes.map((theme) => {
            const active = (activeThemeSlug ?? "office_theme_classic") === theme.slug;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onApplyTheme(theme)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all hover:bg-muted/40",
                  active ? "border-primary bg-primary/10" : "border-white/15",
                )}
              >
                <FurnitureSVG item={theme} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{theme.name}</p>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {theme.description ?? "Visual do ambiente"}
                  </p>
                </div>
                {active && (
                  <span className="text-[10px] font-medium text-primary shrink-0">Ativo</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** @deprecated use DecorCatalog */
export function InventoryPlacer(props: {
  ownedOfficeItems: AvatarItem[];
  placedItemIds: string[];
  onPickItem: (item: AvatarItem) => void;
}) {
  return (
    <DecorCatalog
      ownedItems={props.ownedOfficeItems}
      ownedThemes={[]}
      placedItemIds={props.placedItemIds}
      onPickItem={props.onPickItem}
      onApplyTheme={() => {}}
    />
  );
}
