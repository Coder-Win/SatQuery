import { format, subDays } from "date-fns";

export async function fetchNASAPower({ coordinates, startDate, endDate }) {
  const { lat, lon } = coordinates;
  
  // Parameter ALLSKY_SFC_SW_DWN = All Sky Surface Shortwave Downward Irradiance (Solar Radiation)
  const params = "ALLSKY_SFC_SW_DWN";

  // NASA POWER requires compact date format YYYYMMDD
  const formatPowerDate = (dateStr) => dateStr.replace(/-/g, "");

  const sDate = startDate ? formatPowerDate(startDate) : format(subDays(new Date(), 365), "yyyyMMdd");
  const eDate = endDate ? formatPowerDate(endDate) : format(subDays(new Date(), 5), "yyyyMMdd"); // POWER data trails by a few days

  const url = new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
  url.searchParams.append("parameters", params);
  url.searchParams.append("community", "RE"); // Renewable Energy
  url.searchParams.append("longitude", lon);
  url.searchParams.append("latitude", lat);
  url.searchParams.append("start", sDate);
  url.searchParams.append("end", eDate);
  url.searchParams.append("format", "JSON");

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`NASA POWER Network Error: ${response.status}`);
  }

  const payload = await response.json();
  const rawData = payload.properties.parameter[params]; // Object map of "YYYYMMDD": value

  const timeSeries = [];
  let sum = 0;
  let count = 0;
  let max = -Infinity;

  if (rawData) {
    const keys = Object.keys(rawData).sort();

    // Sample down if too large
    const step = Math.ceil(keys.length / 50);

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const val = rawData[key];
        // -999 represents missing data in NASA POWER
        if (val !== -999) {
            if (i % step === 0) {
              // Format key YYYYMMDD back to YYYY-MM-DD
              const formattedDate = `${key.slice(0,4)}-${key.slice(4,6)}-${key.slice(6,8)}`;
              timeSeries.push({ date: formattedDate, value: val });
            }
            sum += val;
            count++;
            if (val > max) max = val;
        }
    }
  }

  const average = count > 0 ? sum / count : 0;

  return {
    timeSeries,
    stats: {
      average: parseFloat(average.toFixed(2)),
      max: max !== -Infinity ? max : 0,
      unit: "kW-hr/m^2/day"
    },
    dataSource: "NASA POWER (Solar Radiation)"
  };
}
