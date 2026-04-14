# SatQuery

Natural language interface for Earth observation data. Ask questions about weather, earthquakes, soil, water, and more.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local`:

```env
GEMINI_API_KEY=your_key_here
```

Get a free key at https://aistudio.google.com/

### Optional: Ollama (No Rate Limits)

Install Ollama from https://ollama.com/download

```bash
ollama pull qwen2.5:7b
```

Add to `.env.local`:

```env
USE_OLLAMA_FALLBACK=true
OLLAMA_MODEL=qwen2.5:7b
```

## Data Sources

- Open-Meteo (Weather, Air Quality, Marine)
- USGS (Earthquakes, Water Levels)
- NASA (EONET Events, Solar Radiation)
- NOAA (Greenhouse Gases)
- ISRIC (Soil Properties)
- World Bank (Socioeconomic Data)

All APIs are free and require no authentication.

## Example Queries

- "Air quality in Los Angeles"
- "Recent earthquakes in Japan"
- "Soil quality in Iowa"
- "Mississippi River water level"
- "CO2 levels globally"

## Tech Stack

- Next.js 15
- React 19
- Gemini AI + Ollama (fallback)
- Recharts
- React-Leaflet
- SQLite

## License

MIT
