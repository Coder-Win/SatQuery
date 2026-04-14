import { extractIntent, generateInsight } from "@/lib/ai-router";
import { geocodeLocation } from "@/lib/geocoder";
import { getCachedResult, setCachedResult } from "@/lib/db";
import { fetchOpenMeteoData } from "@/lib/fetchers/open-meteo";
import { fetchNASAEonet } from "@/lib/fetchers/nasa-eonet";
import { fetchUSGSEarthquakes } from "@/lib/fetchers/usgs-earthquake";
import { fetchNASAPower } from "@/lib/fetchers/nasa-power";
import { fetchWorldBankData } from "@/lib/fetchers/worldbank";
import { fetchOpenMeteoMarine } from "@/lib/fetchers/om-marine";
import { fetchUSGSWater } from "@/lib/fetchers/usgs-water";
import { fetchISRICSoil } from "@/lib/fetchers/isric-soil";
import { fetchNOAAGML } from "@/lib/fetchers/noaa-gml";
import crypto from "crypto";

export async function POST(req) {
  const { query } = await req.json();

  if (!query) {
    return Response.json({ error: "Query is required" }, { status: 400 });
  }

  // Create an SSE stream exactly matching standard streaming mechanisms
  const stream = new ReadableStream({
    async start(controller) {
      const sendStage = (msg) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ stage: msg })}\n\n`));
      };
      
      const sendResult = (data) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ result: data })}\n\n`));
        controller.close();
      };
      
      const sendError = (err) => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: err })}\n\n`));
        controller.close();
      };

      try {
        // Fast Cache Check BEFORE expensive operations
        const queryHash = crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
        const cachedPayload = getCachedResult(queryHash);
        
        if (cachedPayload) {
          sendStage("Retrieved from planetary cache in 15ms...");
          cachedPayload.cached = true;
          return sendResult(cachedPayload);
        }

        // Step 1: Extract Intent
        sendStage("Analyzing query intent...");
        const intent = await extractIntent(query);
        console.log("Extracted Intent:", intent);

        // Step 2: Geocoding
        sendStage(`Locating ${intent.location || 'globally'}...`);
        const geoInfo = await geocodeLocation(intent.location);

        // Step 3: Fetch Data Strategy
        sendStage(`Fetching real-time ${intent.metric} data...`);
        let dataPack = null;
        const fetchParams = {
          coordinates: { lat: geoInfo.lat, lon: geoInfo.lon },
          bbox: geoInfo.bbox,
          startDate: intent.startDate,
          endDate: intent.endDate,
          metricString: intent.metric
        };

        if (intent.targetAPI === "OPEN_METEO") {
          dataPack = await fetchOpenMeteoData(fetchParams);
        } else if (intent.targetAPI === "NASA_EONET") {
          dataPack = await fetchNASAEonet(geoInfo.bbox, "all");
        } else if (intent.targetAPI === "USGS_EARTHQUAKE") {
          dataPack = await fetchUSGSEarthquakes(fetchParams);
        } else if (intent.targetAPI === "NASA_POWER") {
          dataPack = await fetchNASAPower(fetchParams);
        } else if (intent.targetAPI === "WORLD_BANK") {
          dataPack = await fetchWorldBankData(intent, geoInfo);
        } else if (intent.targetAPI === "MARINE") {
          dataPack = await fetchOpenMeteoMarine(intent, geoInfo);
        } else if (intent.targetAPI === "WATER") {
          dataPack = await fetchUSGSWater(fetchParams);
        } else if (intent.targetAPI === "SOIL") {
          dataPack = await fetchISRICSoil(fetchParams);
        } else if (intent.targetAPI === "ATMOSPHERE") {
          dataPack = await fetchNOAAGML(fetchParams);
        } else {
          // Fallback to METEO 
          dataPack = await fetchOpenMeteoData(fetchParams);
        }

        // Step 4: Generate Insight & Custom Stats
        sendStage("Generating scientific insights & metrics...");
        const insightContext = {
          location: geoInfo.name,
          metric: intent.metric,
          dataPackOverview: dataPack.timeSeries.filter((_, i) => i % Math.max(1, Math.floor(dataPack.timeSeries.length / 20)) === 0) 
        };
        const insightJson = await generateInsight(query, insightContext);

        // Create Final Payload
        const finalPayload = {
          query,
          location: geoInfo.name,
          metric: intent.metric,
          insight: insightJson.insightText,
          timeSeries: dataPack.timeSeries || [],
          stats: insightJson.customStats,
          bbox: geoInfo.bbox,
          coordinates: { lat: geoInfo.lat, lon: geoInfo.lon },
          dataSource: dataPack.dataSource,
          dateRange: { 
            start: intent.startDate || "Default (30d/1yr ago)", 
            end: intent.endDate || "Today" 
          },
          cached: false
        };

        // Cache the result for next time
        setCachedResult(queryHash, finalPayload);

        // Send Final Result
        sendResult(finalPayload);

      } catch (error) {
        console.error("Pipeline Error:", error);
        sendError(error.message || "An internal error occurred during orchestration.");
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}
