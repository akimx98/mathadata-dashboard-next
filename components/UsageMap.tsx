"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";

export type Point = {
  uai: string;
  nb: number;
  nom_lycee?: string;
  ville?: string;
  academie?: string;
  ips?: string | number;
  latitude: number;
  longitude: number;
  teacherUsages?: number;
  studentUsages?: number;
  hasStudents?: boolean;
};

export interface UsageMapProps {
  points: Point[];
  onPointClick?: (uai: string) => void;
  onAcademyClick?: (academie: string) => void;
  showAcademyBorders?: boolean;
}

function scaleRadius(count: number, min: number, max: number) {
  if (max <= min) return 8;
  const t = Math.sqrt((count - min) / (max - min));
  return 6 + t * 18; // 6..24 px
}

export default function UsageMap({ points, onPointClick, onAcademyClick, showAcademyBorders = false }: UsageMapProps) {
  const valid = points.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  const max = valid.reduce((m, p) => Math.max(m, p.nb), 0);
  const [academyGeoJSON, setAcademyGeoJSON] = useState<any>(null);
  const [officialStats, setOfficialStats] = useState<any>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  
  // Calculer les statistiques par académie à partir des données de points (usage MathAData)
  const academyStats = valid.reduce((acc, point) => {
    const academie = point.academie || "Non définie";
    if (!acc[academie]) {
      acc[academie] = {
        nbLycees: 0,
        nbUsages: 0,
        nbElevesUniques: 0 // Approximation via studentUsages
      };
    }
    acc[academie].nbLycees++;
    acc[academie].nbUsages += point.nb;
    if (point.studentUsages) {
      acc[academie].nbElevesUniques += point.studentUsages;
    }
    return acc;
  }, {} as Record<string, { nbLycees: number; nbUsages: number; nbElevesUniques: number }>);

  useEffect(() => {
    if (showAcademyBorders && !academyGeoJSON) {
      // Charger les données GeoJSON des académies de l'Éducation Nationale
      // Source: data.gouv.fr - Contours géographiques des académies
      // Fichier local converti depuis le shapefile officiel
      fetch('/data/academies.geojson')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("GeoJSON académies chargé", data);
          setAcademyGeoJSON(data);
        })
        .catch(err => {
          console.error("Erreur chargement GeoJSON académies:", err);
        });
    }
  }, [showAcademyBorders, academyGeoJSON]);

  // Charger les statistiques officielles des académies
  useEffect(() => {
    if (showAcademyBorders && !officialStats) {
      fetch('/data/academies_stats.json')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log("Statistiques officielles chargées", data);
          setOfficialStats(data);
        })
        .catch(err => {
          console.error("Erreur chargement statistiques officielles:", err);
        });
    }
  }, [showAcademyBorders, officialStats]);

  return (
    <MapContainer center={[46.8, 2.5]} zoom={5.5} scrollWheelZoom style={{height: "100%", width: "100%"}}>
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {showAcademyBorders && academyGeoJSON && (
        <GeoJSON
          ref={geoJsonRef}
          data={academyGeoJSON}
          style={{
            color: "#64748b",
            weight: 2,
            fillOpacity: 0,
            dashArray: "5, 5"
          }}
          onEachFeature={(feature, layer) => {
            const name = feature.properties?.name || "Académie inconnue";
            const vacances = feature.properties?.vacances || "Non définie";
            
            // Extraire le nom court de l'académie pour matcher avec les stats
            // Ex: "Académie d'Aix-Marseille" -> "Aix-Marseille"
            let academyShortName = name.replace(/^Académie (d'|de |des |du |de la )/i, '');
            
            // Gérer la fusion Caen/Rouen -> Normandie (depuis 2020)
            if (academyShortName === "Caen" || academyShortName === "Rouen") {
              academyShortName = "Normandie";
            }
            
            const usageStats = academyStats[academyShortName];
            const official = officialStats?.[academyShortName];
            
            layer.bindTooltip(
              `<div style="font-size: 0.875rem; line-height: 1.4;">
                <strong>${name}</strong><br/>
                ${vacances && vacances !== '' ? `<span style="color: #64748b;">Zone de vacances : ${vacances}</span><br/>` : ''}
                ${official ? `
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                    <div style="color: #1e293b; font-weight: 600; margin-bottom: 4px;">
                      🏫 ${official.nb_colleges} collège${official.nb_colleges > 1 ? 's' : ''} · ${official.nb_lycees_gt} lycée${official.nb_lycees_gt > 1 ? 's' : ''} GT · ${official.nb_lycees_pro} lycée${official.nb_lycees_pro > 1 ? 's' : ''} Pro
                    </div>
                    <div style="color: #64748b; font-size: 0.8rem;">👥 ${official.nb_eleves_gt.toLocaleString('fr-FR')} élèves lycées GT</div>
                    ${usageStats ? `
                      <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                        <div style="color: #3b82f6;">📊 ${usageStats.nbLycees} lycées GT utilisant MathAData (${((usageStats.nbLycees / official.nb_lycees_gt) * 100).toFixed(1)}%)</div>
                        <div style="color: #64748b; font-size: 0.8rem; padding-left: 8px;">▸ ${usageStats.nbUsages.toLocaleString('fr-FR')} usages</div>
                        ${usageStats.nbElevesUniques > 0 ? `<div style="color: #64748b; font-size: 0.8rem; padding-left: 8px;">▸ ${usageStats.nbElevesUniques.toLocaleString('fr-FR')} sessions élèves (${((usageStats.nbElevesUniques / official.nb_eleves_gt) * 100).toFixed(1)}%)</div>` : ''}
                      </div>
                    ` : ''}
                  </div>
                ` : usageStats ? `
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0;">
                    <div style="color: #3b82f6;">📚 ${usageStats.nbLycees} lycée${usageStats.nbLycees > 1 ? 's' : ''} utilisant MathAData</div>
                    <div style="color: #64748b; font-size: 0.8rem;">▸ ${usageStats.nbUsages.toLocaleString('fr-FR')} usages</div>
                    ${usageStats.nbElevesUniques > 0 ? `<div style="color: #64748b; font-size: 0.8rem;">▸ ${usageStats.nbElevesUniques.toLocaleString('fr-FR')} sessions élèves</div>` : ''}
                  </div>
                ` : ''}
              </div>`,
              {
                sticky: true,
                className: 'custom-tooltip'
              }
            );
            
            layer.on({
              mouseover: (e) => {
                const layer = e.target;
                layer.setStyle({
                  color: "#3b82f6",
                  weight: 3,
                  fillOpacity: 0.1,
                  fillColor: "#3b82f6"
                });
              },
              mouseout: (e) => {
                const layer = e.target;
                layer.setStyle({
                  color: "#64748b",
                  weight: 2,
                  fillOpacity: 0,
                  dashArray: "5, 5"
                });
              },
              click: (e) => {
                if (onAcademyClick) {
                  onAcademyClick(academyShortName);
                }
              }
            });
          }}
        />
      )}
      {valid.map(p => {
        // Déterminer la couleur : bleu si élèves, orange si uniquement profs
        const color = p.hasStudents ? "#3b82f6" : "#f59e0b";
        
        return (
          <CircleMarker
            key={p.uai}
            center={[p.latitude, p.longitude]}
            radius={scaleRadius(p.nb, 0, max)}
            pathOptions={{ 
              fillColor: color,
              color: color,
              fillOpacity: 0.6,
              weight: 2
            }}
            eventHandlers={{
              click: () => {
                if (onPointClick) {
                  onPointClick(p.uai);
                }
              }
            }}
          >
            <LeafletTooltip>
              <div>
                <strong>{p.nom_lycee || p.uai}</strong><br />
                {p.ville} — {p.academie}<br />
                Usages : {p.nb}<br />
                {p.teacherUsages !== undefined && p.studentUsages !== undefined && (
                  <>
                    <span style={{color: "#f59e0b"}}>Profs: {p.teacherUsages}</span> • <span style={{color: "#3b82f6"}}>Élèves: {p.studentUsages}</span><br />
                  </>
                )}
                IPS : {p.ips != null ? p.ips : "—"}
              </div>
            </LeafletTooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

