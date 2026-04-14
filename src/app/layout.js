import "./globals.css";

export const metadata = {
  title: "SatQuery — Earth Observation Intelligence",
  description:
    "Ask natural language questions about environmental, atmospheric, and planetary conditions. Powered by satellite data and AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
