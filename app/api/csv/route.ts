import { NextRequest, NextResponse } from "next/server";
import { put, list, head } from "@vercel/blob";
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

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// Force dynamic — disable Next.js route caching
export const dynamic = "force-dynamic";

function ensureStorageDir() {
  if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
  }
}

// --- Blob helpers ---
async function blobGet(name: string): Promise<string | null> {
  try {
    const { blobs } = await list({ prefix: name, limit: 1 });
    const match = blobs.find(b => b.pathname === name);
    if (!match) return null;
    const res = await fetch(match.url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch (err) {
    console.error(`[blobGet] Error fetching ${name}:`, err);
    return null;
  }
}

async function blobPut(name: string, content: string): Promise<void> {
  await put(name, content, { access: "public", addRandomSuffix: false });
}

/**
 * GET /api/csv
 * Returns the current CSV content + metadata.
 * Falls back to the default CSV if no upload has been done.
 */
export async function GET() {
  let csvContent: string | null = null;
  let metadata: { extractionDate: string | null } = { extractionDate: null };

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
  }

  return NextResponse.json({
    csv: csvContent,
    extractionDate: metadata.extractionDate,
  });
}

/**
 * POST /api/csv
 * Receives CSV content + extraction date, saves to storage.
 * Body: { csv: string, extractionDate: string }
 */
export async function POST(request: NextRequest) {
  let body: { csv: string; extractionDate: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
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

  const metaJson = JSON.stringify({ extractionDate: body.extractionDate });

  if (useBlob()) {
    // --- Vercel Blob ---
    await blobPut(BLOB_CSV_KEY, body.csv);
    await blobPut(BLOB_META_KEY, metaJson);
  } else {
    // --- Local filesystem ---
    ensureStorageDir();
    fs.writeFileSync(CSV_PATH, body.csv, "utf-8");
    fs.writeFileSync(META_PATH, metaJson, "utf-8");
  }

  return NextResponse.json({ ok: true, lines: body.csv.split("\n").length - 1 });
}
