import { GoogleGenAI, Type } from "@google/genai";

// Initialize using the API key from .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Retry helper with exponential backoff for handling rate limits and temporary failures
 */
async function retryWithBackoff(fn, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a retryable error (503, 429, or network issues)
      const isRetryable = 
        error?.message?.includes('503') ||
        error?.message?.includes('429') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.message?.includes('high demand') ||
        error?.message?.includes('RESOURCE_EXHAUSTED');
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Gemini API retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Extracts intent from the user's natural language query using Structured Outputs.
 */
export async function extractIntent(queryText) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      location: {
        type: Type.STRING,
        description: "The targeted geographic location (e.g., 'London')."
      },
      targetAPI: {
        type: Type.STRING,
        enum: ["OPEN_METEO", "NASA_EONET", "USGS_EARTHQUAKE", "NASA_POWER", "WORLD_BANK", "MARINE", "WATER", "SOIL", "ATMOSPHERE"],
        description: "CRITICAL ROUTING: OPEN_METEO for weather/AQ. NASA_EONET for wildfires. USGS_EARTHQUAKE for seismic. NASA_POWER for solar. WORLD_BANK for socioeconomic/large-scale environment (forest distribution/coverage, urban density, agriculture, population). MARINE for ocean waves. WATER for rivers/floods/streamflow. SOIL for soil quality/properties. ATMOSPHERE for CO2/CH4/greenhouse gases."
      },
      metric: {
        type: Type.STRING,
        description: "The specific metric the user wants (e.g. 'Air Quality', 'Urban Coverage', 'Forest Distribution')"
      },
      startDate: { type: Type.STRING },
      endDate: { type: Type.STRING }
    },
    required: ["location", "targetAPI", "metric"]
  };

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the user's Earth observation query. Extract the parameters accurately.\nQuery: "${queryText}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.1,
      }
    });

    return JSON.parse(response.text);
  });
}

/**
 * Generates a human-readable inference based on the gathered data statistics,
 * returns custom tailored metrics.
 */
export async function generateInsight(queryText, dataContext) {
  const schema = {
    type: Type.OBJECT,
    properties: {
      insightText: {
        type: Type.STRING,
        description: "A concise, insightful 2-paragraph summary resolving their query using the raw data."
      },
      customStats: {
        type: Type.OBJECT,
        description: "Exactly 4 highly contextual mathematical insights. Key is a 2-3 word metric name describing the analytic, Value is the stringified number (e.g., {'Peak Wave': '3.2m', 'Calculated Coverage Area': '98 sq km', '10-Year Growth': '+14%'})."
      }
    },
    required: ["insightText", "customStats"]
  };

  const prompt = `
    You are an expert Earth Observation Scientist. 
    The user asked: "${queryText}"
    
    Here is the aggregated data retrieved from satellite/environmental APIs: 
    ${JSON.stringify(dataContext)}
    
    Using this data, output a JSON object adhering exactly to the supplied schema.
    For 'insightText', do not say 'Based on the JSON data'. Speak directly to the user about planetary conditions! Keep it extremely readable and engaging.
  `;

  return retryWithBackoff(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.4
      }
    });

    return JSON.parse(response.text);
  });
}
