/**
 * USGS Water Services API
 * Real-time and historical water data for rivers, streams, and monitoring stations
 * Covers: Water levels, discharge, floods, streamflow
 */

export async function fetchUSGSWater({ coordinates, bbox, startDate, endDate }) {
  const { lat, lon } = coordinates;
  
  try {
    // Step 1: Find nearest monitoring stations within 50km radius
    const stationUrl = new URL("https://waterservices.usgs.gov/nwis/site/");
    stationUrl.searchParams.append("format", "json");
    stationUrl.searchParams.append("bBox", `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`);
    stationUrl.searchParams.append("siteStatus", "active");
    stationUrl.searchParams.append("hasDataTypeCd", "dv"); // Daily values
    
    const stationResponse = await fetch(stationUrl.toString());
    if (!stationResponse.ok) {
      throw new Error(`USGS Station API error: ${stationResponse.status}`);
    }
    
    const stationData = await stationResponse.json();
    const sites = stationData?.value?.timeSeries || [];
    
    if (sites.length === 0) {
      return {
        timeSeries: [],
        stats: { message: "No water monitoring stations found in this region" },
        dataSource: "USGS Water Services"
      };
    }
    
    // Get the first available station
    const siteCode = sites[0]?.sourceInfo?.siteCode?.[0]?.value;
    
    if (!siteCode) {
      throw new Error("No valid station code found");
    }
    
    // Step 2: Fetch time series data for the station
    const dataUrl = new URL("https://waterservices.usgs.gov/nwis/dv/");
    dataUrl.searchParams.append("format", "json");
    dataUrl.searchParams.append("sites", siteCode);
    dataUrl.searchParams.append("parameterCd", "00060,00065"); // Discharge and gage height
    
    if (startDate) dataUrl.searchParams.append("startDT", startDate);
    if (endDate) dataUrl.searchParams.append("endDT", endDate);
    
    // Default to last 30 days if no dates provided
    if (!startDate && !endDate) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      dataUrl.searchParams.append("startDT", start.toISOString().split('T')[0]);
      dataUrl.searchParams.append("endDT", end.toISOString().split('T')[0]);
    }
    
    const dataResponse = await fetch(dataUrl.toString());
    if (!dataResponse.ok) {
      throw new Error(`USGS Data API error: ${dataResponse.status}`);
    }
    
    const data = await dataResponse.json();
    const timeSeries = data?.value?.timeSeries?.[0];
    
    if (!timeSeries || !timeSeries.values?.[0]?.value) {
      return {
        timeSeries: [],
        stats: { message: "No water data available for this time period" },
        dataSource: "USGS Water Services"
      };
    }
    
    // Step 3: Process the data
    const values = timeSeries.values[0].value;
    const variable = timeSeries.variable;
    const unit = variable.unit?.unitCode || "";
    const variableName = variable.variableDescription || "Water Level";
    
    const processedData = values
      .filter(v => v.value && v.value !== "-999999")
      .map(v => ({
        date: v.dateTime.split('T')[0],
        value: parseFloat(v.value),
        detail: variableName
      }));
    
    if (processedData.length === 0) {
      return {
        timeSeries: [],
        stats: { message: "No valid measurements in this period" },
        dataSource: "USGS Water Services"
      };
    }
    
    // Calculate statistics
    const vals = processedData.map(d => d.value);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = sum / vals.length;
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    
    // Trend detection
    const firstHalf = vals.slice(0, Math.floor(vals.length / 2));
    const secondHalf = vals.slice(Math.floor(vals.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg * 1.05 ? "Rising ↑" : 
                  secondAvg < firstAvg * 0.95 ? "Falling ↓" : "Stable";
    
    return {
      timeSeries: processedData,
      stats: {
        average: parseFloat(avg.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        trend,
        unit,
        station: timeSeries.sourceInfo?.siteName || "Unknown Station"
      },
      dataSource: `USGS Water Services (${variableName})`
    };
    
  } catch (error) {
    console.error("USGS Water API Error:", error);
    throw new Error(`USGS Water Services error: ${error.message}`);
  }
}
