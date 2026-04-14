"use client";

import styles from "./StatsGrid.module.css";

const STAT_ICONS = {
  average: "μ",
  min: "↓",
  max: "↑",
  trend: "→",
  count: "#",
  total: "Σ",
};

const STAT_COLORS = {
  average: "var(--accent-indigo-light)",
  min: "var(--accent-cyan)",
  max: "var(--accent-rose)",
  trend: "var(--accent-emerald)",
  count: "var(--accent-amber)",
  total: "var(--accent-purple)",
};

export default function StatsGrid({ stats }) {
  if (!stats || Object.keys(stats).length === 0) return null;

  // Convert stats to array and limit to top 4 most important
  const statsArray = Object.entries(stats).map(([key, value]) => {
    // Handle both simple values and object values
    let displayValue = value;
    
    // If value is an object (e.g., {label, value, unit, context, source})
    if (typeof value === 'object' && value !== null) {
      // Extract the actual value from the object
      displayValue = value.value || value.label || JSON.stringify(value);
    }
    
    // Format the display value
    const formattedValue = typeof displayValue === "number" 
      ? displayValue.toFixed(2) 
      : String(displayValue);
    
    return { key, value: displayValue, formattedValue };
  });

  // Limit to 4 stats for cleaner display
  const displayStats = statsArray.slice(0, 4);

  return (
    <div className={styles.grid}>
      {displayStats.map(({ key, formattedValue }, i) => {
        return (
          <div
            key={key}
            className={`${styles.statCard} glass`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div
              className={styles.statIcon}
              style={{ color: STAT_COLORS[key] || "var(--accent-indigo-light)" }}
            >
              {STAT_ICONS[key] || "•"}
            </div>
            <div className={styles.statValue}>
              {formattedValue}
            </div>
            <div className={styles.statLabel}>{key}</div>
          </div>
        );
      })}
    </div>
  );
}
