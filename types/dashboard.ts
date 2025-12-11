/**
 * Type definitions for the MathAData Dashboard
 */

export interface UsageRow {
  assignment_id?: string;
  created?: string | number;
  changed?: string | number;
  activity_id?: string;
  mathadata_id?: string;
  mathadata_title?: string;
  student?: string;
  Role?: string;
  uai_el?: string;
  teacher?: string;
  uai_teach?: string;
  uai?: string;
}

export interface AnnuaireRow {
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
}

export interface OfficialAcademyStats {
  nb_colleges: number;
  nb_lycees_gt: number;
  nb_lycees_pro: number;
  nb_eleves_lycees_gt: number;
  nb_eleves_lycees_pro: number;
}

export interface EstablishmentStats {
  nbSeances: number;
  nbEleves: number;
  nbProfsEnseignant: number;
  nbProfsTestant: number;
}

export interface UsageByUai {
  uai: string;
  nb: number;
  nom_lycee: string;
  ville: string;
  academie: string;
  ips?: string | number;
  activites: string[];
  latitude: number;
  longitude: number;
  teacherUsages: number;
  studentUsages: number;
  hasStudents: boolean;
  nbSeances: number;
  nbEleves: number;
  nbProfsEnseignant: number;
  nbProfsTestant: number;
}

export interface ActivityDetail {
  activity: string;
  activityId: string;
  count: number;
}

export interface SessionData {
  student: string;
  teacher: string;
  mathadata_id: string;
  created: number;
  assignment_id: string;
}

export interface SeanceData {
  activity: string;
  activityId: string;
  date: string;
  dateObj: Date;
  sessions: SessionData[];
}

export interface ProfActivityData {
  teacher: string;
  seances: SeanceData[];
}

export interface TeacherUsageData {
  teacher: string;
  activities: Map<string, number>;
  totalTests: number;
}

export interface SeanceAnalysis {
  nbEleves: number;
  elevesList: string[];
  firstSession: Date;
  lastSession: Date;
  dureeMinutes: number;
  repriseApres1h: {
    nbEleves: number;
    pct: number;
  };
  travailMaison: {
    nbEleves: number;
    pct: number;
  };
  deuxiemeSeance: {
    detected: boolean;
    nbEleves: number;
    pct: number;
  };
}

export interface MonthlyData {
  month: string;
  count: number;
}
