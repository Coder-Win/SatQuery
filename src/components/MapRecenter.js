"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

export default function MapRecenter({ center, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      // Add padding so the entire bounding box is visible with some margin
      map.fitBounds(bounds, { 
        animate: true, 
        duration: 1.5,
        padding: [50, 50] // 50px padding on all sides
      });
    } else if (center) {
      map.flyTo(center, map.getZoom() || 8, { animate: true, duration: 1.5 });
    }
  }, [center, bounds, map]);

  return null;
}
