"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapRecenter({ center, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length === 4) {
      // Leaflet expects bounds as [[minLat, minLon], [maxLat, maxLon]]
      // Our bbox is [minLon, minLat, maxLon, maxLat]
      const leafletBounds = [
        [bounds[1], bounds[0]],
        [bounds[3], bounds[2]]
      ];
      map.fitBounds(leafletBounds, { animate: true, duration: 1.5 });
    } else if (center) {
      map.flyTo(center, map.getZoom() || 8, { animate: true, duration: 1.5 });
    }
  }, [center, bounds, map]);

  return null;
}
