"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Rectangle, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import MapRecenter from "./MapRecenter";

// Fix Leaflet's default icon path issues in modern bundlers
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function MapComponent({ bbox, coordinates, location }) {
  // Center defaults to coordinates, or center of bbox, or 0,0
  const center = coordinates 
    ? [coordinates.lat, coordinates.lon] 
    : bbox 
      ? [(bbox[1] + bbox[3]) / 2, (bbox[0] + bbox[2]) / 2]
      : [0, 0];

  return (
    <MapContainer 
      center={center} 
      zoom={10} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      bounds={bbox || undefined}
    >
      <MapRecenter center={center} bounds={bbox} />
      <TileLayer
        attribution='&copy; <a href="https://www.carto.com/">CartoDB</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme
      />
      
      {/* Explicit Marker */}
      {coordinates && (
        <Marker position={[coordinates.lat, coordinates.lon]}>
          <Popup>{location || "Target Center"}</Popup>
        </Marker>
      )}

      {/* Bounding Box Outline */}
      {bbox && (
        <Rectangle 
          bounds={[
            [bbox[1], bbox[0]], 
            [bbox[3], bbox[2]] 
          ]} 
          pathOptions={{ color: "#0ea5e9", weight: 2, fillOpacity: 0.1 }}
        />
      )}
    </MapContainer>
  );
}
