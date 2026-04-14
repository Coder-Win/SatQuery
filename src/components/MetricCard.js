import styles from './MetricCard.module.css';

/**
 * MetricCard displays a single Stats_Object entry with all 5 fields
 * @param {Object} stat - Stats_Object with { label, value, unit, context, source }
 */
export default function MetricCard({ stat }) {
  const { label, value, unit, context, source } = stat;
  
  // Determine card style based on source
  const isAPIData = source === "API Data";
  const cardClass = isAPIData ? styles.apiCard : styles.calculatedCard;
  
  // Extract trend icon if present in label or context
  const trendIcon = extractTrendIcon(label, context);
  
  return (
    <div className={`${styles.card} ${cardClass}`}>
      <div className={styles.header}>
        <h3 className={styles.label}>
          {label}
          {trendIcon && <span className={styles.trend}>{trendIcon}</span>}
        </h3>
        <span className={styles.source}>{source}</span>
      </div>
      
      <div className={styles.value}>
        {value} <span className={styles.unit}>{unit}</span>
      </div>
      
      {context && (
        <div className={styles.context} title={context}>
          {context}
        </div>
      )}
    </div>
  );
}

/**
 * Extract trend icon from label or context
 */
function extractTrendIcon(label, context) {
  const text = `${label} ${context}`.toLowerCase();
  
  if (text.includes('increasing') || text.includes('rising') || text.includes('upward')) {
    return '↑';
  }
  if (text.includes('decreasing') || text.includes('falling') || text.includes('downward')) {
    return '↓';
  }
  if (text.includes('stable') || text.includes('steady') || text.includes('flat')) {
    return '→';
  }
  
  return null;
}
