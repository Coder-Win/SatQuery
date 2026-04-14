/**
 * Open-Meteo Marine API
 * Used for Ocean wave heights, swell duration, and sea surface temperatures.
 */

export async function fetchOpenMeteoMarine(intent, geoInfo) {
  const { lat, lon } = geoInfo;
  
  // Use today exactly to a week ago
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 14); // default 14 days for marine

  const startStr = startDate.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lon.toString(),
    start_date: startStr,
    end_date: endStr,
    hourly: "wave_height,ocean_current_velocity",
    timezone: "auto"
  });

  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Marine HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data.hourly || !data.hourly.time) {
      throw new Error("No marine data returned (ensure location is over an ocean/sea).");
    }

    // Process down to daily averages to avoid 1000s of points
    const aggregated = {};
    data.hourly.time.forEach((timestamp, idx) => {
      const dateKey = timestamp.split("T")[0];
      const val = data.hourly.wave_height[idx];
      if (val !== null) {
        if (!aggregated[dateKey]) aggregated[dateKey] = { sum: 0, count: 0 };
        aggregated[dateKey].sum += val;
        aggregated[dateKey].count += 1;
      }
    });

    const timeSeries = Object.keys(aggregated).map((date) => {
      const avgWave = aggregated[date].sum / aggregated[date].count;
      return {
        date,
        value: parseFloat(avgWave.toFixed(2)),
        detail: "Avg Wave Height (m)"
      };
    });

    if (timeSeries.length === 0) throw new Error("No valid marine data retrieved over this target.");

    return {
      timeSeries,
      stats: {}, 
      dataSource: "Open-Meteo Marine API",
    };
  } catch (error) {
    console.error("Open-Meteo Marine API Error:", error);
    throw new Error(`Marine API error: ${error.message}`);
  }
}
