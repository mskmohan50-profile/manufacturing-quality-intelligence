import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProductionRecord, DashboardKPIs } from '@/types';

export function exportPDFReport(
  records: ProductionRecord[],
  kpis: DashboardKPIs,
  fileName: string = 'production-report.pdf'
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Manufacturing Quality Intelligence Report', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Performance Indicators', 14, 42);

  autoTable(doc, {
    startY: 46,
    head: [['Metric', 'Value']],
    body: [
      ['Total Production Records', String(kpis.totalRecords)],
      ['Accepted Parts', String(kpis.acceptedParts)],
      ['Rejected Parts', String(kpis.rejectedParts)],
      ['Yield Percentage', `${kpis.yieldPercentage.toFixed(2)}%`],
      ['Average Cycle Time (sec)', kpis.avgCycleTime.toFixed(2)],
      ['Machine Count', String(kpis.machineCount)],
      ['Operator Count', String(kpis.operatorCount)],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    styles: { fontSize: 9 },
  });

  const shiftEntries = Object.entries(kpis.shiftSummary);
  if (shiftEntries.length > 0) {
    const afterY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Shift Summary', 14, afterY);
    autoTable(doc, {
      startY: afterY + 4,
      head: [['Shift', 'Record Count']],
      body: shiftEntries.map(([shift, count]) => [shift, String(count)]),
      theme: 'striped',
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      styles: { fontSize: 9 },
    });
  }

  const afterShiftY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Production Records (first 50 rows)', 14, afterShiftY);

  const tableData = records.slice(0, 50).map((r) => [
    r.production_date,
    r.machine_id,
    r.operator,
    r.shift,
    r.product,
    r.batch,
    r.cycle_time_sec.toFixed(1),
    r.status,
  ]);

  autoTable(doc, {
    startY: afterShiftY + 4,
    head: [['Date', 'Machine', 'Operator', 'Shift', 'Product', 'Batch', 'Cycle (s)', 'Status']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 7 },
    styles: { fontSize: 7, cellPadding: 1.5 },
  });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Qeltrava AI - Manufacturing Quality Intelligence  |  Page ${i} of ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(fileName);
}
