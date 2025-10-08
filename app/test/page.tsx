"use client";

import { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    console.log("[TEST] Début test de chargement...");
    
    // Test 1: Fetch simple
    fetch("/data/mathadata_2025-10-08.csv")
      .then(r => {
        console.log("[TEST] Status:", r.status, r.statusText);
        return r.text();
      })
      .then(text => {
        console.log("[TEST] Taille du fichier:", text.length, "caractères");
        console.log("[TEST] Premières 200 caractères:", text.substring(0, 200));
      })
      .catch(err => {
        console.error("[TEST] Erreur fetch:", err);
      });
  }, []);

  return (
    <div style={{padding: 20}}>
      <h1>Page de Test</h1>
      <p>Ouvrez la console pour voir les résultats.</p>
    </div>
  );
}
