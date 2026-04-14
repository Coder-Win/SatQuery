"use client";

import { memo } from "react";
import styles from "./Dashboard.module.css";

import InsightCard from "./InsightCard";
import DataChart from "./DataChart";
import MapView from "./MapView";
import StatsGrid from "./StatsGrid";
import { exportToPDF } from "@/lib/pdf-export";

function Dashboard({ data }) {
  const { result } = data;
  const {
    query,
    location,
    metric,
    insight,
    timeSeries,
    stats,
    bbox,
    coordinates,
    dataSource,
    dateRange,
    cached
  } = result;

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerMeta}>
          <h2 className={styles.headerTitle}>{query}</h2>
          <div className={styles.tags}>
            {location && (
              <span className={styles.tag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {location}
              </span>
            )}
            {metric && (
              <span className={styles.tag}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                {metric}
              </span>
            )}
            {dataSource && (
              <span className={`${styles.tag} ${styles.tagSource}`}>
                {dataSource}
              </span>
            )}
            {cached && (
              <span className={`${styles.tag} ${styles.tagCached}`}>
                ⚡ Cached
              </span>
            )}
          </div>
          {dateRange && (
            <p className={styles.dateRange}>
              {dateRange.start} → {dateRange.end}
            </p>
          )}
        </div>
        <button 
          onClick={() => exportToPDF(result)} 
          className={styles.exportButton}
          title="Download Professional PDF Report"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export PDF
        </button>
      </div>

      {/* Stats Grid */}
      {stats && <StatsGrid stats={stats} />}

      {/* Main Content Grid */}
      <div className={styles.grid}>
        {/* Insight */}
        {insight && (
          <div className={styles.insightCol}>
            <InsightCard insight={insight} />
          </div>
        )}

        {/* Chart */}
        {timeSeries && timeSeries.length > 0 && (
          <div className={styles.chartCol}>
            <div className={`${styles.card} glass-strong`}>
              <h3 className={styles.cardTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Time-Series Trend
              </h3>
              <DataChart data={timeSeries} metric={metric} />
            </div>
          </div>
        )}

        {/* Map */}
        {(bbox || coordinates) && (
          <div className={styles.mapCol}>
            <div className={`${styles.card} glass-strong`}>
              <h3 className={styles.cardTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                Geographic View
              </h3>
              <MapView bbox={bbox} coordinates={coordinates} location={location} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(Dashboard);
