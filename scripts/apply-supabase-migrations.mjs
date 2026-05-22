/**
 * Aplica migrations SQL no projeto Supabase remoto.
 *
 * Opção A (recomendada): SUPABASE_ACCESS_TOKEN no .env
 *   Dashboard → Account → Access Tokens
 *
 * Opção B: SUPABASE_DB_PASSWORD no .env (senha do banco)
 *   Dashboard → Settings → Database → Database password
 *
 * Uso: npm run db:push
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const PROJECT_REF = "tjnymhgzvqttophpfghu";
const MIGRATIONS_DIR = resolve(root, "supabase", "migrations");

function loadEnv() {
  for (const name of [".env", ".env.local"]) {
    const envPath = resolve(root, name);
    if (!existsSync(envPath)) continue;
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
}

loadEnv();

function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
}

async function runManagementQuery(sql, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const body = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }

  if (!res.ok) {
    const msg = typeof parsed === "object" ? JSON.stringify(parsed) : parsed;
    throw new Error(`HTTP ${res.status}: ${msg}`);
  }
  return parsed;
}

async function applyViaAccessToken(token) {
  const files = listMigrations();
  console.log(`\n📦 Aplicando ${files.length} migrations via Management API...\n`);

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    process.stdout.write(`  → ${file} ... `);
    try {
      await runManagementQuery(sql, token);
      await runManagementQuery(
        `INSERT INTO supabase_migrations.schema_migrations (version)
         VALUES ('${version}')
         ON CONFLICT (version) DO NOTHING;`,
        token,
      );
      console.log("ok");
    } catch (err) {
      console.log("erro");
      throw new Error(`${file}: ${err.message}`);
    }
  }
}

function applyViaCliPassword(password) {
  const host = process.env.SUPABASE_DB_HOST ?? `db.${PROJECT_REF}.supabase.co`;
  const dbUrl = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
  console.log("\n📦 Aplicando migrations via Supabase CLI (db push)...\n");

  const link = spawnSync(
    "npx",
    ["supabase", "link", "--project-ref", PROJECT_REF, "-p", password],
    { cwd: root, stdio: "inherit", shell: true },
  );
  if (link.status !== 0) process.exit(link.status ?? 1);

  const push = spawnSync("npx", ["supabase", "db", "push", "--yes"], {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (push.status !== 0) process.exit(push.status ?? 1);
}

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;

  if (token) {
    await applyViaAccessToken(token);
    console.log("\n✅ Migrations aplicadas com sucesso.\n");
    return;
  }

  if (dbPassword) {
    applyViaCliPassword(dbPassword);
    console.log("\n✅ Migrations aplicadas com sucesso.\n");
    return;
  }

  console.error(
    "\n❌ Credenciais ausentes. Adicione no .env uma das opções:\n\n" +
      "   SUPABASE_ACCESS_TOKEN=sbp_...   (Account → Access Tokens)\n" +
      "   SUPABASE_DB_PASSWORD=...          (Settings → Database password)\n\n" +
      "Depois execute: npm run db:push\n",
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("\n❌", err.message, "\n");
  process.exit(1);
});
