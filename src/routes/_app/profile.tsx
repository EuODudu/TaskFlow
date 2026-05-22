import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import {
  useProfile, useUserBadges, useBadges, useUserAvatar, useAvatarItems,
  useUserInventory, useOfficeItems, useXpEvents, useInvalidate,
  type AvatarItem, type UserAvatar,
} from "@/lib/queries";
import {
  buildEquipPayload,
  getCollectionBonus,
  getItemCollection,
  getEquippedSlugs,
  getHighestEquippedRarity,
  getAccessorySlot,
  isAvatarItemEquipped,
  POSE_OPTIONS,
  resolveAvatarAccessories,
  ACCESSORY_SLOT_LABELS,
  type AccessorySlot,
} from "@/lib/avatar-cosmetics";
import { Link } from "@tanstack/react-router";
import {
  getLevelFromXP, getRankFromLevel, getLevelProgress,
  getXPForLevel, getXPForNextLevel, formatXP, RARITY_META, type BadgeRarity,
} from "@/lib/gamification";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar2D } from "@/components/gamification/avatar-2d";
import { FurnitureSVG } from "@/components/gamification/furniture-sprites";
import { LevelBadge } from "@/components/gamification/level-badge";
import { XPBar } from "@/components/gamification/xp-bar";
import { RarityBadge, RARITY_STYLES, type ExtendedRarity } from "@/components/gamification/rarity-frame";
import { Flame, Coins, Edit2, Check, X, ChevronRight, Trophy, Zap, Clock, Package, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/_app/profile")({ component: ProfilePage });

const SKIN_TONES = [
  { label: "Tom 1", value: "#FDBCB4" },
  { label: "Tom 2", value: "#F0C27F" },
  { label: "Tom 3", value: "#FFD9B3" },
  { label: "Tom 4", value: "#C68642" },
  { label: "Tom 5", value: "#8D5524" },
  { label: "Tom 6", value: "#4A2912" },
];

const HAIR_COLORS = [
  "#1a0a00", "#5D3A1A", "#8B4513", "#D4A017", "#FFD700",
  "#FF6B9D", "#7c3aed", "#1e40af", "#1B5E20", "#374151",
];

const DEFAULT_SKIN_TONE = SKIN_TONES[0].value;
const DEFAULT_HAIR_COLOR = HAIR_COLORS[1];
const DEFAULT_HAIR_STYLE = "casual";

const SEX_OPTIONS = [
  { label: "Masculino", value: "🧑" },
  { label: "Feminino", value: "👩" },
];

const HAIR_STYLES = [
  { label: "Casual", value: "casual" },
  { label: "Curto", value: "short" },
  { label: "Longo", value: "long" },
  { label: "Formal", value: "formal" },
];

const HIDDEN_INVENTORY_SLUGS = new Set(["acc_sunglasses"]);

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: userBadges = [] } = useUserBadges(user?.id);
  const { data: allBadges = [] } = useBadges();
  const { data: avatar } = useUserAvatar(user?.id);
  const { data: allItems = [] } = useAvatarItems();
  const { data: ownedIds = [] } = useUserInventory(user?.id);
  const { data: officeRows = [] } = useOfficeItems(user?.id);
  const { data: xpEvents = [] } = useXpEvents(user?.id);
  const inv = useInvalidate();

  const equippedSlugs = getEquippedSlugs(avatar ?? null, allItems);
  const highlightRarity = getHighestEquippedRarity(equippedSlugs, allItems);
  const collectionBonus = getCollectionBonus(equippedSlugs);
  const accessorySlots = resolveAvatarAccessories(avatar);
  const activeOfficeTheme = officeRows.find((row) => row.item?.category === "office_theme")?.item;
  const ownedItems = allItems.filter((item) => (item.is_default || ownedIds.includes(item.id)) && !HIDDEN_INVENTORY_SLUGS.has(item.slug));

  const xp = profile?.xp ?? 0;
  const level = getLevelFromXP(xp);
  const rank = getRankFromLevel(level);
  const progress = getLevelProgress(xp);
  const currentXP = getXPForLevel(level);
  const nextXP = getXPForNextLevel(level);

  const earnedBadgeIds = new Set(userBadges.map((b) => b.badge_id));
  const totalTasks = xpEvents.filter((e) => e.reason === "task_completed").length;
  const totalPomodoro = xpEvents.filter((e) => e.reason === "pomodoro_session").length;

  const [editingAvatar, setEditingAvatar] = useState(false);
  const [pageTab, setPageTab] = useState<"overview" | "inventory">("overview");
  const [activeTab, setActiveTab] = useState<"sex" | "skin" | "hairColor" | "hairStyle" | "pose">("sex");
  const [draft, setDraft] = useState<Partial<UserAvatar> & { skin_tone?: string; hair_color?: string; hair_style?: string; pose?: string }>({});

  const isEquipableInventoryItem = (item: AvatarItem) =>
    ["face", "outfit", "accessory", "aura", "pet", "office_theme", "office_item"].includes(item.category);

  const isInventoryItemEquipped = (item: AvatarItem) => {
    if (item.category === "office_theme") return (activeOfficeTheme?.slug ?? "office_theme_classic") === item.slug;
    if (item.category === "office_item") return officeRows.some((row) => row.item_id === item.id);
    return isAvatarItemEquipped(avatar ?? null, item);
  };

  const equipInventoryItem = async (item: AvatarItem) => {
    if (!user || !isEquipableInventoryItem(item)) return;

    if (item.category === "office_item") {
      const placedOfSameItem = officeRows.find((row) => row.item_id === item.id);
      if (placedOfSameItem) {
        toast.info("Esse item já está no escritório.");
        return;
      }

      const { error } = await (supabase as any).from("office_items").insert({
        user_id: user.id,
        item_id: item.id,
        grid_x: 0,
        grid_y: 4,
        rotation: 0,
      });
      if (error) return toast.error(error.message);

      inv.officeItems(user.id);
      toast.success(`${item.name} adicionado ao escritório!`);
      return;
    }

    if (item.category === "office_theme") {
      const existingThemeIds = officeRows
        .filter((row) => row.item?.category === "office_theme")
        .map((row) => row.id);

      if (existingThemeIds.length > 0) {
        const { error: deleteError } = await (supabase as any)
          .from("office_items")
          .delete()
          .in("id", existingThemeIds);
        if (deleteError) return toast.error(deleteError.message);
      }

      if (item.slug !== "office_theme_classic") {
        const { error: insertError } = await (supabase as any).from("office_items").insert({
          user_id: user.id,
          item_id: item.id,
          grid_x: -1,
          grid_y: -1,
          rotation: 0,
        });
        if (insertError) return toast.error(insertError.message);
      }

      inv.officeItems(user.id);
      toast.success(`${item.name} aplicado no escritório!`);
      return;
    }

    const payload = buildEquipPayload(user.id, item, avatar ?? null);
    const { error } = await (supabase as any).from("user_avatar").upsert(payload, { onConflict: "user_id" });
    if (error) return toast.error(error.message);

    inv.userAvatar(user.id);
    toast.success(`${item.name} equipado!`);
  };

  const openEdit = () => {
    const currentFace = (avatar as any)?.face_emoji;
    const baseSex = SEX_OPTIONS.some((option) => option.value === currentFace) ? currentFace : "🧑";
    setDraft({
      face_emoji: baseSex,
      bg_color: (avatar as any)?.bg_color ?? "#6366f1",
      skin_tone: (avatar as any)?.skin_tone ?? undefined,
      hair_color: (avatar as any)?.hair_color ?? undefined,
      hair_style: (avatar as any)?.hair_style ?? undefined,
      pose: (avatar as any)?.pose ?? "idle",
    });
    setActiveTab("sex");
    setEditingAvatar(true);
  };

  const saveAvatar = async () => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      face_emoji: draft.face_emoji ?? "🧑",
      bg_color: (avatar as any)?.bg_color ?? draft.bg_color ?? "#6366f1",
      skin_tone: draft.skin_tone ?? DEFAULT_SKIN_TONE,
      hair_color: draft.hair_color ?? DEFAULT_HAIR_COLOR,
      hair_style: draft.hair_style ?? DEFAULT_HAIR_STYLE,
      pose: draft.pose ?? "idle",
    };
    const { error } = await (supabase as any).from("user_avatar").upsert(payload, { onConflict: "user_id" });
    if (error) return toast.error(error.message);
    inv.userAvatar(user.id);
    setEditingAvatar(false);
    toast.success("Personagem salvo!");
  };

  const previewAvatar = {
    user_id: user?.id ?? "",
    face_emoji: draft.face_emoji ?? "🧑",
    bg_color: (avatar as any)?.bg_color ?? draft.bg_color ?? "#6366f1",
    accessory_emoji: (avatar as any)?.accessory_emoji ?? null,
    pet_emoji: (avatar as any)?.pet_emoji ?? null,
    updated_at: "",
    skin_tone: draft.skin_tone,
    hair_color: draft.hair_color,
    hair_style: draft.hair_style,
    clothes_color: (avatar as any)?.clothes_color,
    pose: draft.pose,
    accessory_head: (avatar as any)?.accessory_head,
    accessory_face: (avatar as any)?.accessory_face,
    accessory_back: (avatar as any)?.accessory_back,
    accessory_hand: (avatar as any)?.accessory_hand,
    accessory_chest: (avatar as any)?.accessory_chest,
    aura_emoji: (avatar as any)?.aura_emoji,
  } as any;

  const displayAvatar = editingAvatar ? previewAvatar : avatar as any;
  const currentPose = POSE_OPTIONS.find((option) => option.value === ((displayAvatar as any)?.pose ?? "idle")) ?? POSE_OPTIONS[0];
  const equippedCount =
    Object.values(accessorySlots).filter(Boolean).length +
    ((avatar as { aura_emoji?: string })?.aura_emoji ? 1 : 0) +
    (avatar?.pet_emoji ? 1 : 0);

  const EDITOR_TABS = [
    { key: "sex",       label: "Sexo" },
    { key: "skin",      label: "Tom da pele" },
    { key: "hairColor", label: "Cor do cabelo" },
    { key: "hairStyle", label: "Tipo de cabelo" },
    { key: "pose",      label: "Pose" },
  ] as const;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Perfil</p>
          <h1 className="text-3xl font-bold tracking-tight">Meu personagem</h1>
        </div>
        <p className="text-sm text-muted-foreground">Progresso, visual e conquistas sem excesso.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border bg-muted/25 p-1">
        {[
          { key: "overview", label: "Visão geral", icon: Sparkles },
          { key: "inventory", label: "Inventário", icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setPageTab(tab.key as "overview" | "inventory")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
                pageTab === tab.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {pageTab === "overview" ? (
        <>
      {/* Hero card */}
      <Card className="relative overflow-hidden border-border/70 bg-card p-0 shadow-sm">
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none opacity-20"
          style={{
            background: `linear-gradient(135deg, ${collectionBonus?.glow ?? rank.color}55, transparent 68%)`,
          }}
        />

        <div className="relative grid gap-0 lg:grid-cols-[300px_1fr]">
          {/* Avatar */}
          <div className="relative flex min-h-[300px] flex-col items-center justify-center gap-4 border-b border-border/60 p-6 lg:border-b-0 lg:border-r">
            <div
              className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs font-semibold"
              style={{ color: currentPose.accent, borderColor: `${currentPose.accent}30` }}
            >
              <span>{currentPose.icon}</span>
              {currentPose.label}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="relative z-10 flex size-52 items-center justify-center rounded-[1.75rem] border bg-muted/30 shadow-inner"
            >
              <div
                className="absolute inset-5 rounded-[1.3rem] blur-2xl opacity-25"
                style={{ backgroundColor: collectionBonus?.glow ?? rank.color }}
              />
              <Avatar2D
                avatar={displayAvatar}
                size="2xl"
                animate={!editingAvatar}
                equippedSlugs={equippedSlugs}
                highlightRarity={highlightRarity}
                className="relative scale-110"
              />
            </motion.div>

            <button
              onClick={editingAvatar ? saveAvatar : openEdit}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
            >
              {editingAvatar ? <Check className="size-4" /> : <Edit2 className="size-4" />}
              {editingAvatar ? "Salvar visual" : "Editar personagem"}
            </button>
            {editingAvatar && (
              <button
                onClick={() => setEditingAvatar(false)}
                className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-2 text-sm font-semibold transition-all hover:bg-destructive/10"
              >
                <X className="size-4" />
                Cancelar
              </button>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 p-6 lg:p-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <LevelBadge xp={xp} size="sm" />
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ color: rank.color, backgroundColor: `${rank.color}14` }}
                >
                  {rank.emoji} {rank.title}
                </span>
                {collectionBonus && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                    style={{ color: collectionBonus.glow, backgroundColor: `${collectionBonus.glow}14` }}
                  >
                    {collectionBonus.collection.label}
                  </span>
                )}
              </div>
              <div>
                <h2 className="truncate text-2xl font-bold">{profile?.full_name ?? user?.email}</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  Pose <span className="font-semibold text-foreground">{currentPose.label}</span>
                  {equippedCount > 0 ? ` · ${equippedCount} item(ns) equipados` : " · visual básico"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-background/50 p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Progresso</p>
                  <p className="text-sm font-semibold">Rumo ao nível {level + 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{formatXP(xp - currentXP)} / {formatXP(nextXP - currentXP)} XP</p>
                  <p className="text-xs font-semibold text-primary">{formatXP(xp)} XP total</p>
                </div>
              </div>
              <XPBar xp={xp} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatPill icon={<Flame className="size-4 text-orange-500" />} value={profile?.streak_days ?? 0} label="streak" />
              <StatPill icon={<Coins className="size-4 text-amber-500" />} value={profile?.coins ?? 0} label="moedas" />
              <StatPill icon={<Zap className="size-4 text-primary" />} value={formatXP(xp)} label="XP" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Visual equipado</p>
                <Link to="/store" className="text-xs font-medium text-primary hover:underline">Loja</Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(accessorySlots) as [AccessorySlot, string | null][])
                  .filter(([, v]) => v)
                  .map(([slot, emoji]) => (
                    <span key={slot} className="inline-flex items-center gap-1.5 rounded-full border bg-muted/35 px-2.5 py-1 text-xs">
                      <span>{emoji}</span>
                      <span className="text-muted-foreground">{ACCESSORY_SLOT_LABELS[slot]}</span>
                    </span>
                  ))}
                {(avatar as { aura_emoji?: string })?.aura_emoji && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/35 px-2.5 py-1 text-xs">
                    <span>{(avatar as { aura_emoji?: string }).aura_emoji}</span>
                    <span className="text-muted-foreground">Aura</span>
                  </span>
                )}
                {avatar?.pet_emoji && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted/35 px-2.5 py-1 text-xs">
                    <span>{avatar.pet_emoji}</span>
                    <span className="text-muted-foreground">Pet</span>
                  </span>
                )}
                {!Object.values(accessorySlots).some(Boolean) &&
                  !(avatar as { aura_emoji?: string })?.aura_emoji &&
                  !avatar?.pet_emoji && (
                    <p className="text-xs text-muted-foreground">Nenhum acessório equipado.</p>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Avatar Editor */}
        {editingAvatar && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t bg-background/35 p-6 space-y-4"
          >
            {/* Editor tabs */}
            <div className="flex flex-wrap gap-1.5">
              {EDITOR_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sex selection */}
            {activeTab === "sex" && (
              <div className="flex flex-wrap gap-3">
                {SEX_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraft((d) => ({ ...d, face_emoji: option.value }))}
                    className={cn(
                      "w-28 rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all hover:scale-105 bg-muted/30",
                      draft.face_emoji === option.value
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <Avatar2D
                      avatar={{ ...previewAvatar, face_emoji: option.value }}
                      size="md"
                      animate={false}
                    />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Skin tone */}
            {activeTab === "skin" && (
              <div className="flex flex-wrap gap-3">
                {SKIN_TONES.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setDraft((d) => ({ ...d, skin_tone: s.value }))}
                    title={s.label}
                    className={cn(
                      "size-10 rounded-full border-4 transition-all hover:scale-110",
                      draft.skin_tone === s.value
                        ? "border-primary scale-110"
                        : "border-border hover:border-primary/60",
                    )}
                    style={{ background: s.value }}
                  />
                ))}
              </div>
            )}

            {/* Hair color */}
            {activeTab === "hairColor" && (
              <div className="flex flex-wrap gap-3">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setDraft((d) => ({ ...d, hair_color: c }))}
                    className={cn(
                      "size-10 rounded-full border-4 transition-all hover:scale-110",
                      draft.hair_color === c
                        ? "border-primary scale-110"
                        : "border-border hover:border-primary/60",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            )}

            {activeTab === "pose" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {POSE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDraft((d) => ({ ...d, pose: option.value }))}
                    className={cn(
                      "group rounded-2xl border-2 bg-muted/30 p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md",
                      (draft.pose ?? "idle") === option.value
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-20 shrink-0 items-center justify-center rounded-xl border bg-background/70"
                        style={{ borderColor: `${option.accent}35` }}
                      >
                        <Avatar2D
                          avatar={{ ...previewAvatar, pose: option.value }}
                          size="md"
                          animate
                          equippedSlugs={equippedSlugs}
                          className="scale-110"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold">
                          <span className="mr-1">{option.icon}</span>
                          {option.label}
                        </p>
                        <p className="mt-1 text-xs leading-snug text-muted-foreground">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Hair style */}
            {activeTab === "hairStyle" && (
              <div className="flex flex-wrap gap-3">
                {HAIR_STYLES.map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setDraft((d) => ({ ...d, hair_style: style.value }))}
                    className={cn(
                      "w-24 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all hover:scale-105",
                      (draft.hair_style ?? DEFAULT_HAIR_STYLE) === style.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-muted/30 hover:border-primary/50",
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={saveAvatar}>Salvar personagem</Button>
              <Button variant="ghost" onClick={() => setEditingAvatar(false)}>Cancelar</Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Tarefas", value: totalTasks, icon: "✅", color: "#10b981" },
          { label: "Pomodoro", value: totalPomodoro, icon: "🍅", color: "#ef4444" },
          { label: "Streak", value: `${profile?.streak_days ?? 0}d`, icon: "🔥", color: "#f59e0b" },
          { label: "Conquistas", value: `${earnedBadgeIds.size}/${allBadges.length}`, icon: "🏅", color: "#a855f7" },
        ].map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-3 overflow-hidden relative">
            <div className="absolute inset-0 opacity-5" style={{ background: s.color }} />
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Badges showcase */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" /> Conquistas
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {allBadges.slice(0, 10).map((badge) => {
            const earned = earnedBadgeIds.has(badge.id);
            const rarity = (badge.rarity ?? "common") as ExtendedRarity;
            const rs = RARITY_STYLES[rarity];
            return (
              <div
                key={badge.id}
                className={cn(
                  "rounded-xl p-3 border text-center space-y-1 transition-all",
                  earned
                    ? cn("bg-card", rs.border, rs.glow && `shadow-md ${rs.glow}`)
                    : "border-border opacity-35 grayscale",
                )}
              >
                <div className="text-2xl">{badge.icon}</div>
                <p className="text-[11px] font-bold leading-tight">{badge.name}</p>
                <RarityBadge rarity={rarity} />
              </div>
            );
          })}
        </div>
        {allBadges.length > 10 && (
          <a href="/achievements" className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver todas as conquistas <ChevronRight className="size-3" />
          </a>
        )}
      </Card>

      {/* XP history */}
      {xpEvents.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Histórico de XP
          </h2>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {xpEvents.slice(0, 20).map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="text-base">{REASON_ICON[ev.reason] ?? "⚡"}</span>
                <span className="flex-1 text-muted-foreground text-xs">{REASON_LABEL[ev.reason] ?? ev.reason}</span>
                <span className="font-semibold text-primary text-xs">+{ev.amount} XP</span>
                <span className="text-[10px] text-muted-foreground">{format(new Date(ev.created_at), "dd/MM HH:mm")}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
        </>
      ) : (
        <InventoryTab
          avatar={avatar ?? null}
          items={ownedItems}
          equippedSlugs={equippedSlugs}
          highlightRarity={highlightRarity}
          isEquipped={isInventoryItemEquipped}
          isEquipable={isEquipableInventoryItem}
          onEquip={equipInventoryItem}
        />
      )}
    </div>
  );
}

const REASON_ICON: Record<string, string> = {
  task_completed:   "✅",
  early_delivery:   "🚀",
  pomodoro_session: "🍅",
  badge_earned:     "🏅",
  streak_bonus:     "🔥",
};
const REASON_LABEL: Record<string, string> = {
  task_completed:   "Tarefa concluída",
  early_delivery:   "Entrega antecipada",
  pomodoro_session: "Sessão Pomodoro",
  badge_earned:     "Conquista desbloqueada",
  streak_bonus:     "Bônus de streak",
};

type InventoryCategory = "all" | "face" | "outfit" | "accessory" | "aura" | "pet" | "office_item" | "office_theme";

const INVENTORY_CATEGORIES: { key: InventoryCategory; label: string }[] = [
  { key: "all", label: "Tudo" },
  { key: "face", label: "Personagens" },
  { key: "outfit", label: "Roupas" },
  { key: "accessory", label: "Acessórios" },
  { key: "aura", label: "Auras" },
  { key: "pet", label: "Pets" },
  { key: "office_item", label: "Escritório" },
  { key: "office_theme", label: "Temas" },
];

const CATEGORY_LABEL: Record<string, string> = {
  face: "Personagem",
  outfit: "Roupa",
  accessory: "Acessório",
  aura: "Aura",
  pet: "Pet",
  office_item: "Item de escritório",
  office_theme: "Tema do escritório",
};

function InventoryTab({
  avatar,
  items,
  equippedSlugs,
  highlightRarity,
  isEquipped,
  isEquipable,
  onEquip,
}: {
  avatar: UserAvatar | null;
  items: AvatarItem[];
  equippedSlugs: string[];
  highlightRarity: ExtendedRarity;
  isEquipped: (item: AvatarItem) => boolean;
  isEquipable: (item: AvatarItem) => boolean;
  onEquip: (item: AvatarItem) => void;
}) {
  const [category, setCategory] = useState<InventoryCategory>("all");
  const filtered = category === "all" ? items : items.filter((item) => item.category === category);

  const counts = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card className="overflow-hidden border-border/70 bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Inventário</p>
          <h2 className="text-2xl font-bold tracking-tight">Itens adquiridos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Equipe acessórios, pets, auras, roupas, personagens e itens de escritório sem sair do perfil.
          </p>
        </div>
        <div className="rounded-full border bg-muted/35 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
          {items.length} item(ns)
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {INVENTORY_CATEGORIES.map((tab) => {
          const total = tab.key === "all" ? items.length : (counts[tab.key] ?? 0);
          return (
            <button
              key={tab.key}
              onClick={() => setCategory(tab.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all",
                category === tab.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {tab.label}
              <span className="ml-1 opacity-70">{total}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          Nenhum item nessa categoria ainda. Compre na loja para aparecer aqui.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              avatar={avatar}
              equipped={isEquipped(item)}
              equipable={isEquipable(item)}
              equippedSlugs={equippedSlugs}
              highlightRarity={highlightRarity}
              onEquip={() => onEquip(item)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}

function InventoryItemCard({
  item,
  avatar,
  equipped,
  equipable,
  equippedSlugs,
  highlightRarity,
  onEquip,
}: {
  item: AvatarItem;
  avatar: UserAvatar | null;
  equipped: boolean;
  equipable: boolean;
  equippedSlugs: string[];
  highlightRarity: ExtendedRarity;
  onEquip: () => void;
}) {
  const rarity = (item.rarity ?? "common") as ExtendedRarity;
  const rarityStyle = RARITY_STYLES[rarity] ?? RARITY_STYLES.common;
  const collection = getItemCollection(item);
  const slot = item.category === "accessory" ? getAccessorySlot(item) : null;
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

  const previewAvatar =
    item.category === "face"
      ? { ...basePreview, face_emoji: item.icon }
      : item.category === "outfit"
        ? { ...basePreview, bg_color: item.icon, clothes_color: item.icon }
        : item.category === "accessory" && slot && slot !== "aura"
          ? { ...basePreview, accessory_emoji: null, [`accessory_${slot}`]: item.slug === "acc_none" ? null : item.icon }
          : item.category === "aura"
            ? { ...basePreview, aura_emoji: item.slug === "aura_none" ? null : item.icon }
            : item.category === "pet"
              ? { ...basePreview, pet_emoji: item.slug === "pet_none" ? null : item.icon }
              : null;

  const actionLabel =
    item.category === "office_item"
      ? equipped
        ? "No escritório"
        : "Colocar"
      : equipped
        ? "Equipado"
        : "Equipar";

  return (
    <div className={cn("rounded-2xl border bg-background/45 p-4 shadow-sm", rarityStyle.border)}>
      <div className="flex gap-3">
        <div
          className="grid size-20 shrink-0 place-items-center rounded-2xl border bg-muted/30"
          style={{ borderColor: `${rarityStyle.color}35` }}
        >
          {previewAvatar ? (
            <Avatar2D
              avatar={previewAvatar as UserAvatar}
              size="md"
              animate={false}
              equippedSlugs={equippedSlugs}
              highlightRarity={highlightRarity}
              className="scale-110"
            />
          ) : item.category === "office_item" || item.category === "office_theme" ? (
            <FurnitureSVG item={item} size={52} />
          ) : (
            <span className="text-4xl">{item.icon}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{item.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.category === "accessory" && slot && slot !== "aura"
                  ? `${CATEGORY_LABEL[item.category]} · ${ACCESSORY_SLOT_LABELS[slot]}`
                  : CATEGORY_LABEL[item.category] ?? item.category}
              </p>
            </div>
            {equipped && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Ativo
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <RarityBadge rarity={rarity} />
            {collection && (
              <span
                className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                style={{ color: collection.tone, backgroundColor: `${collection.tone}1f` }}
              >
                {collection.label}
              </span>
            )}
          </div>

          {item.description && (
            <p className="mt-2 line-clamp-2 text-xs leading-snug text-muted-foreground">{item.description}</p>
          )}
        </div>
      </div>

      <Button
        size="sm"
        variant={equipped ? "secondary" : "default"}
        className="mt-4 w-full"
        disabled={!equipable || equipped}
        onClick={onEquip}
      >
        {equipable ? actionLabel : "Adquirido"}
      </Button>
    </div>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-muted/40 min-w-[60px]">
      {icon}
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
