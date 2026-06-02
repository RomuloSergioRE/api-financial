import { parse as csvParse } from 'csv-parse/sync';
import { stringify as csvStringify } from 'csv-stringify/sync';
import type { Response } from 'express';

export type CsvRow = Record<string, string>;

export interface ParseOptions {
  columns?: boolean | string[];
  delimiter?: string;
  skipEmptyLines?: boolean;
  trim?: boolean;
}

export function parseCSV(input: Buffer | string, options: ParseOptions = {}): CsvRow[] {
  return csvParse(input, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    ...options,
  }) as unknown as CsvRow[];
}

export interface StringifyColumn {
  key: string;
  header: string;
}

export type StringifyColumns = Array<string | StringifyColumn>;

export function stringifyCSV(rows: CsvRow[], columns: StringifyColumns): string {
  const headerColumns = columns.map(c =>
    typeof c === 'string' ? c : c.header
  );

  return csvStringify(rows, {
    header: true,
    columns: headerColumns,
  });
}

export function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export function detectColumns(headers: string[]): string[] {
  return headers.map(normalizeHeader);
}

export function setCsvHeaders(res: Response, filename: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
}
