/**
 * Apply web/supabase/schema.sql to the new project via direct Postgres connection.
 *
 * Set one of these in web/.env.migrate:
 *   NEW_DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 *   NEW_DB_PASSWORD=[your database password]  (auto-builds URL from NEW_SUPABASE_URL)
 *
 * Find the password / URI in Supabase Dashboard → Project Settings → Database.
 */

import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const REGIONS = [
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "eu-north-1",
  "us-east-1",
  "us-west-1",
  "ap-southeast-1",
  "ap-northeast-1",
  "ap-south-1",
  "sa-east-1",
];

function loadEnvMigrate() {
  const path = join(ROOT, ".env.migrate");
  if (!existsSync(path)) {
    console.error("Missing web/.env.migrate");
    process.exit(1);
  }

  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function projectRefFromUrl(url) {
  const match = url?.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function buildPoolerUrls(ref, password) {
  const encoded = encodeURIComponent(password);
  return REGIONS.flatMap((region) => [
    `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${ref}:${encoded}@aws-0-${region}.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres:${encoded}@db.${ref}.supabase.co:5432/postgres`,
  ]);
}

async function tryConnect(urls) {
  for (const url of urls) {
    const client = new Client({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
    });

    try {
      await client.connect();
      await client.query("select 1");
      return { client, url };
    } catch {
      await client.end().catch(() => {});
    }
  }
  return null;
}

function resolveConnectionUrls(env) {
  if (env.NEW_DATABASE_URL) {
    return [env.NEW_DATABASE_URL];
  }

  const password = env.NEW_DB_PASSWORD;
  const ref = projectRefFromUrl(env.NEW_SUPABASE_URL);

  if (!password || !ref) {
    console.error(
      "Set NEW_DATABASE_URL or both NEW_DB_PASSWORD and NEW_SUPABASE_URL in web/.env.migrate.\n" +
        "Dashboard → Project Settings → Database → Database password / Session pooler URI."
    );
    process.exit(1);
  }

  return buildPoolerUrls(ref, password);
}

async function main() {
  const env = loadEnvMigrate();
  const schemaPath = join(ROOT, "supabase", "schema.sql");
  const sql = readFileSync(schemaPath, "utf8");
  const urls = resolveConnectionUrls(env);

  console.log("Connecting to new Supabase Postgres...");
  const connected = await tryConnect(urls);

  if (!connected) {
    console.error(
      "Could not connect. Check NEW_DB_PASSWORD or NEW_DATABASE_URL in web/.env.migrate."
    );
    process.exit(1);
  }

  const host = connected.url.replace(/:[^:@/]+@/, ":***@");
  console.log(`Connected (${host})`);
  console.log("Applying schema...");

  try {
    await connected.client.query(sql);
    console.log("Schema applied successfully.");
  } finally {
    await connected.client.end();
  }
}

main().catch((err) => {
  console.error("Schema apply failed:", err.message);
  process.exit(1);
});
