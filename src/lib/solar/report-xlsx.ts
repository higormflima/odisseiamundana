import type { ReportEntry, SolarReportDocument } from './report-presentation.ts';
import { plannerDisplayUrl, plannerShareUrl } from './links.ts';

/*
 * Planilha .xlsx sem dependências: um pacote ZIP (sem compressão) com as partes mínimas do
 * formato Office Open XML. Abre no Excel, no Numbers e no Google Planilhas.
 */

type Cell = string | number | { value: string | number; style: CellStyle } | { link: string; text: string } | null;
type CellStyle = 'bold' | 'number' | 'boldNumber' | 'wrap' | 'title';
type Row = Cell[];

const styleIndex: Record<CellStyle, number> = { bold: 1, number: 2, boldNumber: 3, wrap: 4, title: 5 };

interface Sheet {
  name: string;
  columnWidths: number[];
  rows: Row[];
}

const escapeXml = (text: string) => text
  // Remove caracteres de controle que o XML não aceita.
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function columnName(index: number): string {
  let name = '';
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    name = String.fromCharCode(65 + ((value - 1) % 26)) + name;
  }
  return name;
}

function cellXml(cell: Cell, reference: string): string {
  if (cell === null || cell === '') return '';
  if (typeof cell === 'object' && 'link' in cell) {
    const quoted = (text: string) => `"${text.replace(/"/g, '""')}"`;
    return `<c r="${reference}" t="str" s="${styleIndex.bold}"><f>${escapeXml(`HYPERLINK(${quoted(cell.link)},${quoted(cell.text)})`)}</f><v>${escapeXml(cell.text)}</v></c>`;
  }
  const { value, style } = typeof cell === 'object' ? cell : { value: cell, style: undefined };
  const styleAttribute = style ? ` s="${styleIndex[style]}"` : '';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? `<c r="${reference}"${styleAttribute}><v>${value}</v></c>` : '';
  }
  return `<c r="${reference}" t="inlineStr"${styleAttribute}><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`;
}

function sheetXml(sheet: Sheet): string {
  const columns = sheet.columnWidths
    .map((width, index) => `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`)
    .join('');
  const rows = sheet.rows.map((row, rowIndex) => {
    const cells = row.map((cell, columnIndex) => cellXml(cell, `${columnName(columnIndex)}${rowIndex + 1}`)).join('');
    return `<row r="${rowIndex + 1}">${cells}</row>`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>${columns}</cols><sheetData>${rows}</sheetData></worksheet>`;
}

const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="6">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf>
<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

function workbookParts(sheets: Sheet[]): Array<[string, string]> {
  const sheetEntries = sheets.map((sheet, index) =>
    `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
  const sheetRelationships = sheets.map((_, index) =>
    `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
  const sheetOverrides = sheets.map((_, index) =>
    `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
  return [
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheetEntries}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheetRelationships}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', stylesXml],
    ...sheets.map((sheet, index): [string, string] => [`xl/worksheets/sheet${index + 1}.xml`, sheetXml(sheet)]),
  ];
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xEDB88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

/** Monta um ZIP com o método "stored" (sem compressão), suficiente para planilhas pequenas. */
export function createStoredZip(files: Array<[name: string, content: Uint8Array]>): Uint8Array {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;
  // 01/01/2026 00:00 no formato de data/hora do MS-DOS.
  const dosTime = 0;
  const dosDate = ((2026 - 1980) << 9) | (1 << 5) | 1;
  for (const [name, content] of files) {
    const nameBytes = encoder.encode(name);
    const crc = crc32(content);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034B50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true);
    local.setUint16(8, 0, true);
    local.setUint16(10, dosTime, true);
    local.setUint16(12, dosDate, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, content.length, true);
    local.setUint32(22, content.length, true);
    local.setUint16(26, nameBytes.length, true);
    local.setUint16(28, 0, true);
    chunks.push(new Uint8Array(local.buffer), nameBytes, content);

    const central = new DataView(new ArrayBuffer(46));
    central.setUint32(0, 0x02014B50, true);
    central.setUint16(4, 20, true);
    central.setUint16(6, 20, true);
    central.setUint16(8, 0x0800, true);
    central.setUint16(10, 0, true);
    central.setUint16(12, dosTime, true);
    central.setUint16(14, dosDate, true);
    central.setUint32(16, crc, true);
    central.setUint32(20, content.length, true);
    central.setUint32(24, content.length, true);
    central.setUint16(28, nameBytes.length, true);
    central.setUint32(42, offset, true);
    centralDirectory.push(new Uint8Array(central.buffer), nameBytes);
    offset += 30 + nameBytes.length + content.length;
  }
  const centralSize = centralDirectory.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054B50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, centralSize, true);
  end.setUint32(16, offset, true);
  const parts = [...chunks, ...centralDirectory, new Uint8Array(end.buffer)];
  const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let position = 0;
  for (const part of parts) {
    result.set(part, position);
    position += part.length;
  }
  return result;
}

function entryRows(title: string, entries: ReportEntry[]): Row[] {
  if (!entries.length) return [];
  return [
    [{ value: title, style: 'bold' }],
    ...entries.map(([label, value]): Row => [label, { value, style: 'wrap' }]),
    [],
  ];
}

export function createSolarReportWorkbook(report: SolarReportDocument): Uint8Array {
  const summarySheet: Sheet = {
    name: 'Resumo',
    columnWidths: [40, 90],
    rows: [
      [{ value: report.title, style: 'title' }],
      ['Guia básico do sistema elétrico — Odisseia Mundana'],
      ['Gerado no Planejador Elétrico', { link: plannerShareUrl('relatorio-excel'), text: plannerDisplayUrl }],
      [],
      ...entryRows('Identificação', report.identification),
      ...entryRows('Seu sistema em resumo', report.summary.map((metric) => [metric.label, `${metric.value} — ${metric.detail}`])),
      ...entryRows('Banco de baterias estimado', report.battery),
      ...entryRows('Inversor', report.inverter),
      ...entryRows('Energia solar e controlador', report.solar),
      ...(report.warnings.length ? [[{ value: 'Atenção antes de usar os resultados', style: 'bold' }] as Row, ...report.warnings.map((warning): Row => ['', { value: warning, style: 'wrap' }]), []] : []),
      [{ value: 'Premissas e limites', style: 'bold' }],
      ...report.notes.map((note): Row => ['', { value: note, style: 'wrap' }]),
      [],
      ['', { value: report.disclaimer, style: 'wrap' }],
    ],
  };
  const consumptionSheet: Sheet = {
    name: 'Consumo',
    columnWidths: [48, 26, 13, 12, 30, 20],
    rows: [
      ['Equipamento', 'Categoria', 'Alimentação', 'Quantidade', 'Uso por unidade', 'Energia por dia (Wh)']
        .map((header): Cell => ({ value: header, style: 'bold' })),
      ...report.loads.map((load): Row => [
        load.name,
        load.category,
        load.supply,
        load.quantityValue,
        load.basis,
        { value: load.energyWhPerDay, style: 'number' },
      ]),
      [],
      [{ value: 'Composição do consumo diário', style: 'bold' }, null, null, null, null, { value: 'Wh/dia', style: 'bold' }],
      ...report.consumptionWh.map(([label, value], index, all): Row => {
        const isTotal = index === all.length - 1;
        return [isTotal ? { value: label, style: 'bold' } : label, null, null, null, null, { value, style: isTotal ? 'boldNumber' : 'number' }];
      }),
      ...(report.excludedLoadsNote ? [[], [{ value: report.excludedLoadsNote, style: 'wrap' }] as Row] : []),
    ],
  };
  const encoder = new TextEncoder();
  return createStoredZip(workbookParts([summarySheet, consumptionSheet]).map(([name, xml]) => [name, encoder.encode(xml)]));
}
