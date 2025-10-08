"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export type Point = {
  uai: string;
  nb: number;
  nom_lycee?: string;
  ville?: string;
  academie?: string;
  latitude: number;
  longitude: number;
};

export interface UsageMapProps {
  points: Point[];
}

function scaleRadius(count: number, min: number, max: number) {
  if (max <= min) return 8;
  const t = Math.sqrt((count - min) / (max - min));
  return 6 + t * 18; // 6..24 px
}

export default function UsageMap({ points }: UsageMapProps) {
  const valid = points.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
  const max = valid.reduce((m, p) => Math.max(m, p.nb), 0);

  return (
    <MapContainer center={[46.8, 2.5]} zoom={5.5} scrollWheelZoom style={{height: "100%", width: "100%"}}>
      <TileLayer
        attribution='© OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map(p => (
        <CircleMarker
          key={p.uai}
          center={[p.latitude, p.longitude]}
          radius={scaleRadius(p.nb, 0, max)}
          pathOptions={{ fillOpacity: 0.5 }}
        >
          <LeafletTooltip>
            <div>
              <strong>{p.nom_lycee || p.uai}</strong><br />
              {p.ville} — {p.academie}<br />
              Usages : {p.nb}
            </div>
          </LeafletTooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
