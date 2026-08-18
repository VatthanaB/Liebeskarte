/**
 * One-off migration: copy couple_allowlist, memories, photos, and memory-photos
 * storage from the old Supabase project to the new region project.
 *
 * Loads credentials from web/.env.migrate (gitignored).
 * Uses publishable (anon) keys when open RLS policies are enabled, or service role keys.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PHOTO_BUCKET = "memory-photos";

function loadEnvMigrate() {
  const path = join(ROOT, ".env.migrate");
  if (!existsSync(path)) {
    console.error(
      "Missing web/.env.migrate — copy web/.env.migrate.example and fill in both projects' keys."
    );
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

function resolveKey(env, prefix) {
  return (
    env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`] ||
    env[`${prefix}_SUPABASE_PUBLISHABLE_KEY`]
  );
}

function createProjectClient(env, prefix) {
  const url = env[`${prefix}_SUPABASE_URL`];
  const key = resolveKey(env, prefix);
  if (!url || !key) {
    throw new Error(
      `Missing ${prefix}_SUPABASE_URL or key (${prefix}_SUPABASE_SERVICE_ROLE_KEY / ${prefix}_SUPABASE_PUBLISHABLE_KEY)`
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function fetchAllRows(client, table, orderBy = "created_at") {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .order(orderBy, { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`${table} read failed: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function upsertRows(client, table, rows, onConflict) {
  if (!rows.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return 0;
  }

  const chunkSize = 200;
  let total = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).upsert(chunk, { onConflict });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    total += chunk.length;
    process.stdout.write(`\r  ${table}: ${total}/${rows.length}`);
  }

  console.log(`\r  ${table}: ${total}/${rows.length} upserted`);
  return total;
}

async function listAllFiles(client, bucket, path = "") {
  const { data, error } = await client.storage.from(bucket).list(path, {
    limit: 1000,
    sortBy: { column: "name", order: "asc" },
  });

  if (error) {
    throw new Error(`Storage list failed at "${path || "/"}": ${error.message}`);
  }

  if (!data?.length) return [];

  const files = [];

  for (const item of data) {
    const fullPath = path ? `${path}/${item.name}` : item.name;
    const isFolder = item.id === null || item.metadata === null;

    if (isFolder) {
      const nested = await listAllFiles(client, bucket, fullPath);
      files.push(...nested);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function ensureBucket(newClient) {
  const { data: files, error: listError } = await newClient.storage
    .from(PHOTO_BUCKET)
    .list("", { limit: 1 });

  if (!listError) {
    return;
  }

  const { data: bucket } = await newClient.storage.getBucket(PHOTO_BUCKET);
  if (bucket) return;

  const { error: createError } = await newClient.storage.createBucket(PHOTO_BUCKET, {
    public: false,
  });

  if (createError && !createError.message.includes("already exists")) {
    throw new Error(
      `Bucket "${PHOTO_BUCKET}" is not usable (${createError.message}). ` +
        "Ensure web/supabase/schema.sql was applied on the new project (creates the bucket via SQL)."
    );
  }
}

async function migrateStorage(oldClient, newClient) {
  console.log(`\nStorage bucket "${PHOTO_BUCKET}":`);
  await ensureBucket(newClient);

  const paths = await listAllFiles(oldClient, PHOTO_BUCKET);
  console.log(`  Found ${paths.length} file(s) on old project`);

  if (!paths.length) return { copied: 0, failed: [] };

  const failed = [];
  let copied = 0;

  for (const filePath of paths) {
    try {
      const { data: blob, error: downloadError } = await oldClient.storage
        .from(PHOTO_BUCKET)
        .download(filePath);

      if (downloadError) throw new Error(downloadError.message);
      if (!blob) throw new Error("empty download");

      const contentType = blob.type || "application/octet-stream";
      const { error: uploadError } = await newClient.storage
        .from(PHOTO_BUCKET)
        .upload(filePath, blob, { upsert: true, contentType });

      if (uploadError) throw new Error(uploadError.message);

      copied += 1;
      process.stdout.write(`\r  Files: ${copied}/${paths.length}`);
    } catch (err) {
      failed.push({ path: filePath, error: err.message });
    }
  }

  console.log(`\r  Files: ${copied}/${paths.length} copied`);
  if (failed.length) {
    console.log(`  Failed (${failed.length}):`);
    for (const f of failed.slice(0, 10)) {
      console.log(`    - ${f.path}: ${f.error}`);
    }
    if (failed.length > 10) {
      console.log(`    ... and ${failed.length - 10} more`);
    }
  }

  return { copied, failed };
}

async function verifySchema(client) {
  const { error } = await client.from("memories").select("id").limit(1);
  if (error) {
    if (error.message.includes("Could not find the table") || error.code === "42P01") {
      return false;
    }
    throw new Error(`Schema check failed: ${error.message}`);
  }
  return true;
}

async function main() {
  const env = loadEnvMigrate();
  const oldClient = createProjectClient(env, "OLD");
  const newClient = createProjectClient(env, "NEW");

  console.log("Supabase region migration");
  console.log(`  Old: ${env.OLD_SUPABASE_URL}`);
  console.log(`  New: ${env.NEW_SUPABASE_URL}`);

  const hasSchema = await verifySchema(newClient);
  if (!hasSchema) {
    console.error(
      "\nNew project is missing the memories table. Run schema first:\n" +
        "  npm run migrate:apply-schema\n" +
        "Or paste web/supabase/schema.sql into the new project's SQL Editor."
    );
    process.exit(1);
  }

  console.log("\nCopying tables...");
  const allowlist = await fetchAllRows(oldClient, "couple_allowlist", "email");
  const memories = await fetchAllRows(oldClient, "memories");
  const photos = await fetchAllRows(oldClient, "photos");

  const sanitizedMemories = memories.map((row) => ({
    ...row,
    created_by: row.created_by ?? null,
  }));

  const allowlistCount = await upsertRows(newClient, "couple_allowlist", allowlist, "email");
  const memoryCount = await upsertRows(newClient, "memories", sanitizedMemories, "id");
  const photoCount = await upsertRows(newClient, "photos", photos, "id");

  const storage = await migrateStorage(oldClient, newClient);

  console.log("\nDone.");
  console.log(`  couple_allowlist: ${allowlistCount}`);
  console.log(`  memories:         ${memoryCount}`);
  console.log(`  photos:           ${photoCount}`);
  console.log(`  storage files:    ${storage.copied}${storage.failed.length ? ` (${storage.failed.length} failed)` : ""}`);
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
