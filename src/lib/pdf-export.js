import jsPDF from "jspdf";
import "jspdf-autotable";

/**
 * Generates a professional white-background PDF report
 * containing the original query, the AI Insight, summarized stats,
 * and the entire data payload tabulated nicely.
 */
export function exportToPDF(resultData) {
  const { query, location, metric, insight, stats, timeSeries, dataSource, dateRange } = resultData;
  const doc = new jsPDF();

  // 1. Header
  doc.setFontSize(22);
  doc.setTextColor(33, 37, 41);
  doc.text("SatQuery Earth Observation Report", 14, 20);

  doc.setFontSize(11);
  doc.setTextColor(108, 117, 125); // muted gray
  const reportDate = new Date().toLocaleString();
  doc.text(`Generated exactly at: ${reportDate}`, 14, 28);
  
  doc.line(14, 32, 196, 32);

  // 2. Query Details
  doc.setFontSize(12);
  doc.setTextColor(33, 37, 41);
  let startY = 40;
  
  doc.setFont("helvetica", "bold");
  doc.text("Original Query:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(query, 50, startY);

  startY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Location Resolved:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(location || "Global Coordinates", 50, startY);

  startY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Metric Modeled:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(metric || "N/A", 50, startY);

  startY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Period Selected:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(`${dateRange?.start} to ${dateRange?.end}`, 50, startY);

  startY += 8;
  doc.setFont("helvetica", "bold");
  doc.text("Data Source:", 14, startY);
  doc.setFont("helvetica", "normal");
  doc.text(dataSource || "Multiple SAT/API", 50, startY);

  // 3. AI Scientific Insight
  startY += 12;
  doc.setFillColor(248, 249, 250); // slight gray bg
  doc.rect(14, startY, 182, 45, 'F');
  
  doc.setFontSize(14);
  doc.setTextColor(33, 37, 41);
  doc.setFont("helvetica", "bold");
  doc.text("Scientific Insight Summary", 18, startY + 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  // split text to fit standard A4 width
  const splitInsight = doc.splitTextToSize(insight || "No insight generated.", 174);
  doc.text(splitInsight, 18, startY + 16);

  // Predict new Y after insight paragraph
  startY += 18 + (splitInsight.length * 5); // Rough sizing

  // 4. Statistics Grid
  if (stats) {
    const statKeys = Object.keys(stats);
    if (statKeys.length > 0) {
      startY += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Aggregated Statistics", 14, startY);
      
      const statBody = [statKeys.map(k => stats[k].toString())];
      doc.autoTable({
        startY: startY + 4,
        head: [statKeys.map(k => k.toUpperCase())],
        body: statBody,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
      });
      startY = doc.lastAutoTable.finalY + 10;
    }
  }

  // 5. Data Points (Time Series Data) as Table
  if (timeSeries && timeSeries.length > 0) {
    // If we're off the page
    if (startY > 250) {
      doc.addPage();
      startY = 20;
    }

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Complete Time-Series Data Points", 14, startY);
    
    // Formatting for the autoTable
    const tableHeaders = [["Date", "Value", "Additional Detail"]];
    const tableBody = timeSeries.map(ts => [
      ts.date || "N/A", 
      ts.value?.toString() || "N/A", 
      ts.detail || ts.category || "-"
    ]);

    doc.autoTable({
      startY: startY + 4,
      head: tableHeaders,
      body: tableBody,
    });
  }

  // Generate strict, simple filename
  let cleanName = "Data";
  if (location) {
    cleanName = location.split(",")[0].replace(/[^a-zA-Z0-9]/g, '');
  }
  
  // Use simple save. Browsers respect explicit strings without template literals better.
  try {
    doc.save(`SatQuery_${cleanName}.pdf`);
  } catch (e) {
    // Ultimate fallback if location string is completely corrupted
    doc.save("SatQuery_Report.pdf");
  }
}
