"use client";

import React, { useRef, useState, useCallback } from "react";
import Papa from "papaparse";

const EXPECTED_COLUMNS = [
  "assignment_id", "created", "changed", "assignment_title",
  "student", "Role", "uai_el", "activity_id",
  "teacher", "uai_teach", "mathadata_id", "mathadata_title"
];

export interface CsvUploadResult {
  rows: Record<string, any>[];
  csvText: string;
  extractionDate: string;
  mode: "replace" | "merge";
}

interface CsvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (result: CsvUploadResult) => void;
  currentRows: Record<string, any>[];
}

type Step = "upload" | "conflict" | "confirm";

export default function CsvUploadModal({
  isOpen,
  onClose,
  onConfirm,
  currentRows,
}: CsvUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [error, setError] = useState<string | null>(null);
  const [extractionDate, setExtractionDate] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);
  const [conflictInfo, setConflictInfo] = useState<{
    newOnly: number;
    existingOnly: number;
    common: number;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setError(null);
    setExtractionDate("");
    setParsedRows([]);
    setConflictInfo(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const validateColumns = (headers: string[]): string | null => {
    const trimmed = headers.map(h => h.trim().replace(/^"+|"+$/g, ""));
    const missing = EXPECTED_COLUMNS.filter(c => !trimmed.includes(c));
    if (missing.length > 0) {
      return `Colonnes manquantes : ${missing.join(", ")}`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      setError("Le fichier doit être un .csv");
      return;
    }

    setError(null);
    setIsProcessing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().replace(/^"+|"+$/g, ""),
      transform: (value) => {
        const v = String(value ?? "").trim();
        return v === "NULL" ? "" : v;
      },
      complete: (results) => {
        setIsProcessing(false);

        // Validate columns
        if (results.meta.fields) {
          const colError = validateColumns(results.meta.fields);
          if (colError) {
            setError(colError);
            return;
          }
        } else {
          setError("Impossible de lire les en-têtes du CSV.");
          return;
        }

        if (results.data.length === 0) {
          setError("Le fichier CSV est vide.");
          return;
        }

        const newRows = results.data as Record<string, any>[];
        setParsedRows(newRows);

        // Check if new CSV is a superset of the current one
        const currentIds = new Set(
          currentRows.map(r => r.assignment_id).filter(Boolean)
        );
        const newIds = new Set(
          newRows.map(r => r.assignment_id).filter(Boolean)
        );

        const existingOnly = [...currentIds].filter(id => !newIds.has(id)).length;
        const common = [...currentIds].filter(id => newIds.has(id)).length;
        const newOnly = [...newIds].filter(id => !currentIds.has(id)).length;

        if (existingOnly === 0) {
          // New CSV contains all existing data → superset, go straight to confirm
          setConflictInfo({ newOnly, existingOnly, common });
          setStep("confirm");
        } else {
          // Some existing rows are missing → conflict
          setConflictInfo({ newOnly, existingOnly, common });
          setStep("conflict");
        }
      },
      error: (err) => {
        setIsProcessing(false);
        setError(`Erreur de lecture : ${err.message}`);
      },
    });
  };

  const handleMerge = () => {
    // Merge: keep all existing rows + add new ones that don't exist yet
    const existingIds = new Set(
      currentRows.map(r => r.assignment_id).filter(Boolean)
    );
    const newOnlyRows = parsedRows.filter(
      r => r.assignment_id && !existingIds.has(r.assignment_id)
    );
    // Also add rows from new CSV that have no assignment_id (shouldn't happen but be safe)
    const newNoId = parsedRows.filter(r => !r.assignment_id);
    const merged = [...currentRows, ...newOnlyRows, ...newNoId];
    setParsedRows(merged);
    setStep("confirm");
  };

  const handleReplace = () => {
    // Keep parsedRows as-is (the new CSV replaces everything)
    setStep("confirm");
  };

  const handleConfirm = () => {
    if (!extractionDate) {
      setError("Veuillez entrer la date d'extraction.");
      return;
    }
    setError(null);
    const mode = step === "confirm" && conflictInfo && conflictInfo.existingOnly > 0
      ? "merge" // We got here via merge path
      : "replace";
    onConfirm({
      rows: parsedRows,
      csvText: Papa.unparse(parsedRows),
      extractionDate,
      mode,
    });
    reset();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 32,
          maxWidth: 560,
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#0f172a" }}>
            📁 Importer un nouveau CSV
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#94a3b8",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#dc2626",
              fontSize: "0.9rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Step: Upload */}
        {step === "upload" && (
          <div>
            <p style={{ color: "#475569", marginBottom: 16, fontSize: "0.95rem" }}>
              Sélectionnez un fichier CSV avec les données d'usage à jour.
              Les colonnes doivent correspondre au format attendu.
            </p>
            <div
              style={{
                border: "2px dashed #cbd5e1",
                borderRadius: 8,
                padding: 24,
                textAlign: "center",
                marginBottom: 16,
                cursor: "pointer",
                background: "#f8fafc",
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              {isProcessing ? (
                <p style={{ color: "#64748b" }}>⏳ Analyse en cours…</p>
              ) : (
                <>
                  <p style={{ fontSize: "2rem", margin: "0 0 8px" }}>📄</p>
                  <p style={{ color: "#64748b", margin: 0 }}>
                    Cliquez ou glissez un fichier .csv ici
                  </p>
                </>
              )}
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.8rem" }}>
              Colonnes attendues : {EXPECTED_COLUMNS.join(", ")}
            </p>
          </div>
        )}

        {/* Step: Conflict */}
        {step === "conflict" && conflictInfo && (
          <div>
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fbbf24",
                borderRadius: 8,
                padding: "16px",
                marginBottom: 20,
              }}
            >
              <p style={{ margin: "0 0 8px", fontWeight: 600, color: "#92400e" }}>
                ⚠️ Le nouveau CSV ne contient pas toutes les données existantes
              </p>
              <ul style={{ margin: 0, paddingLeft: 20, color: "#78350f", fontSize: "0.9rem" }}>
                <li><strong>{conflictInfo.common}</strong> lignes en commun</li>
                <li><strong>{conflictInfo.newOnly}</strong> nouvelles lignes dans le fichier importé</li>
                <li><strong>{conflictInfo.existingOnly}</strong> lignes existantes absentes du nouveau fichier</li>
              </ul>
            </div>
            <p style={{ color: "#475569", marginBottom: 20, fontSize: "0.95rem" }}>
              Que souhaitez-vous faire ?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={handleMerge}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "2px solid #3b82f6",
                  background: "#eff6ff",
                  color: "#1d4ed8",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                🔀 Fusionner
                <br />
                <span style={{ fontWeight: 400, fontSize: "0.8rem" }}>
                  Ajouter les nouvelles lignes aux données existantes
                </span>
              </button>
              <button
                onClick={handleReplace}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "2px solid #ef4444",
                  background: "#fef2f2",
                  color: "#dc2626",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                🔄 Remplacer
                <br />
                <span style={{ fontWeight: 400, fontSize: "0.8rem" }}>
                  Ignorer les anciennes données, utiliser uniquement le nouveau fichier
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm (date + summary) */}
        {step === "confirm" && (
          <div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #86efac",
                borderRadius: 8,
                padding: "16px",
                marginBottom: 20,
              }}
            >
              <p style={{ margin: 0, color: "#166534", fontSize: "0.9rem" }}>
                ✅ <strong>{parsedRows.length}</strong> lignes prêtes à charger
                {conflictInfo && conflictInfo.newOnly > 0 && (
                  <> (dont <strong>{conflictInfo.newOnly}</strong> nouvelles)</>
                )}
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label
                htmlFor="extraction-date"
                style={{ display: "block", fontWeight: 600, color: "#334155", marginBottom: 8 }}
              >
                Date d'extraction des données *
              </label>
              <input
                id="extraction-date"
                type="date"
                value={extractionDate}
                onChange={(e) => {
                  setExtractionDate(e.target.value);
                  setError(null);
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  fontSize: "1rem",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <button
              onClick={handleConfirm}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                background: "#3b82f6",
                color: "white",
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Charger les données
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
