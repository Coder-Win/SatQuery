/**
 * AI Router - Tries Gemini first, falls back to Ollama on rate limits
 * Provides seamless switching between cloud and local AI
 */

import * as gemini from "./gemini.js";
import * as ollama from "./ollama.js";

const USE_OLLAMA_FALLBACK = process.env.USE_OLLAMA_FALLBACK !== "false";
const PREFER_OLLAMA = process.env.PREFER_OLLAMA === "true";

/**
 * Try a function with automatic fallback to alternative provider
 */
async function tryWithFallback(geminiFunc, ollamaFunc, functionName, ...args) {
  // If user prefers Ollama, try it first
  if (PREFER_OLLAMA) {
    try {
      console.log(`🟢 [${functionName}] Using Ollama (preferred)...`);
      const result = await ollamaFunc(...args);
      console.log(`✅ [${functionName}] Ollama succeeded`);
      return { result, provider: "ollama" };
    } catch (error) {
      console.log(`⚠️ [${functionName}] Ollama failed: ${error.message}`);
      console.log(`🔵 [${functionName}] Falling back to Gemini...`);
      
      try {
        const result = await geminiFunc(...args);
        console.log(`✅ [${functionName}] Gemini succeeded`);
        return { result, provider: "gemini" };
      } catch (geminiError) {
        console.error(`❌ [${functionName}] Both providers failed`);
        throw new Error(`Both AI providers failed. Ollama: ${error.message}, Gemini: ${geminiError.message}`);
      }
    }
  }
  
  // Default: Try Gemini first
  try {
    console.log(`🔵 [${functionName}] Trying Gemini...`);
    const result = await geminiFunc(...args);
    console.log(`✅ [${functionName}] Gemini succeeded`);
    return { result, provider: "gemini" };
  } catch (error) {
    console.log(`⚠️ [${functionName}] Gemini failed: ${error.message}`);
    
    // Check if it's a rate limit or availability error
    const isRateLimit = 
      error?.message?.includes('429') ||
      error?.message?.includes('503') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('UNAVAILABLE') ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('quota');
    
    if (isRateLimit && USE_OLLAMA_FALLBACK) {
      console.log(`🟢 [${functionName}] Falling back to Ollama...`);
      try {
        const result = await ollamaFunc(...args);
        console.log(`✅ [${functionName}] Ollama succeeded`);
        return { result, provider: "ollama" };
      } catch (ollamaError) {
        console.error(`❌ [${functionName}] Ollama also failed: ${ollamaError.message}`);
        throw new Error(`Both AI providers failed. Gemini: ${error.message}, Ollama: ${ollamaError.message}`);
      }
    }
    
    // If not rate limit or fallback disabled, throw original error
    throw error;
  }
}

/**
 * Extract intent from user query
 * Tries Gemini first, falls back to Ollama on rate limit
 */
export async function extractIntent(queryText) {
  const { result, provider } = await tryWithFallback(
    gemini.extractIntent,
    ollama.extractIntent,
    "extractIntent",
    queryText
  );
  
  // Add provider info to result for debugging
  result._aiProvider = provider;
  return result;
}

/**
 * Generate insight from data
 * Tries Gemini first, falls back to Ollama on rate limit
 */
export async function generateInsight(queryText, dataContext) {
  const { result, provider } = await tryWithFallback(
    gemini.generateInsight,
    ollama.generateInsight,
    "generateInsight",
    queryText,
    dataContext
  );
  
  // Add provider info to result for debugging
  result._aiProvider = provider;
  return result;
}

/**
 * Check availability of both AI providers
 */
export async function checkProviders() {
  const status = {
    gemini: { available: false, error: null },
    ollama: { available: false, error: null }
  };
  
  // Check Gemini
  try {
    if (process.env.GEMINI_API_KEY) {
      status.gemini.available = true;
    } else {
      status.gemini.error = "GEMINI_API_KEY not set";
    }
  } catch (error) {
    status.gemini.error = error.message;
  }
  
  // Check Ollama
  try {
    const ollamaStatus = await ollama.checkOllamaAvailability();
    status.ollama = ollamaStatus;
  } catch (error) {
    status.ollama.error = error.message;
  }
  
  return status;
}
