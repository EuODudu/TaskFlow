/**
 * Insere skins, roupas (outfit) e acessórios no Supabase remoto.
 * Requer SUPABASE_SERVICE_ROLE_KEY no .env (Dashboard → Settings → API).
 *
 * Uso: npm run seed:cosmetics
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "\n❌ Configure no .env:\n" +
      "   SUPABASE_URL=https://tjnymhgzvqttophpfghu.supabase.co\n" +
      "   SUPABASE_SERVICE_ROLE_KEY=<service_role do dashboard>\n\n" +
      "Ou execute o SQL em: supabase/seed_cosmetics.sql (SQL Editor)\n",
  );
  process.exit(1);
}

/** @type {import('@supabase/supabase-js').SupabaseClient} */
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ITEMS = [
  // Personagens que antes ficavam liberados no editor de perfil
  { slug: "face_default", name: "Profissional", category: "face", icon: "🧑", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "face_woman", name: "Profissional F", category: "face", icon: "👩", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "face_smile", name: "Sorriso", category: "face", icon: "😊", unlock_level: 1, price_coins: 50, is_default: false, rarity: "common" },
  { slug: "face_cool", name: "Estiloso", category: "face", icon: "😎", unlock_level: 3, price_coins: 90, is_default: false, rarity: "common" },
  { slug: "face_nerd", name: "Nerd", category: "face", icon: "🤓", unlock_level: 4, price_coins: 110, is_default: false, rarity: "common" },
  { slug: "face_young", name: "Jovem Talento", category: "face", icon: "👦", unlock_level: 3, price_coins: 70, is_default: false, rarity: "common" },
  { slug: "face_fire", name: "Em Chamas", category: "face", icon: "🔥", unlock_level: 8, price_coins: 180, is_default: false, rarity: "rare" },
  { slug: "face_star", name: "Estrelinha", category: "face", icon: "⭐", unlock_level: 9, price_coins: 190, is_default: false, rarity: "rare" },
  { slug: "face_senior", name: "Executivo", category: "face", icon: "👨‍💼", unlock_level: 4, price_coins: 90, is_default: false, rarity: "common" },
  { slug: "face_crown", name: "Realeza", category: "face", icon: "👑", unlock_level: 16, price_coins: 360, is_default: false, rarity: "epic" },
  { slug: "face_gossip", name: "Fofoqueiro do Setor", category: "face", icon: "🗣️", unlock_level: 6, price_coins: 140, is_default: false, rarity: "rare" },
  { slug: "face_hero", name: "Super Analista", category: "face", icon: "🦸", unlock_level: 5, price_coins: 120, is_default: false, rarity: "rare" },
  { slug: "face_wizard", name: "Mago do Código", category: "face", icon: "🧙", unlock_level: 8, price_coins: 150, is_default: false, rarity: "rare" },
  { slug: "face_elf", name: "Arquiteto", category: "face", icon: "🧝", unlock_level: 12, price_coins: 240, is_default: false, rarity: "epic" },
  { slug: "face_robot", name: "Cyborg Corp", category: "face", icon: "🤖", unlock_level: 15, price_coins: 320, is_default: false, rarity: "epic" },
  { slug: "face_alien", name: "Alienígena", category: "face", icon: "👽", unlock_level: 18, price_coins: 420, is_default: false, rarity: "epic" },
  { slug: "face_unicorn", name: "Lendário", category: "face", icon: "🦄", unlock_level: 20, price_coins: 600, is_default: false, rarity: "legendary" },
  { slug: "face_cosmic", name: "Guardião Cósmico", category: "face", icon: "🌌", unlock_level: 26, price_coins: 850, is_default: false, rarity: "mythic" },

  // Skins
  { slug: "face_ninja", name: "Ninja do Foco", category: "face", icon: "🥷", unlock_level: 10, price_coins: 180, is_default: false, rarity: "rare" },
  { slug: "face_astronaut", name: "Astronauta das Metas", category: "face", icon: "🧑‍🚀", unlock_level: 14, price_coins: 260, is_default: false, rarity: "epic" },
  { slug: "face_scientist", name: "Cientista Produtivo", category: "face", icon: "🧑‍🔬", unlock_level: 9, price_coins: 150, is_default: false, rarity: "rare" },
  { slug: "face_artist", name: "Criativo Sprint", category: "face", icon: "🎨", unlock_level: 7, price_coins: 120, is_default: false, rarity: "rare" },
  { slug: "face_productivity_enthusiast", name: "Entusiasta da Produtividade", category: "face", icon: "🏁", unlock_level: 30, price_coins: 1200, is_default: false, rarity: "mythic" },
  { slug: "face_dragon_exec", name: "Executivo Dragão", category: "face", icon: "🐉", unlock_level: 18, price_coins: 520, is_default: false, rarity: "legendary" },
  { slug: "face_vampire_ceo", name: "CEO Vampiro", category: "face", icon: "🧛", unlock_level: 14, price_coins: 360, is_default: false, rarity: "epic" },
  { slug: "face_fairy_sprint", name: "Fada do Sprint", category: "face", icon: "🧚", unlock_level: 11, price_coins: 280, is_default: false, rarity: "epic" },
  { slug: "face_ice_overlord", name: "Senhor do Gelo", category: "face", icon: "🧊", unlock_level: 16, price_coins: 420, is_default: false, rarity: "epic" },
  { slug: "face_wolf_operator", name: "Lobo Operacional", category: "face", icon: "🐺", unlock_level: 12, price_coins: 300, is_default: false, rarity: "rare" },
  { slug: "face_eagle_director", name: "Diretor Águia", category: "face", icon: "🦅", unlock_level: 13, price_coins: 320, is_default: false, rarity: "rare" },
  { slug: "face_biohacker", name: "Biohacker Corporativo", category: "face", icon: "🧬", unlock_level: 20, price_coins: 620, is_default: false, rarity: "legendary" },
  { slug: "face_shadow_agent", name: "Agente das Sombras", category: "face", icon: "🕶️", unlock_level: 10, price_coins: 260, is_default: false, rarity: "rare" },
  { slug: "face_diamond_emperor", name: "Imperador Diamante", category: "face", icon: "💎", unlock_level: 24, price_coins: 850, is_default: false, rarity: "mythic" },
  { slug: "face_saturn_guardian", name: "Guardião de Saturno", category: "face", icon: "🪐", unlock_level: 28, price_coins: 980, is_default: false, rarity: "mythic" },

  // Roupas (icon = cor hex para preview)
  { slug: "outfit_default_indigo", name: "Roupa Índigo Base", category: "outfit", icon: "#6366f1", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "outfit_emerald_base", name: "Roupa Esmeralda", category: "outfit", icon: "#10b981", unlock_level: 2, price_coins: 45, is_default: false, rarity: "common" },
  { slug: "outfit_rose_base", name: "Roupa Rosa", category: "outfit", icon: "#ec4899", unlock_level: 2, price_coins: 45, is_default: false, rarity: "common" },
  { slug: "outfit_amber_base", name: "Roupa Âmbar", category: "outfit", icon: "#f59e0b", unlock_level: 3, price_coins: 55, is_default: false, rarity: "common" },
  { slug: "outfit_red_base", name: "Roupa Vermelha", category: "outfit", icon: "#ef4444", unlock_level: 3, price_coins: 55, is_default: false, rarity: "common" },
  { slug: "outfit_cyan_base", name: "Roupa Ciano", category: "outfit", icon: "#06b6d4", unlock_level: 4, price_coins: 70, is_default: false, rarity: "common" },
  { slug: "outfit_slate_base", name: "Roupa Slate", category: "outfit", icon: "#64748b", unlock_level: 4, price_coins: 70, is_default: false, rarity: "common" },
  { slug: "outfit_violet_base", name: "Roupa Violeta", category: "outfit", icon: "#8b5cf6", unlock_level: 5, price_coins: 90, is_default: false, rarity: "rare" },
  { slug: "outfit_lime_base", name: "Roupa Lima", category: "outfit", icon: "#84cc16", unlock_level: 5, price_coins: 90, is_default: false, rarity: "rare" },
  { slug: "outfit_coral_base", name: "Roupa Coral", category: "outfit", icon: "#fb7185", unlock_level: 6, price_coins: 110, is_default: false, rarity: "rare" },
  { slug: "outfit_focus_black", name: "Roupa Foco Noturno", category: "outfit", icon: "#0f172a", unlock_level: 6, price_coins: 90, is_default: false, rarity: "common" },
  { slug: "outfit_neon_blue", name: "Roupa Neon Azul", category: "outfit", icon: "#22d3ee", unlock_level: 8, price_coins: 130, is_default: false, rarity: "rare" },
  { slug: "outfit_royal_purple", name: "Roupa Real Violeta", category: "outfit", icon: "#7e22ce", unlock_level: 12, price_coins: 220, is_default: false, rarity: "epic" },
  { slug: "outfit_forest_green", name: "Roupa Guardião Verde", category: "outfit", icon: "#166534", unlock_level: 5, price_coins: 100, is_default: false, rarity: "common" },
  { slug: "outfit_sunset_orange", name: "Roupa Sprint Solar", category: "outfit", icon: "#f97316", unlock_level: 10, price_coins: 180, is_default: false, rarity: "rare" },
  { slug: "outfit_mythic_pink", name: "Roupa Mítica Aurora", category: "outfit", icon: "#db2777", unlock_level: 24, price_coins: 650, is_default: false, rarity: "mythic" },
  { slug: "outfit_crimson_exec", name: "Roupa Executivo Carmim", category: "outfit", icon: "#b91c1c", unlock_level: 9, price_coins: 160, is_default: false, rarity: "rare" },
  { slug: "outfit_gold_elite", name: "Roupa Elite Dourada", category: "outfit", icon: "#d97706", unlock_level: 18, price_coins: 360, is_default: false, rarity: "epic" },
  { slug: "outfit_ice_focus", name: "Roupa Foco Ártico", category: "outfit", icon: "#38bdf8", unlock_level: 11, price_coins: 190, is_default: false, rarity: "rare" },
  { slug: "outfit_lavender_calm", name: "Roupa Lavanda Zen", category: "outfit", icon: "#a78bfa", unlock_level: 4, price_coins: 85, is_default: false, rarity: "common" },
  { slug: "outfit_graphite_ops", name: "Roupa Operações Grafite", category: "outfit", icon: "#374151", unlock_level: 7, price_coins: 120, is_default: false, rarity: "common" },
  { slug: "outfit_mint_flow", name: "Roupa Fluxo Menta", category: "outfit", icon: "#2dd4bf", unlock_level: 13, price_coins: 240, is_default: false, rarity: "rare" },
  { slug: "outfit_ocean_deep", name: "Roupa Oceano Profundo", category: "outfit", icon: "#1e3a8a", unlock_level: 15, price_coins: 280, is_default: false, rarity: "epic" },
  { slug: "outfit_rose_gold", name: "Roupa Rose Gold", category: "outfit", icon: "#f472b6", unlock_level: 16, price_coins: 320, is_default: false, rarity: "epic" },
  { slug: "outfit_storm_mythic", name: "Roupa Tempestade Mítica", category: "outfit", icon: "#312e81", unlock_level: 28, price_coins: 900, is_default: false, rarity: "mythic" },
  { slug: "outfit_dragon_scale", name: "Armadura Escamas de Dragão", category: "outfit", icon: "#14532d", unlock_level: 18, price_coins: 380, is_default: false, rarity: "legendary" },
  { slug: "outfit_vampire_velvet", name: "Veludo Vampírico", category: "outfit", icon: "#450a0a", unlock_level: 14, price_coins: 260, is_default: false, rarity: "epic" },
  { slug: "outfit_fairy_glow", name: "Aura de Fada", category: "outfit", icon: "#f0abfc", unlock_level: 11, price_coins: 230, is_default: false, rarity: "epic" },
  { slug: "outfit_ice_armor", name: "Armadura Glacial", category: "outfit", icon: "#7dd3fc", unlock_level: 16, price_coins: 300, is_default: false, rarity: "epic" },
  { slug: "outfit_shadow_ops", name: "Operações Sombra", category: "outfit", icon: "#020617", unlock_level: 10, price_coins: 210, is_default: false, rarity: "rare" },
  { slug: "outfit_galaxy_royal", name: "Galáxia Real", category: "outfit", icon: "#581c87", unlock_level: 24, price_coins: 700, is_default: false, rarity: "mythic" },
  { slug: "outfit_diamond_luxury", name: "Luxo Diamante", category: "outfit", icon: "#67e8f9", unlock_level: 22, price_coins: 620, is_default: false, rarity: "legendary" },
  { slug: "outfit_toxic_neon", name: "Neon Tóxico", category: "outfit", icon: "#a3e635", unlock_level: 15, price_coins: 280, is_default: false, rarity: "epic" },
  { slug: "outfit_lava_king", name: "Rei da Lava", category: "outfit", icon: "#ea580c", unlock_level: 19, price_coins: 420, is_default: false, rarity: "legendary" },
  { slug: "outfit_cyber_gold", name: "Cyber Ouro", category: "outfit", icon: "#facc15", unlock_level: 21, price_coins: 520, is_default: false, rarity: "legendary" },
  { slug: "outfit_hologram_suit", name: "Terno Holográfico", category: "outfit", icon: "#22d3ee", unlock_level: 26, price_coins: 760, is_default: false, rarity: "mythic" },
  { slug: "outfit_crimson_royalty", name: "Realeza Carmesim", category: "outfit", icon: "#be123c", unlock_level: 17, price_coins: 340, is_default: false, rarity: "epic" },
  // Acessórios
  { slug: "acc_none", name: "Sem Acessório", category: "accessory", icon: "🚫", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "acc_glasses", name: "Óculos de Sol", category: "accessory", icon: "🕶️", unlock_level: 1, price_coins: 25, is_default: false, rarity: "common" },
  { slug: "acc_headset", name: "Headset Pro", category: "accessory", icon: "🎧", unlock_level: 1, price_coins: 50, is_default: false, rarity: "common" },
  { slug: "acc_briefcase", name: "Maleta", category: "accessory", icon: "💼", unlock_level: 2, price_coins: 60, is_default: false, rarity: "common" },
  { slug: "acc_hat", name: "Cartola", category: "accessory", icon: "🎩", unlock_level: 5, price_coins: 90, is_default: false, rarity: "rare" },
  { slug: "acc_crown", name: "Coroa", category: "accessory", icon: "👑", unlock_level: 15, price_coins: 240, is_default: false, rarity: "epic" },
  { slug: "acc_lightning", name: "Energia", category: "accessory", icon: "⚡", unlock_level: 10, price_coins: 170, is_default: false, rarity: "rare" },
  { slug: "acc_cap", name: "Boné de Sprint", category: "accessory", icon: "🧢", unlock_level: 2, price_coins: 45, is_default: false, rarity: "common" },
  { slug: "acc_wand", name: "Varinha de Automação", category: "accessory", icon: "🪄", unlock_level: 11, price_coins: 180, is_default: false, rarity: "rare" },
  { slug: "acc_moon", name: "Broche Lunar", category: "accessory", icon: "🌙", unlock_level: 8, price_coins: 140, is_default: false, rarity: "rare" },
  { slug: "acc_gem", name: "Cristal de XP", category: "accessory", icon: "💎", unlock_level: 16, price_coins: 300, is_default: false, rarity: "epic" },
  { slug: "acc_backpack", name: "Mochila de Projeto", category: "accessory", icon: "🎒", unlock_level: 4, price_coins: 80, is_default: false, rarity: "common" },
  { slug: "acc_scarf", name: "Cachecol de Streak", category: "accessory", icon: "🧣", unlock_level: 6, price_coins: 110, is_default: false, rarity: "common" },
  { slug: "acc_shield", name: "Escudo Anti-Procrastinação", category: "accessory", icon: "🛡️", unlock_level: 12, price_coins: 230, is_default: false, rarity: "rare" },
  { slug: "acc_medal", name: "Medalha de Produtividade", category: "accessory", icon: "🏅", unlock_level: 9, price_coins: 170, is_default: false, rarity: "rare" },
  { slug: "acc_coffee", name: "Café de Foco", category: "accessory", icon: "☕", unlock_level: 3, price_coins: 65, is_default: false, rarity: "common" },
  { slug: "acc_flower", name: "Flor Zen", category: "accessory", icon: "🌸", unlock_level: 5, price_coins: 95, is_default: false, rarity: "common" },
  { slug: "acc_book", name: "Manual de Hábitos", category: "accessory", icon: "📘", unlock_level: 8, price_coins: 145, is_default: false, rarity: "rare" },
  { slug: "acc_compass", name: "Bússola de Metas", category: "accessory", icon: "🧭", unlock_level: 14, price_coins: 260, is_default: false, rarity: "epic" },
  { slug: "acc_target", name: "Alvo de Sprint", category: "accessory", icon: "🎯", unlock_level: 10, price_coins: 190, is_default: false, rarity: "rare" },
  { slug: "acc_wings", name: "Asas Angelicais", category: "accessory", icon: "🪽", unlock_level: 13, price_coins: 320, is_default: false, rarity: "epic" },
  { slug: "acc_halo", name: "Halo Divino", category: "accessory", icon: "⭕", unlock_level: 17, price_coins: 420, is_default: false, rarity: "epic" },
  { slug: "acc_cape", name: "Capa de Herói", category: "accessory", icon: "🦸", unlock_level: 7, price_coins: 150, is_default: false, rarity: "rare" },
  { slug: "acc_drone", name: "Drone Assistente", category: "accessory", icon: "🛸", unlock_level: 19, price_coins: 500, is_default: false, rarity: "legendary" },

  { slug: "aura_none", name: "Sem Aura", category: "aura", icon: "✨", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "aura_sparkle", name: "Aura de Foco", category: "aura", icon: "✨", unlock_level: 4, price_coins: 120, is_default: false, rarity: "common" },
  { slug: "aura_fire", name: "Aura Flamejante", category: "aura", icon: "🔥", unlock_level: 9, price_coins: 200, is_default: false, rarity: "rare" },
  { slug: "aura_frost", name: "Aura Gelada", category: "aura", icon: "❄️", unlock_level: 12, price_coins: 280, is_default: false, rarity: "rare" },
  { slug: "aura_cosmic", name: "Aura Cósmica", category: "aura", icon: "💫", unlock_level: 18, price_coins: 450, is_default: false, rarity: "epic" },
  { slug: "aura_neon", name: "Aura Neon Cyber", category: "aura", icon: "🌀", unlock_level: 22, price_coins: 620, is_default: false, rarity: "legendary" },
  { slug: "aura_rainbow", name: "Aura Arco-íris", category: "aura", icon: "🌈", unlock_level: 26, price_coins: 880, is_default: false, rarity: "mythic" },

  // Pets que antes ficavam no editor de perfil
  { slug: "pet_none", name: "Sem Pet", category: "pet", icon: "🚫", unlock_level: 1, price_coins: 0, is_default: true, rarity: "common" },
  { slug: "pet_cat", name: "Gatinho", category: "pet", icon: "🐱", unlock_level: 1, price_coins: 50, is_default: false, rarity: "common" },
  { slug: "pet_dog", name: "Cachorrinho", category: "pet", icon: "🐶", unlock_level: 1, price_coins: 50, is_default: false, rarity: "common" },
  { slug: "pet_hamster", name: "Hamster", category: "pet", icon: "🐹", unlock_level: 2, price_coins: 45, is_default: false, rarity: "common" },
  { slug: "pet_fish", name: "Peixinho", category: "pet", icon: "🐠", unlock_level: 2, price_coins: 45, is_default: false, rarity: "common" },
  { slug: "pet_fox", name: "Raposa", category: "pet", icon: "🦊", unlock_level: 5, price_coins: 110, is_default: false, rarity: "rare" },
  { slug: "pet_robot", name: "Robot Pet", category: "pet", icon: "🤖", unlock_level: 12, price_coins: 240, is_default: false, rarity: "epic" },
  { slug: "pet_dragon", name: "Dragão", category: "pet", icon: "🐲", unlock_level: 20, price_coins: 650, is_default: false, rarity: "legendary" },
];

const { data, error } = await admin.from("avatar_items").upsert(ITEMS, { onConflict: "slug" }).select("slug,category");

if (error) {
  console.error("❌ Falha no seed:", error.message);
  process.exit(1);
}

const outfits = data.filter((r) => r.category === "outfit");
console.log(`✅ Seed OK: ${data.length} itens (${outfits.length} roupas).`);
console.log("Recarregue a loja e abra a aba Roupas.");
