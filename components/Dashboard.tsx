"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Papa from "papaparse";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import type { UsageMapProps } from "@/components/UsageMap";
import { Modal } from "@/components/Modal";
import EstablishmentModalContent from "@/components/EstablishmentModalContent";
import SeanceDetailModalContent from "@/components/SeanceDetailModalContent";
import TeachersBySeanceModalContent from "@/components/TeachersBySeanceModalContent";

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
  
  // Filtre temporel
  const [dateRangeStart, setDateRangeStart] = useState<string>(""); // Format YYYY-MM
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(""); // Format YYYY-MM
  const [isPlaying, setIsPlaying] = useState(false);

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

  // Calcul de la plage de dates disponibles
  const dateRange = useMemo(() => {
    if (rowsWithDate.length === 0) return { min: null, max: null, months: [] };
    
    const dates = rowsWithDate.map(r => r._date);
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Générer la liste de tous les mois entre min et max
    const months: string[] = [];
    const current = new Date(min.getFullYear(), min.getMonth(), 1);
    const endDate = new Date(max.getFullYear(), max.getMonth(), 1);
    
    while (current <= endDate) {
      months.push(fmtMonth(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return { min, max, months };
  }, [rowsWithDate]);

  // Données filtrées par période temporelle
  const rowsFilteredByDate = useMemo(() => {
    if (!dateRangeStart && !dateRangeEnd) return rowsWithDate;
    
    return rowsWithDate.filter(r => {
      const month = fmtMonth(r._date);
      const afterStart = !dateRangeStart || month >= dateRangeStart;
      const beforeEnd = !dateRangeEnd || month <= dateRangeEnd;
      return afterStart && beforeEnd;
    });
  }, [rowsWithDate, dateRangeStart, dateRangeEnd]);

  // Animation du filtre temporel (play)
  useEffect(() => {
    if (!isPlaying) return;
    
    const months = dateRange.months as string[];
    if (months.length < 2) return;
    
    // Initialiser le début au premier mois si pas défini
    if (!dateRangeStart) {
      setDateRangeStart(months[0]);
    }
    
    const startIdx = dateRangeStart ? months.indexOf(dateRangeStart) : 0;
    const currentEndIdx = dateRangeEnd ? months.indexOf(dateRangeEnd) : 0;
    
    // Si on est au début ou la fin n'est pas encore définie, démarrer au 2ème mois
    if (currentEndIdx <= startIdx) {
      if (startIdx + 1 < months.length) {
        setDateRangeEnd(months[startIdx + 1]);
      }
      return;
    }
    
    // Si on a atteint la fin (dernier mois), arrêter
    if (currentEndIdx >= months.length - 1) {
      setIsPlaying(false);
      return;
    }
    
    // Avancer la fin d'un mois toutes les 500ms
    const timer = setTimeout(() => {
      setDateRangeEnd(months[currentEndIdx + 1]);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isPlaying, dateRangeStart, dateRangeEnd, dateRange.months]);

  // Données filtrées par activité ET période
  const filtered = useMemo(() => {
    const base = rowsFilteredByDate;
    if (activityFilter === "__ALL__") return base;
    return base.filter(r => r.mathadata_id === activityFilter);
  }, [rowsFilteredByDate, activityFilter]);

  // --- Séries temporelles mensuelles (toutes activités) ---
  const monthlyAll = useMemo(() => {
    const m = groupCount(rowsWithDate, r => fmtMonth(r._date));
    const result = Array.from(m.entries())
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
    console.log("[monthlyAll] Points de données:", result.length);
    if (result.length > 0) {
      console.log("[monthlyAll] Premier mois:", result[0]);
      console.log("[monthlyAll] Dernier mois:", result[result.length - 1]);
    }
    return result;
  }, [rowsWithDate]);

  // Usages totaux par activité
  const usageByActivity = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsWithDate) {
      const id = r.mathadata_id || "NA";
      map.set(id, (map.get(id) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => ({
        id,
        activity: activityTitles.get(id) || `Activité ${id}`,
        count
      }))
      .sort((a, b) => b.count - a.count); // Tri décroissant par nombre d'usages
  }, [rowsWithDate, activityTitles]);

  // --- Agrégat par UAI & jointure annuaire ---
  const annMap = useMemo(() => new Map(annuaire.map(a => [a.uai, a])), [annuaire]);
  
  // Calculer les statistiques détaillées pour un établissement (utilisé pour le tableau principal - VERSION FILTRÉE)
  const getEtablissementStatsFiltered = (uai: string) => {
    // 1. Récupérer toutes les sessions pour cet UAI (élèves uniquement) - PÉRIODE FILTRÉE
    const studentSessions = rowsFilteredByDate
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
    rowsFilteredByDate.forEach(r => {
      const rowUai = (r.uai_el || r.uai || "").trim();
      if (rowUai === uai && r.Role === "student" && r.teacher) {
        profsEnseignant.add(r.teacher);
      }
    });
    
    // 5. Compter les profs testant (profs avec des sessions Role="teacher" dans cet établissement)
    // On utilise uai_teach pour identifier où le prof a testé
    const profsTestant = new Set<string>();
    rowsFilteredByDate.forEach(r => {
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
  
  // Calculer les statistiques détaillées pour un établissement (VERSION GLOBALE - pour les modals)
  const getEtablissementStats = (uai: string) => {
    // 1. Récupérer toutes les sessions pour cet UAI (élèves uniquement) - TOUTES PÉRIODES
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
  
  // VERSION GLOBALE : Pour les stats globales et distribution IPS
  // Utilise uai_el (établissement de l'élève) pour localiser les usages
  const usageByUaiGlobal = useMemo(() => {
    const m = groupCount(rowsWithDate, r => (r.uai_el || r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null") // Filtrer les UAI vides/null (insensible à la casse)
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        
        // Compter les usages profs vs élèves pour cet UAI
        let teacherUsages = 0;
        let studentUsages = 0;
        
        rowsWithDate.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai) {
            if (r.Role === "teacher") teacherUsages++;
            else if (r.Role === "student") studentUsages++;
          }
        });
        
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
        
        // Calculer les statistiques détaillées
        const stats = getEtablissementStats(uai);
        
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",
          ville: meta?.commune ?? "",
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          activites: activitesList,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
          teacherUsages,
          studentUsages,
          hasStudents: studentUsages > 0,
          // Statistiques détaillées
          nbSeances: stats.nbSeances,
          nbEleves: stats.nbEleves,
          nbProfsEnseignant: stats.nbProfsEnseignant,
          nbProfsTestant: stats.nbProfsTestant,
        };
      });
  }, [rowsWithDate, annMap]);
  
  // VERSION FILTRÉE PAR PÉRIODE : Pour le tableau Lycées — usages
  const usageByUaiFiltered = useMemo(() => {
    const m = groupCount(rowsFilteredByDate, r => (r.uai_el || r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null")
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        
        // Compter les usages profs vs élèves pour cet UAI sur la période
        let teacherUsages = 0;
        let studentUsages = 0;
        
        rowsFilteredByDate.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai) {
            if (r.Role === "teacher") teacherUsages++;
            else if (r.Role === "student") studentUsages++;
          }
        });
        
        // Collecter les activités uniques pour cet UAI sur la période
        const activitiesSet = new Set<string>();
        rowsFilteredByDate.forEach(r => {
          const rowUai = (r.uai_el || r.uai || "").trim();
          if (rowUai === uai && r.mathadata_id) {
            const activityName = getActivityName(r.mathadata_id, r.mathadata_title);
            activitiesSet.add(activityName);
          }
        });
        const activitesList = Array.from(activitiesSet).sort();
        
        // Calculer les statistiques détaillées sur la période filtrée
        const stats = getEtablissementStatsFiltered(uai);
        
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",
          ville: meta?.commune ?? "",
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          activites: activitesList,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
          teacherUsages,
          studentUsages,
          hasStudents: studentUsages > 0,
          // Statistiques détaillées de la période filtrée
          nbSeances: stats.nbSeances,
          nbEleves: stats.nbEleves,
          nbProfsEnseignant: stats.nbProfsEnseignant,
          nbProfsTestant: stats.nbProfsTestant,
        };
      });
  }, [rowsFilteredByDate, annMap]);

  // Maximum absolu pour la carte (toutes périodes)
  const maxUsageAbsolute = useMemo(() => {
    const m = groupCount(rowsWithDate, r => (r.uai_el || r.uai || "").trim() || null);
    return Math.max(...Array.from(m.values()), 0);
  }, [rowsWithDate]);

  // VERSION POUR LA CARTE : Utilise filtered (respecte le filtre d'activité)
  const usageByUaiForMap = useMemo(() => {
    const m = groupCount(filtered, r => (r.uai_el || r.uai || "").trim() || null);
    return Array.from(m.entries())
      .filter(([uai]) => uai && uai.toLowerCase() !== "null")
      .map(([uai, nb]) => {
        const meta = annMap.get(uai);
        
        // Compter les usages profs vs élèves pour cet UAI (avec filtre)
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
        
        return {
          uai, nb,
          nom_lycee: meta?.nom ?? "",
          ville: meta?.commune ?? "",
          academie: meta?.academie ?? "",
          ips: meta?.ips,
          activites: activitesList,
          latitude: meta ? Number(meta.latitude) : NaN,
          longitude: meta ? Number(meta.longitude) : NaN,
          teacherUsages,
          studentUsages,
          hasStudents: studentUsages > 0,
        };
      });
  }, [filtered, annMap]);

  // --- Tableau interactif ---
  const [q, setQ] = useState("");
  const [selectedUai, setSelectedUai] = useState<string | null>(null);
  const [selectedAcademie, setSelectedAcademie] = useState<string | null>(null);
  const [selectedSeance, setSelectedSeance] = useState<number | null>(null); // index de la séance dans classActivityDetails
  const [selectedSeancesCount, setSelectedSeancesCount] = useState<number | null>(null); // pour le modal des profs par nb de séances
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null); // pour le modal détail de l'activité
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
    let arr = usageByUaiFiltered.filter(r =>
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
  }, [usageByUaiFiltered, q, sortKey, sortAsc]);

  // Liste d'activités pour empilé
  const activityKeys = useMemo(
    () => Array.from(new Set(rowsWithDate.map(r => r.mathadata_id || "NA"))).sort(),
    [rowsWithDate]
  );

  // Statistiques globales - FILTRÉ PAR PÉRIODE
  const globalStats = useMemo(() => {
    const totalUsages = rowsFilteredByDate.length;
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
    for (const r of rowsFilteredByDate) {
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
    const usages2023_2024 = rowsFilteredByDate.filter(r => {
      const d = r._date;
      return d >= new Date(2023,7,15) && d < new Date(2024,7,15);
    }).length;
    const usages2024_2025 = rowsFilteredByDate.filter(r => {
      const d = r._date;
      return d >= new Date(2024,7,15) && d < new Date(2025,7,15);
    }).length;
    const usages2025_2026 = rowsFilteredByDate.filter(r => {
      const d = r._date;
      return d >= new Date(2025,7,15) && d < new Date(2026,7,15);
    }).length;
    
    // Calcul des élèves uniques (exclure les profs qui testent)
    const uniqueStudents = new Set(
      rowsFilteredByDate
        .filter(r => r.Role === "student") // Ne compter que les vrais élèves
        .map(r => r.student)
        .filter(Boolean)
    );
    const totalElevesUniques = uniqueStudents.size;
    
    // Calcul des séances globales
    // 1. Récupérer toutes les sessions étudiants
    const studentSessions = rowsFilteredByDate
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
    
    for (const r of rowsFilteredByDate) {
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
  }, [rowsFilteredByDate, usageByUaiGlobal, annMap]);

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

  // Usages par académie (basé sur l'établissement de l'élève) - FILTRÉ PAR PÉRIODE
  const usageByAcademie = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rowsFilteredByDate) {
      const uai = (r.uai_el || r.uai || "").trim();
      const info = annMap.get(uai);
      const academie = info?.academie || "Inconnue";
      map.set(academie, (map.get(academie) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([academie, count]) => ({ academie, count }))
      .sort((a, b) => b.count - a.count); // Tri décroissant par nombre d'usages
  }, [rowsFilteredByDate, annMap]);

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
  // Fonction générique pour obtenir les données mensuelles avec un filtre
  const getMonthlyDataFiltered = (filterFn: (r: UsageRow & { _date: Date }) => boolean) => {
    const filteredData = rowsWithDate.filter(filterFn);
    const m = groupCount(filteredData, r => fmtMonth(r._date));
    
    // Trouver les dates min/max globales
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

  const getMonthlyDataForAcademie = (academie: string) => {
    return getMonthlyDataFiltered(r => {
      const uai = (r.uai_el || r.uai || "").trim();
      const info = annMap.get(uai);
      return (info?.academie || "Inconnue") === academie;
    });
  };

  const getMonthlyDataForActivity = (activityId: string) => {
    return getMonthlyDataFiltered(r => r.mathadata_id === activityId);
  };

  return (
    <div className="container">
      <h1>Tableau de bord — Données d'usage Capytale</h1>

      {/* Section : Données globales (toujours) */}
      <div style={{marginBottom: 32}}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: "3px solid #94a3b8"
        }}>
          Évolution globale (toutes périodes)
        </h2>
      </div>

      {/* Graphiques */}
      <div className="grid grid-2">
        <div className="card">
          <h2>Évolution mensuelle — toutes activités</h2>
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
                <Bar 
                  dataKey="count" 
                  name="Nombre d'usages" 
                  fill="#3b82f6" 
                  onClick={(data: any) => {
                    if (data && data.id) {
                      setSelectedActivityId(data.id);
                    }
                  }}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Nouveau tableau : Indicateurs de succès par activité */}
      <div className="card" style={{marginTop: 16}}>
        <h2>Indicateurs de succès des activités en classe</h2>
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
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Lycées</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Adoption</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Séances</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>En classe</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Profs</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Uniques</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Élèves</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Uniques</div>
                </th>
                <th style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #e2e8f0"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Taille</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Classe moy.</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Reprise</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>{'>'}1h après</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Maison</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Soir/weekend</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>2ème séance</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Collective</div>
                </th>
                <th style={{textAlign: "center", padding: "8px", borderLeft: "2px solid #e2e8f0"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Récurrence</div>
                  <div style={{fontSize: "0.75rem", fontWeight: "normal", color: "#64748b"}}>Séance/prof</div>
                </th>
                <th style={{textAlign: "center", padding: "8px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>Usage après test</div>
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
          <h4 style={{margin: "0 0 12px 0", fontSize: "0.875rem", color: "#475569"}}>Guide de lecture</h4>
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

      {/* Section : Données de la période sélectionnée */}
      <div style={{marginTop: 48, marginBottom: 32}}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "#0f172a",
          marginBottom: 16,
          paddingBottom: 8,
          borderBottom: "3px solid #3b82f6",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          Analyse de la période
          {(dateRangeStart || dateRangeEnd) && (
            <span style={{
              fontSize: "1rem",
              fontWeight: "600",
              color: "#3b82f6",
              backgroundColor: "#dbeafe",
              padding: "4px 12px",
              borderRadius: "6px"
            }}>
              {dateRangeStart || "Début"} → {dateRangeEnd || "Fin"}
            </span>
          )}
        </h2>
      </div>

      {/* Frise temporelle */}
      <div className="card" style={{marginBottom: 24, backgroundColor: "#ffffff", border: "2px solid #e2e8f0"}}>
        <div style={{padding: "8px 0"}}>
          {/* Titre et info */}
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16}}>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <span style={{fontSize: "0.875rem", fontWeight: "600", color: "#475569"}}>
                Période d'analyse
              </span>
              {/* Bouton Play/Pause */}
              <button
                onClick={() => {
                  if (!isPlaying) {
                    // Préparer l'animation : fixer le début au premier mois
                    const months = dateRange.months as string[];
                    if (months.length > 0) {
                      setDateRangeStart(months[0]);
                      // Si la fin est déjà au dernier mois, réinitialiser au 2ème mois
                      const endIdx = dateRangeEnd ? months.indexOf(dateRangeEnd) : -1;
                      if (endIdx >= months.length - 1 || endIdx <= 0) {
                        setDateRangeEnd(months[1] || months[0]);
                      }
                    }
                  }
                  setIsPlaying(!isPlaying);
                }}
                style={{
                  padding: "4px 8px",
                  backgroundColor: isPlaying ? "#ef4444" : "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = "0.9";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = "1";
                }}
              >
                {isPlaying ? "Pause" : "La conquête du monde"}
              </button>
            </div>
            <span style={{fontSize: "0.875rem", color: "#64748b"}}>
              {dateRangeStart || dateRangeEnd ? (
                <>
                  <strong style={{color: "#3b82f6"}}>{dateRangeStart || dateRange.months[0]}</strong>
                  {" → "}
                  <strong style={{color: "#3b82f6"}}>{dateRangeEnd || dateRange.months[dateRange.months.length - 1]}</strong>
                  {" "}
                  <span style={{color: "#94a3b8"}}>
                    ({rowsFilteredByDate.length.toLocaleString("fr-FR")} usages)
                  </span>
                </>
              ) : (
                <>
                  Toute la période
                  {" "}
                  <span style={{color: "#94a3b8"}}>
                    ({rowsWithDate.length.toLocaleString("fr-FR")} usages)
                  </span>
                </>
              )}
            </span>
          </div>
          
          {/* Ligne de temps */}
          <div style={{position: "relative", paddingTop: "30px", paddingBottom: "10px"}}>
            {/* Ligne de base */}
            <div style={{
              position: "absolute",
              top: "40px",
              left: "0",
              right: "0",
              height: "4px",
              backgroundColor: "#e2e8f0",
              borderRadius: "2px"
            }} />
            
            {/* Ligne sélectionnée */}
            {(() => {
              const months = dateRange.months as string[];
              const startIdx = dateRangeStart ? months.indexOf(dateRangeStart) : 0;
              const endIdx = dateRangeEnd ? months.indexOf(dateRangeEnd) : months.length - 1;
              const totalMonths = months.length;
              const leftPercent = (startIdx / (totalMonths - 1)) * 100;
              const widthPercent = ((endIdx - startIdx) / (totalMonths - 1)) * 100;
              
              return (
                <div style={{
                  position: "absolute",
                  top: "40px",
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: "4px",
                  backgroundColor: "#3b82f6",
                  borderRadius: "2px",
                  transition: "all 0.3s"
                }} />
              );
            })()}
            
            {/* Points cliquables pour chaque mois */}
            <div 
              style={{position: "relative", display: "flex", justifyContent: "space-between", userSelect: "none"}}
              onMouseMove={(e) => {
                // Gérer le drag uniquement si un bouton est enfoncé
                const dragType = (e.currentTarget as any)._dragType;
                if (!dragType || e.buttons !== 1) return;
                
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = Math.max(0, Math.min(1, x / rect.width));
                const monthIdx = Math.round(percentage * (dateRange.months.length - 1));
                const month = dateRange.months[monthIdx];
                
                const months = dateRange.months as string[];
                if (dragType === "start") {
                  const endIdx = dateRangeEnd ? months.indexOf(dateRangeEnd) : months.length - 1;
                  if (monthIdx <= endIdx) {
                    setDateRangeStart(month);
                  }
                } else if (dragType === "end") {
                  const startIdx = dateRangeStart ? months.indexOf(dateRangeStart) : 0;
                  if (monthIdx >= startIdx) {
                    setDateRangeEnd(month);
                  }
                }
              }}
              onMouseUp={(e) => {
                delete (e.currentTarget as any)._dragType;
              }}
              onMouseLeave={(e) => {
                delete (e.currentTarget as any)._dragType;
              }}
            >
              {dateRange.months.map((month, idx) => {
                const isStart = month === (dateRangeStart || dateRange.months[0]);
                const isEnd = month === (dateRangeEnd || dateRange.months[dateRange.months.length - 1]);
                const showLabel = idx === 0 || idx === dateRange.months.length - 1 || idx % 3 === 0;
                
                return (
                  <div
                    key={month}
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: "pointer"
                    }}
                  >
                    {/* Label du mois */}
                    {showLabel && (
                      <div style={{
                        position: "absolute",
                        top: "-25px",
                        fontSize: "0.7rem",
                        color: (isStart || isEnd) ? "#3b82f6" : "#94a3b8",
                        fontWeight: (isStart || isEnd) ? "700" : "400",
                        whiteSpace: "nowrap"
                      }}>
                        {month}
                      </div>
                    )}
                    
                    {/* Point cliquable / draggable */}
                    <div
                      onMouseDown={(e) => {
                        if (isStart || isEnd) {
                          // Activer le drag
                          e.preventDefault();
                          const parent = e.currentTarget.parentElement?.parentElement;
                          if (parent) {
                            (parent as any)._dragType = isStart ? "start" : "end";
                            e.currentTarget.style.cursor = "grabbing";
                          }
                        }
                      }}
                      onMouseUp={(e) => {
                        if (isStart || isEnd) {
                          e.currentTarget.style.cursor = "grab";
                        }
                      }}
                      onClick={(e) => {
                        if (isStart || isEnd) return; // Ne pas gérer le clic sur les curseurs actifs
                        
                        // Si aucune sélection, définir comme début
                        if (!dateRangeStart && !dateRangeEnd) {
                          setDateRangeStart(month);
                          return;
                        }
                        
                        // Si seulement début défini
                        if (dateRangeStart && !dateRangeEnd) {
                          if (month >= dateRangeStart) {
                            setDateRangeEnd(month);
                          } else {
                            setDateRangeEnd(dateRangeStart);
                            setDateRangeStart(month);
                          }
                          return;
                        }
                        
                        // Si période complète définie, choisir le plus proche
                        const months = dateRange.months as string[];
                        const startIdx = months.indexOf(dateRangeStart || months[0]);
                        const endIdx = months.indexOf(dateRangeEnd || months[months.length - 1]);
                        const clickIdx = idx;
                        
                        const distToStart = Math.abs(clickIdx - startIdx);
                        const distToEnd = Math.abs(clickIdx - endIdx);
                        
                        if (distToStart <= distToEnd) {
                          setDateRangeStart(month);
                        } else {
                          setDateRangeEnd(month);
                        }
                      }}
                      style={{
                        width: (isStart || isEnd) ? "16px" : "10px",
                        height: (isStart || isEnd) ? "16px" : "10px",
                        borderRadius: "50%",
                        backgroundColor: (isStart || isEnd) ? "#3b82f6" : "#cbd5e1",
                        border: (isStart || isEnd) ? "3px solid white" : "2px solid white",
                        boxShadow: (isStart || isEnd) ? "0 0 0 2px #3b82f6, 0 2px 4px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.1)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        zIndex: (isStart || isEnd) ? 10 : 1,
                        cursor: (isStart || isEnd) ? "grab" : "pointer"
                      }}
                      onMouseEnter={(e) => {
                        if (!isStart && !isEnd) {
                          e.currentTarget.style.transform = "scale(1.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isStart && !isEnd) {
                          e.currentTarget.style.transform = "scale(1)";
                        }
                      }}
                    />
                    
                    {/* Indicateur début/fin */}
                    {isStart && (
                      <div style={{
                        position: "absolute",
                        top: "20px",
                        fontSize: "0.65rem",
                        color: "#3b82f6",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        pointerEvents: "none"
                      }}>
                        Début
                      </div>
                    )}
                    {isEnd && (
                      <div style={{
                        position: "absolute",
                        top: "20px",
                        fontSize: "0.65rem",
                        color: "#3b82f6",
                        fontWeight: "600",
                        whiteSpace: "nowrap",
                        pointerEvents: "none"
                      }}>
                        Fin
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Aide */}
          <div style={{marginTop: 20, fontSize: "0.75rem", color: "#94a3b8", textAlign: "center"}}>
            Cliquez sur les points pour déplacer le début ou la fin de la période
          </div>
        </div>
      </div>

      {/* Carte */}
      <div style={{marginTop: 16}}>
        <div className="card">
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12}}>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <h2 style={{margin: 0}}>Carte des usages (cercles ∝ nb)</h2>
              {(dateRangeStart || dateRangeEnd) && (
                <span style={{
                  fontSize: "0.75rem",
                  fontWeight: "600",
                  color: "#3b82f6",
                  backgroundColor: "#dbeafe",
                  padding: "3px 8px",
                  borderRadius: "4px"
                }}>
                  Période filtrée
                </span>
              )}
            </div>
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
          <div className="toolbar" style={{marginBottom: 12}}>
            <label>Filtrer par activité :</label>
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
              points={usageByUaiForMap} 
              onPointClick={(uai) => setSelectedUai(uai)} 
              onAcademyClick={(academie) => setSelectedAcademie(academie)}
              showAcademyBorders={showAcademyBorders}
              maxUsage={maxUsageAbsolute}
            />
          </div>
        </div>
      </div>

      {/* Tableau lycées full width */}
      <div style={{marginTop: 16}}>
        <div className="card">
          <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 12}}>
            <h2 style={{margin: 0}}>Lycées — usages</h2>
            {(dateRangeStart || dateRangeEnd) && (
              <span style={{
                fontSize: "0.75rem",
                fontWeight: "600",
                color: "#3b82f6",
                backgroundColor: "#dbeafe",
                padding: "3px 8px",
                borderRadius: "4px"
              }}>
                Période filtrée
              </span>
            )}
          </div>
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
          <div style={{maxHeight: 500, overflowY: "auto", overflowX: "auto"}}>
            <table style={{width: "100%"}}>
              <thead>
                <tr>
                  <th style={{minWidth: "200px", position: "sticky", left: 0, backgroundColor: "#fff", zIndex: 1}}>Établissement</th>
                  <th style={{minWidth: "120px"}}>Ville</th>
                  <th style={{minWidth: "120px"}}>Académie</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Séances</th>
                  <th style={{textAlign:"center", minWidth: "80px"}}>Élèves</th>
                  <th style={{textAlign:"center", minWidth: "100px"}}>Profs ens.</th>
                  <th style={{textAlign:"center", minWidth: "100px"}}>Profs test</th>
                  <th style={{textAlign:"right", minWidth: "70px"}}>IPS</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map(r => (
                  <tr key={r.uai}>
                    <td style={{position: "sticky", left: 0, backgroundColor: "#fff", zIndex: 1}}>
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
          <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 12}}>
            <h2 style={{margin: 0}}>Statistiques globales d'usage</h2>
            {(dateRangeStart || dateRangeEnd) && (
              <span style={{
                fontSize: "0.75rem",
                fontWeight: "600",
                color: "#3b82f6",
                backgroundColor: "#dbeafe",
                padding: "3px 8px",
                borderRadius: "4px"
              }}>
                Période filtrée
              </span>
            )}
          </div>
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
        <div style={{display: "flex", alignItems: "center", gap: 12, marginBottom: 12}}>
          <h2 style={{margin: 0}}>Usages par académie</h2>
          {(dateRangeStart || dateRangeEnd) && (
            <span style={{
              fontSize: "0.75rem",
              fontWeight: "600",
              color: "#3b82f6",
              backgroundColor: "#dbeafe",
              padding: "3px 8px",
              borderRadius: "4px"
            }}>
              Période filtrée
            </span>
          )}
        </div>
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
        const etablissement = usageByUaiGlobal.find(e => e.uai === selectedUai);
        const activityDetails = getActivityDetailsForUai(selectedUai);
        const classActivityDetails = getClassActivityDetailsForUai(selectedUai);
        const teacherUsages = getTeacherUsagesForUai(selectedUai);
        
        // Créer un mapping teacher -> lettre (A, B, C...)
        const teacherToLetter = new Map<string, string>();
        let letterIndex = 0;
        
        // 1. Attribuer des lettres aux profs qui enseignent
        classActivityDetails.forEach(profData => {
          if (!teacherToLetter.has(profData.teacher)) {
            teacherToLetter.set(profData.teacher, String.fromCharCode(65 + letterIndex));
            letterIndex++;
          }
        });
        
        // 2. Attribuer des lettres aux profs qui testent uniquement
        teacherUsages.forEach(profData => {
          if (!teacherToLetter.has(profData.teacher)) {
            teacherToLetter.set(profData.teacher, String.fromCharCode(65 + letterIndex));
            letterIndex++;
          }
        });
        
        return (
          <Modal
            isOpen={true}
            onClose={() => setSelectedUai(null)}
            title=""
            maxWidth="800px"
          >
            <EstablishmentModalContent
              etablissement={etablissement}
              activityDetails={activityDetails}
              classActivityDetails={classActivityDetails}
              teacherUsages={teacherUsages}
              teacherToLetter={teacherToLetter}
              analyzeSeance={analyzeSeance}
              setSelectedSeance={setSelectedSeance}
            />
          </Modal>
        );
      })()}

      {/* Modal détails d'une séance */}
      {selectedUai && selectedSeance !== null && (() => {
        const etablissement = usageByUaiGlobal.find(e => e.uai === selectedUai);
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
          <Modal
            isOpen={true}
            onClose={() => setSelectedSeance(null)}
            title=""
            maxWidth="700px"
            zIndex={1100}
          >
            <SeanceDetailModalContent
              foundSeance={foundSeance}
              etablissement={etablissement}
              analysis={analysis}
            />
          </Modal>
        );
      })()}

      {/* Modal évolution temporelle par académie */}
      <Modal
        isOpen={selectedAcademie !== null}
        onClose={() => setSelectedAcademie(null)}
        title={`Académie de ${selectedAcademie}`}
        maxWidth="900px"
      >
        {selectedAcademie && (() => {
          console.log("Modal académie ouvert pour:", selectedAcademie);
          const monthlyData = getMonthlyDataForAcademie(selectedAcademie);
          const totalUsagesAcademie = monthlyData.reduce((sum, d) => sum + d.count, 0);
          
          // Calculer le nombre de lycées dans cette académie (utiliser les données globales, pas filtrées)
          const lyceesAcademie = usageByUaiGlobal.filter(u => u.academie === selectedAcademie);
          const nbLycees = lyceesAcademie.length;
          const nbUsages = lyceesAcademie.reduce((sum, u) => sum + u.nb, 0);
          
          // Calculer le nombre d'élèves pour cette académie depuis les données globales
          const nbEleves = Array.from(
            new Set(
              rowsWithDate
                .filter(r => {
                  const uai = (r.uai_el || r.uai || "").trim();
                  const meta = annMap.get(uai);
                  return meta?.academie === selectedAcademie && r.Role === "student" && r.student;
                })
                .map(r => r.student!)
            )
          ).length;
          
          // Récupérer les statistiques officielles
          const officialStats = officialAcademyStats?.[selectedAcademie];
          
          return (
            <>
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
                        Établissements de l'académie : {officialStats.nb_colleges} collège{officialStats.nb_colleges > 1 ? 's' : ''} · {officialStats.nb_lycees_gt} lycée{officialStats.nb_lycees_gt > 1 ? 's' : ''} GT · {officialStats.nb_lycees_pro} lycée{officialStats.nb_lycees_pro > 1 ? 's' : ''} Pro
                      </div>
                      <div style={{paddingLeft: "8px"}}>
                        <span className="muted">Élèves lycées GT :</span>{" "}
                        <strong>{officialStats.nb_eleves_lycees_gt.toLocaleString("fr-FR")}</strong>
                        <span style={{fontSize: "0.8rem", color: "#64748b", marginLeft: "8px"}}>
                          ({officialStats.nb_eleves_lycees_pro.toLocaleString("fr-FR")} en Pro)
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
                            ({((nbEleves / officialStats.nb_eleves_lycees_gt) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}
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
            </>
          );
        })()}
      </Modal>

      <Modal
        isOpen={selectedActivityId !== null}
        onClose={() => setSelectedActivityId(null)}
        title={activityTitles.get(selectedActivityId || "") || `Activité ${selectedActivityId}`}
        subtitle={`ID: ${selectedActivityId}`}
        maxWidth="900px"
      >
        {selectedActivityId && (() => {
          const monthlyData = getMonthlyDataForActivity(selectedActivityId);
          const totalUsages = monthlyData.reduce((sum, d) => sum + d.count, 0);
          
          // Filtrer les données pour cette activité
          const activityRows = rowsWithDate.filter(r => r.mathadata_id === selectedActivityId);
          
          // Calculer le nombre d'élèves uniques
          const nbEleves = Array.from(
            new Set(
              activityRows
                .filter(r => r.Role === "student" && r.student)
                .map(r => r.student!)
            )
          ).length;
          
          // Calculer le nombre de profs uniques (qui ont enseigné)
          const nbProfs = Array.from(
            new Set(
              activityRows
                .filter(r => r.Role === "student" && r.teacher)
                .map(r => r.teacher!)
            )
          ).length;
          
          // Calculer le nombre de lycées participants
          const lyceesSet = new Set<string>();
          activityRows.forEach(r => {
            const uai = (r.uai_el || r.uai || "").trim();
            if (uai && uai.toLowerCase() !== "null") {
              lyceesSet.add(uai);
            }
          });
          const nbLycees = lyceesSet.size;
          
          return (
            <>
              {/* Statistiques de l'activité */}
              <div style={{display: "flex", gap: "24px", fontSize: "0.875rem", marginBottom: 24, flexWrap: "wrap"}}>
                <div>
                  <span className="muted">Total usages :</span>{" "}
                  <strong style={{color: "#3b82f6"}}>{totalUsages.toLocaleString("fr-FR")}</strong>
                </div>
                <div>
                  <span className="muted">Élèves uniques :</span>{" "}
                  <strong style={{color: "#3b82f6"}}>{nbEleves.toLocaleString("fr-FR")}</strong>
                </div>
                <div>
                  <span className="muted">Profs :</span>{" "}
                  <strong style={{color: "#3b82f6"}}>{nbProfs.toLocaleString("fr-FR")}</strong>
                </div>
                <div>
                  <span className="muted">Lycées participants :</span>{" "}
                  <strong style={{color: "#3b82f6"}}>{nbLycees.toLocaleString("fr-FR")}</strong>
                </div>
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
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          );
        })()}
      </Modal>

      {/* Modal détails professeurs par nombre de séances */}
      {selectedSeancesCount !== null && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedSeancesCount(null)}
          title=""
          maxWidth="1200px"
          zIndex={1002}
        >
          <TeachersBySeanceModalContent
            teacherDetails={getTeacherDetailsForSeanceCount(selectedSeancesCount)}
            selectedSeancesCount={selectedSeancesCount}
            annMap={annMap}
          />
        </Modal>
      )}

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
                points={usageByUaiForMap} 
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

