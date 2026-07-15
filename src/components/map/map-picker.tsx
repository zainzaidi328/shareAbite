"use client";

// Interactive location picker built on OpenStreetMap.
// Rendered with next/dynamic({ ssr: false }) — Leaflet needs `window`.

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useState } from "react";

// Default marker assets don't resolve under bundlers; use a themed div icon.
const pin = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#F59E0B;border:2px solid #0A0A0F;box-shadow:0 0 12px rgba(245,158,11,0.6)"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

export default function MapPicker({
  value,
  onChange,
  height = 260,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
  height?: number;
}) {
  const [center] = useState<[number, number]>([
    value?.lat ?? 31.5204,
    value?.lng ?? 74.3587,
  ]);

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-line">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={(lat, lng) => onChange({ lat, lng })} />
        {value && <Marker position={[value.lat, value.lng]} icon={pin} />}
      </MapContainer>
    </div>
  );
}
