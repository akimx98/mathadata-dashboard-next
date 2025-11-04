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
  student?: string;        // Hash anonyme de l'élève/utilisateur
  Role?: string;           // "student" ou "teacher" - distingue les vrais élèves des profs qui testent
  uai_el?: string;         // UAI de l'établissement de l'élève
  teacher?: string;        // Hash anonyme de l'enseignant
  uai_teach?: string;      // UAI de l'établissement du prof
  // Ancienne colonne pour compatibilité temporaire
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
  const [sortKey, setSortKey] = useState<"nb" | "nom_lycee" | "ville" | "academie" | "ips" | "nbSeances" | "nbEleves" | "nbProfsEnseignant" | "nbProfsTestant">("nbSeances");
  const [sortAsc, setSortAsc] = useState(false);

  // Chargement CSV
  useEffect(() => {
    console.log("[DEBUG] Début chargement des CSVs...");
    Papa.parse<UsageRow>("/data/mathadata-V2.csv", {
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
          student: r.student ?? undefined,
          Role: r.Role ?? undefined,
          uai_el: r.uai_el?.toString().trim(),
          teacher: r.teacher ?? undefined,
          uai_teach: r.uai_teach?.toString().trim(),
          // Pour compatibilité, on garde uai_el comme UAI par défaut
          uai: r.uai_el?.toString().trim()
        }));
        setUsageRows(rows);
        console.log("[usages] Lignes chargées:", rows.length);
        console.log("[usages] Avec mathadata_id:", rows.filter(r => r.mathadata_id).length);
        console.log("[usages] Avec created:", rows.filter(r => r.created).length);
        console.log("[usages] Role distribution:", 
          "students:", rows.filter(r => r.Role === "student").length,
          "teachers:", rows.filter(r => r.Role === "teacher").length
        );
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
  
  // VERSION GLOBALE : Pour les stats globales et distribution IPS
  // Utilise uai_el (établissement de l'élève) pour localiser les usages
  const usageByUaiGlobal = useMemo(() => {
    const m = groupCount(rowsWithDate, r => (r.uai_el || r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null") // Filtrer les UAI vides/null (insensible à la casse)
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        
        // Collecter les activités uniques pour cet UAI (sur toutes les données)
        const activitiesSet = new Set<string>();
        rowsWithDate.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai && r.mathadata_id) {
            const activityName = getActivityName(r.mathadata_id, r.mathadata_title);
            activitiesSet.add(activityName);
          }
        });
        const activitesList = Array.from(activitiesSet).sort();
        
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",
          ville: meta?.commune ?? "",
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          activites: activitesList,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
        };
      });
  }, [rowsWithDate, annMap]);
  
  // Calculer les statistiques détaillées pour un établissement (utilisé pour le tableau principal)
  const getEtablissementStats = (uai: string) => {
    // 1. Récupérer toutes les sessions pour cet UAI (élèves uniquement)
    const studentSessions = rowsWithDate
      .filter(r => {
        const rowUai = (r.uai_el || r.uai || "").trim();
        return rowUai === uai && r.Role === "student" && r.mathadata_id && r.teacher && r.student && r._date;
      })
      .map(r => ({
        student: r.student!,
        teacher: r.teacher!,
        mathadata_id: r.mathadata_id!,
        created: r._date!.getTime(),
      }));
    
    // 2. Compter les élèves uniques
    const uniqueStudents = new Set(studentSessions.map(s => s.student));
    const nbEleves = uniqueStudents.size;
    
    // 3. Compter les séances (clustering temporel par prof+activité)
    type GroupKey = string;
    type SessionType = typeof studentSessions[number];
    const groups = new Map<GroupKey, SessionType[]>();
    
    studentSessions.forEach(session => {
      const key = `${session.teacher}|${session.mathadata_id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });
    
    let nbSeances = 0;
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    
    groups.forEach(sessions => {
      const sorted = sessions.sort((a, b) => a.created - b.created);
      let currentClusterStart = 0;
      
      sorted.forEach(session => {
        if (currentClusterStart === 0 || session.created - currentClusterStart > TWO_HOURS_MS) {
          nbSeances++;
          currentClusterStart = session.created;
        }
      });
    });
    
    // 4. Compter les profs ayant enseigné (prof dont uai_teach = uai avec des élèves)
    const profsEnseignant = new Set<string>();
    rowsWithDate.forEach(r => {
      const uaiTeach = (r.uai_teach || "").trim();
      const uaiEl = (r.uai_el || "").trim();
      if (uaiTeach === uai && uaiEl === uai && r.Role === "student" && r.teacher) {
        profsEnseignant.add(r.teacher);
      }
    });
    
    // 5. Compter les profs testant uniquement (prof avec uai_teach = uai mais sans élèves de ce uai)
    const profsTestant = new Set<string>();
    const profsTeachingActivities = new Set<string>(); // "prof|activity"
    
    // D'abord, collecter les profs qui ont donné aux élèves
    rowsWithDate.forEach(r => {
      const uaiTeach = (r.uai_teach || "").trim();
      const uaiEl = (r.uai_el || "").trim();
      if (uaiTeach === uai && uaiEl === uai && r.Role === "student" && r.teacher && r.mathadata_id) {
        profsTeachingActivities.add(`${r.teacher}|${r.mathadata_id}`);
      }
    });
    
    // Ensuite, trouver les profs qui testent sans donner
    rowsWithDate.forEach(r => {
      const uaiTeach = (r.uai_teach || "").trim();
      if (uaiTeach === uai && r.Role === "teacher" && r.teacher && r.mathadata_id) {
        const key = `${r.teacher}|${r.mathadata_id}`;
        if (!profsTeachingActivities.has(key)) {
          profsTestant.add(r.teacher);
        }
      }
    });
    
    return {
      nbSeances,
      nbEleves,
      nbProfsEnseignant: profsEnseignant.size,
      nbProfsTestant: profsTestant.size,
    };
  };
  
  // VERSION FILTRÉE : Pour la carte et le tableau (selon activité sélectionnée)
  // Utilise uai_el (établissement de l'élève) pour localiser les usages
  const usageByUai = useMemo(() => {
    const m = groupCount(filtered, r => (r.uai_el || r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null") // Filtrer les UAI vides/null (insensible à la casse)
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        
        // Compter les usages profs vs élèves pour cet UAI
        let teacherUsages = 0;
        let studentUsages = 0;
        
        filtered.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai) {
            if (r.Role === "teacher") teacherUsages++;
            else if (r.Role === "student") studentUsages++;
          }
        });
        
        // Collecter les activités uniques pour cet UAI (selon filtre)
        const activitiesSet = new Set<string>();
        filtered.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai && r.mathadata_id) {
            const activityName = getActivityName(r.mathadata_id, r.mathadata_title);
            activitiesSet.add(activityName);
          }
        });
        const activitesList = Array.from(activitiesSet).sort();
        
        // Calculer les statistiques détaillées
        const stats = getEtablissementStats(uai);
        
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",   // ← au lieu de meta?.nom_lycee
          ville: meta?.commune ?? "",   // ← au lieu de meta?.ville
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          activites: activitesList,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
          teacherUsages,
          studentUsages,
          hasStudents: studentUsages > 0,
          // Nouvelles statistiques
          nbSeances: stats.nbSeances,
          nbEleves: stats.nbEleves,
          nbProfsEnseignant: stats.nbProfsEnseignant,
          nbProfsTestant: stats.nbProfsTestant,
        };
      });
  }, [filtered, annMap]);

  // --- Tableau interactif ---
  const [q, setQ] = useState("");
  const [selectedUai, setSelectedUai] = useState<string | null>(null);
  const [selectedAcademie, setSelectedAcademie] = useState<string | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<number | null>(null); // index de la séance dans classActivityDetails
  
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
      let va: number | string;
      let vb: number | string;
      
      if (k === "nb") {
        va = a.nb;
        vb = b.nb;
      } else if (k === "nbSeances") {
        va = a.nbSeances || 0;
        vb = b.nbSeances || 0;
      } else if (k === "nbEleves") {
        va = a.nbEleves || 0;
        vb = b.nbEleves || 0;
      } else if (k === "nbProfsEnseignant") {
        va = a.nbProfsEnseignant || 0;
        vb = b.nbProfsEnseignant || 0;
      } else if (k === "nbProfsTestant") {
        va = a.nbProfsTestant || 0;
        vb = b.nbProfsTestant || 0;
      } else if (k === "ips") {
        // Pour l'IPS, convertir en nombre ou utiliser -Infinity si absent
        va = a.ips != null ? (typeof a.ips === 'string' ? parseFloat(a.ips) : a.ips) : -Infinity;
        vb = b.ips != null ? (typeof b.ips === 'string' ? parseFloat(b.ips) : b.ips) : -Infinity;
      } else {
        va = (a[k] || "");
        vb = (b[k] || "");
      }
      
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
    const totalEtablissements = usageByUaiGlobal.length;
    
    let nombreLycees = 0;
    let nombreColleges = 0;
    let nombreInconnus = 0;
    
    // Pour compter les profs uniques par secteur
    const profsPublics = new Set<string>();
    const profsPrives = new Set<string>();
    
    for (const point of usageByUaiGlobal) {
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
    }
    
    // Compter les profs uniques par secteur
    for (const r of rowsWithDate) {
      if (!r.teacher) continue;
      
      // Utiliser uai_teach (UAI de l'établissement du prof)
      const uai = (r.uai_teach || "").trim().toUpperCase();
      const info = annMap.get(uai);
      
      // Si UAI est NULL ou absent de l'annuaire → privé
      if (!info || uai === "NULL") {
        profsPrives.add(r.teacher);
      } else if (info.secteur === "Public") {
        profsPublics.add(r.teacher);
      } else if (info.secteur === "Privé") {
        profsPrives.add(r.teacher);
      }
    }
    
    const nombreProfsPublics = profsPublics.size;
    const nombreProfsPrives = profsPrives.size;
    
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
    
    // Calcul des élèves uniques (exclure les profs qui testent)
    const uniqueStudents = new Set(
      rowsWithDate
        .filter(r => r.Role === "student") // Ne compter que les vrais élèves
        .map(r => r.student)
        .filter(Boolean)
    );
    const totalElevesUniques = uniqueStudents.size;
    
    return {
      totalUsages,
      totalEtablissements,
      totalElevesUniques,
      nombreLycees,
      nombreColleges,
      nombreProfsPublics,
      nombreProfsPrives,
      nombreInconnus,
      usages2023_2024,
      usages2024_2025,
      usages2025_2026,
    };
  }, [rowsWithDate, usageByUaiGlobal, annMap]);

  // Histogramme IPS des lycées avec au moins un usage (GLOBAL)
  const ipsHistogram = useMemo(() => {
    // Récupérer tous les IPS des lycées avec au moins un usage
    const ipsValues: number[] = [];
    for (const point of usageByUaiGlobal) {
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
  }, [usageByUaiGlobal]);

  // Histogramme du nombre d'activités différentes par élève (VRAIS ÉLÈVES uniquement)
  const activitiesPerStudent = useMemo(() => {
    // Map: student -> Set d'activités uniques
    const studentActivities = new Map<string, Set<string>>();
    
    for (const r of rowsWithDate) {
      // Ne compter que les vrais élèves (Role === "student")
      if (r.Role !== "student" || !r.student || !r.mathadata_id) continue;
      
      if (!studentActivities.has(r.student)) {
        studentActivities.set(r.student, new Set());
      }
      studentActivities.get(r.student)!.add(r.mathadata_id);
    }
    
    // Compter combien d'élèves ont fait 1, 2, 3... activités
    const distribution = new Map<number, number>();
    for (const activities of studentActivities.values()) {
      const count = activities.size;
      distribution.set(count, (distribution.get(count) || 0) + 1);
    }
    
    // Convertir en tableau trié
    return Array.from(distribution.entries())
      .map(([nbActivites, nbEleves]) => ({
        nbActivites: `${nbActivites} activité${nbActivites > 1 ? 's' : ''}`,
        nbEleves,
        nbActivitesNum: nbActivites  // Pour le tri
      }))
      .sort((a, b) => a.nbActivitesNum - b.nbActivitesNum);
  }, [rowsWithDate]);

  // Usages par académie (basé sur l'établissement de l'élève)
  const usageByAcademie = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsWithDate) {
      const uai = (r.uai_el || r.uai || "").trim();
      const info = annMap.get(uai);
      const academie = info?.academie || "Inconnue";
      map.set(academie, (map.get(academie) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([academie, count]) => ({ academie, count }))
      .sort((a, b) => b.count - a.count); // Tri décroissant par nombre d'usages
  }, [rowsWithDate, annMap]);

  // Détails des activités pour un établissement sélectionné
  const getActivityDetailsForUai = (uai: string) => {
    const activitiesMap = new Map<string, { 
      studentCount: number; 
      teacherCount: number; 
      lastDate: Date | null 
    }>();
    
    rowsWithDate.forEach(r => {
      const rowUai = (r.uai_el || r.uai || "").trim();
      if (rowUai === uai && r.mathadata_id) {
        const activityName = getActivityName(r.mathadata_id, r.mathadata_title);
        const existing = activitiesMap.get(activityName);
        const currentDate = r._date;
        
        if (existing) {
          if (r.Role === "student") {
            existing.studentCount += 1;
          } else if (r.Role === "teacher") {
            existing.teacherCount += 1;
          }
          if (!existing.lastDate || (currentDate && currentDate > existing.lastDate)) {
            existing.lastDate = currentDate;
          }
        } else {
          activitiesMap.set(activityName, { 
            studentCount: r.Role === "student" ? 1 : 0,
            teacherCount: r.Role === "teacher" ? 1 : 0,
            lastDate: currentDate 
          });
        }
      }
    });
    
    return Array.from(activitiesMap.entries())
      .map(([activity, data]) => ({
        activity,
        studentCount: data.studentCount,
        teacherCount: data.teacherCount,
        totalCount: data.studentCount + data.teacherCount,
        lastDate: data.lastDate
      }))
      .sort((a, b) => b.totalCount - a.totalCount);
  };

  // Nouvelle fonction : usages par classe-activité GROUPÉS PAR PROFESSEUR
  // Une classe = groupe d'élèves avec même prof + même activité + sessions créées le même jour à < 2h d'intervalle
  const getClassActivityDetailsForUai = (uai: string) => {
    // 1. Récupérer toutes les sessions élèves pour cet UAI
    const studentSessions = rowsWithDate
      .filter(r => {
        const rowUai = (r.uai_el || r.uai || "").trim();
        return rowUai === uai && r.Role === "student" && r.mathadata_id && r.teacher && r.student && r._date;
      })
      .map(r => ({
        student: r.student!,
        teacher: r.teacher!,
        mathadata_id: r.mathadata_id!,
        mathadata_title: r.mathadata_title || "",
        created: r._date!.getTime(), // timestamp en ms
        changed: r.changed ? parseMaybeEpoch(r.changed)?.getTime() || r._date!.getTime() : r._date!.getTime(),
      }));
    
    // 2. Grouper par (teacher, mathadata_id)
    type GroupKey = string; // "teacher|mathadata_id"
    type SessionType = typeof studentSessions[number];
    const groups = new Map<GroupKey, SessionType[]>();
    
    studentSessions.forEach(session => {
      const key = `${session.teacher}|${session.mathadata_id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });
    
    // 3. Pour chaque groupe, détecter les classes (fenêtre temporelle de 2h)
    type SeanceType = {
      activityName: string;
      studentCount: number;
      creationDate: string;
      avgWorkTimeMinutes: number;
      sessions: SessionType[];
      teacher: string;
    };
    
    const allSeances: SeanceType[] = [];
    
    groups.forEach((sessions, key) => {
      const teacher = sessions[0].teacher;
      
      // Trier par date de création
      const sorted = sessions.sort((a, b) => a.created - b.created);
      
      // Algorithme de clustering temporel : fenêtre de 2h (7200000 ms)
      const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
      const clusters: SessionType[][] = [];
      
      let currentCluster: SessionType[] = [];
      let clusterStartTime = 0;
      
      sorted.forEach(session => {
        if (currentCluster.length === 0) {
          // Première session du cluster
          currentCluster.push(session);
          clusterStartTime = session.created;
        } else {
          const timeSinceClusterStart = session.created - clusterStartTime;
          if (timeSinceClusterStart <= TWO_HOURS_MS) {
            // Dans la fenêtre de 2h
            currentCluster.push(session);
          } else {
            // Nouvelle classe détectée
            clusters.push([...currentCluster]);
            currentCluster = [session];
            clusterStartTime = session.created;
          }
        }
      });
      
      // Ajouter le dernier cluster
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      
      // 4. Pour chaque cluster, créer une entrée "séance"
      clusters.forEach(cluster => {
        const activityName = getActivityName(cluster[0].mathadata_id, cluster[0].mathadata_title);
        const studentCount = cluster.length;
        const creationDate = new Date(cluster[0].created).toLocaleDateString('fr-FR');
        
        // Calculer le temps moyen de travail (changed - created) en minutes
        const workTimes = cluster.map(s => (s.changed - s.created) / 1000 / 60); // en minutes
        const avgWorkTimeMinutes = workTimes.reduce((sum, t) => sum + t, 0) / workTimes.length;
        
        allSeances.push({
          activityName,
          studentCount,
          creationDate,
          avgWorkTimeMinutes: Math.round(avgWorkTimeMinutes),
          sessions: cluster,
          teacher,
        });
      });
    });
    
    // 5. Grouper les séances par professeur
    const seancesByProf = new Map<string, SeanceType[]>();
    allSeances.forEach(seance => {
      if (!seancesByProf.has(seance.teacher)) {
        seancesByProf.set(seance.teacher, []);
      }
      seancesByProf.get(seance.teacher)!.push(seance);
    });
    
    // 6. Trier les séances de chaque prof par date décroissante
    seancesByProf.forEach(seances => {
      seances.sort((a, b) => {
        const dateA = new Date(a.creationDate.split('/').reverse().join('-'));
        const dateB = new Date(b.creationDate.split('/').reverse().join('-'));
        return dateB.getTime() - dateA.getTime();
      });
    });
    
    // 7. Convertir en tableau et trier par nombre total de séances (prof le plus actif d'abord)
    return Array.from(seancesByProf.entries())
      .map(([teacher, seances]) => ({ teacher, seances }))
      .sort((a, b) => b.seances.length - a.seances.length);
  };

  // Analyse détaillée d'une séance (classe)
  type SessionType = {
    student: string;
    teacher: string;
    mathadata_id: string;
    mathadata_title: string;
    created: number;
    changed: number;
  };
  
  const analyzeSeance = (sessions: SessionType[]) => {
    if (sessions.length === 0) return null;
    
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    
    // 1. Élèves ayant continué après 2h
    const continueApres2h = sessions.filter(s => (s.changed - s.created) > TWO_HOURS_MS).length;
    
    // 2. Élèves travaillant à domicile (soir après 18h ou weekend)
    const workingAtHome = sessions.filter(s => {
      const changedDate = new Date(s.changed);
      const createdDate = new Date(s.created);
      
      // Si changed est le même jour que created et avant 18h, pas à domicile
      if (changedDate.toDateString() === createdDate.toDateString()) {
        return changedDate.getHours() >= 18; // Après 18h le même jour
      }
      
      // Si changé un autre jour
      const dayOfWeek = changedDate.getDay(); // 0=dimanche, 6=samedi
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isEvening = changedDate.getHours() >= 18 || changedDate.getHours() < 8;
      
      return isWeekend || isEvening;
    }).length;
    
    // 3. Détecter une 2ème séance en classe
    // = plusieurs élèves modifiant leurs sessions dans une fenêtre de 2h
    // et au moins 2h après la séance initiale
    
    // Récupérer toutes les timestamps de modification (après la séance initiale)
    const seanceInitialEnd = Math.max(...sessions.map(s => s.created)) + TWO_HOURS_MS;
    const modificationsApres = sessions
      .filter(s => s.changed > seanceInitialEnd)
      .map(s => ({ student: s.student, timestamp: s.changed }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Chercher des groupes de modifications dans une fenêtre de 2h
    let deuxiemeSeance = false;
    let deuxiemeSeanceSize = 0;
    let deuxiemeSeanceDate: Date | null = null;
    
    if (modificationsApres.length >= 2) {
      // Algorithme de clustering sur les modifications
      let currentGroup: typeof modificationsApres = [];
      let groupStartTime = 0;
      
      modificationsApres.forEach(modif => {
        if (currentGroup.length === 0) {
          currentGroup.push(modif);
          groupStartTime = modif.timestamp;
        } else {
          const timeSinceGroupStart = modif.timestamp - groupStartTime;
          if (timeSinceGroupStart <= TWO_HOURS_MS) {
            currentGroup.push(modif);
          } else {
            // Groupe terminé, vérifier s'il constitue une 2ème séance
            if (currentGroup.length >= 2 && currentGroup.length > deuxiemeSeanceSize) {
              deuxiemeSeance = true;
              deuxiemeSeanceSize = currentGroup.length;
              deuxiemeSeanceDate = new Date(currentGroup[0].timestamp);
            }
            currentGroup = [modif];
            groupStartTime = modif.timestamp;
          }
        }
      });
      
      // Vérifier le dernier groupe
      if (currentGroup.length >= 2 && currentGroup.length > deuxiemeSeanceSize) {
        deuxiemeSeance = true;
        deuxiemeSeanceSize = currentGroup.length;
        deuxiemeSeanceDate = new Date(currentGroup[0].timestamp);
      }
    }
    
    return {
      totalStudents: sessions.length,
      continueApres2h,
      workingAtHome,
      deuxiemeSeance,
      deuxiemeSeanceSize,
      deuxiemeSeanceDate,
    };
  };

  // Évolution mensuelle pour une académie spécifique
  const getMonthlyDataForAcademie = (academie: string) => {
    const filteredByAcademie = rowsWithDate.filter(r => {
      const uai = (r.uai_el || r.uai || "").trim();
      const info = annMap.get(uai);
      return (info?.academie || "Inconnue") === academie;
    });
    
    const m = groupCount(filteredByAcademie, r => fmtMonth(r._date));
    
    // Trouver les dates min/max globales (toutes académies)
    if (rowsWithDate.length === 0) return [];
    
    const allDates = rowsWithDate.map(r => r._date);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Générer tous les mois entre min et max
    const allMonths: string[] = [];
    const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    
    while (current <= end) {
      allMonths.push(fmtMonth(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    // Créer le résultat avec 0 pour les mois sans données
    return allMonths.map(month => ({
      month,
      count: m.get(month) || 0
    }));
  };

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
          <div style={{marginBottom: 12, display: "flex", gap: 16, fontSize: "0.875rem"}}>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <div style={{
                width: 12, 
                height: 12, 
                borderRadius: "50%", 
                backgroundColor: "#10b981"
              }}></div>
              <span>Usages élèves</span>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 6}}>
              <div style={{
                width: 12, 
                height: 12, 
                borderRadius: "50%", 
                backgroundColor: "#ef4444"
              }}></div>
              <span>Tests profs uniquement</span>
            </div>
          </div>
          <div className="map">
            <UsageMap points={usageByUai} onPointClick={(uai) => setSelectedUai(uai)} />
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
              <option value="nbSeances">Trier par séances</option>
              <option value="nbEleves">Trier par élèves</option>
              <option value="nbProfsEnseignant">Trier par profs enseignants</option>
              <option value="nbProfsTestant">Trier par profs testant</option>
              <option value="nom_lycee">Trier par lycée</option>
              <option value="ville">Trier par ville</option>
              <option value="academie">Trier par académie</option>
              <option value="ips">Trier par IPS</option>
            </select>
            <button onClick={()=>setSortAsc(s=>!s)}>{sortAsc ? "↑" : "↓"}</button>
          </div>
          <div style={{maxHeight: 420, overflowY: "auto", overflowX: "auto"}}>
            <table style={{width: "100%"}}>
              <thead>
                <tr>
                  <th style={{minWidth: "150px"}}>Établissement</th>
                  <th style={{minWidth: "100px"}}>Ville</th>
                  <th style={{minWidth: "100px"}}>Académie</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Séances</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Élèves</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Profs ens.</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Profs test</th>
                  <th style={{textAlign:"right", minWidth: "60px"}}>IPS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(r => (
                  <tr key={r.uai}>
                    <td>
                      <span 
                        style={{
                          color: r.hasStudents ? "#10b981" : "#ef4444",
                          cursor: "pointer", 
                          textDecoration: "underline",
                          fontWeight: r.hasStudents ? "600" : "normal"
                        }}
                        onClick={() => setSelectedUai(r.uai)}
                      >
                        {r.nom_lycee || "—"}
                      </span>
                    </td>
                    <td>{r.ville || "—"}</td>
                    <td>{r.academie || "—"}</td>
                    <td style={{textAlign:"center"}}>{r.nbSeances}</td>
                    <td style={{textAlign:"center", color: "#10b981", fontWeight: r.nbEleves > 0 ? "600" : "normal"}}>
                      {r.nbEleves}
                    </td>
                    <td style={{textAlign:"center", color: "#3b82f6", fontWeight: r.nbProfsEnseignant > 0 ? "600" : "normal"}}>
                      {r.nbProfsEnseignant}
                    </td>
                    <td style={{textAlign:"center", color: "#ef4444", fontWeight: r.nbProfsTestant > 0 ? "600" : "normal"}}>
                      {r.nbProfsTestant}
                    </td>
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
                <td><strong>Nombre d'élèves uniques</strong></td>
                <td style={{textAlign:"right"}}><strong>{globalStats.totalElevesUniques.toLocaleString("fr-FR")}</strong></td>
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
                <td>Profs Publics</td>
                <td style={{textAlign:"right"}}>{globalStats.nombreProfsPublics.toLocaleString("fr-FR")}</td>
              </tr>
              <tr>
                <td>Profs Privés</td>
                <td style={{textAlign:"right"}}>{globalStats.nombreProfsPrives.toLocaleString("fr-FR")}</td>
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

      {/* Nouvelle section: Engagement des élèves */}
      <div className="card" style={{marginTop: 16}}>
        <h2>Nombre d'activités différentes utilisées par élève</h2>
        <p className="muted" style={{marginTop: 0, marginBottom: 16}}>
          Distribution du nombre d'activités MathAData différentes testées par chaque élève
        </p>
        <div style={{height: 300}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activitiesPerStudent}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nbActivites" />
              <YAxis allowDecimals={false} label={{ value: "Nombre d'élèves", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="nbEleves" name="Élèves" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usages par académie */}
      <div className="card" style={{marginTop: 16}}>
        <h2>Usages par académie</h2>
        <div style={{height: 400}}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={usageByAcademie} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="academie" angle={-45} textAnchor="end" height={120} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar 
                dataKey="count" 
                name="Nombre d'usages" 
                fill="#f59e0b"
                onClick={(data: any) => {
                  if (data && data.academie) {
                    setSelectedAcademie(data.academie);
                  }
                }}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modal détails activités par établissement */}
      {selectedUai && (() => {
        const etablissement = usageByUai.find(e => e.uai === selectedUai);
        const activityDetails = getActivityDetailsForUai(selectedUai);
        const classActivityDetails = getClassActivityDetailsForUai(selectedUai);
        
        return (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
            onClick={() => setSelectedUai(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: "800px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
                <div>
                  <h2 style={{marginBottom: "4px"}}>{etablissement?.nom_lycee || "Établissement"}</h2>
                  <p className="muted" style={{marginTop: 0}}>
                    {etablissement?.ville && `${etablissement.ville} • `}
                    {etablissement?.academie && `${etablissement.academie} • `}
                    UAI: {selectedUai}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedUai(null)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "4px 12px",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              
              {/* Nouveau tableau : Usages par classe-activité GROUPÉS PAR PROFESSEUR */}
              <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569", marginTop: "24px"}}>
                📚 Séances par professeur ({classActivityDetails.reduce((sum, prof) => sum + prof.seances.length, 0)} séances, {classActivityDetails.length} {classActivityDetails.length > 1 ? 'profs' : 'prof'})
              </h3>
              <p className="muted" style={{marginTop: 0, marginBottom: "12px", fontSize: "0.875rem"}}>
                Une séance = groupe d'élèves avec même prof + même activité + sessions créées le même jour à moins de 2h d'intervalle
              </p>
              
              {classActivityDetails.length > 0 ? (
                <div style={{marginBottom: "32px"}}>
                  {classActivityDetails.map((profData, profIdx) => {
                    // Calculer l'index global de chaque séance pour le click
                    const seanceStartIndex = classActivityDetails
                      .slice(0, profIdx)
                      .reduce((sum, p) => sum + p.seances.length, 0);
                    
                    return (
                      <div key={profIdx} style={{marginBottom: "24px"}}>
                        {/* En-tête professeur */}
                        <div style={{
                          backgroundColor: "#f8fafc",
                          padding: "12px 16px",
                          borderRadius: "8px 8px 0 0",
                          borderBottom: "2px solid #e2e8f0",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <strong style={{color: "#334155"}}>Prof {String.fromCharCode(65 + profIdx)}</strong>
                            <span style={{color: "#64748b", marginLeft: "12px", fontSize: "0.875rem"}}>
                              {profData.seances.length} séance{profData.seances.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <span style={{fontSize: "0.75rem", color: "#94a3b8"}}>
                            {profData.teacher.substring(0, 8)}...
                          </span>
                        </div>
                        
                        {/* Tableau des séances de ce prof */}
                        <table style={{width: "100%", marginBottom: 0}}>
                          <thead style={{backgroundColor: "#f8fafc"}}>
                            <tr>
                              <th style={{textAlign: "left", padding: "8px 16px"}}>Activité</th>
                              <th style={{textAlign:"center", padding: "8px"}}>Nb élèves</th>
                              <th style={{textAlign:"center", padding: "8px"}}>Date</th>
                              <th style={{textAlign:"right", padding: "8px 16px"}}>Temps moyen</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profData.seances.map((seance, seanceIdx) => {
                              const globalIdx = seanceStartIndex + seanceIdx;
                              return (
                                <tr 
                                  key={seanceIdx}
                                  onClick={() => setSelectedSeance(globalIdx)}
                                  style={{
                                    cursor: "pointer",
                                    transition: "background-color 0.2s",
                                    borderBottom: seanceIdx < profData.seances.length - 1 ? "1px solid #f1f5f9" : "none"
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                                >
                                  <td style={{padding: "8px 16px"}}>{seance.activityName}</td>
                                  <td style={{textAlign:"center", fontWeight: "600", padding: "8px"}}>{seance.studentCount}</td>
                                  <td style={{textAlign:"center", padding: "8px"}}>{seance.creationDate}</td>
                                  <td style={{textAlign:"right", padding: "8px 16px"}}>
                                    {seance.avgWorkTimeMinutes < 60 
                                      ? `${seance.avgWorkTimeMinutes} min`
                                      : seance.avgWorkTimeMinutes < 1440
                                        ? `${Math.floor(seance.avgWorkTimeMinutes / 60)}h${seance.avgWorkTimeMinutes % 60 > 0 ? (seance.avgWorkTimeMinutes % 60).toString().padStart(2, '0') : ''}`
                                        : `${Math.floor(seance.avgWorkTimeMinutes / 1440)}j ${Math.floor((seance.avgWorkTimeMinutes % 1440) / 60)}h`
                                    }
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted" style={{marginBottom: "32px"}}>Aucun usage élève détecté pour cet établissement.</p>
              )}
              
              {/* Tableau existant : total des usages par activité */}
              <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569"}}>
                📊 Total des activités utilisées ({activityDetails.length})
              </h3>
              
              <table style={{width: "100%"}}>
                <thead>
                  <tr>
                    <th>Activité</th>
                    <th style={{textAlign:"right", color: "#10b981"}}>Élèves</th>
                    <th style={{textAlign:"right", color: "#ef4444"}}>Profs</th>
                    <th style={{textAlign:"right"}}>Total</th>
                    <th style={{textAlign:"right"}}>Dernier usage</th>
                  </tr>
                </thead>
                <tbody>
                  {activityDetails.map(detail => (
                    <tr key={detail.activity}>
                      <td>{detail.activity}</td>
                      <td style={{textAlign:"right", color: "#10b981", fontWeight: detail.studentCount > 0 ? "600" : "normal"}}>
                        {detail.studentCount}
                      </td>
                      <td style={{textAlign:"right", color: "#ef4444", fontWeight: detail.teacherCount > 0 ? "600" : "normal"}}>
                        {detail.teacherCount}
                      </td>
                      <td style={{textAlign:"right", fontWeight: "600"}}>
                        {detail.totalCount}
                      </td>
                      <td style={{textAlign:"right"}}>
                        {detail.lastDate 
                          ? detail.lastDate.toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })
                          : "—"
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Modal détails d'une séance */}
      {selectedUai && selectedSeance !== null && (() => {
        const etablissement = usageByUai.find(e => e.uai === selectedUai);
        const classActivityDetails = getClassActivityDetailsForUai(selectedUai);
        
        // Convertir l'index global en vraie séance
        let currentIndex = 0;
        let foundSeance = null;
        for (const profData of classActivityDetails) {
          for (const seance of profData.seances) {
            if (currentIndex === selectedSeance) {
              foundSeance = seance;
              break;
            }
            currentIndex++;
          }
          if (foundSeance) break;
        }
        
        if (!foundSeance) return null;
        
        const analysis = analyzeSeance(foundSeance.sessions);
        if (!analysis) return null;
        
        return (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px"
            }}
            onClick={() => setSelectedSeance(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: "700px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
                <div>
                  <h2 style={{marginBottom: "4px"}}>Détails de la séance</h2>
                  <p className="muted" style={{marginTop: 0}}>
                    {foundSeance.activityName} • {foundSeance.creationDate} • {etablissement?.nom_lycee}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSeance(null)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "4px 12px",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px"}}>
                <div className="card" style={{padding: "16px", backgroundColor: "#f8fafc"}}>
                  <div style={{fontSize: "2rem", fontWeight: "700", color: "#0ea5e9"}}>
                    {analysis.totalStudents}
                  </div>
                  <div style={{fontSize: "0.875rem", color: "#64748b", marginTop: "4px"}}>
                    Élèves total
                  </div>
                </div>
                
                <div className="card" style={{padding: "16px", backgroundColor: "#f8fafc"}}>
                  <div style={{fontSize: "2rem", fontWeight: "700", color: "#8b5cf6"}}>
                    {foundSeance.avgWorkTimeMinutes < 60 
                      ? `${foundSeance.avgWorkTimeMinutes} min`
                      : foundSeance.avgWorkTimeMinutes < 1440
                        ? `${Math.floor(foundSeance.avgWorkTimeMinutes / 60)}h${foundSeance.avgWorkTimeMinutes % 60 > 0 ? (foundSeance.avgWorkTimeMinutes % 60).toString().padStart(2, '0') : ''}`
                        : `${Math.floor(foundSeance.avgWorkTimeMinutes / 1440)}j ${Math.floor((foundSeance.avgWorkTimeMinutes % 1440) / 60)}h`
                    }
                  </div>
                  <div style={{fontSize: "0.875rem", color: "#64748b", marginTop: "4px"}}>
                    Temps moyen de travail
                  </div>
                </div>
              </div>
              
              <h3 style={{fontSize: "1rem", marginBottom: "16px", color: "#475569"}}>
                📊 Continuité du travail
              </h3>
              
              <div style={{marginBottom: "24px"}}>
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
                  <span>Élèves ayant continué après la séance ({'>'}2h)</span>
                  <strong style={{fontSize: "1.25rem", color: "#10b981"}}>
                    {analysis.continueApres2h}
                  </strong>
                </div>
                <div style={{
                  height: "8px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  overflow: "hidden",
                  marginBottom: "16px"
                }}>
                  <div style={{
                    width: `${(analysis.continueApres2h / analysis.totalStudents) * 100}%`,
                    height: "100%",
                    backgroundColor: "#10b981",
                    transition: "width 0.3s"
                  }} />
                </div>
                
                <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px"}}>
                  <span>Élèves travaillant à domicile (soir/weekend)</span>
                  <strong style={{fontSize: "1.25rem", color: "#f59e0b"}}>
                    {analysis.workingAtHome}
                  </strong>
                </div>
                <div style={{
                  height: "8px",
                  backgroundColor: "#e2e8f0",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${(analysis.workingAtHome / analysis.totalStudents) * 100}%`,
                    height: "100%",
                    backgroundColor: "#f59e0b",
                    transition: "width 0.3s"
                  }} />
                </div>
              </div>
              
              <h3 style={{fontSize: "1rem", marginBottom: "16px", color: "#475569"}}>
                🎓 Détection d'une 2ème séance en classe
              </h3>
              
              {analysis.deuxiemeSeance ? (
                <div className="card" style={{padding: "16px", backgroundColor: "#dbeafe", border: "1px solid #3b82f6"}}>
                  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    <div style={{fontSize: "2rem"}}>✅</div>
                    <div>
                      <div style={{fontWeight: "600", color: "#1e40af", marginBottom: "4px"}}>
                        2ème séance détectée !
                      </div>
                      <div style={{fontSize: "0.875rem", color: "#1e40af"}}>
                        {analysis.deuxiemeSeanceSize} élèves ont retravaillé ensemble
                        {analysis.deuxiemeSeanceDate && ` le ${analysis.deuxiemeSeanceDate.toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card" style={{padding: "16px", backgroundColor: "#f1f5f9"}}>
                  <div style={{display: "flex", alignItems: "center", gap: "12px"}}>
                    <div style={{fontSize: "2rem"}}>ℹ️</div>
                    <div>
                      <div style={{fontWeight: "600", color: "#64748b", marginBottom: "4px"}}>
                        Pas de 2ème séance détectée
                      </div>
                      <div style={{fontSize: "0.875rem", color: "#64748b"}}>
                        Aucun groupe d'élèves n'a retravaillé ensemble après la séance initiale
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal évolution temporelle par académie */}
      {selectedAcademie && (() => {
        const monthlyData = getMonthlyDataForAcademie(selectedAcademie);
        const totalUsagesAcademie = monthlyData.reduce((sum, d) => sum + d.count, 0);
        
        return (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px"
            }}
            onClick={() => setSelectedAcademie(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: "900px",
                width: "100%",
                maxHeight: "80vh",
                overflow: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
                <div>
                  <h2 style={{marginBottom: "4px"}}>Académie de {selectedAcademie}</h2>
                  <p className="muted" style={{marginTop: 0}}>
                    Total des usages : {totalUsagesAcademie.toLocaleString("fr-FR")}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedAcademie(null)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "4px 12px",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              
              <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569"}}>
                Évolution mensuelle des usages
              </h3>
              
              <div style={{height: 400, marginTop: "20px"}}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      name="Usages mensuels" 
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: "#f59e0b", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

