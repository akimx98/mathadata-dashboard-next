/**
 * TeachersBySeanceModalContent Component
 * 
 * Displays detailed information about teachers filtered by number of sessions.
 * Shows for each teacher:
 * - Statistics (number of schools, activities, total students)
 * - Timeline of activity usage
 * - List of schools and activities
 * - Detailed session timeline
 */

import React from 'react';

interface AnnuaireInfo {
  nom: string;
  ville?: string;
  academie?: string;
}

interface SeanceInfo {
  dateObj: Date;
  activityName: string;
  uai: string;
  students: Set<string>;
}

interface TeacherDetail {
  teacher: string;
  seances: SeanceInfo[];
  lycees: Set<string>;
  activites: Set<string>;
  firstDate: Date;
  lastDate: Date;
}

interface TeachersBySeanceModalContentProps {
  teacherDetails: TeacherDetail[];
  selectedSeancesCount: number;
  annMap: Map<string, AnnuaireInfo>;
}

export default function TeachersBySeanceModalContent({
  teacherDetails,
  selectedSeancesCount,
  annMap
}: TeachersBySeanceModalContentProps) {
  
  return (
    <>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px"}}>
        <div>
          <h2 style={{marginBottom: "4px"}}>
            Professeurs avec {selectedSeancesCount} séance{selectedSeancesCount > 1 ? 's' : ''}
          </h2>
          <p className="muted" style={{marginTop: 0}}>
            {teacherDetails.length} professeur{teacherDetails.length > 1 ? 's' : ''} concerné{teacherDetails.length > 1 ? 's' : ''}
          </p>
        </div>
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
    </>
  );
}
