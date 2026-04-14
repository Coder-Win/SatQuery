/**
 * World Bank Open Data API Fetcher
 * Excellent for long-term socio-environmental tracking:
 * e.g., Forest Coverage, Population Density, CO2 Emissions
 */

export async function fetchWorldBankData(intent, geoInfo) {
  const { metric } = intent;
  const iso2 = geoInfo.countryCode;

  if (!iso2) {
    throw new Error("World Bank API requires a country-level geocoded location. Please specify a country (e.g., 'Forest coverage in Brazil').");
  }

  // Map abstract intents to World Bank Indicator Codes
  let indicator = "EN.POP.DNST"; // Default: Pop Density
  let metricName = "Population Density (people per sq. km)";

  if (metric.toLowerCase().includes("forest") || metric.toLowerCase().includes("tree")) {
    indicator = "AG.LND.FRST.K2";
    metricName = "Forest area (sq. km)";
  } else if (metric.toLowerCase().includes("co2") || metric.toLowerCase().includes("emission")) {
    indicator = "EN.ATM.CO2E.KT";
    metricName = "CO2 emissions (kt)";
  } else if (metric.toLowerCase().includes("urban")) {
    indicator = "EN.URB.LCTY";
    metricName = "Population in largest city";
  } else if (metric.toLowerCase().includes("arable") || metric.toLowerCase().includes("farm")) {
    indicator = "AG.LND.ARBL.HA";
    metricName = "Arable land (hectares)";
  }

  // World Bank URL format: http://api.worldbank.org/V2/country/{country}/indicator/{indicator}?format=json
  const url = `https://api.worldbank.org/V2/country/${iso2}/indicator/${indicator}?format=json&per_page=30`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`World Bank HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    if (!data || !data[1] || data[1].length === 0) {
      throw new Error(`No World Bank data found for indicator ${indicator} in country ${iso2}.`);
    }

    // World Bank returns data descending by year. Filter out null values.
    const rawData = data[1].filter(d => d.value !== null);
    
    // Sort ascending for chart flow (oldest to newest)
    const timeSeries = rawData.sort((a, b) => a.date - b.date).map((entry) => ({
      date: entry.date,
      value: parseFloat(entry.value.toFixed(2)),
      detail: metricName
    }));

    if (timeSeries.length === 0) throw new Error("No non-null data recorded for this metric.");

    return {
      timeSeries,
      stats: {}, // Defer to Gemini insight generator for custom metrics
      dataSource: "The World Bank Open Data",
    };
  } catch (error) {
    console.error("World Bank API Error:", error);
    throw new Error(`World Bank API error: ${error.message}`);
  }
}
