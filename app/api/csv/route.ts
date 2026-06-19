import { NextRequest, NextResponse } from "next/server";
import { put, del, list } from "@vercel/blob";
import Papa from "papaparse";
import fs from "fs";
import path from "path";

// --- Blob storage keys ---
const BLOB_CSV_KEY = "usages.csv";
const BLOB_META_KEY = "metadata.json";

// --- Local filesystem fallback (dev without BLOB_READ_WRITE_TOKEN) ---
const STORAGE_DIR = path.join(process.cwd(), "storage");
const CSV_PATH = path.join(STORAGE_DIR, "usages.csv");
const META_PATH = path.join(STORAGE_DIR, "metadata.json");
const DEFAULT_CSV = path.join(process.cwd(), "public", "data", "Mathadata20260210.csv");
const CAPYTALE_CSV_URL =
  process.env.CAPYTALE_MATHADATA_URL ||
  "https://capytale2.ac-paris.fr/web/c-stat/mathadata";

const EXPECTED_COLUMNS = [
  "assignment_id",
  "created",
  "changed",
  "assignment_title",
  "student",
  "Role",
  "uai_el",
  "activity_id",
  "teacher",
  "uai_teach",
  "mathadata_id",
  "mathadata_title",
] as const;

type CsvSource = "capytale" | "manual" | "default";

type CsvMetadata = {
  extractionDate: string | null;
  source?: CsvSource;
  updatedAt?: string;
};

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// Force dynamic — disable Next.js route caching
export const dynamic = "force-dynamic";

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

function getParisDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

// --- Blob helpers ---
async function blobGet(name: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: name, limit: 1 });
    const match = blobs.find(b => b.pathname === name);
    if (!match) return null;
    // Cache-bust: add timestamp to avoid CDN serving stale content
    const bustUrl = match.url + (match.url.includes("?") ? "&" : "?") + `_t=${Date.now()}`;
    const res = await fetch(bustUrl, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`[blobGet] Error fetching ${name}:`, err);
    return null;
  }
}

async function blobPut(name: string, content: string): Promise<void> {
  // Delete old blob first to avoid CDN stale cache issues
  try {
    const { blobs } = await list({ prefix: name, limit: 1 });
    const match = blobs.find(b => b.pathname === name);
    if (match) await del(match.url);
  } catch { /* ignore delete errors */ }
  await put(name, content, {
    access: "public",
    addRandomSuffix: false,
    cacheControlMaxAge: 0,
  });
}

async function persistCsv(csv: string, metadata: CsvMetadata) {
  const metaJson = JSON.stringify(metadata);

  if (useBlob()) {
    await blobPut(BLOB_CSV_KEY, csv);
    await blobPut(BLOB_META_KEY, metaJson);
    return;
  }

  ensureStorageDir();
  fs.writeFileSync(CSV_PATH, csv, "utf-8");
  fs.writeFileSync(META_PATH, metaJson, "utf-8");
}

function normalizeCapytaleCsv(rawCsv: string) {
  const parsed = Papa.parse<Record<string, string>>(rawCsv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => {
      const normalized = header.trim().replace(/^"+|"+$/g, "");
      return normalized.toLowerCase() === "role" ? "Role" : normalized;
    },
    transform: value => {
      const normalized = String(value ?? "").trim();
      return normalized === "NULL" ? "" : normalized;
    },
  });

  if (parsed.errors.length > 0) {
    throw new Error(`CSV Capytale invalide: ${parsed.errors[0].message}`);
  }

  const fields = parsed.meta.fields || [];
  const missingColumns = EXPECTED_COLUMNS.filter(column => !fields.includes(column));
  if (missingColumns.length > 0) {
    throw new Error(`Colonnes manquantes: ${missingColumns.join(", ")}`);
  }
  if (parsed.data.length === 0) {
    throw new Error("Le CSV Capytale est vide");
  }

  return {
    csv: Papa.unparse(parsed.data, { columns: [...EXPECTED_COLUMNS] }),
    lines: parsed.data.length,
  };
}

async function fetchLatestCapytaleCsv() {
  const token = process.env.CAPYTALE_MATHADATA_TOKEN;
  if (!token) {
    throw new Error("CAPYTALE_MATHADATA_TOKEN n'est pas configuré");
  }

  const response = await fetch(CAPYTALE_CSV_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "text/csv",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Capytale a répondu HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/csv")) {
    throw new Error(`Type de réponse Capytale inattendu: ${contentType || "inconnu"}`);
  }

  return normalizeCapytaleCsv(await response.text());
}

/**
 * GET /api/csv
 * Returns the current CSV content + metadata.
 * Falls back to the default CSV if no upload has been done.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format");

  let csvContent: string | null = null;
  let metadata: CsvMetadata = { extractionDate: null };

  if (useBlob()) {
    // --- Vercel Blob ---
    csvContent = await blobGet(BLOB_CSV_KEY);
    const metaRaw = await blobGet(BLOB_META_KEY);
    if (metaRaw) {
      try { metadata = JSON.parse(metaRaw); } catch { /* ignore */ }
    }
  } else {
    // --- Local filesystem ---
    ensureStorageDir();
    if (fs.existsSync(CSV_PATH)) {
      csvContent = fs.readFileSync(CSV_PATH, "utf-8");
      if (fs.existsSync(META_PATH)) {
        try { metadata = JSON.parse(fs.readFileSync(META_PATH, "utf-8")); } catch { /* ignore */ }
      }
    }
  }

  // Fallback to default CSV
  if (!csvContent) {
    csvContent = fs.readFileSync(DEFAULT_CSV, "utf-8");
    metadata.source = "default";
  }

  // ?format=raw → download as .csv file
  if (format === "raw") {
    const date = metadata.extractionDate || "unknown";
    return new Response(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Mathadata_${date}.csv"`,
      },
    });
  }

  return NextResponse.json({
    csv: csvContent,
    extractionDate: metadata.extractionDate,
    source: metadata.source || "manual",
    updatedAt: metadata.updatedAt || null,
  });
}

/**
 * POST /api/csv
 * Synchronizes from Capytale or stores a manually uploaded CSV.
 * Body: { source: "capytale" } or { csv: string, extractionDate: string }
 */
export async function POST(request: NextRequest) {
  let body: {
    source?: "capytale";
    csv?: string;
    extractionDate?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  if (body.source === "capytale") {
    try {
      const { csv, lines } = await fetchLatestCapytaleCsv();
      const updatedAt = new Date().toISOString();
      const extractionDate = getParisDate();
      const metadata: CsvMetadata = {
        extractionDate,
        source: "capytale",
        updatedAt,
      };

      await persistCsv(csv, metadata);
      console.log(`[POST /api/csv] Capytale sync OK: ${lines} lines, date=${extractionDate}`);

      return NextResponse.json({
        ok: true,
        csv,
        lines,
        extractionDate,
        source: "capytale",
        updatedAt,
      });
    } catch (err) {
      console.error("[POST /api/csv] Capytale sync failed:", err);
      return NextResponse.json(
        {
          error: "Impossible de récupérer les données Capytale",
          details: err instanceof Error ? err.message : String(err),
        },
        { status: 502 }
      );
    }
  }

  if (!body.csv || typeof body.csv !== "string") {
    return NextResponse.json({ error: "Champ 'csv' manquant ou invalide" }, { status: 400 });
  }
  if (!body.extractionDate || typeof body.extractionDate !== "string") {
    return NextResponse.json({ error: "Champ 'extractionDate' manquant" }, { status: 400 });
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.extractionDate)) {
    return NextResponse.json({ error: "Format de date invalide (attendu: YYYY-MM-DD)" }, { status: 400 });
  }

  const updatedAt = new Date().toISOString();
  const metadata: CsvMetadata = {
    extractionDate: body.extractionDate,
    source: "manual",
    updatedAt,
  };

  try {
    await persistCsv(body.csv, metadata);
    console.log(`[POST /api/csv] Manual upload OK: ${body.csv.length} bytes, date=${body.extractionDate}`);
  } catch (err) {
    console.error("[POST /api/csv] Manual upload failed:", err);
    return NextResponse.json(
      { error: "Erreur d'écriture du CSV", details: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    lines: body.csv.split("\n").length - 1,
    extractionDate: body.extractionDate,
    source: "manual",
    updatedAt,
  });
}
