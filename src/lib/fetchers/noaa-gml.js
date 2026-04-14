/**
 * NOAA Global Monitoring Laboratory
 * Long-term atmospheric greenhouse gas measurements
 * Covers: CO2, CH4, N2O from global monitoring stations
 */

export async function fetchNOAAGML({ metricString }) {
  try {
    // Determine which gas to fetch based on query
    let gas = "co2";
    let station = "mlo"; // Mauna Loa Observatory (most famous)
    let gasName = "Carbon Dioxide";
    let unit = "ppm";
    
    const m = metricString.toLowerCase();
    
    if (m.includes("methane") || m.includes("ch4")) {
      gas = "ch4";
      gasName = "Methane";
      unit = "ppb";
    } else if (m.includes("nitrous") || m.includes("n2o")) {
      gas = "n2o";
      gasName = "Nitrous Oxide";
      unit = "ppb";
    }
    
    // NOAA GML provides monthly mean data in simple text format
    const url = `https://gml.noaa.gov/webdata/ccgg/trends/${gas}/monthly/${gas}_mm_${station}.txt`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NOAA GML API error: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Parse the text file (format: year month decimal_date average)
    const lines = text.split('\n').filter(line => !line.startsWith('#') && line.trim());
    
    if (lines.length === 0) {
      throw new Error("No data returned from NOAA GML");
    }
    
    const timeSeries = [];
    const values = [];
    
    // Get last 5 years of data for better visualization
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const value = parseFloat(parts[3]);
        
        // Skip missing data (-99.99)
        if (value > 0 && year >= startYear) {
          const date = `${year}-${month.toString().padStart(2, '0')}-01`;
          timeSeries.push({
            date,
            value: parseFloat(value.toFixed(2)),
            detail: `${gasName} concentration`
          });
          values.push(value);
        }
      }
    });
    
    if (timeSeries.length === 0) {
      throw new Error("No valid data points found");
    }
    
    // Calculate statistics
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    
    // Calculate year-over-year growth rate
    const firstYearAvg = values.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
    const lastYearAvg = values.slice(-12).reduce((a, b) => a + b, 0) / 12;
    const growthRate = ((lastYearAvg - firstYearAvg) / firstYearAvg * 100).toFixed(2);
    
    // Trend
    const trend = lastYearAvg > firstYearAvg ? "Increasing ↑" : "Decreasing ↓";
    
    return {
      timeSeries,
      stats: {
        current: parseFloat(values[values.length - 1].toFixed(2)),
        average_5yr: parseFloat(avg.toFixed(2)),
        max_5yr: parseFloat(max.toFixed(2)),
        min_5yr: parseFloat(min.toFixed(2)),
        growth_rate: `${growthRate}%`,
        trend,
        unit,
        station: "Mauna Loa Observatory, Hawaii"
      },
      dataSource: `NOAA GML (${gasName} at Mauna Loa)`
    };
    
  } catch (error) {
    console.error("NOAA GML API Error:", error);
    throw new Error(`NOAA GML error: ${error.message}`);
  }
}
