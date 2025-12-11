/**
 * SeanceDetailModalContent Component
 * 
 * Displays detailed analysis of a classroom session including:
 * - Student count and average work time
 * - Work continuity metrics (students continuing after 1h, working at home)
 * - Second session detection
 * - Individual student session details
 */

import React from 'react';

interface SessionType {
  student: string;
  teacher: string;
  mathadata_id: string;
  mathadata_title: string;
  created: number;
  changed: number;
}

interface SeanceData {
  activityName: string;
  studentCount: number;
  creationDate: string;
  avgWorkTimeMinutes: number;
  sessions: SessionType[];
}

interface SeanceAnalysis {
  totalStudents: number;
  continueApres2h: number;
  workingAtHome: number;
  deuxiemeSeance: boolean;
  deuxiemeSeanceSize: number;
  deuxiemeSeanceDate: Date | null;
}

interface EstablishmentData {
  nom_lycee: string;
  ville?: string;
  academie?: string;
  uai: string;
  ips?: string | number;
}

interface SeanceDetailModalContentProps {
  foundSeance: SeanceData;
  etablissement: EstablishmentData | undefined;
  analysis: SeanceAnalysis;
}

export default function SeanceDetailModalContent({
  foundSeance,
  etablissement,
  analysis
}: SeanceDetailModalContentProps) {
  
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
    <>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
        <div>
          <h2 style={{marginBottom: "4px"}}>Détails de la séance</h2>
          <p className="muted" style={{marginTop: 0}}>
            {foundSeance.activityName} • {foundSeance.creationDate} • {etablissement?.nom_lycee}
          </p>
        </div>
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
            {formatDuration(foundSeance.avgWorkTimeMinutes)}
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
          <span>Élèves ayant continué après la séance (&gt;1h)</span>
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
    </>
  );
}
