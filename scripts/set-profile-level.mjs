import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
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
    process.env[key] ??= val;
  }
}

function getXPForLevel(level) {
  const thresholds = [
    0, 200, 450, 750, 1100, 1500, 2000, 2600, 3300, 4100,
    5000, 6000, 7100, 8300, 9600, 11000, 12500, 14100, 15800, 17600,
    19500, 21500, 23600, 25800, 28100, 30500, 33000, 35600, 38300, 41100,
  ];
  if (level <= thresholds.length) return thresholds[level - 1];

  let xp = thresholds[thresholds.length - 1];
  for (let currentLevel = thresholds.length + 1; currentLevel <= level; currentLevel++) {
    xp += 2900 + (currentLevel - 31) * 100;
  }
  return xp;
}

loadEnv();

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Configure SUPABASE_SERVICE_ROLE_KEY no .env para atualizar o perfil remoto.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const targetLevel = 100;
const targetCoins = 1000;
const targetXp = getXPForLevel(targetLevel);

const { data: profiles, error: listError } = await admin
  .from("profiles")
  .select("id, full_name, coins, xp")
  .order("created_at", { ascending: false });

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

if (!profiles?.length) {
  console.error("Nenhum perfil encontrado.");
  process.exit(1);
}

if (profiles.length > 1) {
  console.error("Mais de um perfil encontrado. Informe o id manualmente antes de atualizar:");
  console.error(JSON.stringify(profiles, null, 2));
  process.exit(2);
}

const profile = profiles[0];
const { data, error } = await admin
  .from("profiles")
  .update({ coins: targetCoins, xp: targetXp })
  .eq("id", profile.id)
  .select("id, full_name, coins, xp")
  .single();

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(JSON.stringify({ updated: data, targetLevel }, null, 2));
