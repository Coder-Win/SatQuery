import Database from "better-sqlite3";
import path from "path";

// Initialize SQLite database at the root of the project (gitignored recommended)
const dbPath = path.resolve(process.cwd(), "satquery_cache.db");
const db = new Database(dbPath);

// Initialize schema if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS cache (
    query_hash TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

export function getCachedResult(queryHash) {
  // Return cached result if it's less than 24 hours old
  const stmt = db.prepare(`
    SELECT payload 
    FROM cache 
    WHERE query_hash = ? 
      AND timestamp >= datetime('now', '-24 hours')
  `);
  const row = stmt.get(queryHash);
  if (row) {
    return JSON.parse(row.payload);
  }
  return null;
}

export function setCachedResult(queryHash, payload) {
  const stmt = db.prepare(`
    INSERT INTO cache (query_hash, payload, timestamp) 
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(query_hash) DO UPDATE SET 
      payload = excluded.payload,
      timestamp = datetime('now')
  `);
  stmt.run(queryHash, JSON.stringify(payload));
}
