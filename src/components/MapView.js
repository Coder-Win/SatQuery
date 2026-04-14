"use client";

import dynamic from "next/dynamic";
import styles from "./MapView.module.css";

// Dynamically import the actual map implementation to avoid SSR 'window' errors
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Initializing satellite map...</div>,
});

export default function MapView({ bbox, coordinates, location }) {
  return (
    <div className={styles.mapContainer}>
      <MapComponent bbox={bbox} coordinates={coordinates} location={location} />
    </div>
  );
}
