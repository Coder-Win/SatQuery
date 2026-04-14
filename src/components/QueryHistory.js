"use client";

import { useState } from "react";
import styles from "./QueryHistory.module.css";

export default function QueryHistory({ history, activeId, onSelect }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.header}>
        <h3 className={styles.sidebarTitle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {!isCollapsed && "History"}
        </h3>
        <button 
          className={styles.toggleButton}
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand history" : "Collapse history"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <polyline points="9 18 15 12 9 6"/>
            ) : (
              <polyline points="15 18 9 12 15 6"/>
            )}
          </svg>
        </button>
      </div>
      {!isCollapsed && (
        <div className={styles.list}>
          {history.map((entry) => (
            <button
              key={entry.id}
              className={`${styles.item} ${entry.id === activeId ? styles.active : ""}`}
              onClick={() => onSelect(entry)}
            >
              <span className={styles.itemQuery}>{entry.query}</span>
              <span className={styles.itemTime}>
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
