"use client";

import styles from "./InsightCard.module.css";

export default function InsightCard({ insight }) {
  return (
    <div className={`${styles.card} glass-strong`}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h3 className={styles.title}>AI Insight</h3>
      </div>
      <div className={styles.content}>
        {insight.split("\n").map((paragraph, i) =>
          paragraph.trim() ? (
            <p key={i} className={styles.paragraph}>
              {paragraph}
            </p>
          ) : null
        )}
      </div>
    </div>
  );
}
