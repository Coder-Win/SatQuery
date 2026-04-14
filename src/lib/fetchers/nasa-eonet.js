export async function fetchNASAEonet(bbox, status = "open") {
  // EONET maps bbox as: minLon,minLat,maxLon,maxLat
  // We can pass string "bbox=lon_min,lat_min,lon_max,lat_max"
  const url = new URL("https://eonet.gsfc.nasa.gov/api/v3/events");
  
  if (bbox) {
    url.searchParams.append("bbox", `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`);
  }
  
  // 'open' for active events, 'closed' for historical, 'all' for both
  url.searchParams.append("status", status); 
  url.searchParams.append("limit", "150");

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`NASA EONET Network Error: ${response.status}`);
  }

  const payload = await response.json();
  const events = payload.events || [];

  const timeSeries = events.map(e => {
    // EONET events have an array of geometries mostly by date
    const lastGeo = e.geometry[e.geometry.length - 1];
    return {
      date: lastGeo.date.split("T")[0],
      value: 1, // Represents 1 active event
      detail: e.title,
      category: e.categories[0]?.title || "Unknown"
    };
  }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Aggregate stats by category for variety
  const cats = {};
  timeSeries.forEach(t => {
    cats[t.category] = (cats[t.category] || 0) + 1;
  });

  const topCategory = Object.keys(cats).sort((a,b) => cats[b] - cats[a])[0] || "None";

  return {
    timeSeries,
    stats: {
      total: events.length,
      top_type: topCategory,
      status: status
    },
    dataSource: "NASA Earth Observatory (EONET)"
  };
}
