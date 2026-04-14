"use client";

import { useMemo } from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';
import styles from "./DataChart.module.css";

export default function DataChart({ data, metric }) {
  if (!data || data.length === 0) return <div className={styles.chartContainer}>No data available</div>;

  // Determine if this is truly time-series data
  const isTimeSeries = useMemo(() => {
    if (data.length < 2) return false;
    
    // Check if dates are different (not all the same)
    const dates = data.map(d => d.date).filter(Boolean);
    const uniqueDates = new Set(dates);
    
    // If all dates are the same, it's categorical data
    if (uniqueDates.size <= 1) return false;
    
    // If we have multiple different dates, it's time series
    return uniqueDates.size > 1;
  }, [data]);

  // Determine chart type
  const chartType = useMemo(() => {
    // For non-time-series or few data points, use bar chart
    if (!isTimeSeries || data.length <= 10) {
      return 'bar';
    }
    return 'area';
  }, [data, isTimeSeries]);

  // Sample data if too many points
  const chartData = useMemo(() => {
    if (data.length > 100) {
      const step = Math.ceil(data.length / 100);
      return data.filter((_, i) => i % step === 0);
    }
    return data;
  }, [data]);

  // Determine axis labels
  const xAxisLabel = useMemo(() => {
    if (isTimeSeries) return 'Date';
    if (chartData[0]?.detail) return 'Property';
    return 'Category';
  }, [chartData, isTimeSeries]);

  const yAxisLabel = useMemo(() => {
    // Try to extract unit from first data point's detail
    if (chartData[0]?.detail) {
      const detail = chartData[0].detail;
      // Extract unit from patterns like "Temperature (°C)" or "PM2.5 (μg/m³)"
      const unitMatch = detail.match(/\(([^)]+)\)/);
      if (unitMatch) return unitMatch[1];
    }
    return metric || 'Value';
  }, [chartData, metric]);

  // Determine x-axis data key
  const xDataKey = useMemo(() => {
    if (isTimeSeries) return 'date';
    // For categorical data, use detail as x-axis
    return 'detail';
  }, [isTimeSeries]);

  // Common chart props
  const commonProps = {
    data: chartData,
    margin: { top: 20, right: 30, left: 20, bottom: 80 }
  };

  const xAxisProps = {
    dataKey: xDataKey,
    stroke: "var(--text-muted)",
    fontSize: 11,
    tickLine: false,
    axisLine: { stroke: 'var(--border-subtle)' },
    tickMargin: 10,
    angle: -45,
    textAnchor: "end",
    height: 100,
    interval: chartType === 'bar' ? 0 : 'preserveStartEnd',
    label: { 
      value: xAxisLabel, 
      position: 'insideBottom', 
      offset: -60, 
      fill: 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 600
    }
  };

  const yAxisProps = {
    stroke: "var(--text-muted)",
    fontSize: 11,
    tickLine: false,
    axisLine: { stroke: 'var(--border-subtle)' },
    tickFormatter: (val) => {
      if (Math.abs(val) >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (Math.abs(val) >= 1000) {
        return (val / 1000).toFixed(1) + 'k';
      }
      if (Math.abs(val) < 1 && val !== 0) {
        return val.toFixed(2);
      }
      return val.toFixed(1);
    },
    label: { 
      value: yAxisLabel, 
      angle: -90, 
      position: 'insideLeft',
      fill: 'var(--text-secondary)',
      fontSize: 13,
      fontWeight: 600,
      offset: 10
    }
  };

  const tooltipProps = {
    contentStyle: { 
      backgroundColor: 'var(--bg-card)', 
      border: '1px solid var(--border-subtle)', 
      borderRadius: '8px',
      padding: '8px 12px'
    },
    itemStyle: { color: 'var(--text-primary)' },
    labelStyle: { color: 'var(--text-muted)', marginBottom: '4px', fontSize: '12px' },
    formatter: (value) => {
      if (typeof value === 'number') {
        return value.toFixed(2);
      }
      return value;
    }
  };

  return (
    <div className={styles.chartContainer} style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <ResponsiveContainer>
        {chartType === 'bar' ? (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Bar 
              dataKey="value" 
              fill="var(--accent-cyan)" 
              radius={[8, 8, 0, 0]}
              animationDuration={800}
            />
          </BarChart>
        ) : (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis {...xAxisProps} />
            <YAxis {...yAxisProps} />
            <Tooltip {...tooltipProps} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="var(--accent-cyan)" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorValue)"
              animationDuration={800}
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
