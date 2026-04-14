import { format, differenceInDays } from "date-fns";

export async function fetchOpenMeteoData({ coordinates, startDate, endDate, metricString }) {
  const { lat, lon } = coordinates;
  
  // Decide which API base and variables to use based on metric string
  let baseUrl = "https://archive-api.open-meteo.com/v1/archive";
  let variable = "temperature_2m_max";
  let type = "daily";
  let isAirQuality = false;

  const m = metricString.toLowerCase();
  
  if (m.includes("air") || m.includes("pm2") || m.includes("pollution")) {
    baseUrl = "https://air-quality-api.open-meteo.com/v1/air-quality";
    variable = "pm2_5";
    type = "hourly";
    isAirQuality = true;
  } else if (m.includes("soil") || m.includes("moisture")) {
    variable = "soil_moisture_0_to_7cm_mean";
  } else if (m.includes("rain") || m.includes("precipitation")) {
    variable = "precipitation_sum";
  } else if (m.includes("wind")) {
    variable = "wind_speed_10m_max";
  } else if (m.includes("humidity")) {
    variable = "relative_humidity_2m_mean";
    type = "hourly"; // some archives don't support daily mean out of box
  }

  // Ensure dates exist
  const sDate = startDate || format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const eDate = endDate || format(new Date(), "yyyy-MM-dd");

  const url = new URL(baseUrl);
  url.searchParams.append("latitude", lat);
  url.searchParams.append("longitude", lon);
  url.searchParams.append("start_date", sDate);
  url.searchParams.append("end_date", eDate);
  url.searchParams.append(type, variable);
  url.searchParams.append("timezone", "auto");

  // Fallback to current API if archive doesn't have the last 5 days
  if (!isAirQuality && differenceInDays(new Date(), new Date(eDate)) < 5) {
     // use historical for old, but the API handles it or we could use the standard forecast endpoint
     // For MVP, archive-api extends nicely to near present
  }

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    // Air quality historically doesn't go back too far. Fallback logic:
    if (response.status === 400 && isAirQuality) {
       throw new Error("Air quality data is only available for recent dates. Please adjust the temporal range.");
    }
    throw new Error(`Open-Meteo Network Error: ${response.status}`);
  }

  const payload = await response.json();
  
  const timeArray = payload[type].time;
  const valArray = payload[type][variable];

  if (!timeArray || timeArray.length === 0) {
    return { timeSeries: [], stats: {} };
  }

  // Normalize data
  const timeSeries = [];
  let sum = 0;
  let validCount = 0;
  let max = -Infinity;
  let min = Infinity;

  // We only want ~30-50 data points max for the chart, so we might sample if it's hourly over a year
  const step = Math.ceil(timeArray.length / 100);

  for (let i = 0; i < timeArray.length; i++) {
    const val = valArray[i];
    if (val !== null && val !== undefined) {
      if (i % step === 0) {
        timeSeries.push({
          date: type === "hourly" ? timeArray[i].split("T").join(" ") : timeArray[i],
          value: parseFloat(val.toFixed(2))
        });
      }
      sum += val;
      validCount++;
      if (val > max) max = val;
      if (val < min) min = val;
    }
  }

  const average = validCount > 0 ? (sum / validCount) : 0;
  
  // Basic trend: (Last 10% average) - (First 10% average)
  let trendStr = "Stable";
  if (validCount > 10) {
      const p10 = Math.floor(validCount * 0.1);
      const startAvg = valArray.slice(0, p10).filter(v=>v!==null).reduce((a,b)=>a+b,0) / p10;
      const endAvg = valArray.slice(-p10).filter(v=>v!==null).reduce((a,b)=>a+b,0) / p10;
      const diff = endAvg - startAvg;
      if (diff > (average * 0.05)) trendStr = "Increasing ↑";
      else if (diff < -(average * 0.05)) trendStr = "Decreasing ↓";
  }

  return {
    timeSeries,
    stats: {
      average: validCount > 0 ? parseFloat(average.toFixed(2)) : 0,
      min: min !== Infinity ? min : 0,
      max: max !== -Infinity ? max : 0,
      trend: trendStr
    },
    dataSource: `Open-Meteo (${variable})`
  };
}
