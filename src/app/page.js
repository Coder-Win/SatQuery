"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./page.module.css";
import QueryInput from "@/components/QueryInput";
import Dashboard from "@/components/Dashboard";
import QueryHistory from "@/components/QueryHistory";

const EXAMPLE_QUERIES = [
  "Air quality in Los Angeles",
  "Temperature in London last month",
  "Solar radiation in Arizona",
  "Soil quality in Iowa",
  "Recent earthquakes in Japan"
];

export default function Home() {
  const [queryHistory, setQueryHistory] = useState([]);
  const [activeResult, setActiveResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingStage, setLoadingStage] = useState("");
  const dashboardRef = useRef(null);

  const handleQuery = async (queryText) => {
    setIsLoading(true);
    setError(null);
    setLoadingStage("Parsing your question...");

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed with status ${response.status}`);
      }

      // Read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Try to parse stage updates from SSE-like format
        const lines = chunk.split("\n").filter(Boolean);
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.stage) setLoadingStage(data.stage);
            } catch {
              // Not JSON, skip
            }
          }
        }
      }

      // Parse final result — find the last complete JSON object
      const lastDataLine = fullText
        .split("\n")
        .filter((l) => l.startsWith("data: "))
        .pop();

      if (!lastDataLine) {
        throw new Error("No data received from server");
      }

      const parsedPayload = JSON.parse(lastDataLine.slice(6));

      if (parsedPayload.error) {
        throw new Error(parsedPayload.error);
      }

      const historyEntry = {
        id: Date.now(),
        query: queryText,
        result: parsedPayload.result,
        timestamp: new Date().toISOString(),
      };


      setQueryHistory((prev) => [historyEntry, ...prev]);
      setActiveResult(historyEntry);

      // Scroll to dashboard
      setTimeout(() => {
        dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingStage("");
    }
  };

  return (
    <main className={styles.main}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeDot}></span>
            AI-Powered Earth Observation
          </div>
          <h1 className={styles.title}>
            Query the <span className="gradient-text">Planet</span>
          </h1>
          <p className={styles.subtitle}>
            Ask natural language questions about weather, air quality,
            earthquakes, wildfires, and solar radiation — powered by real
            satellite and environmental data.
          </p>
        </div>

        {/* Query Input */}
        <QueryInput
          onSubmit={handleQuery}
          isLoading={isLoading}
          loadingStage={loadingStage}
        />

        {/* Example Queries */}
        {!activeResult && !isLoading && (
          <div className={styles.examples}>
            <p className={styles.examplesLabel}>Try an example:</p>
            <div className={styles.exampleGrid}>
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  className={styles.exampleChip}
                  onClick={() => handleQuery(q)}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className={styles.errorCard}>
            <span className={styles.errorIcon}>⚠</span>
            <div>
              <strong>Something went wrong</strong>
              <p>{error}</p>
            </div>
            <button
              className={styles.errorDismiss}
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}
      </section>

      {/* Dashboard */}
      {activeResult && (
        <section ref={dashboardRef} className={styles.dashboardSection}>
          <Dashboard data={activeResult} />
        </section>
      )}

      {/* Query History Sidebar */}
      {queryHistory.length > 0 && (
        <QueryHistory
          history={queryHistory}
          activeId={activeResult?.id}
          onSelect={(entry) => setActiveResult(entry)}
        />
      )}
    </main>
  );
}
