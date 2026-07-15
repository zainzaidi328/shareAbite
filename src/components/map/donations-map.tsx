"use client";

// Map of nearby donations for the browse page.
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { formatDistance } from "@/lib/utils";

const foodPin = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#F59E0B;border:2px solid #0A0A0F;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 0 14px rgba(245,158,11,0.5)">🍽</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const youPin = L.divIcon({
  className: "",
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#38bdf8;border:2px solid #0A0A0F;box-shadow:0 0 10px rgba(56,189,248,0.7)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export interface MapDonation {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  quantity: number;
  distanceKm: number | null;
  donor: { fullName: string };
}

export default function DonationsMap({
  donations,
  me,
  height = 420,
}: {
  donations: MapDonation[];
  me: { lat: number; lng: number } | null;
  height?: number;
}) {
  const center: [number, number] = me
    ? [me.lat, me.lng]
    : donations.length
      ? [donations[0].latitude, donations[0].longitude]
      : [31.5204, 74.3587];

  return (
    <div style={{ height }} className="overflow-hidden rounded-lg border border-line">
      <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {me && (
          <>
            <Marker position={[me.lat, me.lng]} icon={youPin} />
            <Circle
              center={[me.lat, me.lng]}
              radius={500}
              pathOptions={{ color: "#38bdf8", opacity: 0.2, fillOpacity: 0.05 }}
            />
          </>
        )}
        {donations.map((d) => (
          <Marker key={d.id} position={[d.latitude, d.longitude]} icon={foodPin}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{d.title}</p>
                <p style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>
                  {d.donor.fullName}
                  {d.distanceKm != null && ` · ${formatDistance(d.distanceKm)}`}
                </p>
                <Link
                  href={`/dashboard/donations/${d.id}`}
                  style={{ color: "#F59E0B", fontSize: 13 }}
                >
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
