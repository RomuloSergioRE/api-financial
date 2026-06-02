import PDFDocument from 'pdfkit';

export const COLORS = {
  primary: '#1f2937',
  secondary: '#6b7280',
  accent: '#10b981',
  danger: '#ef4444',
  border: '#e5e7eb',
  text: '#111827',
} as const;

export function formatCurrencyCents(cents: number): string {
  const value = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

export interface PdfHeaderOptions {
  title: string;
  subtitle?: string;
}

export function addPdfHeader(doc: PDFKit.PDFDocument, opts: PdfHeaderOptions): void {
  doc
    .fontSize(20)
    .fillColor(COLORS.primary)
    .font('Helvetica-Bold')
    .text(opts.title, { align: 'left' });

  if (opts.subtitle) {
    doc
      .fontSize(10)
      .fillColor(COLORS.secondary)
      .font('Helvetica')
      .text(opts.subtitle, { align: 'left' });
  }

  doc.moveDown(0.5);
  doc
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .moveTo(doc.x, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.5);
}

export function addPdfFooter(doc: PDFKit.PDFDocument, page: number, total: number): void {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const bottom = doc.page.height - doc.page.margins.bottom + 10;
    doc
      .fontSize(8)
      .fillColor(COLORS.secondary)
      .font('Helvetica')
      .text(
        `Page ${i - range.start + 1} of ${range.count}`,
        doc.page.margins.left,
        bottom,
        { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
      );
  }
}

export interface TableColumn {
  key: string;
  header: string;
  width: number;
  align?: 'left' | 'right' | 'center';
}

export function renderTable(
  doc: PDFKit.PDFDocument,
  columns: TableColumn[],
  rows: Array<Record<string, string | number>>,
  startY?: number
): void {
  const startX = doc.page.margins.left;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const totalWidth = columns.reduce((s, c) => s + c.width, 0);
  const scale = pageWidth / totalWidth;
  const colWidths = columns.map(c => c.width * scale);

  const tableTop = startY ?? doc.y;
  const rowHeight = 18;

  doc.font('Helvetica-Bold').fontSize(9).fillColor(COLORS.primary);
  let x = startX;
  columns.forEach((c, i) => {
    doc.text(c.header, x + 4, tableTop + 4, {
      width: (colWidths[i] ?? 0) - 8,
      align: c.align ?? 'left',
      lineBreak: false,
    });
    x += colWidths[i] ?? 0;
  });

  doc
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .moveTo(startX, tableTop + rowHeight)
    .lineTo(startX + pageWidth, tableTop + rowHeight)
    .stroke();

  doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);
  let y = tableTop + rowHeight;
  rows.forEach((row, rowIdx) => {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom - 20) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    if (rowIdx % 2 === 0) {
      doc
        .save()
        .fillColor('#f9fafb')
        .rect(startX, y, pageWidth, rowHeight)
        .fill()
        .restore();
    }
    x = startX;
    columns.forEach((c, i) => {
      const cellValue = String(row[c.key] ?? '');
      doc.text(cellValue, x + 4, y + 4, {
        width: (colWidths[i] ?? 0) - 8,
        align: c.align ?? 'left',
        lineBreak: false,
      });
      x += colWidths[i] ?? 0;
    });
    y += rowHeight;
  });

  doc.y = y + 4;
}

export interface PdfResult {
  buffer: Buffer;
  filename: string;
}

export function buildPdf(
  setup: (doc: PDFKit.PDFDocument) => Promise<void> | void,
  filename: string
): Promise<PdfResult> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve({ buffer: Buffer.concat(chunks), filename }));
    doc.on('error', reject);

    Promise.resolve(setup(doc))
      .then(() => {
        addPdfFooter(doc, 1, 1);
        doc.end();
      })
      .catch(reject);
  });
}
