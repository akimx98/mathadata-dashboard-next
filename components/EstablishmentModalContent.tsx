/**
 * EstablishmentModalContent Component
 * 
 * Displays detailed information about an establishment's usage including:
 * - Sessions grouped by teacher
 * - Teacher test activities
 * - Total activity usage statistics
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

interface ProfSeanceData {
  teacher: string;
  seances: SeanceData[];
}

interface TestData {
  activityName: string;
  createdDate: Date;
  changedDate: Date;
  workTimeMinutes: number;
}

interface ProfTestData {
  teacher: string;
  tests: TestData[];
}

interface ActivityDetail {
  activity: string;
  studentCount: number;
  teacherCount: number;
  totalCount: number;
  lastDate: Date | null;
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

interface EstablishmentModalContentProps {
  etablissement: EstablishmentData | undefined;
  activityDetails: ActivityDetail[];
  classActivityDetails: ProfSeanceData[];
  teacherUsages: ProfTestData[];
  teacherToLetter: Map<string, string>;
  analyzeSeance: (sessions: SessionType[]) => SeanceAnalysis | null;
  setSelectedSeance: (idx: number) => void;
}

export default function EstablishmentModalContent({
  etablissement,
  activityDetails,
  classActivityDetails,
  teacherUsages,
  teacherToLetter,
  analyzeSeance,
  setSelectedSeance
}: EstablishmentModalContentProps) {
  
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
          <h2 style={{marginBottom: "4px"}}>{etablissement?.nom_lycee || "Établissement"}</h2>
          <p className="muted" style={{marginTop: 0}}>
            {etablissement?.ville && `${etablissement.ville} • `}
            {etablissement?.academie && `${etablissement.academie} • `}
            UAI: {etablissement?.uai}
            {etablissement?.ips != null && ` • IPS: ${etablissement.ips}`}
          </p>
        </div>
      </div>
      
      {/* Séances par professeur */}
      <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569", marginTop: "24px"}}>
        Séances par professeur ({classActivityDetails.reduce((sum, prof) => sum + prof.seances.length, 0)} séances, {classActivityDetails.length} {classActivityDetails.length > 1 ? 'profs' : 'prof'})
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
                            {formatDuration(seance.avgWorkTimeMinutes)}
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
                              <span style={{color: "#3b82f6"}}>Oui</span>
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
      
      {/* Tests enseignants */}
      {teacherUsages.length > 0 && (
        <>
          <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569", marginTop: "24px"}}>
            Tests enseignants ({teacherUsages.reduce((sum, prof) => sum + prof.tests.length, 0)} sessions, {teacherUsages.length} {teacherUsages.length > 1 ? 'profs' : 'prof'})
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
                    {profData.tests.map((test, testIdx) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </>
      )}
      
      {/* Total des activités utilisées */}
      <h3 style={{fontSize: "1rem", marginBottom: "12px", color: "#475569"}}>
        Total des activités utilisées ({activityDetails.length})
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
    </>
  );
}
