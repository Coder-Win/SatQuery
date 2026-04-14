/**
 * ISRIC SoilGrids API
 * Global soil property data at 250m resolution
 * Covers: pH, organic carbon, texture, bulk density, nutrients
 */

export async function fetchISRICSoil({ coordinates }) {
  const { lat, lon } = coordinates;
  
  try {
    // SoilGrids REST API endpoint
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon}&lat=${lat}&property=phh2o&property=soc&property=clay&property=sand&property=nitrogen&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 404) {
        return {
          timeSeries: [],
          stats: { message: "No soil data available for this location (may be ocean or unmapped area)" },
          dataSource: "ISRIC SoilGrids"
        };
      }
      throw new Error(`ISRIC API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.properties || !data.properties.layers) {
      throw new Error("Invalid response from ISRIC API");
    }
    
    // Process soil properties
    const layers = data.properties.layers;
    const soilMetrics = {};
    
    layers.forEach(layer => {
      const propName = layer.name;
      const unit = layer.unit_measure?.mapped_units || "";
      
      // Get surface layer (0-5cm) value
      const surfaceDepth = layer.depths.find(d => d.label === "0-5cm");
      if (surfaceDepth && surfaceDepth.values) {
        const value = surfaceDepth.values.mean;
        
        // Convert to readable format
        let displayValue = value;
        let displayName = propName;
        
        switch(propName) {
          case "phh2o":
            displayValue = (value / 10).toFixed(1); // Convert to pH scale
            displayName = "Soil pH";
            break;
          case "soc":
            displayValue = (value / 10).toFixed(1); // Convert to g/kg
            displayName = "Organic Carbon";
            break;
          case "clay":
            displayValue = (value / 10).toFixed(1); // Convert to %
            displayName = "Clay Content";
            break;
          case "sand":
            displayValue = (value / 10).toFixed(1); // Convert to %
            displayName = "Sand Content";
            break;
          case "nitrogen":
            displayValue = (value / 100).toFixed(2); // Convert to g/kg
            displayName = "Nitrogen";
            break;
        }
        
        soilMetrics[displayName] = {
          value: parseFloat(displayValue),
          unit: unit,
          depth: "0-5cm (surface)"
        };
      }
    });
    
    // Create a synthetic time series (soil data is static, not temporal)
    // We'll show it as a single point with today's date
    const today = new Date().toISOString().split('T')[0];
    const timeSeries = Object.entries(soilMetrics).map(([name, data]) => ({
      date: today,
      value: data.value,
      detail: `${name} (${data.unit})`
    }));
    
    // Soil quality assessment
    const ph = soilMetrics["Soil pH"]?.value || 7;
    const organicCarbon = soilMetrics["Organic Carbon"]?.value || 0;
    
    let quality = "Unknown";
    if (ph >= 6 && ph <= 7.5 && organicCarbon > 10) {
      quality = "Excellent";
    } else if (ph >= 5.5 && ph <= 8 && organicCarbon > 5) {
      quality = "Good";
    } else if (ph >= 5 && ph <= 8.5) {
      quality = "Fair";
    } else {
      quality = "Poor";
    }
    
    return {
      timeSeries,
      stats: {
        ...Object.fromEntries(
          Object.entries(soilMetrics).map(([name, data]) => [
            name.replace(/\s+/g, '_').toLowerCase(),
            `${data.value} ${data.unit}`
          ])
        ),
        soil_quality: quality,
        location: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
      },
      dataSource: "ISRIC SoilGrids (250m resolution)"
    };
    
  } catch (error) {
    console.error("ISRIC Soil API Error:", error);
    throw new Error(`ISRIC SoilGrids error: ${error.message}`);
  }
}
