import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useProfile, useAvatarItems, useUserInventory, useUserAvatar, useInvalidate } from "@/lib/queries";
import { getLevelFromXP } from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ShoppingBag, Lock, CheckCircle2, Coins, Sparkles, Star, Zap, Crown, Layers, Circle } from "lucide-react";
import {
  buildEquipPayload,
  getAccessorySlot,
  getEquippedSlugs,
  getHighestEquippedRarity,
  getItemCollection,
  isAvatarItemEquipped,
  ACCESSORY_SLOT_LABELS,
  type AccessorySlot,
} from "@/lib/avatar-cosmetics";
import { RarityFrame, RarityBadge, RARITY_STYLES, type ExtendedRarity } from "@/components/gamification/rarity-frame";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import type { AvatarItem, UserAvatar } from "@/lib/queries";

export const Route = createFileRoute("/_app/store")({ component: StorePage });

const STORE_CATEGORIES = [
  { key: "all",          label: "Tudo",         icon: ShoppingBag },
  { key: "collections",  label: "Coleções",     icon: Layers      },
  { key: "face",         label: "Personagens",  icon: Sparkles    },
  { key: "outfit",       label: "Roupas",       icon: Crown       },
  { key: "accessory",    label: "Acessórios",   icon: Star        },
  { key: "aura",         label: "Auras",        icon: Circle      },
  { key: "pet",          label: "Pets",         icon: Zap         },
];

const ACCESSORY_SLOT_FILTERS: { key: AccessorySlot | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "head", label: "Cabeça" },
  { key: "face", label: "Rosto" },
  { key: "back", label: "Costas" },
  { key: "hand", label: "Mão" },
  { key: "chest", label: "Peito" },
];

type ParticleData = { id: number; x: number; y: number; color: string };

const HIDDEN_STORE_SLUGS = new Set(["acc_none", "acc_sunglasses"]);

function StorePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: allItems = [], isLoading } = useAvatarItems();
  const { data: ownedIds = [] } = useUserInventory(user?.id);
  const { data: avatar } = useUserAvatar(user?.id);
  const inv = useInvalidate();
  const [category, setCategory] = useState("all");
  const [accessorySlot, setAccessorySlot] = useState<AccessorySlot | "all">("all");
  const [buying, setBuying] = useState<string | null>(null);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const particleId = useRef(0);

  const xp = profile?.xp ?? 0;
  const coins = profile?.coins ?? 0;
  const userLevel = getLevelFromXP(xp);

  const equippedSlugs = getEquippedSlugs(avatar ?? null, allItems);
  const highlightRarity = getHighestEquippedRarity(equippedSlugs, allItems);
  const visibleItems = allItems.filter((item) => !HIDDEN_STORE_SLUGS.has(item.slug) && !item.category.startsWith("office_"));

  const filtered = (() => {
    if (category === "all") return visibleItems;
    if (category === "collections") return visibleItems.filter((i) => getItemCollection(i));
    if (category === "accessory") {
      const accessories = visibleItems.filter((i) => i.category === "accessory");
      if (accessorySlot === "all") return accessories;
      return accessories.filter((i) => {
        const slot = getAccessorySlot(i);
        return slot === accessorySlot;
      });
    }
    return visibleItems.filter((i) => i.category === category);
  })();

  const isOwned = (item: AvatarItem) => item.is_default || ownedIds.includes(item.id);
  const isEquipable = (item: AvatarItem) =>
    ["face", "outfit", "accessory", "aura", "pet"].includes(item.category);
  const isEquipped = (item: AvatarItem) => {
    return isAvatarItemEquipped(avatar ?? null, item);
  };

  const spawnParticles = (e: React.MouseEvent, color: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newParticles: ParticleData[] = Array.from({ length: 8 }).map(() => ({
      id: ++particleId.current,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      color,
    }));
    setParticles((p) => [...p, ...newParticles]);
    setTimeout(() => {
      setParticles((p) => p.filter((px) => !newParticles.map((n) => n.id).includes(px.id)));
    }, 1200);
  };

  const buy = async (item: AvatarItem, e: React.MouseEvent) => {
    if (!user || !profile) return;
    if (ownedIds.includes(item.id)) return;
    if (coins < item.price_coins) return toast.error("Moedas insuficientes!");
    if (userLevel < item.unlock_level) return toast.error(`Requer nível ${item.unlock_level}!`);

    setBuying(item.id);
    const { error: invError } = await supabase.from("user_inventory").insert({ user_id: user.id, item_id: item.id });
    if (invError) { setBuying(null); return toast.error(invError.message); }

    const { error: coinsError } = await supabase.from("profiles").update({ coins: coins - item.price_coins }).eq("id", user.id);
    if (coinsError) { setBuying(null); return toast.error(coinsError.message); }

    setBuying(null);
    inv.userInventory(user.id);
    inv.profile();

    const rarity = (item.rarity ?? "common") as ExtendedRarity;
    const color = RARITY_STYLES[rarity]?.color ?? "#6366f1";
    spawnParticles(e, color);
    toast.success(`${item.name} adquirido!`, { description: `${RARITY_STYLES[rarity].label} obtido!` });
  };

  const equip = async (item: AvatarItem) => {
    if (!user || !isEquipable(item) || !isOwned(item)) return;

    const payload = buildEquipPayload(user.id, item, avatar ?? null);

    const { error } = await (supabase as any).from("user_avatar").upsert(payload, { onConflict: "user_id" });
    if (error) return toast.error(error.message);

    inv.userAvatar(user.id);
    toast.success(`${item.name} equipado!`);
  };

  return (
    <div className="p-6 max-w-5xl space-y-6">
      {/* Particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="fixed pointer-events-none z-50"
          style={{ left: p.x, top: p.y }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: (Math.cos((i / 6) * Math.PI * 2) * 60) + (Math.random() - 0.5) * 30,
                y: (Math.sin((i / 6) * Math.PI * 2) * 60) - 40 + (Math.random() - 0.5) * 30,
                opacity: 0,
                scale: 0,
              }}
              transition={{ duration: 0.9, ease: "easeOut" }}
            />
          ))}
        </div>
      ))}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingBag className="size-6 text-primary" /> Loja
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Customize seu personagem
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <Coins className="size-4 text-amber-500" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Saldo</p>
              <p className="font-bold text-amber-600 dark:text-amber-400">{coins}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/25">
            <Crown className="size-4 text-primary" />
            <div>
              <p className="text-[10px] text-muted-foreground leading-none">Nível</p>
              <p className="font-bold text-primary">{userLevel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {STORE_CATEGORIES.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => {
                setCategory(c.key);
                if (c.key !== "accessory") setAccessorySlot("all");
              }}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all duration-200",
                category === c.key
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" /> {c.label}
            </button>
          );
        })}
      </div>

      {category === "accessory" && (
        <div className="flex flex-wrap gap-1.5">
          {ACCESSORY_SLOT_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setAccessorySlot(f.key)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all",
                accessorySlot === f.key
                  ? "bg-muted border-primary text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Items grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={category}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {filtered.map((item, i) => (
            <StoreCard
              key={item.id}
              item={item}
              avatar={avatar ?? null}
              owned={isOwned(item)}
              equipped={isEquipped(item)}
              equipable={isEquipable(item)}
              locked={userLevel < item.unlock_level}
              canAfford={coins >= item.price_coins}
              buying={buying === item.id}
              index={i}
              equippedSlugs={equippedSlugs}
              highlightRarity={highlightRarity}
              onBuy={(e) => buy(item, e)}
              onEquip={() => equip(item)}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="size-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum item nessa categoria.</p>
        </div>
      )}

      {/* How to earn */}
      <Card className="p-4 bg-muted/30">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Coins className="size-4 text-amber-500" /> Como ganhar moedas
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: "✅", label: "Tarefa concluída", val: "+10" },
            { icon: "🚀", label: "Entrega antecipada", val: "+5" },
            { icon: "🍅", label: "Sessão Pomodoro", val: "+2" },
            { icon: "🏅", label: "Conquista", val: "+bônus" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-xs text-muted-foreground bg-background/60 rounded-lg p-2">
              <span className="text-base">{item.icon}</span>
              <div>
                <p>{item.label}</p>
                <p className="font-bold text-amber-500">{item.val}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Store Card ───────────────────────────────────────────────────────────────

function StoreCard({
  item,
  avatar,
  owned,
  equipped,
  equipable,
  locked,
  canAfford,
  buying,
  index,
  equippedSlugs,
  highlightRarity,
  onBuy,
  onEquip,
}: {
  item: AvatarItem;
  avatar: UserAvatar | null;
  owned: boolean;
  equipped: boolean;
  equipable: boolean;
  locked: boolean;
  canAfford: boolean;
  buying: boolean;
  index: number;
  equippedSlugs: string[];
  highlightRarity: ExtendedRarity;
  onBuy: (e: React.MouseEvent) => void;
  onEquip: () => void;
}) {
  const rarity = (item.rarity ?? "common") as ExtendedRarity;
  const rs = RARITY_STYLES[rarity];
  const collection = getItemCollection(item);

  const basePreview = avatar
    ? { ...avatar, user_id: avatar.user_id ?? "", updated_at: avatar.updated_at ?? "" }
    : {
        face_emoji: "🧑",
        bg_color: "#6366f1",
        clothes_color: "#3b82f6",
        accessory_emoji: null,
        pet_emoji: null,
        user_id: "",
        updated_at: "",
      };

  const slot = item.category === "accessory" ? getAccessorySlot(item) : null;

  const fakeAvatar =
    item.category === "face"
      ? { ...basePreview, face_emoji: item.icon }
      : item.category === "outfit"
        ? { ...basePreview, bg_color: item.icon, clothes_color: item.icon }
        : item.category === "accessory" && slot && slot !== "aura"
          ? {
              ...basePreview,
              accessory_emoji: null,
              [`accessory_${slot}`]: item.slug === "acc_none" ? null : item.icon,
            }
          : item.category === "aura"
            ? { ...basePreview, aura_emoji: item.slug === "aura_none" ? null : item.icon }
            : item.category === "pet"
              ? { ...basePreview, pet_emoji: item.slug === "pet_none" ? null : item.icon }
              : null;

  const previewSlugs = fakeAvatar
    ? [...equippedSlugs.filter((s) => {
        if (item.category === "face") return !s.startsWith("face_");
        if (item.category === "outfit") return !s.startsWith("outfit_");
        if (item.category === "accessory") return !s.startsWith("acc_");
        if (item.category === "aura") return !s.startsWith("aura_");
        if (item.category === "pet") return !s.startsWith("pet_");
        return true;
      }), item.slug !== "acc_none" && item.slug !== "aura_none" && item.slug !== "pet_none" ? item.slug : ""].filter(Boolean)
    : equippedSlugs;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
    >
      <RarityFrame rarity={rarity} hoverEffect={!owned && !locked} className="h-full">
        <div className={cn("p-4 flex flex-col items-center gap-3 text-center", locked && "opacity-55")}>
          {/* Visual preview */}
          <div className="relative">
            {fakeAvatar ? (
              <div
                className="relative size-24 flex items-center justify-center rounded-2xl overflow-hidden border shadow-inner"
                style={{
                  borderColor: `${rs.color}35`,
                  background: `radial-gradient(circle at 50% 18%, ${rs.color}30, transparent 42%), linear-gradient(160deg, ${rs.color}1f, transparent 70%)`,
                }}
              >
                <div className="absolute inset-x-4 bottom-3 h-3 rounded-full bg-black/15 blur-[2px]" />
                <Avatar2D
                  avatar={fakeAvatar}
                  size="lg"
                  animate={false}
                  className="relative z-10 scale-110"
                  equippedSlugs={previewSlugs}
                  highlightRarity={item.rarity as ExtendedRarity}
                />
                {rarity !== "common" && (
                  <div
                    className="absolute right-2 top-2 size-2 rounded-full shadow-[0_0_14px_currentColor]"
                    style={{ color: rs.color, backgroundColor: rs.color }}
                  />
                )}
              </div>
            ) : (
              <div className="size-20 flex items-center justify-center text-5xl">
                {item.icon}
              </div>
            )}

            {owned && (
              <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                <CheckCircle2 className="size-3.5 text-primary-foreground" />
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-bold leading-tight">{item.name}</p>
            {fakeAvatar && (
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {item.category === "face"
                  ? "Mascote"
                  : item.category === "outfit"
                    ? "Roupa"
                    : item.category === "accessory"
                      ? slot && slot !== "aura"
                        ? `Acessório · ${ACCESSORY_SLOT_LABELS[slot as AccessorySlot]}`
                        : "Acessório"
                      : item.category === "aura"
                        ? "Aura"
                        : "Companheiro"}
              </p>
            )}
            {collection && (
              <p
                className="mx-auto mt-1 w-fit rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ color: collection.tone, backgroundColor: `${collection.tone}1f` }}
              >
                {collection.label}
              </p>
            )}
            <RarityBadge rarity={rarity} className="mt-1" />
          </div>

          {/* Unlock/price */}
          {locked ? (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 rounded-full px-2 py-1 mt-auto">
              <Lock className="size-3" /> Nível {item.unlock_level}
            </div>
          ) : owned ? (
            equipable ? (
              <Button
                size="sm"
                variant={equipped ? "secondary" : "outline"}
                className="w-full text-xs h-7 mt-auto gap-1"
                onClick={onEquip}
                disabled={equipped}
              >
                <CheckCircle2 className="size-3.5" />
                {equipped ? "Equipado" : "Equipar"}
              </Button>
            ) : (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-primary mt-auto">
                <CheckCircle2 className="size-3.5" /> Adquirido
              </div>
            )
          ) : item.price_coins === 0 ? (
            <Button size="sm" className="w-full text-xs h-7 mt-auto" onClick={onBuy} disabled={buying}>
              {buying ? "Obtendo…" : "Grátis!"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant={canAfford ? "default" : "outline"}
              className={cn(
                "w-full text-xs h-7 mt-auto gap-1",
                !canAfford && "opacity-60",
              )}
              onClick={onBuy}
              disabled={buying || !canAfford}
            >
              <Coins className="size-3 text-amber-400" />
              {buying ? "…" : item.price_coins}
            </Button>
          )}
        </div>
      </RarityFrame>
    </motion.div>
  );
}
