"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import type { UsageMapProps } from "@/components/UsageMap";
type UsageRow = {
  assignment_id?: string;
  created?: string | number;
  changed?: string | number;
  activity_id?: string;    // g.nid si présent
  mathadata_id?: string;   // g.parentNid (10 activités)
  mathadata_title?: string; // Nom de l'activité
  uai?: string;
};

type AnnuaireRow = {
  uai: string;
  nom: string;
  type_etablissement?: string;
  commune: string;
  academie: string;
  departement?: string;
  secteur?: string;
  ips?: string | number;
  latitude: string | number;
  longitude: string | number;
};

// Noms courts personnalisés pour les activités (à modifier selon vos besoins)
const ACTIVITY_SHORT_NAMES: Record<string, string> = {
  "2548348": "Intro IA",
  "3515488": "Droites 2nde MNIST",
  "3518185": "Stats MNIST",
  "3534169": "BTS Meilleur Pixel",
  "4388355": "Séance Python",
  "5197770": "Geometry line MNIST",
  "5862412": "Droite 1ere MNIST",
  "5909323": "Challenge lycée",
  "6659633": "Milieu Distance MNIST",
  "6944347": "Stats Foetus",
};

// Carte Leaflet sans SSR
const UsageMap = dynamic<UsageMapProps>(() => import("@/components/UsageMap"), { ssr: false });

const parseMaybeEpoch = (v: any): Date | null => {
  if (v == null || v === "") return null;
  const s = String(v).trim();

  // Numérique pur → distinguer secondes vs millisecondes par la longueur
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (s.length >= 13) {             // 13+ chiffres → millisecondes
      const d = new Date(n);
      return isNaN(d.getTime()) ? null : d;
    }
    if (s.length >= 10) {             // 10-12 chiffres → secondes
      const d = new Date(n * 1000);
      return isNaN(d.getTime()) ? null : d;
    }
  }

  // ISO/date lisible
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

// Fonction pour obtenir le nom court d'une activité
const getActivityName = (id: string | undefined, fullTitle?: string): string => {
  if (!id) return "Activité inconnue";
  // Priorité : nom court personnalisé > titre complet > ID
  return ACTIVITY_SHORT_NAMES[id] || fullTitle || `Activité ${id}`;
};

const fmtMonth = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const groupCount = <T,>(arr: T[], keyFn: (x: T) => string | null) => {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = keyFn(x);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
};

export default function Dashboard() {
  const [usageRows, setUsageRows] = useState<UsageRow[]>([]);
  const [annuaire, setAnnuaire] = useState<AnnuaireRow[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>("__ALL__");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"nb" | "nom_lycee" | "ville" | "academie">("nb");
  const [sortAsc, setSortAsc] = useState(false);

  // Chargement CSV
  useEffect(() => {
    console.log("[DEBUG] Début chargement des CSVs...");
    Papa.parse<UsageRow>("/data/mathadata_2025-10-08.csv", {
      download: true, 
      header: true, 
      skipEmptyLines: true, 
      delimiter: ";",  // ← Fichier CSV avec point-virgule comme délimiteur
      complete: (res) => {
        console.log("[usages] Parse complete. Errors:", res.errors.length, "Data rows:", res.data.length);
        if (res.errors.length > 0) {
          console.error("[usages] Parse errors:", res.errors.slice(0, 5));
        }
        const rows = res.data.map(r => ({
          assignment_id: r.assignment_id ?? (r as any).id ?? undefined,
          created: r.created, changed: r.changed,
          activity_id: r.activity_id ?? (r as any).nid ?? undefined,
          mathadata_id: r.mathadata_id ?? (r as any).parentNid ?? undefined,
          mathadata_title: r.mathadata_title ?? (r as any).mathadata_title ?? undefined,
          uai: r.uai?.toString().trim()
        }));
        setUsageRows(rows);
        console.log("[usages] Lignes chargées:", rows.length);
        console.log("[usages] Avec mathadata_id:", rows.filter(r => r.mathadata_id).length);
        console.log("[usages] Avec created:", rows.filter(r => r.created).length);
        console.log("[usages] Premier exemple:", rows[0]);
        
        // Liste des activités uniques avec leurs titres pour faciliter la configuration
        const activities = new Map<string, string>();
        rows.forEach(r => {
          if (r.mathadata_id && r.mathadata_title && !activities.has(r.mathadata_id)) {
            activities.set(r.mathadata_id, r.mathadata_title);
          }
        });
        console.log("[usages] Activités trouvées:", Array.from(activities.entries()));
      },
      error: (err) => {
        console.error("[usages] Erreur de chargement:", err);
      }
    });
    Papa.parse("/data/annuaire_etablissements.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (res) => {
            console.log("[annuaire] Parse complete. Errors:", res.errors.length, "Data rows:", res.data.length);
            if (res.errors.length > 0) {
              console.error("[annuaire] Parse errors:", res.errors.slice(0, 5));
            }
            const rows = (res.data as any[]).map(r => ({
            uai: String(r.uai ?? "").trim(),
            nom: String(r.nom ?? ""),
            type_etablissement: String(r.type_etablissement ?? ""),
            commune: String(r.commune ?? ""),
            academie: String(r.academie ?? ""),
            departement: String(r.departement ?? ""),
            secteur: String(r.secteur ?? ""),
            ips: r.ips,
            latitude: Number(String(r.latitude).replace(",", ".")),
            longitude: Number(String(r.longitude).replace(",", ".")),
            }));
            setAnnuaire(rows);
            console.log("[annuaire] Lignes chargées:", rows.length);
            console.log("[annuaire] Avec coords:", rows.filter(r => Number.isFinite(r.latitude) && Number.isFinite(r.longitude)).length);
            console.log("[annuaire] Premier exemple:", rows[0]);
        },
        error: (err) => {
          console.error("[annuaire] Erreur de chargement:", err);
        }
        });
}, []);

  // Prépare dates
  const rowsWithDate = useMemo(() => {
    const result = usageRows.map(r => {
      const d = parseMaybeEpoch(r.created) ?? parseMaybeEpoch(r.changed);
      return d ? { ...r, _date: d } : null;
    }).filter(Boolean) as (UsageRow & { _date: Date })[];
    console.log("[rowsWithDate] Lignes avec date:", result.length, "sur", usageRows.length);
    if (result.length > 0) {
      console.log("[rowsWithDate] Première date:", result[0]._date);
    }
    return result;
  }, [usageRows]);

  // Mapping des IDs vers les noms d'activités (courts si définis, sinon complets)
  const activityTitles = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rowsWithDate) {
      if (r.mathadata_id && !map.has(r.mathadata_id)) {
        const shortName = getActivityName(r.mathadata_id, r.mathadata_title);
        map.set(r.mathadata_id, shortName);
      }
    }
    return map;
  }, [rowsWithDate]);

  const activities = useMemo(() => {
    const set = new Set<string>();
    for (const r of rowsWithDate) if (r.mathadata_id) set.add(r.mathadata_id);
    return ["__ALL__", ...Array.from(set).sort()];
  }, [rowsWithDate]);

  const filtered = useMemo(() => {
    if (activityFilter === "__ALL__") return rowsWithDate;
    return rowsWithDate.filter(r => r.mathadata_id === activityFilter);
  }, [rowsWithDate, activityFilter]);

  // --- Séries temporelles mensuelles ---
  const monthlyAll = useMemo(() => {
    const m = groupCount(filtered, r => fmtMonth(r._date));
    const result = Array.from(m.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
    console.log("[monthlyAll] Points de données:", result.length);
    if (result.length > 0) {
      console.log("[monthlyAll] Premier mois:", result[0]);
      console.log("[monthlyAll] Dernier mois:", result[result.length - 1]);
    }
    return result;
  }, [filtered]);

  // Usages totaux par activité
  const usageByActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsWithDate) {
      const id = r.mathadata_id || "NA";
      map.set(id, (map.get(id) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => ({
        activity: activityTitles.get(id) || `Activité ${id}`,
        count
      }))
      .sort((a, b) => b.count - a.count); // Tri décroissant par nombre d'usages
  }, [rowsWithDate, activityTitles]);

  // --- Agrégat par UAI & jointure annuaire ---
  const annMap = useMemo(() => new Map(annuaire.map(a => [a.uai, a])), [annuaire]);
  
  const usageByUai = useMemo(() => {
    const m = groupCount(filtered, r => (r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null") // Filtrer les UAI vides/null (insensible à la casse)
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",   // ← au lieu de meta?.nom_lycee
          ville: meta?.commune ?? "",   // ← au lieu de meta?.ville
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
        };
      });
  }, [filtered, annMap]);

  // --- Tableau interactif ---
  const [q, setQ] = useState("");
  const tableData = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    let arr = usageByUai.filter(r =>
      !query ||
      r.uai.toLowerCase().includes(query) ||
      r.nom_lycee.toLowerCase().includes(query) ||
      r.ville.toLowerCase().includes(query) ||
      r.academie.toLowerCase().includes(query)
    );
    arr.sort((a, b) => {
      const k = sortKey;
      const va = k === "nb" ? a.nb : (a[k] || "");
      const vb = k === "nb" ? b.nb : (b[k] || "");
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [usageByUai, q, sortKey, sortAsc]);

  // Liste d'activités pour empilé
  const activityKeys = useMemo(
    () => Array.from(new Set(rowsWithDate.map(r => r.mathadata_id || "NA"))).sort(),
    [rowsWithDate]
  );

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalUsages = rowsWithDate.length;
    const totalEtablissements = usageByUai.length;
    
    let nombreLycees = 0;
    let nombreColleges = 0;
    let nombrePublics = 0;
    let nombrePrives = 0;
    let nombreInconnus = 0;
    
    for (const point of usageByUai) {
      const info = annMap.get(point.uai);
      
      if (!info) {
        nombreInconnus++;
        continue;
      }
      
      // Compter par type d'établissement
      if (info.type_etablissement === "lycee") {
        nombreLycees++;
      } else if (info.type_etablissement === "college") {
        nombreColleges++;
      }
      
      // Compter par secteur
      if (info.secteur === "Public") {
        nombrePublics++;
      } else if (info.secteur === "Privé") {
        nombrePrives++;
      }
    }
    
    // Usages par année scolaire (15 août → 14 août)
    const usages2023_2024 = rowsWithDate.filter(r => {
      const d = r._date;
      return d >= new Date(2023,7,15) && d < new Date(2024,7,15);
    }).length;
    const usages2024_2025 = rowsWithDate.filter(r => {
      const d = r._date;
      return d >= new Date(2024,7,15) && d < new Date(2025,7,15);
    }).length;
    const usages2025_2026 = rowsWithDate.filter(r => {
      const d = r._date;
      return d >= new Date(2025,7,15) && d < new Date(2026,7,15);
    }).length;
    
    return {
      totalUsages,
      totalEtablissements,
      nombreLycees,
      nombreColleges,
      nombrePublics,
      nombrePrives,
      nombreInconnus,
      usages2023_2024,
      usages2024_2025,
      usages2025_2026,
    };
  }, [rowsWithDate, usageByUai, annMap]);

  // Histogramme IPS des lycées avec au moins un usage
  const ipsHistogram = useMemo(() => {
    // Récupérer tous les IPS des lycées avec au moins un usage
    const ipsValues: number[] = [];
    for (const point of usageByUai) {
      const ipsVal = point.ips;
      if (ipsVal != null) {
        const ipsNum = typeof ipsVal === 'string' ? parseFloat(ipsVal) : ipsVal;
        if (!isNaN(ipsNum)) {
          ipsValues.push(ipsNum);
        }
      }
    }
    
    // Créer les bins de 10 en 10
    const bins = new Map<string, number>();
    for (const ips of ipsValues) {
      const binStart = Math.floor(ips / 10) * 10;
      const binLabel = `${binStart}-${binStart + 10}`;
      bins.set(binLabel, (bins.get(binLabel) || 0) + 1);
    }
    
    // Convertir en tableau trié
    return Array.from(bins.entries())
      .map(([range, count]) => ({ range, count }))
      .sort((a, b) => {
        const aStart = parseInt(a.range.split('-')[0]);
        const bStart = parseInt(b.range.split('-')[0]);
        return aStart - bStart;
      });
  }, [usageByUai]);

  return (
    <div className="container">
      <h1>Tableau de bord — Données d'usage Capytale</h1>
      <p className="muted">Filtrer par activité et explorer l'usage dans le temps et par lycée.</p>

      <div className="toolbar" style={{margin: "12px 0 6px"}}>
        <label>Activité :</label>
        <select value={activityFilter} onChange={(e)=>setActivityFilter(e.target.value)}>
          {activities.map(a => (
            <option key={a} value={a}>
              {a === "__ALL__" ? "Toutes activités" : (activityTitles.get(a) || `Activité ${a}`)}
            </option>
          ))}
        </select>
        <span className="muted">
          Lignes usage: {filtered.length.toLocaleString("fr-FR")} (sur {rowsWithDate.length.toLocaleString("fr-FR")})
        </span>
      </div>

      {/* Graphiques */}
      <div className="grid grid-2">
        <div className="card">
          <h2>
            Évolution mensuelle — {
              activityFilter === "__ALL__" 
                ? "toutes activités" 
                : (activityTitles.get(activityFilter) || `activité ${activityFilter}`)
            }
          </h2>
          <div style={{height: 300}}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyAll}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" name="Usages" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2>Usages totaux par activité</h2>
          <div style={{height: 420}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageByActivity} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" angle={-50} textAnchor="end" height={140} interval={0} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="Nombre d'usages" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Carte + Tableau */}
      <div className="grid grid-2" style={{marginTop: 16}}>
        <div className="card">
          <h2>Carte des usages (cercles ∝ nb)</h2>
          <div className="map">
            <UsageMap points={usageByUai} />
          </div>
        </div>

        <div className="card">
          <h2>Lycées — usages</h2>
          <div className="toolbar" style={{marginBottom:8}}>
            <input
              placeholder="Recherche UAI / lycée / ville / académie…"
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              style={{flex:1}}
            />
            <select value={sortKey} onChange={(e)=>setSortKey(e.target.value as any)}>
              <option value="nb">Trier par usages</option>
              <option value="nom_lycee">Trier par lycée</option>
              <option value="ville">Trier par ville</option>
              <option value="academie">Trier par académie</option>
            </select>
            <button onClick={()=>setSortAsc(s=>!s)}>{sortAsc ? "↑" : "↓"}</button>
          </div>
          <div style={{maxHeight: 420, overflow: "auto"}}>
            <table>
              <thead>
                <tr>
                  <th>Établissement</th>
                  <th>Ville</th>
                  <th>Académie</th>
                  <th style={{textAlign:"right"}}>Usages</th>
                  <th style={{textAlign:"right"}}>IPS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(r => (
                  <tr key={r.uai}>
                    <td>{r.nom_lycee || "—"}</td>
                    <td>{r.ville || "—"}</td>
                    <td>{r.academie || "—"}</td>
                    <td style={{textAlign:"right"}}>{r.nb}</td>
                    <td style={{textAlign:"right"}}>{r.ips != null ? r.ips : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted" style={{marginTop:8}}>
            {tableData.length} lycées affichés.
          </p>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-2" style={{marginTop: 16}}>
        <div className="card">
          <h2>Statistiques globales d'usage</h2>
          <table>
            <thead>
              <tr>
                <th>Indicateur</th>
                <th style={{textAlign:"right"}}>Valeur</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Nombre total d'usages</td>
                <td style={{textAlign:"right"}}>{globalStats.totalUsages.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Nombre de lycées</td>
                <td style={{textAlign:"right"}}>{globalStats.nombreLycees.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Nombre de collèges</td>
                <td style={{textAlign:"right"}}>{globalStats.nombreColleges.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Établissements publics</td>
                <td style={{textAlign:"right"}}>{globalStats.nombrePublics.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Établissements privés</td>
                <td style={{textAlign:"right"}}>{globalStats.nombrePrives.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Établissements absents de l'annuaire</td>
                <td style={{textAlign:"right"}}>{globalStats.nombreInconnus.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Usages 2023-2024</td>
                <td style={{textAlign:"right"}}>{globalStats.usages2023_2024.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Usages 2024-2025</td>
                <td style={{textAlign:"right"}}>{globalStats.usages2024_2025.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Usages 2025-2026</td>
                <td style={{textAlign:"right"}}>{globalStats.usages2025_2026.toLocaleString("fr-FR")}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2>Distribution des IPS des lycées</h2>
          <div style={{height: 320}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ipsHistogram}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" label={{ value: "IPS", position: "insideBottom", offset: -5 }} />
                <YAxis allowDecimals={false} label={{ value: "Nombre de lycées", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="count" name="Lycées" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

