/**
 * Geocoding Service using OpenStreetMap Nominatim API
 * Translates location strings (e.g., "Paris", "Amazon Rainforest", "California") 
 * into geographic bounding boxes and coordinate centroids.
 */

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeLocation(locationString) {
  if (!locationString || locationString.toLowerCase() === "global") {
    // If no location, assume global scope (used for some planetary queries)
    return {
      name: "Global",
      lat: 0,
      lon: 0,
      bbox: [-180, -90, 180, 90]
    };
  }

  // Build the URL with required User-Agent
  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.append("q", locationString);
  url.searchParams.append("format", "json");
  url.searchParams.append("limit", "1");
  url.searchParams.append("addressdetails", "1");

  try {
    const response = await fetch(url, {
      headers: {
        // Nominatim policy requires a valid User-Agent
        "User-Agent": "SatQuery/1.0 (Earth Observation Dashboard)",
        "Accept-Language": "en-US,en"
      }
    });

    if (!response.ok) {
      throw new Error(`Geocoding HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`Location not found: "${locationString}"`);
    }

    const match = data[0];
    
    // Parse bounding box [minLat, maxLat, minLon, maxLon] -> to standard GeoJSON BBox: 
    // [minLon, minLat, maxLon, maxLat]
    const rawBbox = match.boundingbox;
    const bbox = [
      parseFloat(rawBbox[2]), // minLon
      parseFloat(rawBbox[0]), // minLat
      parseFloat(rawBbox[3]), // maxLon
      parseFloat(rawBbox[1])  // maxLat
    ];

    return {
      name: match.display_name,
      lat: parseFloat(match.lat),
      lon: parseFloat(match.lon),
      bbox,
      countryCode: match.address?.country_code?.toLowerCase() || null
    };
  } catch (error) {
    console.error("Geocoding Error:", error);
    throw new Error(`Failed to geocode location: ${error.message}`);
  }
}
