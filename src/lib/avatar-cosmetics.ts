import type { AvatarItem, UserAvatar } from "@/lib/queries";
import type { ExtendedRarity } from "@/components/gamification/rarity-frame";

export type AccessorySlot = "head" | "face" | "back" | "hand" | "chest";
export type AvatarPose = "idle" | "hero" | "cool" | "focus" | "victory" | "sprint";

export type ResolvedAccessories = Record<AccessorySlot, string | null>;

const EMOJI_SLOT: Record<string, AccessorySlot> = {
  "🕶️": "face",
  "🎧": "head",
  "🎩": "head",
  "👑": "head",
  "🧢": "head",
  "🌸": "head",
  "🧭": "head",
  "🪽": "back",
  "🦸": "back",
  "🎒": "back",
  "🛡️": "back",
  "⭕": "head",
  "⚡": "hand",
  "💼": "hand",
  "🪄": "hand",
  "☕": "hand",
  "📘": "hand",
  "🎯": "hand",
  "🛸": "hand",
  "🌙": "chest",
  "💎": "chest",
  "🧣": "chest",
  "🏅": "chest",
};

const SLUG_PREFIX_SLOT: Record<string, AccessorySlot> = {
  acc_head_: "head",
  acc_face_: "face",
  acc_back_: "back",
  acc_hand_: "hand",
  acc_chest_: "chest",
};

export const ACCESSORY_SLOT_LABELS: Record<AccessorySlot, string> = {
  head: "Cabeça",
  face: "Rosto",
  back: "Costas",
  hand: "Mão",
  chest: "Peito",
};

export const POSE_OPTIONS: {
  value: AvatarPose;
  label: string;
  description: string;
  icon: string;
  accent: string;
}[] = [
  { value: "idle", label: "Relaxado", description: "Leve movimento de respiração", icon: "✨", accent: "#6366f1" },
  { value: "hero", label: "Herói", description: "Postura forte com brilho ascendente", icon: "🦸", accent: "#2563eb" },
  { value: "cool", label: "Confiante", description: "Balanço sutil e atitude", icon: "😎", accent: "#06b6d4" },
  { value: "focus", label: "Foco", description: "Pulso calmo para concentração", icon: "🎯", accent: "#22c55e" },
  { value: "victory", label: "Vitória", description: "Celebração com estrelas", icon: "🏆", accent: "#f59e0b" },
  { value: "sprint", label: "Sprint", description: "Energia rápida com linhas de movimento", icon: "⚡", accent: "#f97316" },
];

export type AvatarCollection = {
  id: string;
  label: string;
  tone: string;
  /** Slugs de skin (face) que contam para o conjunto */
  faces: string[];
  outfits: string[];
  accessories?: string[];
};

export const AVATAR_COLLECTIONS: AvatarCollection[] = [
  {
    id: "dragon",
    label: "Coleção Dragão",
    tone: "#f97316",
    faces: ["face_dragon_exec"],
    outfits: ["outfit_dragon_scale", "outfit_lava_king"],
    accessories: ["acc_crown", "acc_lightning"],
  },
  {
    id: "shadow",
    label: "Coleção Sombria",
    tone: "#dc2626",
    faces: ["face_vampire_ceo", "face_shadow_agent"],
    outfits: ["outfit_vampire_velvet", "outfit_crimson_royalty", "outfit_shadow_ops"],
    accessories: ["acc_moon", "acc_shield"],
  },
  {
    id: "magic",
    label: "Coleção Mágica",
    tone: "#ec4899",
    faces: ["face_fairy_sprint"],
    outfits: ["outfit_fairy_glow"],
    accessories: ["acc_wand", "acc_flower"],
  },
  {
    id: "crystal",
    label: "Coleção Cristal",
    tone: "#06b6d4",
    faces: ["face_ice_overlord", "face_diamond_emperor"],
    outfits: ["outfit_ice_armor", "outfit_diamond_luxury"],
    accessories: ["acc_gem", "acc_halo"],
  },
  {
    id: "cosmic",
    label: "Coleção Cósmica",
    tone: "#8b5cf6",
    faces: ["face_saturn_guardian"],
    outfits: ["outfit_galaxy_royal"],
    accessories: ["acc_compass"],
  },
  {
    id: "cyber",
    label: "Coleção Cyber",
    tone: "#22d3ee",
    faces: ["face_biohacker"],
    outfits: ["outfit_cyber_gold", "outfit_hologram_suit", "outfit_toxic_neon"],
    accessories: ["acc_headset", "acc_drone"],
  },
];

const RARITY_RANK: Record<ExtendedRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

export function getAccessorySlot(item: Pick<AvatarItem, "slug" | "category" | "icon">): AccessorySlot | "aura" | null {
  if (item.category === "aura") return "aura";
  if (item.category !== "accessory") return null;
  if (item.slug === "acc_none") return null;

  for (const [prefix, slot] of Object.entries(SLUG_PREFIX_SLOT)) {
    if (item.slug.startsWith(prefix)) return slot;
  }
  return EMOJI_SLOT[item.icon] ?? "head";
}

export function getItemCollection(item: AvatarItem): { label: string; tone: string } | null {
  const slug = item.slug;
  if (slug.includes("dragon") || slug.includes("lava")) return { label: "Coleção Dragão", tone: "#f97316" };
  if (slug.includes("vampire") || slug.includes("crimson")) return { label: "Coleção Sombria", tone: "#dc2626" };
  if (slug.includes("fairy") || slug.includes("aurora")) return { label: "Coleção Mágica", tone: "#ec4899" };
  if (slug.includes("ice") || slug.includes("diamond")) return { label: "Coleção Cristal", tone: "#06b6d4" };
  if (slug.includes("galaxy") || slug.includes("cosmic") || slug.includes("saturn") || slug.includes("space") || slug.includes("alien")) {
    return { label: "Coleção Cósmica", tone: "#8b5cf6" };
  }
  if (slug.includes("cyber") || slug.includes("biohacker") || slug.includes("hologram") || slug.includes("neon") || slug.includes("toxic")) {
    return { label: "Coleção Cyber", tone: "#22d3ee" };
  }
  if (item.rarity === "legendary" || item.rarity === "mythic") {
    return { label: "Prestígio", tone: "#f59e0b" };
  }
  return null;
}

export function resolveAvatarAccessories(avatar: UserAvatar | null | undefined): ResolvedAccessories {
  const a = avatar as Record<string, unknown> | null | undefined;
  const slots: ResolvedAccessories = {
    head: (a?.accessory_head as string) ?? null,
    face: (a?.accessory_face as string) ?? null,
    back: (a?.accessory_back as string) ?? null,
    hand: (a?.accessory_hand as string) ?? null,
    chest: (a?.accessory_chest as string) ?? null,
  };

  const legacy = avatar?.accessory_emoji;
  if (legacy && !Object.values(slots).some(Boolean)) {
    const slot = EMOJI_SLOT[legacy] ?? "head";
    slots[slot] = legacy;
  }

  return slots;
}

export function getAvatarPose(avatar: UserAvatar | null | undefined): AvatarPose {
  const pose = (avatar as { pose?: string } | null)?.pose;
  if (pose === "hero" || pose === "cool" || pose === "focus" || pose === "victory" || pose === "sprint") return pose;
  return "idle";
}

export function isAvatarItemEquipped(avatar: UserAvatar | null | undefined, item: AvatarItem): boolean {
  if (!avatar) return false;
  const a = avatar as Record<string, unknown>;

  if (item.category === "face") return avatar.face_emoji === item.icon;
  if (item.category === "outfit") {
    return ((a.clothes_color as string) ?? avatar.bg_color) === item.icon;
  }
  if (item.category === "pet") {
    return item.slug === "pet_none" ? !avatar.pet_emoji : avatar.pet_emoji === item.icon;
  }
  if (item.category === "aura") {
    return item.slug === "aura_none" ? !(a.aura_emoji as string) : (a.aura_emoji as string) === item.icon;
  }
  if (item.category === "accessory") {
    if (item.slug === "acc_none") {
      const slots = resolveAvatarAccessories(avatar);
      return !Object.values(slots).some(Boolean) && !avatar.accessory_emoji;
    }
    const slot = getAccessorySlot(item);
    if (!slot || slot === "aura") return false;
    return resolveAvatarAccessories(avatar)[slot] === item.icon;
  }
  return false;
}

export function getEquippedSlugs(avatar: UserAvatar | null | undefined, items: AvatarItem[]): string[] {
  if (!avatar) return [];
  return items.filter((item) => isAvatarItemEquipped(avatar, item)).map((item) => item.slug);
}

export function getCollectionBonus(
  equippedSlugs: string[],
): { collection: AvatarCollection; glow: string } | null {
  for (const col of AVATAR_COLLECTIONS) {
    const hasFace = col.faces.some((s) => equippedSlugs.includes(s));
    const hasOutfit = col.outfits.some((s) => equippedSlugs.includes(s));
    const hasAcc =
      !col.accessories?.length ||
      col.accessories.some((s) => equippedSlugs.includes(s));
    if (hasFace && hasOutfit && hasAcc) {
      return { collection: col, glow: col.tone };
    }
  }
  return null;
}

export function getHighestEquippedRarity(
  equippedSlugs: string[],
  items: AvatarItem[],
): ExtendedRarity {
  let best: ExtendedRarity = "common";
  for (const slug of equippedSlugs) {
    const item = items.find((i) => i.slug === slug);
    if (!item?.rarity) continue;
    const r = item.rarity as ExtendedRarity;
    if (RARITY_RANK[r] > RARITY_RANK[best]) best = r;
  }
  return best;
}

export function buildEquipPayload(
  userId: string,
  item: AvatarItem,
  currentAvatar: UserAvatar | null | undefined,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { user_id: userId };
  const slots = resolveAvatarAccessories(currentAvatar);

  if (item.category === "face") {
    payload.face_emoji = item.icon;
    return payload;
  }
  if (item.category === "outfit") {
    payload.bg_color = item.icon;
    payload.clothes_color = item.icon;
    return payload;
  }
  if (item.category === "pet") {
    payload.pet_emoji = item.slug === "pet_none" ? null : item.icon;
    return payload;
  }
  if (item.category === "aura") {
    payload.aura_emoji = item.slug === "aura_none" ? null : item.icon;
    return payload;
  }
  if (item.category === "accessory") {
    if (item.slug === "acc_none") {
      payload.accessory_emoji = null;
      payload.accessory_head = null;
      payload.accessory_face = null;
      payload.accessory_back = null;
      payload.accessory_hand = null;
      payload.accessory_chest = null;
      return payload;
    }
    const slot = getAccessorySlot(item);
    if (!slot || slot === "aura") return payload;
    payload.accessory_emoji = null;
    payload.accessory_head = slots.head;
    payload.accessory_face = slots.face;
    payload.accessory_back = slots.back;
    payload.accessory_hand = slots.hand;
    payload.accessory_chest = slots.chest;
    payload[`accessory_${slot}`] = item.icon;
    return payload;
  }
  return payload;
}
