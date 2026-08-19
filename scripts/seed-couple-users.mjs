/**
 * Apply schema.sql and create the two confirmed couple users
 * (panda / henne) with dummy emails. Skips email verification.
 *
 * Requires web/.env.migrate with NEW_DATABASE_URL or NEW_DB_PASSWORD.
 * Optional: PANDA_PASSWORD / HENNE_PASSWORD, otherwise generated.
 *
 * Writes usernames + passwords to web/.couple-credentials.local (gitignored).
 */

import pg from "pg";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
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

function loadEnvFile(path) {
  if (!existsSync(path)) return {};
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

function loadEnv() {
  return {
    ...loadEnvFile(join(ROOT, ".env.local")),
    ...loadEnvFile(join(ROOT, ".env.migrate")),
    ...process.env,
  };
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
  if (env.NEW_DATABASE_URL) return [env.NEW_DATABASE_URL];
  if (env.DATABASE_URL) return [env.DATABASE_URL];

  const password = env.NEW_DB_PASSWORD;
  const ref = projectRefFromUrl(env.NEW_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL);
  if (!password || !ref) return [];
  return buildPoolerUrls(ref, password);
}

function randomPassword() {
  return `Lk-${randomBytes(6).toString("base64url")}`;
}

async function main() {
  const env = loadEnv();
  const urls = resolveConnectionUrls(env);
  if (urls.length === 0) {
    console.error(
      "Set NEW_DATABASE_URL or NEW_DB_PASSWORD in web/.env.migrate so this script can reach Postgres."
    );
    process.exit(1);
  }

  const pandaPassword = env.PANDA_PASSWORD || randomPassword();
  const hennePassword = env.HENNE_PASSWORD || randomPassword();

  const connected = await tryConnect(urls);
  if (!connected) {
    console.error("Could not connect to Supabase Postgres.");
    process.exit(1);
  }

  const host = connected.url.replace(/:[^:@/]+@/, ":***@");
  console.log(`Connected (${host})`);

  try {
    console.log("Applying schema.sql...");
    await connected.client.query(readFileSync(join(ROOT, "supabase", "schema.sql"), "utf8"));

    console.log("Creating confirmed couple users...");
    await connected.client.query("select public.create_couple_user($1, $2, $3)", [
      "panda@liebeskarte.app",
      pandaPassword,
      "panda",
    ]);
    await connected.client.query("select public.create_couple_user($1, $2, $3)", [
      "henne@liebeskarte.app",
      hennePassword,
      "henne",
    ]);
  } finally {
    await connected.client.end();
  }

  const credentials = [
    "Liebeskarte login (dummy emails, email confirmation skipped)",
    "",
    "Username: panda",
    `Password: ${pandaPassword}`,
    "",
    "Username: henne",
    `Password: ${hennePassword}`,
    "",
  ].join("\n");

  writeFileSync(join(ROOT, ".couple-credentials.local"), credentials, "utf8");
  console.log("Users created. Credentials written to web/.couple-credentials.local");
  console.log(credentials);
}

main().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
