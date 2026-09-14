import * as ExcelJS from 'exceljs';

// Shared CSV/XLSX export + import plumbing used by every "reference data"
// module that offers an Export/Import toolbar (Trolleys, Trolley
// Categories, Trolley Types, Charger Areas, Parking Areas, Production
// Locations, Warehouse Locations). Each module still owns its own column
// mapping and validation (by reusing its existing Create/Update use-cases
// for the actual writes) — this file only knows how to turn rows into a
// file and a file back into rows.

export interface ExportColumn<T> {
  header: string;
  key: keyof T & string;
}

export async function buildXlsxBuffer<T extends object>(
  sheetName: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: 24,
  }));
  sheet.getRow(1).font = { bold: true };
  for (const row of rows) {
    const source = row as Record<string, unknown>;
    const record: Record<string, unknown> = {};
    for (const column of columns) {
      record[column.key] = source[column.key] ?? '';
    }
    sheet.addRow(record);
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

// Safe stringification for values coming out of either a DB row (string,
// number, boolean, Date) or an ExcelJS cell (which can also be a formula
// result, hyperlink, or rich-text object) — never a plain `String(value)`
// on something that could be a bare object, which would just print
// "[object Object]".
function valueToString(value: unknown): string {
  if (value == null) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.text === 'string') return record.text;
    if ('result' in record) return valueToString(record.result);
    if (Array.isArray(record.richText)) {
      return (record.richText as { text?: string }[])
        .map((part) => part.text ?? '')
        .join('');
    }
  }
  return '';
}

function escapeCsvCell(value: unknown): string {
  const text = valueToString(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsvBuffer<T extends object>(
  columns: ExportColumn<T>[],
  rows: T[],
): Buffer {
  const header = columns.map((column) => escapeCsvCell(column.header));
  const lines = rows.map((row) => {
    const source = row as Record<string, unknown>;
    return columns.map((column) => escapeCsvCell(source[column.key])).join(',');
  });
  // Leading BOM so Excel opens UTF-8 content (non-ASCII names, etc.)
  // correctly — String.fromCharCode avoids embedding the literal BOM byte
  // in this source file, which some editors/linters flag as stray
  // whitespace.
  const bom = String.fromCharCode(0xfeff);
  const csv = `${bom}${[header.join(','), ...lines].join('\r\n')}`;
  return Buffer.from(csv, 'utf-8');
}

export interface ParsedImportRow {
  // 1-based, matching the row number a user would see in Excel (header is
  // row 1) — used to report exactly which row a given import error came from.
  rowNumber: number;
  values: Record<string, string>;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

// Detects CSV vs XLSX from the uploaded filename and parses either into the
// same shape — every non-empty row (at least one non-blank cell), keyed by
// the header text found in row 1, trimmed.
export async function parseImportFile(
  buffer: Buffer,
  originalName: string,
): Promise<ParsedImportRow[]> {
  const isXlsx = /\.xlsx$/i.test(originalName);

  if (isXlsx) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];

    const headers: string[] = [];
    sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
      headers[colNumber - 1] = valueToString(cell.value).trim();
    });

    const rows: ParsedImportRow[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      const values: Record<string, string> = {};
      let hasValue = false;
      headers.forEach((header, idx) => {
        if (!header) return;
        const cell = row.getCell(idx + 1);
        const value = valueToString(cell.value).trim();
        values[header] = value;
        if (value !== '') hasValue = true;
      });
      if (hasValue) rows.push({ rowNumber: r, values });
    }
    return rows;
  }

  const rawText = buffer.toString('utf-8');
  const text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  const lines = text.split(/\r\n|\n/).filter((line) => line.length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  const rows: ParsedImportRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const values: Record<string, string> = {};
    let hasValue = false;
    headers.forEach((header, idx) => {
      const value = (cells[idx] ?? '').trim();
      values[header] = value;
      if (value !== '') hasValue = true;
    });
    if (hasValue) rows.push({ rowNumber: i + 1, values });
  }
  return rows;
}

export interface ImportSummary {
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errors: { rowNumber: number; error: string }[];
}

// Runs `handler` once per parsed row, tallying created/updated/failed —
// one row's failure doesn't stop the rest of the file from being processed.
export async function runImport(
  rows: ParsedImportRow[],
  handler: (values: Record<string, string>) => Promise<'created' | 'updated'>,
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalRows: rows.length,
    created: 0,
    updated: 0,
    failed: 0,
    errors: [],
  };
  for (const row of rows) {
    try {
      const result = await handler(row.values);
      if (result === 'created') summary.created += 1;
      else summary.updated += 1;
    } catch (error) {
      summary.failed += 1;
      summary.errors.push({
        rowNumber: row.rowNumber,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  return summary;
}
