"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import type { UsageMapProps } from "@/components/UsageMap";

// Fonction pour normaliser les noms d'académies (gérer la fusion Caen/Rouen -> Normandie depuis 2020)
function normalizeAcademyName(name: string | undefined): string {
  if (!name) return "";
  const normalized = name.trim();
  // Gérer la fusion des académies de Caen et Rouen en Normandie (janvier 2020)
  if (normalized === "Caen" || normalized === "Rouen") {
    return "Normandie";
  }
  return normalized;
}
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
            academie: normalizeAcademyName(String(r.academie ?? "")),
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
    const ONE_HOUR_MS = 60 * 60 * 1000;
    
    groups.forEach(sessions => {
      const sorted = sessions.sort((a, b) => a.created - b.created);
      let currentClusterStart = 0;
      
      sorted.forEach(session => {
        if (currentClusterStart === 0 || session.created - currentClusterStart > ONE_HOUR_MS) {
          nbSeances++;
          currentClusterStart = session.created;
        }
      });
    });
    
    // 4. Compter les profs ayant enseigné (profs avec des sessions élèves dans cet établissement)
    const profsEnseignant = new Set<string>();
    rowsWithDate.forEach(r => {
      const rowUai = (r.uai_el || r.uai || "").trim();
      if (rowUai === uai && r.Role === "student" && r.teacher) {
        profsEnseignant.add(r.teacher);
      }
    });
    
    // 5. Compter les profs testant (profs avec des sessions Role="teacher" dans cet établissement)
    // On utilise uai_teach pour identifier où le prof a testé
    const profsTestant = new Set<string>();
    rowsWithDate.forEach(r => {
      const uaiTeach = (r.uai_teach || "").trim();
      if (uaiTeach === uai && r.Role === "teacher" && r.teacher) {
        profsTestant.add(r.teacher);
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
  const [selectedSeancesCount, setSelectedSeancesCount] = useState<number | null>(null); // pour le modal des profs par nb de séances
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [showAcademyBorders, setShowAcademyBorders] = useState(false);
  const [officialAcademyStats, setOfficialAcademyStats] = useState<any>(null);
  
  // Charger les statistiques officielles des académies
  useEffect(() => {
    fetch('/data/academies_stats.json')
      .then(res => res.json())
      .then(data => setOfficialAcademyStats(data))
      .catch(err => console.error("Erreur chargement stats académies:", err));
  }, []);
  
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
        // Pour l'IPS, convertir en nombre en gérant tous les cas
        let ipsA: number | null = null;
        let ipsB: number | null = null;
        
        if (a.ips != null && a.ips !== undefined && a.ips !== '') {
          const parsed = typeof a.ips === 'string' ? parseFloat(a.ips) : Number(a.ips);
          if (!isNaN(parsed)) ipsA = parsed;
        }
        
        if (b.ips != null && b.ips !== undefined && b.ips !== '') {
          const parsed = typeof b.ips === 'string' ? parseFloat(b.ips) : Number(b.ips);
          if (!isNaN(parsed)) ipsB = parsed;
        }
        
        // Gérer les valeurs null : les mettre toujours à la fin
        if (ipsA === null && ipsB === null) return 0;
        if (ipsA === null) return 1; // null va toujours à la fin
        if (ipsB === null) return -1; // null va toujours à la fin
        
        // Comparer les nombres
        return sortAsc ? (ipsA - ipsB) : (ipsB - ipsA);
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
    
    // Calcul des séances globales
    // 1. Récupérer toutes les sessions étudiants
    const studentSessions = rowsWithDate
      .filter(r => r.Role === "student" && r.mathadata_id && r.teacher && r.student && r._date)
      .map(r => ({
        student: r.student!,
        teacher: r.teacher!,
        mathadata_id: r.mathadata_id!,
        mathadata_title: r.mathadata_title || "",
        uai: (r.uai_el || r.uai || "").trim(),
        created: r._date!.getTime(),
        changed: r.changed ? parseMaybeEpoch(r.changed)?.getTime() || r._date!.getTime() : r._date!.getTime(),
      }));
    
    // 2. Grouper par (uai, teacher, mathadata_id)
    type SessionType = typeof studentSessions[number];
    const groups = new Map<string, SessionType[]>();
    
    studentSessions.forEach(session => {
      const key = `${session.uai}|${session.teacher}|${session.mathadata_id}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(session);
    });
    
    // 3. Pour chaque groupe, détecter les séances (clustering temporel 1h)
    const ONE_HOUR_MS = 60 * 60 * 1000;
    let totalSeances = 0;
    let totalDeuxiemeSeances = 0;
    let totalElevesInSeances = 0;
    let totalDureeSeances = 0; // en minutes
    
    groups.forEach(sessions => {
      // Trier par date de création
      const sorted = sessions.sort((a, b) => a.created - b.created);
      
      // Clustering temporel
      const clusters: SessionType[][] = [];
      let currentCluster: SessionType[] = [];
      let clusterStartTime = 0;
      
      sorted.forEach(session => {
        if (currentCluster.length === 0) {
          currentCluster.push(session);
          clusterStartTime = session.created;
        } else {
          const timeSinceClusterStart = session.created - clusterStartTime;
          if (timeSinceClusterStart <= ONE_HOUR_MS) {
            currentCluster.push(session);
          } else {
            clusters.push([...currentCluster]);
            currentCluster = [session];
            clusterStartTime = session.created;
          }
        }
      });
      
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      
      // Pour chaque séance (cluster)
      clusters.forEach(cluster => {
        totalSeances++;
        totalElevesInSeances += cluster.length;
        
        // Calculer durée moyenne de cette séance
        const workTimes = cluster.map(s => (s.changed - s.created) / 1000 / 60); // en minutes
        const avgWorkTime = workTimes.reduce((sum, t) => sum + t, 0) / workTimes.length;
        totalDureeSeances += avgWorkTime;
        
        // Détecter 2ème séance
        const seanceInitialEnd = Math.max(...cluster.map(s => s.created)) + ONE_HOUR_MS;
        const modificationsApres = cluster
          .filter(s => s.changed > seanceInitialEnd)
          .map(s => ({ student: s.student, timestamp: s.changed }))
          .sort((a, b) => a.timestamp - b.timestamp);
        
        if (modificationsApres.length >= 2) {
          let currentGroup: typeof modificationsApres = [];
          let groupStartTime = 0;
          let has2ndeSeance = false;
          
          modificationsApres.forEach(modif => {
            if (currentGroup.length === 0) {
              currentGroup.push(modif);
              groupStartTime = modif.timestamp;
            } else {
              const timeSinceGroupStart = modif.timestamp - groupStartTime;
              if (timeSinceGroupStart <= ONE_HOUR_MS) {
                currentGroup.push(modif);
              } else {
                if (currentGroup.length >= 2) {
                  has2ndeSeance = true;
                }
                currentGroup = [modif];
                groupStartTime = modif.timestamp;
              }
            }
          });
          
          if (currentGroup.length >= 2) {
            has2ndeSeance = true;
          }
          
          if (has2ndeSeance) {
            totalDeuxiemeSeances++;
          }
        }
      });
    });
    
    const moyenneElevesParSeance = totalSeances > 0 ? totalElevesInSeances / totalSeances : 0;
    const dureeMoyenneSeance = totalSeances > 0 ? totalDureeSeances / totalSeances : 0;
    const pourcentage2eSeance = totalSeances > 0 ? (totalDeuxiemeSeances / totalSeances) * 100 : 0;
    
    // Analyse du comportement des enseignants (test vs enseignement)
    const teacherBehavior = new Map<string, { hasTeacherSessions: boolean; hasStudentSessions: boolean; firstTeacherSession?: number; firstStudentSession?: number }>();
    
    for (const r of rowsWithDate) {
      if (!r.teacher) continue;
      
      const teacher = r.teacher;
      if (!teacherBehavior.has(teacher)) {
        teacherBehavior.set(teacher, { 
          hasTeacherSessions: false, 
          hasStudentSessions: false 
        });
      }
      
      const behavior = teacherBehavior.get(teacher)!;
      const timestamp = r._date!.getTime();
      
      if (r.Role === "teacher") {
        behavior.hasTeacherSessions = true;
        if (!behavior.firstTeacherSession || timestamp < behavior.firstTeacherSession) {
          behavior.firstTeacherSession = timestamp;
        }
      } else if (r.Role === "student") {
        behavior.hasStudentSessions = true;
        if (!behavior.firstStudentSession || timestamp < behavior.firstStudentSession) {
          behavior.firstStudentSession = timestamp;
        }
      }
    }
    
    let profsTestedThenTaught = 0;
    let profsTaughtWithoutTesting = 0;
    let profsTestedButNeverTaught = 0;
    
    for (const [_teacher, behavior] of teacherBehavior) {
      if (behavior.hasTeacherSessions && behavior.hasStudentSessions) {
        // Le prof a à la fois testé et enseigné
        if (behavior.firstTeacherSession! < behavior.firstStudentSession!) {
          // Test avant enseignement
          profsTestedThenTaught++;
        } else {
          // Enseignement avant test (ou en même temps) → compter comme "enseigné sans tester"
          profsTaughtWithoutTesting++;
        }
      } else if (behavior.hasStudentSessions && !behavior.hasTeacherSessions) {
        // A enseigné sans jamais tester
        profsTaughtWithoutTesting++;
      } else if (behavior.hasTeacherSessions && !behavior.hasStudentSessions) {
        // A testé mais jamais enseigné
        profsTestedButNeverTaught++;
      }
    }
    
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
      totalSeances,
      totalDeuxiemeSeances,
      pourcentage2eSeance,
      moyenneElevesParSeance,
      dureeMoyenneSeance,
      profsTestedThenTaught,
      profsTaughtWithoutTesting,
      profsTestedButNeverTaught,
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

  // Nombre de séances par professeur
  const seancesPerTeacher = useMemo(() => {
    // Map: teacher -> tableau de séances
    const teacherSeances = new Map<string, Array<{ 
      date: string; 
      dateObj: Date;
      activity: string; 
      activityName: string;
      students: Set<string>;
      uai: string;
    }>>();
    
    // Collecter toutes les sessions d'élèves
    const studentSessions = rowsWithDate.filter(r => 
      r.Role === "student" && r.mathadata_id && r.teacher && r.student && r._date
    );
    
    // Grouper par (teacher, mathadata_id, date)
    const seanceGroups = new Map<string, typeof studentSessions>();
    
    for (const session of studentSessions) {
      const dateStr = session._date!.toLocaleDateString('fr-FR');
      const key = `${session.teacher}|${session.mathadata_id}|${dateStr}`;
      
      if (!seanceGroups.has(key)) {
        seanceGroups.set(key, []);
      }
      seanceGroups.get(key)!.push(session);
    }
    
    // Pour chaque groupe, appliquer le clustering 1h pour détecter les vraies séances
    for (const [key, sessions] of seanceGroups.entries()) {
      const [teacher, activity] = key.split('|');
      
      // Trier par timestamp
      const sorted = sessions.slice().sort((a, b) => {
        const aTime = typeof a.created === 'number' ? a.created : parseInt(a.created as string, 10);
        const bTime = typeof b.created === 'number' ? b.created : parseInt(b.created as string, 10);
        return aTime - bTime;
      });
      
      // Clustering avec fenêtre d'1h
      const ONE_HOUR_MS = 3600000;
      const clusters: typeof sorted[] = [];
      let currentCluster: typeof sorted = [];
      let clusterStartTime: number | null = null;
      
      for (const session of sorted) {
        const sessionTime = typeof session.created === 'number' 
          ? session.created * 1000 
          : parseInt(session.created as string, 10) * 1000;
        
        if (clusterStartTime === null) {
          clusterStartTime = sessionTime;
          currentCluster = [session];
        } else {
          const elapsed = sessionTime - clusterStartTime;
          
          if (elapsed <= ONE_HOUR_MS) {
            currentCluster.push(session);
          } else {
            // Nouvelle séance
            clusters.push(currentCluster);
            currentCluster = [session];
            clusterStartTime = sessionTime;
          }
        }
      }
      
      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }
      
      // Ajouter chaque cluster comme une séance
      for (const cluster of clusters) {
        const dateStr = cluster[0]._date!.toLocaleDateString('fr-FR');
        const dateObj = cluster[0]._date!;
        const students = new Set(cluster.map(s => s.student!));
        const activityName = getActivityName(activity, cluster[0].mathadata_title || "");
        const uai = (cluster[0].uai_el || cluster[0].uai || "").trim();
        
        if (!teacherSeances.has(teacher)) {
          teacherSeances.set(teacher, []);
        }
        teacherSeances.get(teacher)!.push({
          date: dateStr,
          dateObj,
          activity,
          activityName,
          students,
          uai
        });
      }
    }
    
    // Compter la distribution
    const distribution = new Map<number, number>();
    for (const seances of teacherSeances.values()) {
      const count = seances.length;
      distribution.set(count, (distribution.get(count) || 0) + 1);
    }
    
    // Convertir en tableau trié avec les détails
    return {
      chart: Array.from(distribution.entries())
        .map(([nbSeances, nbProfs]) => ({
          nbSeances: `${nbSeances} séance${nbSeances > 1 ? 's' : ''}`,
          nbProfs,
          nbSeancesNum: nbSeances
        }))
        .sort((a, b) => a.nbSeancesNum - b.nbSeancesNum),
      teacherSeances // Garder les détails pour le modal
    };
  }, [rowsWithDate]);

  // Obtenir les détails des professeurs pour un nombre de séances donné
  const getTeacherDetailsForSeanceCount = (nbSeances: number) => {
    const teachers: Array<{
      teacher: string;
      seances: typeof seancesPerTeacher.teacherSeances extends Map<string, infer T> ? T : never;
      lycees: Set<string>;
      activites: Set<string>;
      firstDate: Date;
      lastDate: Date;
    }> = [];
    
    for (const [teacher, seances] of seancesPerTeacher.teacherSeances.entries()) {
      if (seances.length === nbSeances) {
        const lycees = new Set(seances.map(s => s.uai));
        const activites = new Set(seances.map(s => s.activityName));
        const dates = seances.map(s => s.dateObj).sort((a, b) => a.getTime() - b.getTime());
        
        teachers.push({
          teacher,
          seances,
          lycees,
          activites,
          firstDate: dates[0],
          lastDate: dates[dates.length - 1]
        });
      }
    }
    
    return teachers;
  };

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
  // Une classe = groupe d'élèves avec même prof + même activité + sessions créées le même jour à < 1h d'intervalle
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
    
    // 3. Pour chaque groupe, détecter les classes (fenêtre temporelle de 1h)
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
      
      // Algorithme de clustering temporel : fenêtre de 1h (3600000 ms)
      const ONE_HOUR_MS = 60 * 60 * 1000;
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
          if (timeSinceClusterStart <= ONE_HOUR_MS) {
            // Dans la fenêtre de 1h
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
  
  // Fonction pour obtenir les usages des professeurs
  const getTeacherUsagesForUai = (uai: string) => {
    const teacherSessions = rowsWithDate
      .filter(r => {
        const uaiTeach = (r.uai_teach || "").trim();
        return uaiTeach === uai && r.Role === "teacher" && r.teacher && r.mathadata_id && r.created && r.changed;
      })
      .map(r => ({
        teacher: r.teacher!,
        mathadata_id: r.mathadata_id!,
        mathadata_title: r.mathadata_title || "",
        created: typeof r.created === 'number' ? r.created : parseInt(r.created as string, 10),
        changed: typeof r.changed === 'number' ? r.changed : parseInt(r.changed as string, 10)
      }));
    
    // Grouper par professeur
    const byTeacher = new Map<string, typeof teacherSessions>();
    teacherSessions.forEach(session => {
      const existing = byTeacher.get(session.teacher);
      if (existing) {
        existing.push(session);
      } else {
        byTeacher.set(session.teacher, [session]);
      }
    });
    
    // Pour chaque professeur, créer la liste des tests
    return Array.from(byTeacher.entries()).map(([teacher, sessions]) => {
      const tests = sessions.map(s => {
        const workTimeMinutes = Math.round((s.changed - s.created) / 60);
        return {
          activityName: getActivityName(s.mathadata_id, s.mathadata_title),
          activityId: s.mathadata_id,
          createdDate: new Date(s.created * 1000),
          changedDate: new Date(s.changed * 1000),
          workTimeMinutes
        };
      });
      
      // Trier par date de création
      tests.sort((a, b) => a.createdDate.getTime() - b.createdDate.getTime());
      
      return {
        teacher,
        tests
      };
    });
  };
  
  const analyzeSeance = (sessions: SessionType[]) => {
    if (sessions.length === 0) return null;
    
    const ONE_HOUR_MS = 60 * 60 * 1000;
    
    // 1. Élèves ayant continué après 1h
    const continueApres2h = sessions.filter(s => (s.changed - s.created) > ONE_HOUR_MS).length;
    
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
    // = plusieurs élèves modifiant leurs sessions dans une fenêtre de 1h
    // et au moins 1h après la séance initiale
    
    // Récupérer toutes les timestamps de modification (après la séance initiale)
    const seanceInitialEnd = Math.max(...sessions.map(s => s.created)) + ONE_HOUR_MS;
    const modificationsApres = sessions
      .filter(s => s.changed > seanceInitialEnd)
      .map(s => ({ student: s.student, timestamp: s.changed }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Chercher des groupes de modifications dans une fenêtre de 1h
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
          if (timeSinceGroupStart <= ONE_HOUR_MS) {
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

  // Indicateurs de succès par activité
  const activitySuccessMetrics = useMemo(() => {
    const metrics = new Map<string, {
      activityId: string;
      activityName: string;
      // Adoption
      nbLycees: number;
      nbSeances: number;
      nbProfs: number;
      nbElevesUniques: number;
      // Engagement
      tailleClasseMoyenne: number;
      nbReprise: number; // Nb élèves qui continuent >1h
      nbTravailMaison: number; // Nb élèves qui travaillent soir/weekend
      nbDeuxiemeSeance: number; // Nb séances avec 2ème session
      tauxReprise: number; // % élèves qui continuent >1h
      tauxTravailMaison: number; // % élèves qui travaillent soir/weekend
      tauxDeuxiemeSeance: number; // % séances avec 2ème session
      // Fidélisation
      seancesParProf: number;
      // Adoption après test
      nbProfsTestedThenTaught: number; // Nb profs qui ont testé puis enseigné
      nbProfsTested: number; // Nb profs qui ont testé (avec ou sans enseignement après)
      tauxUsageApresTest: number; // % profs qui ont enseigné après avoir testé
    }>();
    
    // Collecter toutes les sessions élèves
    const studentSessions = rowsWithDate.filter(r => 
      r.Role === "student" && r.mathadata_id && r.teacher && r.student && r._date && r.created && r.changed
    );
    
    // Grouper par activité
    const byActivity = new Map<string, typeof studentSessions>();
    studentSessions.forEach(session => {
      const activityId = session.mathadata_id!;
      if (!byActivity.has(activityId)) {
        byActivity.set(activityId, []);
      }
      byActivity.get(activityId)!.push(session);
    });
    
    // Pour chaque activité, calculer les métriques
    for (const [activityId, sessions] of byActivity.entries()) {
      const activityName = getActivityName(activityId, sessions[0].mathadata_title || "");
      
      // Lycées uniques
      const lycees = new Set(sessions.map(s => (s.uai_el || s.uai || "").trim()));
      
      // Profs uniques
      const profs = new Set(sessions.map(s => s.teacher));
      
      // Élèves uniques
      const eleves = new Set(sessions.map(s => s.student));
      
      // Détecter les séances avec clustering 1h
      const seanceGroups = new Map<string, typeof sessions>();
      
      for (const session of sessions) {
        const uai = (session.uai_el || session.uai || "").trim();
        const key = `${uai}|${session.teacher}|${activityId}`;
        
        if (!seanceGroups.has(key)) {
          seanceGroups.set(key, []);
        }
        seanceGroups.get(key)!.push(session);
      }
      
      // Appliquer clustering 1h sur chaque groupe
      const seances: Array<typeof sessions> = [];
      
      for (const [, groupSessions] of seanceGroups.entries()) {
        const sorted = groupSessions.slice().sort((a, b) => {
          const aTime = typeof a.created === 'number' ? a.created : parseInt(a.created as string, 10);
          const bTime = typeof b.created === 'number' ? b.created : parseInt(b.created as string, 10);
          return aTime - bTime;
        });
        
        const ONE_HOUR_MS = 3600000;
        const clusters: typeof sorted[] = [];
        let currentCluster: typeof sorted = [];
        let clusterStartTime: number | null = null;
        
        for (const session of sorted) {
          const sessionTime = typeof session.created === 'number' 
            ? session.created * 1000 
            : parseInt(session.created as string, 10) * 1000;
          
          if (clusterStartTime === null) {
            clusterStartTime = sessionTime;
            currentCluster = [session];
          } else {
            const elapsed = sessionTime - clusterStartTime;
            
            if (elapsed <= ONE_HOUR_MS) {
              currentCluster.push(session);
            } else {
              clusters.push(currentCluster);
              currentCluster = [session];
              clusterStartTime = sessionTime;
            }
          }
        }
        
        if (currentCluster.length > 0) {
          clusters.push(currentCluster);
        }
        
        seances.push(...clusters);
      }
      
      const nbSeances = seances.length;
      
      // Taille moyenne des classes
      const tailleClasseMoyenne = nbSeances > 0 
        ? Math.round(seances.reduce((sum, s) => sum + s.length, 0) / nbSeances)
        : 0;
      
      // Analyser chaque séance pour les métriques d'engagement
      let totalContinueApres2h = 0;
      let totalWorkingAtHome = 0;
      let totalDeuxiemeSeance = 0;
      
      for (const seance of seances) {
        const analysis = analyzeSeance(seance.map(s => ({
          student: s.student!,
          teacher: s.teacher!,
          mathadata_id: s.mathadata_id!,
          mathadata_title: s.mathadata_title || "",
          created: (typeof s.created === 'number' ? s.created : parseInt(s.created as string, 10)) * 1000,
          changed: (typeof s.changed === 'number' ? s.changed : parseInt(s.changed as string, 10)) * 1000
        })));
        
        if (analysis) {
          totalContinueApres2h += analysis.continueApres2h;
          totalWorkingAtHome += analysis.workingAtHome;
          if (analysis.deuxiemeSeance) totalDeuxiemeSeance++;
        }
      }
      
      const totalEleves = seances.reduce((sum, s) => sum + s.length, 0);
      const tauxReprise = totalEleves > 0 ? Math.round((totalContinueApres2h / totalEleves) * 100) : 0;
      const tauxTravailMaison = totalEleves > 0 ? Math.round((totalWorkingAtHome / totalEleves) * 100) : 0;
      const tauxDeuxiemeSeance = nbSeances > 0 ? Math.round((totalDeuxiemeSeance / nbSeances) * 100) : 0;
      
      // Séances par prof
      const seancesParProf = profs.size > 0 ? Math.round((nbSeances / profs.size) * 10) / 10 : 0;
      
      // Calculer le taux d'usage après test
      // 1. Trouver les profs qui ont testé cette activité (Role="teacher")
      const profsWhoTested = new Set<string>();
      const profsTestedThenTaught = new Set<string>();
      
      rowsWithDate.forEach(r => {
        if (r.mathadata_id === activityId && r.Role === "teacher" && r.teacher) {
          profsWhoTested.add(r.teacher);
        }
      });
      
      // 2. Parmi ces profs, trouver ceux qui ont ensuite enseigné (Role="student")
      profsWhoTested.forEach(teacher => {
        const hasTeaching = sessions.some(s => s.teacher === teacher);
        if (hasTeaching) {
          profsTestedThenTaught.add(teacher);
        }
      });
      
      const nbProfsTested = profsWhoTested.size;
      const nbProfsTestedThenTaught = profsTestedThenTaught.size;
      const tauxUsageApresTest = nbProfsTested > 0 ? Math.round((nbProfsTestedThenTaught / nbProfsTested) * 100) : 0;
      
      metrics.set(activityId, {
        activityId,
        activityName,
        nbLycees: lycees.size,
        nbSeances,
        nbProfs: profs.size,
        nbElevesUniques: eleves.size,
        tailleClasseMoyenne,
        nbReprise: totalContinueApres2h,
        nbTravailMaison: totalWorkingAtHome,
        nbDeuxiemeSeance: totalDeuxiemeSeance,
        tauxReprise,
        tauxTravailMaison,
        tauxDeuxiemeSeance,
        seancesParProf,
        nbProfsTestedThenTaught,
        nbProfsTested,
        tauxUsageApresTest
      });
    }
    
    return Array.from(metrics.values())
      .sort((a, b) => b.nbSeances - a.nbSeances); // Trier par nb de séances
  }, [rowsWithDate]);

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

      {/* Nouveau tableau : Indicateurs de succès par activité */}
      <div className="card" style={{marginTop: 16}}>
        <h2>📈 Indicateurs de succès des activités en classe</h2>
        <p className="muted" style={{marginTop: 0, marginBottom: 16}}>
          Métriques détaillées pour évaluer l'adoption, l'engagement et la fidélisation de chaque activité
        </p>
        
        <div style={{overflowX: "auto"}}>
          <table style={{width: "100%", fontSize: "0.875rem"}}>
            <thead style={{backgroundColor: "#f8fafc"}}>
              <tr>
                <th style={{textAlign: "left", padding: "12px", position: "sticky", left: 0, backgroundColor: "#f8fafc", zIndex: 10}}>
                  Activité
                </th>
                <th style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #e2e8f0"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🏫 Lycées</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Adoption</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>📚 Séances</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>En classe</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>👨‍🏫 Profs</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Uniques</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🎓 Élèves</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Uniques</div>
                </th>
                <th style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #e2e8f0"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>👥 Taille</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Classe moy.</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🔄 Reprise</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>{'>'}1h après</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🏠 Maison</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Soir/weekend</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🔁 2ème séance</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Collective</div>
                </th>
                <th style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #e2e8f0"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🔄 Récurrence</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Séance/prof</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>🧪 Usage après test</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Test → Classe</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {activitySuccessMetrics.map((metric, idx) => {
                // Couleurs pour les taux
                const getColor = (value: number, thresholds: [number, number]) => {
                  if (value >= thresholds[1]) return "#34d399"; // Vert
                  if (value >= thresholds[0]) return "#f59e0b"; // Orange
                  return "#f87171"; // Rouge
                };
                
                return (
                  <tr 
                    key={idx}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                      borderBottom: "1px solid #e2e8f0"
                    }}
                  >
                    <td style={{padding: "12px", fontWeight: "500", position: "sticky", left: 0, backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc", zIndex: 9}}>
                      {metric.activityName}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #f1f5f9", fontWeight: "600"}}>
                      {metric.nbLycees}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600", color: "#3b82f6"}}>
                      {metric.nbSeances}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600"}}>
                      {metric.nbProfs}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600"}}>
                      {metric.nbElevesUniques}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #f1f5f9", fontWeight: "600"}}>
                      {metric.tailleClasseMoyenne}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600", color: getColor(metric.tauxReprise, [20, 40])}}>
                      {metric.tauxReprise}%
                      {" "}
                      <span style={{color: "#94a3b8", fontSize: "0.75rem", fontWeight: "normal"}}>
                        ({metric.nbReprise})
                      </span>
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600", color: getColor(metric.tauxTravailMaison, [10, 25])}}>
                      {metric.tauxTravailMaison}%
                      {" "}
                      <span style={{color: "#94a3b8", fontSize: "0.75rem", fontWeight: "normal"}}>
                        ({metric.nbTravailMaison})
                      </span>
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600", color: getColor(metric.tauxDeuxiemeSeance, [15, 30])}}>
                      {metric.tauxDeuxiemeSeance}%
                      {" "}
                      <span style={{color: "#94a3b8", fontSize: "0.75rem", fontWeight: "normal"}}>
                        ({metric.nbDeuxiemeSeance})
                      </span>
                    </td>
                    <td style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #f1f5f9", fontWeight: "600", color: getColor(Math.round(metric.seancesParProf * 10), [20, 40])}}>
                      {metric.seancesParProf}
                    </td>
                    <td style={{textAlign: "center", padding: "8px", fontWeight: "600"}}>
                      {metric.nbProfsTested > 0 ? (
                        <>
                          <span style={{color: getColor(metric.tauxUsageApresTest, [50, 75])}}>
                            {metric.tauxUsageApresTest}%
                          </span>
                          {" "}
                          <span style={{color: "#94a3b8", fontSize: "0.75rem", fontWeight: "normal"}}>
                            ({metric.nbProfsTestedThenTaught}/{metric.nbProfsTested})
                          </span>
                        </>
                      ) : (
                        <span style={{color: "#cbd5e1", fontSize: "0.875rem"}}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Légende */}
        <div style={{marginTop: "20px", padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", fontSize: "0.875rem"}}>
          <h4 style={{margin: "0 0 12px 0", fontSize: "0.875rem", color: "#475569"}}>📖 Guide de lecture</h4>
          <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px"}}>
            <div>
              <strong>Adoption :</strong> Nombre de lycées et professeurs utilisant l'activité
            </div>
            <div>
              <strong>Engagement :</strong> Taille des classes, taux de reprise ({'>'}1h), travail à domicile
            </div>
            <div>
              <strong>Fidélisation :</strong> Nombre moyen de séances par prof (récurrence)
            </div>
            <div>
              <strong>Usage après test :</strong> % de profs qui ont enseigné l'activité après l'avoir testée
            </div>
            <div>
              <strong>Codes couleur :</strong> <span style={{color: "#34d399"}}>■ Excellent</span> <span style={{color: "#f59e0b"}}>■ Bon</span> <span style={{color: "#f87171"}}>■ Faible</span>
            </div>
          </div>
        </div>
      </div>

      {/* Carte + Tableau */}
      <div className="grid grid-2" style={{marginTop: 16}}>
        <div className="card">
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
            <h2 style={{margin: 0}}>Carte des usages (cercles ∝ nb)</h2>
            <button 
              onClick={() => setMapModalOpen(true)}
              title="Voir en plein écran"
              style={{
                padding: "6px",
                fontSize: "1.2rem",
                cursor: "pointer",
                backgroundColor: "transparent",
                color: "#64748b",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.color = "#3b82f6";
                e.currentTarget.style.borderColor = "#3b82f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#64748b";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              ⤢
            </button>
          </div>
          <div style={{marginBottom: 12, display: "flex", flexDirection: "column", gap: 8}}>
            <div style={{display: "flex", gap: 16, fontSize: "0.875rem"}}>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <div style={{
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  backgroundColor: "#3b82f6"
                }}></div>
                <span>Usages élèves</span>
              </div>
              <div style={{display: "flex", alignItems: "center", gap: 6}}>
                <div style={{
                  width: 12, 
                  height: 12, 
                  borderRadius: "50%", 
                  backgroundColor: "#f59e0b"
                }}></div>
                <span>Tests profs uniquement</span>
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem"}}>
              <input 
                type="checkbox" 
                id="showAcademyBorders"
                checked={showAcademyBorders}
                onChange={(e) => setShowAcademyBorders(e.target.checked)}
                style={{cursor: "pointer"}}
              />
              <label htmlFor="showAcademyBorders" style={{cursor: "pointer", color: "#64748b"}}>
                Vue par académies
              </label>
            </div>
          </div>
          <div className="map">
            <UsageMap 
              points={usageByUai} 
              onPointClick={(uai) => setSelectedUai(uai)} 
              onAcademyClick={(academie) => setSelectedAcademie(academie)}
              showAcademyBorders={showAcademyBorders} 
            />
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
                          color: r.hasStudents ? "#3b82f6" : "#f59e0b",
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
                    <td style={{textAlign:"center", color: "#3b82f6", fontWeight: r.nbEleves > 0 ? "600" : "normal"}}>
                      {r.nbEleves}
                    </td>
                    <td style={{textAlign:"center", color: "#3b82f6", fontWeight: r.nbProfsEnseignant > 0 ? "600" : "normal"}}>
                      {r.nbProfsEnseignant}
                    </td>
                    <td style={{textAlign:"center", color: "#f59e0b", fontWeight: r.nbProfsTestant > 0 ? "600" : "normal"}}>
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
                <td><strong>Nombre total de séances</strong></td>
                <td style={{textAlign:"right"}}><strong>{globalStats.totalSeances.toLocaleString("fr-FR")}</strong></td>
              </tr>
              <tr>
                <td>Nombre de 2e séance</td>
                <td style={{textAlign:"right"}}>
                  {globalStats.totalDeuxiemeSeances.toLocaleString("fr-FR")}
                  {" "}
                  <span style={{color: "#64748b", fontSize: "0.875rem"}}>
                    ({globalStats.pourcentage2eSeance.toFixed(1)}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td>Nombre moyen élèves par séance</td>
                <td style={{textAlign:"right"}}>{globalStats.moyenneElevesParSeance.toFixed(1)}</td>
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
              <tr style={{borderTop: "2px solid #e2e8f0"}}>
                <td><strong>Profs ont testé puis enseigné</strong></td>
                <td style={{textAlign:"right", color: "#34d399", fontWeight: "600"}}>
                  {globalStats.profsTestedThenTaught.toLocaleString("fr-FR")}
                  {" "}
                  <span style={{color: "#64748b", fontSize: "0.875rem", fontWeight: "normal"}}>
                    ({((globalStats.profsTestedThenTaught / (globalStats.profsTestedThenTaught + globalStats.profsTaughtWithoutTesting + globalStats.profsTestedButNeverTaught)) * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td>Profs ont enseigné sans tester</td>
                <td style={{textAlign:"right", color: "#f59e0b"}}>
                  {globalStats.profsTaughtWithoutTesting.toLocaleString("fr-FR")}
                  {" "}
                  <span style={{color: "#64748b", fontSize: "0.875rem"}}>
                    ({((globalStats.profsTaughtWithoutTesting / (globalStats.profsTestedThenTaught + globalStats.profsTaughtWithoutTesting + globalStats.profsTestedButNeverTaught)) * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>
              <tr>
                <td>Profs ont testé mais pas enseigné</td>
                <td style={{textAlign:"right", color: "#f87171"}}>
                  {globalStats.profsTestedButNeverTaught.toLocaleString("fr-FR")}
                  {" "}
                  <span style={{color: "#64748b", fontSize: "0.875rem"}}>
                    ({((globalStats.profsTestedButNeverTaught / (globalStats.profsTestedThenTaught + globalStats.profsTaughtWithoutTesting + globalStats.profsTestedButNeverTaught)) * 100).toFixed(1)}%)
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 16}}>
          <div className="card">
            <h2>Statistiques établissement</h2>
            <table>
              <thead>
                <tr>
                  <th>Indicateur</th>
                  <th style={{textAlign:"right"}}>Valeur</th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>
          
          <div className="card">
            <h2>Distribution des IPS des lycées</h2>
            <div style={{height: 240}}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ipsHistogram}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" label={{ value: "IPS", position: "insideBottom", offset: -5 }} />
                  <YAxis allowDecimals={false} label={{ value: "Nombre de lycées", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Lycées" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Nouvelle section: Engagement des élèves et professeurs */}
      <div className="grid grid-2" style={{marginTop: 16, gap: 16}}>
        <div className="card">
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

        <div className="card">
          <h2>Nombre de séances par professeur</h2>
          <p className="muted" style={{marginTop: 0, marginBottom: 16}}>
            Distribution du nombre de séances avec élèves animées par chaque professeur
          </p>
          <div style={{height: 300}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={seancesPerTeacher.chart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nbSeances" />
                <YAxis allowDecimals={false} label={{ value: "Nombre de profs", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar 
                  dataKey="nbProfs" 
                  name="Professeurs" 
                  fill="#34d399"
                  onClick={(data: any) => {
                    if (data && data.nbSeancesNum) {
                      setSelectedSeancesCount(data.nbSeancesNum);
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
        const teacherUsages = getTeacherUsagesForUai(selectedUai);
        
        // Créer un mapping teacher -> lettre (A, B, C...)
        // D'abord les profs qui enseignent, puis les profs qui testent uniquement
        const teacherToLetter = new Map<string, string>();
        let letterIndex = 0;
        
        // 1. Attribuer des lettres aux profs qui enseignent (dans l'ordre d'apparition)
        classActivityDetails.forEach(profData => {
          if (!teacherToLetter.has(profData.teacher)) {
            teacherToLetter.set(profData.teacher, String.fromCharCode(65 + letterIndex));
            letterIndex++;
          }
        });
        
        // 2. Attribuer des lettres aux profs qui testent uniquement (pas déjà dans classActivityDetails)
        teacherUsages.forEach(profData => {
          if (!teacherToLetter.has(profData.teacher)) {
            teacherToLetter.set(profData.teacher, String.fromCharCode(65 + letterIndex));
            letterIndex++;
          }
        });
        
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
                    {etablissement?.ips != null && ` • IPS: ${etablissement.ips}`}
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
                Une séance = groupe d'élèves avec même prof + même activité + sessions créées le même jour à moins de 1h d'intervalle
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
                            <strong style={{color: "#334155"}}>Prof {teacherToLetter.get(profData.teacher)}</strong>
                            <span style={{color: "#64748b", marginLeft: "12px", fontSize: "0.875rem"}}>
                              {profData.seances.length} séance{profData.seances.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <span style={{fontSize: "0.75rem", color: "#94a3b8"}}>
                            {profData.teacher.substring(0, 8)}...
                          </span>
                        </div>
                        
                        {/* Tableau des séances de ce prof */}
                        <table style={{width: "100%", marginBottom: 0, fontSize: "0.875rem"}}>
                          <thead style={{backgroundColor: "#f8fafc"}}>
                            <tr>
                              <th style={{textAlign: "left", padding: "8px 12px", minWidth: "120px"}}>Activité</th>
                              <th style={{textAlign:"center", padding: "8px", width: "80px"}}>Nb élèves</th>
                              <th style={{textAlign:"center", padding: "8px", minWidth: "80px"}}>Date</th>
                              <th style={{textAlign:"center", padding: "8px", width: "90px"}}>Temps moyen</th>
                              <th style={{textAlign:"center", padding: "8px", width: "90px"}}>Travail après (&gt;1h)</th>
                              <th style={{textAlign:"center", padding: "8px", width: "90px"}}>Travail maison</th>
                              <th style={{textAlign:"center", padding: "8px", width: "80px"}}>2e séance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profData.seances.map((seance, seanceIdx) => {
                              const globalIdx = seanceStartIndex + seanceIdx;
                              const analysis = analyzeSeance(seance.sessions);
                              
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
                                  <td style={{padding: "8px 12px"}}>{seance.activityName}</td>
                                  <td style={{textAlign:"center", fontWeight: "600", padding: "8px"}}>{seance.studentCount}</td>
                                  <td style={{textAlign:"center", padding: "8px", whiteSpace: "nowrap"}}>{seance.creationDate}</td>
                                  <td style={{textAlign:"center", padding: "8px", whiteSpace: "nowrap"}}>
                                    {seance.avgWorkTimeMinutes < 60 
                                      ? `${seance.avgWorkTimeMinutes} min`
                                      : seance.avgWorkTimeMinutes < 1440
                                        ? `${Math.floor(seance.avgWorkTimeMinutes / 60)}h${seance.avgWorkTimeMinutes % 60 > 0 ? (seance.avgWorkTimeMinutes % 60).toString().padStart(2, '0') : ''}`
                                        : `${Math.floor(seance.avgWorkTimeMinutes / 1440)}j ${Math.floor((seance.avgWorkTimeMinutes % 1440) / 60)}h`
                                    }
                                  </td>
                                  <td style={{
                                    textAlign:"center", 
                                    padding: "8px",
                                    color: analysis && analysis.continueApres2h > 0 ? "#34d399" : "#94a3b8"
                                  }}>
                                    {analysis ? analysis.continueApres2h : 0}
                                  </td>
                                  <td style={{
                                    textAlign:"center", 
                                    padding: "8px",
                                    color: analysis && analysis.workingAtHome > 0 ? "#f59e0b" : "#94a3b8"
                                  }}>
                                    {analysis ? analysis.workingAtHome : 0}
                                  </td>
                                  <td style={{
                                    textAlign:"center", 
                                    padding: "8px",
                                    fontWeight: "600"
                                  }}>
                                    {analysis && analysis.deuxiemeSeance ? (
                                      <span style={{color: "#3b82f6"}}>✓ Oui</span>
                                    ) : (
                                      <span style={{color: "#94a3b8"}}>Non</span>
                                    )}
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
              
              {/* Nouveau tableau : Usages professeurs (tests) */}
              {teacherUsages.length > 0 && (
                <>
                  <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569", marginTop: "24px"}}>
                    👨‍🏫 Tests enseignants ({teacherUsages.reduce((sum, prof) => sum + prof.tests.length, 0)} sessions, {teacherUsages.length} {teacherUsages.length > 1 ? 'profs' : 'prof'})
                  </h3>
                  <p className="muted" style={{marginTop: 0, marginBottom: "12px", fontSize: "0.875rem"}}>
                    Activités testées par les professeurs (sans élèves)
                  </p>
                  
                  <div style={{marginBottom: "32px"}}>
                    {teacherUsages.map((profData, profIdx) => (
                      <div key={profIdx} style={{marginBottom: "24px"}}>
                        {/* En-tête professeur */}
                        <div style={{
                          backgroundColor: "#fef3c7",
                          padding: "12px 16px",
                          borderRadius: "8px 8px 0 0",
                          borderBottom: "2px solid #fbbf24",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}>
                          <div>
                            <strong style={{color: "#92400e"}}>Prof {teacherToLetter.get(profData.teacher)}</strong>
                            <span style={{color: "#b45309", marginLeft: "12px", fontSize: "0.875rem"}}>
                              {profData.tests.length} test{profData.tests.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <span style={{fontSize: "0.75rem", color: "#d97706"}}>
                            {profData.teacher.substring(0, 8)}...
                          </span>
                        </div>
                        
                        {/* Tableau des tests de ce prof */}
                        <table style={{width: "100%", marginBottom: 0, fontSize: "0.875rem", border: "1px solid #fbbf24", borderTop: "none"}}>
                          <thead style={{backgroundColor: "#fef3c7"}}>
                            <tr>
                              <th style={{textAlign: "left", padding: "8px 12px", minWidth: "200px"}}>Activité</th>
                              <th style={{textAlign:"center", padding: "8px", minWidth: "120px"}}>Date de création</th>
                              <th style={{textAlign:"center", padding: "8px", minWidth: "120px"}}>Date de modification</th>
                              <th style={{textAlign:"center", padding: "8px", width: "120px"}}>Durée de travail</th>
                            </tr>
                          </thead>
                          <tbody>
                            {profData.tests.map((test, testIdx) => {
                              const formatDuration = (minutes: number) => {
                                if (minutes === 0) return "0 min";
                                if (minutes < 60) return `${minutes} min`;
                                if (minutes < 1440) {
                                  const hours = Math.floor(minutes / 60);
                                  const mins = minutes % 60;
                                  return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
                                }
                                const days = Math.floor(minutes / 1440);
                                const hours = Math.floor((minutes % 1440) / 60);
                                return `${days}j ${hours}h`;
                              };
                              
                              return (
                                <tr 
                                  key={testIdx}
                                  style={{
                                    borderBottom: testIdx < profData.tests.length - 1 ? "1px solid #fef3c7" : "none",
                                    backgroundColor: testIdx % 2 === 0 ? "#fffbeb" : "transparent"
                                  }}
                                >
                                  <td style={{padding: "8px 12px"}}>{test.activityName}</td>
                                  <td style={{textAlign:"center", padding: "8px", whiteSpace: "nowrap"}}>
                                    {test.createdDate.toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })} {test.createdDate.toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td style={{textAlign:"center", padding: "8px", whiteSpace: "nowrap"}}>
                                    {test.changedDate.toLocaleDateString('fr-FR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric'
                                    })} {test.changedDate.toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </td>
                                  <td style={{
                                    textAlign:"center", 
                                    padding: "8px",
                                    whiteSpace: "nowrap",
                                    fontWeight: "600",
                                    color: test.workTimeMinutes === 0 ? "#94a3b8" : 
                                           test.workTimeMinutes < 60 ? "#34d399" :
                                           test.workTimeMinutes < 1440 ? "#f59e0b" : "#f87171"
                                  }}>
                                    {formatDuration(test.workTimeMinutes)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              {/* Tableau existant : total des usages par activité */}
              <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569"}}>
                📊 Total des activités utilisées ({activityDetails.length})
              </h3>
              
              <table style={{width: "100%"}}>
                <thead>
                  <tr>
                    <th>Activité</th>
                    <th style={{textAlign:"right", color: "#34d399"}}>Élèves</th>
                    <th style={{textAlign:"right", color: "#f87171"}}>Profs</th>
                    <th style={{textAlign:"right"}}>Total</th>
                    <th style={{textAlign:"right"}}>Dernier usage</th>
                  </tr>
                </thead>
                <tbody>
                  {activityDetails.map(detail => (
                    <tr key={detail.activity}>
                      <td>{detail.activity}</td>
                      <td style={{textAlign:"right", color: "#3b82f6", fontWeight: detail.studentCount > 0 ? "600" : "normal"}}>
                        {detail.studentCount}
                      </td>
                      <td style={{textAlign:"right", color: "#f59e0b", fontWeight: detail.teacherCount > 0 ? "600" : "normal"}}>
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
                  <span>Élèves ayant continué après la séance ({'>'}1h)</span>
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
              
              {/* Tableau détaillé des sessions élèves */}
              <h3 style={{fontSize: "1rem", marginBottom: "16px", marginTop: "24px", color: "#475569"}}>
                📋 Détail des sessions élèves ({foundSeance.sessions.length})
              </h3>
              
              <div style={{overflowX: "auto", marginBottom: "16px"}}>
                <table style={{width: "100%", fontSize: "0.875rem"}}>
                  <thead style={{backgroundColor: "#f8fafc"}}>
                    <tr>
                      <th style={{textAlign: "left", padding: "8px 12px", minWidth: "60px"}}>#</th>
                      <th style={{textAlign: "left", padding: "8px 12px", minWidth: "120px"}}>Élève</th>
                      <th style={{textAlign: "center", padding: "8px", minWidth: "120px"}}>Création</th>
                      <th style={{textAlign: "center", padding: "8px", minWidth: "120px"}}>Dernier enregistrement</th>
                      <th style={{textAlign: "center", padding: "8px", minWidth: "100px"}}>Temps de travail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {foundSeance.sessions
                      .sort((a, b) => a.created - b.created)
                      .map((session, idx) => {
                        const createdDate = new Date(session.created);
                        const changedDate = new Date(session.changed);
                        const workTimeMinutes = Math.round((session.changed - session.created) / (1000 * 60));
                        
                        const formatDuration = (minutes: number) => {
                          if (minutes === 0) return "0 min";
                          if (minutes < 60) return `${minutes} min`;
                          if (minutes < 1440) {
                            const hours = Math.floor(minutes / 60);
                            const mins = minutes % 60;
                            return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
                          }
                          const days = Math.floor(minutes / 1440);
                          const hours = Math.floor((minutes % 1440) / 60);
                          return `${days}j ${hours}h`;
                        };
                        
                        return (
                          <tr 
                            key={idx}
                            style={{
                              backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                              borderBottom: "1px solid #e2e8f0"
                            }}
                          >
                            <td style={{padding: "8px 12px", color: "#64748b"}}>
                              {idx + 1}
                            </td>
                            <td style={{padding: "8px 12px", fontFamily: "monospace", fontSize: "0.8rem"}}>
                              {session.student.substring(0, 12)}...
                            </td>
                            <td style={{textAlign: "center", padding: "8px", whiteSpace: "nowrap"}}>
                              <div>{createdDate.toLocaleDateString('fr-FR')}</div>
                              <div style={{fontSize: "0.75rem", color: "#64748b"}}>
                                {createdDate.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td style={{textAlign: "center", padding: "8px", whiteSpace: "nowrap"}}>
                              <div>{changedDate.toLocaleDateString('fr-FR')}</div>
                              <div style={{fontSize: "0.75rem", color: "#64748b"}}>
                                {changedDate.toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td style={{
                              textAlign: "center", 
                              padding: "8px",
                              fontWeight: "600",
                              color: workTimeMinutes === 0 ? "#94a3b8" : 
                                     workTimeMinutes < 60 ? "#3b82f6" :
                                     workTimeMinutes < 1440 ? "#f59e0b" : "#f87171"
                            }}>
                              {formatDuration(workTimeMinutes)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal évolution temporelle par académie */}
      {selectedAcademie && (() => {
        const monthlyData = getMonthlyDataForAcademie(selectedAcademie);
        const totalUsagesAcademie = monthlyData.reduce((sum, d) => sum + d.count, 0);
        
        // Calculer le nombre de lycées dans cette académie
        const lyceesAcademie = usageByUai.filter(u => u.academie === selectedAcademie);
        const nbLycees = lyceesAcademie.length;
        const nbUsages = lyceesAcademie.reduce((sum, u) => sum + u.nb, 0);
        const nbEleves = lyceesAcademie.reduce((sum, u) => sum + (u.nbEleves || 0), 0);
        
        // Récupérer les statistiques officielles
        const officialStats = officialAcademyStats?.[selectedAcademie];
        
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
                <div style={{flex: 1}}>
                  <h2 style={{marginBottom: "8px"}}>Académie de {selectedAcademie}</h2>
                  
                  {/* Statistiques officielles */}
                  {officialStats && (
                    <div style={{
                      padding: "12px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "0.875rem"
                    }}>
                      <div style={{fontWeight: 600, marginBottom: "8px", color: "#1e293b"}}>
                        🏫 Établissements de l'académie : {officialStats.nb_colleges} collège{officialStats.nb_colleges > 1 ? 's' : ''} · {officialStats.nb_lycees_gt} lycée{officialStats.nb_lycees_gt > 1 ? 's' : ''} GT · {officialStats.nb_lycees_pro} lycée{officialStats.nb_lycees_pro > 1 ? 's' : ''} Pro
                      </div>
                      <div style={{paddingLeft: "8px"}}>
                        <span className="muted">Élèves lycées GT :</span>{" "}
                        <strong>{officialStats.nb_eleves_gt.toLocaleString("fr-FR")}</strong>
                        <span style={{fontSize: "0.8rem", color: "#64748b", marginLeft: "8px"}}>
                          ({officialStats.nb_eleves_pro.toLocaleString("fr-FR")} en Pro)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Statistiques MathAData */}
                  <div style={{display: "flex", gap: "24px", fontSize: "0.875rem", marginTop: 0, flexWrap: "wrap"}}>
                    <div>
                      <span className="muted">Lycées GT utilisant MathAData :</span>{" "}
                      <strong style={{color: "#3b82f6"}}>{nbLycees}</strong>
                      {officialStats && (
                        <span style={{color: "#64748b", fontSize: "0.8rem", marginLeft: "4px"}}>
                          ({((nbLycees / officialStats.nb_lycees_gt) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="muted">Total usages :</span>{" "}
                      <strong>{totalUsagesAcademie.toLocaleString("fr-FR")}</strong>
                    </div>
                    {nbEleves > 0 && (
                      <div>
                        <span className="muted">Élèves uniques :</span>{" "}
                        <strong style={{color: "#3b82f6"}}>{nbEleves.toLocaleString("fr-FR")}</strong>
                        {officialStats && (
                          <span style={{color: "#64748b", fontSize: "0.8rem", marginLeft: "4px"}}>
                            ({((nbEleves / officialStats.nb_eleves_gt) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
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

      {/* Modal détails professeurs par nombre de séances */}
      {selectedSeancesCount !== null && (() => {
        const teacherDetails = getTeacherDetailsForSeanceCount(selectedSeancesCount);
        
        return (
          <div 
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1002,
              padding: "20px"
            }}
            onClick={() => setSelectedSeancesCount(null)}
          >
            <div 
              className="card"
              style={{
                maxWidth: "1200px",
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
                <div>
                  <h2 style={{marginBottom: "4px"}}>
                    Professeurs avec {selectedSeancesCount} séance{selectedSeancesCount > 1 ? 's' : ''}
                  </h2>
                  <p className="muted" style={{marginTop: 0}}>
                    {teacherDetails.length} professeur{teacherDetails.length > 1 ? 's' : ''} concerné{teacherDetails.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedSeancesCount(null)}
                  style={{
                    fontSize: "1.5rem",
                    padding: "4px 12px",
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
              
              {teacherDetails.map((profData, profIdx) => {
                const etablissements = Array.from(profData.lycees).map(uai => {
                  const info = annMap.get(uai);
                  return info ? `${info.nom} (${uai})` : uai;
                });
                
                const dureeJours = Math.round((profData.lastDate.getTime() - profData.firstDate.getTime()) / (1000 * 60 * 60 * 24));
                const annees = new Set(profData.seances.map(s => s.dateObj.getFullYear()));
                
                return (
                  <div 
                    key={profIdx} 
                    style={{
                      marginBottom: "32px",
                      padding: "20px",
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    {/* En-tête professeur */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: "16px",
                      paddingBottom: "12px",
                      borderBottom: "2px solid #cbd5e1"
                    }}>
                      <div>
                        <h3 style={{margin: 0, color: "#0f172a"}}>
                          Prof {String.fromCharCode(65 + profIdx)}
                        </h3>
                        <span style={{fontSize: "0.75rem", color: "#64748b"}}>
                          {profData.teacher.substring(0, 16)}...
                        </span>
                      </div>
                      <div style={{textAlign: "right"}}>
                        <div style={{fontSize: "0.875rem", color: "#64748b"}}>
                          Timeline: <strong style={{color: "#0f172a"}}>
                            {profData.firstDate.toLocaleDateString('fr-FR')} → {profData.lastDate.toLocaleDateString('fr-FR')}
                          </strong>
                        </div>
                        <div style={{fontSize: "0.875rem", color: "#64748b", marginTop: "4px"}}>
                          Durée: <strong style={{color: "#0f172a"}}>{dureeJours} jour{dureeJours > 1 ? 's' : ''}</strong>
                          {annees.size > 1 && ` • ${annees.size} années`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Statistiques */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "16px",
                      marginBottom: "20px"
                    }}>
                      <div className="card" style={{padding: "12px", backgroundColor: "#fff"}}>
                        <div style={{fontSize: "1.5rem", fontWeight: "700", color: "#3b82f6"}}>
                          {profData.lycees.size}
                        </div>
                        <div style={{fontSize: "0.75rem", color: "#64748b", marginTop: "4px"}}>
                          Lycée{profData.lycees.size > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="card" style={{padding: "12px", backgroundColor: "#fff"}}>
                        <div style={{fontSize: "1.5rem", fontWeight: "700", color: "#8b5cf6"}}>
                          {profData.activites.size}
                        </div>
                        <div style={{fontSize: "0.75rem", color: "#64748b", marginTop: "4px"}}>
                          Activité{profData.activites.size > 1 ? 's' : ''}
                        </div>
                      </div>
                      
                      <div className="card" style={{padding: "12px", backgroundColor: "#fff"}}>
                        <div style={{fontSize: "1.5rem", fontWeight: "700", color: "#10b981"}}>
                          {profData.seances.reduce((sum, s) => sum + s.students.size, 0)}
                        </div>
                        <div style={{fontSize: "0.75rem", color: "#64748b", marginTop: "4px"}}>
                          Élèves total
                        </div>
                      </div>
                    </div>
                    
                    {/* Liste des lycées */}
                    <div style={{marginBottom: "16px"}}>
                      <h4 style={{fontSize: "0.875rem", color: "#475569", marginBottom: "8px"}}>
                        🏫 Lycées ({profData.lycees.size})
                      </h4>
                      <div style={{
                        fontSize: "0.875rem",
                        color: "#334155",
                        backgroundColor: "#fff",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0"
                      }}>
                        {etablissements.join(' • ')}
                      </div>
                    </div>
                    
                    {/* Liste des activités */}
                    <div style={{marginBottom: "16px"}}>
                      <h4 style={{fontSize: "0.875rem", color: "#475569", marginBottom: "8px"}}>
                        📚 Activités utilisées ({profData.activites.size})
                      </h4>
                      <div style={{
                        fontSize: "0.875rem",
                        color: "#334155",
                        backgroundColor: "#fff",
                        padding: "12px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0"
                      }}>
                        {Array.from(profData.activites).join(' • ')}
                      </div>
                    </div>
                    
                    {/* Timeline des séances */}
                    <div>
                      <h4 style={{fontSize: "0.875rem", color: "#475569", marginBottom: "8px"}}>
                        📅 Timeline des {selectedSeancesCount} séances
                      </h4>
                      <table style={{width: "100%", fontSize: "0.875rem"}}>
                        <thead style={{backgroundColor: "#fff"}}>
                          <tr>
                            <th style={{textAlign: "left", padding: "8px"}}>Date</th>
                            <th style={{textAlign: "left", padding: "8px"}}>Activité</th>
                            <th style={{textAlign: "center", padding: "8px"}}>Nb élèves</th>
                            <th style={{textAlign: "left", padding: "8px"}}>Lycée</th>
                          </tr>
                        </thead>
                        <tbody>
                          {profData.seances
                            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
                            .map((seance, idx) => {
                              const etablissement = annMap.get(seance.uai);
                              return (
                                <tr 
                                  key={idx}
                                  style={{
                                    backgroundColor: idx % 2 === 0 ? "#fff" : "#f8fafc",
                                    borderBottom: "1px solid #e2e8f0"
                                  }}
                                >
                                  <td style={{padding: "8px", whiteSpace: "nowrap"}}>
                                    {seance.dateObj.toLocaleDateString('fr-FR')}
                                  </td>
                                  <td style={{padding: "8px"}}>{seance.activityName}</td>
                                  <td style={{textAlign: "center", padding: "8px", fontWeight: "600"}}>
                                    {seance.students.size}
                                  </td>
                                  <td style={{padding: "8px", fontSize: "0.8rem"}}>
                                    {etablissement?.nom || seance.uai}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Modal carte en grand */}
      {mapModalOpen && (
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
          onClick={() => setMapModalOpen(false)}
        >
          <div 
            className="card"
            style={{
              width: "95vw",
              height: "90vh",
              maxWidth: "1800px",
              display: "flex",
              flexDirection: "column"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
              <div>
                <h2 style={{marginBottom: "4px"}}>Carte des usages (cercles ∝ nb)</h2>
                <div style={{display: "flex", flexDirection: "column", gap: 8}}>
                  <div style={{display: "flex", gap: 16, fontSize: "0.875rem", marginTop: 8}}>
                    <div style={{display: "flex", alignItems: "center", gap: 6}}>
                      <div style={{
                        width: 12, 
                        height: 12, 
                        borderRadius: "50%", 
                        backgroundColor: "#3b82f6"
                      }}></div>
                      <span>Usages élèves</span>
                    </div>
                    <div style={{display: "flex", alignItems: "center", gap: 6}}>
                      <div style={{
                        width: 12, 
                        height: 12, 
                        borderRadius: "50%", 
                        backgroundColor: "#f59e0b"
                      }}></div>
                      <span>Tests profs uniquement</span>
                    </div>
                  </div>
                  <div style={{display: "flex", alignItems: "center", gap: 6, fontSize: "0.875rem"}}>
                    <input 
                      type="checkbox" 
                      id="showAcademyBordersModal"
                      checked={showAcademyBorders}
                      onChange={(e) => setShowAcademyBorders(e.target.checked)}
                      style={{cursor: "pointer"}}
                    />
                    <label htmlFor="showAcademyBordersModal" style={{cursor: "pointer", color: "#64748b"}}>
                      Vue par académies
                    </label>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setMapModalOpen(false)}
                style={{
                  fontSize: "1.5rem",
                  padding: "4px 12px",
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{flex: 1, minHeight: 0}}>
              <UsageMap 
                points={usageByUai} 
                onPointClick={(uai) => {
                  setSelectedUai(uai);
                  setMapModalOpen(false);
                }} 
                onAcademyClick={(academie) => {
                  setSelectedAcademie(academie);
                  setMapModalOpen(false);
                }}
                showAcademyBorders={showAcademyBorders} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

