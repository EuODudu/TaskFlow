import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(import.meta.dirname, "..");
const env = {};
const envPath = resolve(root, ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

const url = env.VITE_SUPABASE_URL ?? env.SUPABASE_URL;
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? env.SUPABASE_PUBLISHABLE_KEY;
const admin = createClient(url, key);

const checks = [
  ["avatar_items face_vampire_ceo", () => admin.from("avatar_items").select("slug").eq("slug", "face_vampire_ceo").maybeSingle()],
  ["tasks.planned_for", () => admin.from("tasks").select("planned_for").limit(1)],
  ["daily_active_time", () => admin.from("daily_active_time").select("active_seconds").limit(1)],
  ["daily_mission_claims", () => admin.from("daily_mission_claims").select("mission_key").limit(1)],
  ["user_avatar slots", () => admin.from("user_avatar").select("accessory_head,pose,aura_emoji").limit(1)],
  ["claim_daily_mission rpc", () => admin.rpc("claim_daily_mission", { p_mission_key: "__probe__" })],
];

for (const [label, run] of checks) {
  const { data, error } = await run();
  console.log(label, JSON.stringify({ data, error: error?.message ?? null }));
}
