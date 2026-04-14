/**
 * Ollama AI functions (local, no rate limits)
 * Drop-in replacement for Gemini functions using Qwen2.5 7B
 */

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:7b";

/**
 * Call Ollama API with retry logic
 */
async function callOllama(prompt, systemPrompt = "", jsonMode = true, temperature = 0.1) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        system: systemPrompt,
        format: jsonMode ? "json" : undefined,
        stream: false,
        options: {
          temperature: temperature,
          top_p: 0.9,
          num_predict: 1024,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    // Check if Ollama is not running
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch failed')) {
      throw new Error('Ollama is not running. Start it with: ollama serve');
    }
    throw error;
  }
}

/**
 * Extracts intent from the user's natural language query
 * Compatible with Gemini's extractIntent function
 */
export async function extractIntent(queryText) {
  const systemPrompt = `You are an Earth observation query parser. Extract location, API route, and metric from user queries.

API Routes (choose ONE that best matches):
- OPEN_METEO: weather, temperature, rain, wind, humidity, air quality, pollution, PM2.5, ozone
- NASA_EONET: wildfires, fires, natural events, storms, volcanoes
- USGS_EARTHQUAKE: earthquakes, seismic activity
- NASA_POWER: solar radiation, solar energy, sunshine
- WORLD_BANK: population, forest coverage, urban, emissions, socioeconomic, deforestation
- MARINE: ocean, waves, sea temperature, tides, currents
- WATER: rivers, floods, water level, discharge, streamflow
- SOIL: soil quality, pH, organic carbon, clay, sand, nitrogen
- ATMOSPHERE: CO2, methane, CH4, greenhouse gases, N2O, carbon dioxide

Rules:
1. Extract the geographic location (city, country, region)
2. Choose the BEST matching targetAPI from the list above
3. Extract the specific metric the user wants
4. Extract dates if mentioned (format: YYYY-MM-DD)
5. Output ONLY valid JSON, no explanations

Required fields: location, targetAPI, metric
Optional fields: startDate, endDate`;

  const prompt = `Query: "${queryText}"

Extract parameters and output JSON:`;

  try {
    const response = await callOllama(prompt, systemPrompt, true, 0.1);
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.location || !parsed.targetAPI || !parsed.metric) {
      throw new Error('Missing required fields in Ollama response');
    }
    
    // Ensure targetAPI is valid
    const validAPIs = ["OPEN_METEO", "NASA_EONET", "USGS_EARTHQUAKE", "NASA_POWER", "WORLD_BANK", "MARINE", "WATER", "SOIL", "ATMOSPHERE"];
    if (!validAPIs.includes(parsed.targetAPI)) {
      console.warn(`Invalid targetAPI from Ollama: ${parsed.targetAPI}, defaulting to OPEN_METEO`);
      parsed.targetAPI = "OPEN_METEO";
    }
    
    return parsed;
  } catch (error) {
    console.error("Ollama extractIntent error:", error);
    throw new Error(`Ollama intent extraction failed: ${error.message}`);
  }
}

/**
 * Generates a human-readable inference based on the gathered data statistics
 * Compatible with Gemini's generateInsight function
 */
export async function generateInsight(queryText, dataContext) {
  const systemPrompt = `You are an expert Earth Observation Scientist. Generate concise, engaging insights from satellite and environmental data.

Guidelines:
1. Write in a direct, engaging style - speak TO the user about planetary conditions
2. Do NOT say "Based on the data" or "According to the JSON" - just state the findings
3. Be scientifically accurate but accessible
4. Focus on trends, patterns, and significance
5. Keep it to 2 paragraphs maximum
6. Output ONLY valid JSON, no explanations`;

  const prompt = `User asked: "${queryText}"

Data retrieved from APIs:
${JSON.stringify(dataContext, null, 2)}

Generate a JSON response with:
1. "insightText": A 2-paragraph scientific summary (engaging, direct, no meta-commentary)
2. "customStats": Exactly 4 key metrics as an object with short names (2-3 words) as keys and stringified values
   Example: {"Peak Value": "42.5 ppm", "Average": "38.2 ppm", "Trend": "+5.2%", "Status": "Moderate"}

Output valid JSON only:`;

  try {
    const response = await callOllama(prompt, systemPrompt, true, 0.4);
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.insightText || !parsed.customStats) {
      throw new Error('Missing required fields in Ollama response');
    }
    
    // Ensure customStats is an object with at least 3 entries
    if (typeof parsed.customStats !== 'object' || Object.keys(parsed.customStats).length < 3) {
      console.warn('Ollama returned invalid customStats, generating fallback');
      parsed.customStats = {
        "Data Points": `${dataContext.dataPackOverview?.length || 0}`,
        "Location": dataContext.location || "Unknown",
        "Metric": dataContext.metric || "Various",
        "Status": "Available"
      };
    }
    
    return parsed;
  } catch (error) {
    console.error("Ollama generateInsight error:", error);
    throw new Error(`Ollama insight generation failed: ${error.message}`);
  }
}

/**
 * Check if Ollama is available and running
 */
export async function checkOllamaAvailability() {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(2000) // 2 second timeout
    });
    
    if (!response.ok) {
      return { available: false, error: `Ollama returned status ${response.status}` };
    }
    
    const data = await response.json();
    const hasModel = data.models?.some(m => m.name.includes('qwen2.5'));
    
    if (!hasModel) {
      return { 
        available: false, 
        error: 'Qwen2.5 model not found. Run: ollama pull qwen2.5:7b' 
      };
    }
    
    return { available: true, models: data.models };
  } catch (error) {
    return { 
      available: false, 
      error: 'Ollama not running. Start with: ollama serve' 
    };
  }
}
