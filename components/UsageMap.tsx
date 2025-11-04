"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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
}

function scaleRadius(count: number, min: number, max: number) {
  if (max <= min) return 8;
  const t = Math.sqrt((count - min) / (max - min));
  return 6 + t * 18; // 6..24 px
}

export default function UsageMap({ points, onPointClick }: UsageMapProps) {
  const valid = points.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  const max = valid.reduce((m, p) => Math.max(m, p.nb), 0);

  return (
    <MapContainer center={[46.8, 2.5]} zoom={5.5} scrollWheelZoom style={{height: "100%", width: "100%"}}>
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map(p => {
        // Déterminer la couleur : vert si élèves, rouge si uniquement profs
        const color = p.hasStudents ? "#10b981" : "#ef4444";
        
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
                    <span style={{color: "#ef4444"}}>Profs: {p.teacherUsages}</span> • <span style={{color: "#10b981"}}>Élèves: {p.studentUsages}</span><br />
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

