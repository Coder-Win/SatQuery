export async function fetchUSGSEarthquakes({ bbox, startDate, endDate }) {
  // USGS takes bounding box as minLon, minLat, maxLon, maxLat
  const [minLon, minLat, maxLon, maxLat] = bbox;
  
  const url = new URL("https://earthquake.usgs.gov/fdsnws/event/1/query");
  url.searchParams.append("format", "geojson");
  if (startDate) url.searchParams.append("starttime", startDate);
  if (endDate) url.searchParams.append("endtime", endDate);
  url.searchParams.append("minlongitude", minLon);
  url.searchParams.append("maxlongitude", maxLon);
  url.searchParams.append("minlatitude", minLat);
  url.searchParams.append("maxlatitude", maxLat);
  // Optional: Only significant earthquakes to avoid chart noise
  url.searchParams.append("minmagnitude", "2.0"); 
  url.searchParams.append("orderby", "time");
  url.searchParams.append("limit", "1000");

  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 400) {
        return { data: [], stats: { total: 0 } }; // Often means bounds are too wide for USGS limits, return empty cleanly
    }
    throw new Error(`USGS Network Error: ${response.status}`);
  }

  const payload = await response.json();
  const features = payload.features || [];

  // Normalize data for the frontend DataChart component
  const timeSeries = features.reverse().map(f => {
    return {
      date: new Date(f.properties.time).toISOString().split('T')[0],
      value: f.properties.mag, // Magnitude represents the severity
      detail: f.properties.place
    };
  });

  // Calculate aggregation stats
  const mags = timeSeries.map(t => t.value);
  const stats = {
    count: mags.length,
    max: mags.length > 0 ? Math.max(...mags) : 0,
    average: mags.length > 0 ? (mags.reduce((a, b) => a + b, 0) / mags.length) : 0,
  };

  return {
    timeSeries,
    stats,
    dataSource: "USGS Earthquake Hazards Program"
  };
}
