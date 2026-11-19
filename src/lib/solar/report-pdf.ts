import { jsPDF } from 'jspdf';
import type { ReportEntry, SolarReportDocument } from './report-presentation.ts';

export interface SolarPdfFonts {
  regular: string;
  bold: string;
  display: string;
}

export function createSolarReportPdf(report: SolarReportDocument, fonts: SolarPdfFonts): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  pdf.addFileToVFS('Manrope-Regular.ttf', fonts.regular);
  pdf.addFont('Manrope-Regular.ttf', 'Manrope', 'normal');
  pdf.addFileToVFS('Manrope-Bold.ttf', fonts.bold);
  pdf.addFont('Manrope-Bold.ttf', 'Manrope', 'bold');
  pdf.addFileToVFS('DMSerifDisplay-Regular.ttf', fonts.display);
  pdf.addFont('DMSerifDisplay-Regular.ttf', 'DM Serif Display', 'normal');
  pdf.setProperties({ title: report.title, author: 'Odisseia Mundana', subject: 'Guia básico do sistema elétrico' });
  pdf.setLanguage('pt-BR');

  const margin = 18;
  const width = pdf.internal.pageSize.getWidth() - 2 * margin;
  const bottom = pdf.internal.pageSize.getHeight() - 23;
  const ink = '#282829';
  const muted = '#64615D';
  const ocean = '#314B7B';
  const copper = '#784330';
  const surface = '#F5F2ED';
  let y = margin;

  function font(size = 10, bold = false, color = ink, family = 'Manrope') {
    pdf.setFont(family, bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.setTextColor(color);
  }

  function pageHeader() {
    font(8, true, ocean);
    pdf.text('ODISSEIA MUNDANA  /  PLANEJADOR ELÉTRICO', margin, 11);
    pdf.setDrawColor('#D18E59');
    pdf.setLineWidth(0.45);
    pdf.line(margin, 14, margin + width, 14);
    y = 22;
  }

  function ensureSpace(height: number): boolean {
    if (y + height <= bottom) return false;
    pdf.addPage();
    pageHeader();
    return true;
  }

  function paragraph(text: string, size = 10, bold = false, color = ink, family = 'Manrope') {
    font(size, bold, color, family);
    const lines: string[] = pdf.splitTextToSize(text, width);
    const lineHeight = size * 0.352778 * 1.5;
    for (const line of lines) {
      ensureSpace(lineHeight);
      font(size, bold, color, family);
      pdf.text(line, margin, y + size * 0.352778);
      y += lineHeight;
    }
    y += 2;
  }

  function heading(number: number, title: string) {
    ensureSpace(24);
    y += 5;
    pdf.setFillColor(ocean);
    pdf.rect(margin, y, 1, 8, 'F');
    pdf.setFont('DM Serif Display', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(ocean);
    pdf.text(`${number}. ${title}`, margin + 4, y + 6);
    y += 13;
  }

  function entries(values: ReportEntry[]) {
    for (const [label, value] of values) {
      ensureSpace(18);
      paragraph(label, 8.5, true, copper);
      paragraph(value);
      y += 1;
    }
  }

  pageHeader();
  paragraph('GUIA BÁSICO DO SISTEMA ELÉTRICO', 9, true, copper);
  paragraph(report.title, 22, false, ocean, 'DM Serif Display');
  paragraph('Consumo, baterias e inversor: um ponto de partida para planejar seu motorhome.', 10, false, muted);
  entries(report.identification);

  heading(1, 'Seu sistema em resumo');
  for (const metric of report.summary) {
    const height = [[metric.label, 9], [metric.value, 16], [metric.detail, 9]].reduce((total, [text, size]) => {
      font(Number(size));
      return total + pdf.splitTextToSize(String(text), width).length * Number(size) * 0.352778 * 1.5 + 2;
    }, 2);
    ensureSpace(height);
    paragraph(metric.label, 9, true, copper);
    paragraph(metric.value, 16, true, ocean);
    paragraph(metric.detail, 9, false, muted);
    y += 2;
  }
  if (report.warnings.length) {
    ensureSpace(20);
    paragraph('Atenção antes de usar os resultados', 11, true, copper);
    for (const warning of report.warnings) paragraph(`• ${warning}`, 10, true, copper);
  }

  heading(2, 'Consumo dos equipamentos');
  paragraph('A energia de cada equipamento inclui a quantidade escolhida, mas ainda não as perdas do inversor.', 9, false, muted);
  const columns = [73, 12, 51, width - 136];
  const lineHeight = 4.7;
  function tableHeader() {
    const headers = ['Equipamento / referência', 'Qtd.', 'Uso por unidade', 'Energia por dia'];
    pdf.setFillColor(ocean);
    pdf.rect(margin, y, width, 10, 'F');
    font(8, true, '#FFFFFF');
    let x = margin;
    headers.forEach((header, index) => {
      pdf.text(header, x + 2, y + 6);
      x += columns[index];
    });
    y += 10;
  }
  ensureSpace(30);
  tableHeader();
  report.loads.forEach((load, index) => {
    font(9);
    const cells = [`${load.name}\n${load.detail}`, load.quantity, load.basis, load.energy];
    const lines = cells.map((cell, column): string[] => pdf.splitTextToSize(cell, columns[column] - 4));
    const count = Math.max(...lines.map((cell) => cell.length));
    const fullHeight = count * lineHeight + 6;
    if (fullHeight <= bottom - 32 && ensureSpace(fullHeight)) tableHeader();
    let offset = 0;
    while (offset < count) {
      if (ensureSpace(lineHeight + 8)) tableHeader();
      const availableLines = Math.max(1, Math.floor((bottom - y - 6) / lineHeight));
      const rows = Math.min(count - offset, availableLines);
      const height = rows * lineHeight + 6;
      pdf.setFillColor(index % 2 === 0 ? surface : '#FFFFFF');
      pdf.rect(margin, y, width, height, 'F');
      let x = margin;
      lines.forEach((cell, column) => {
        font(9, column === 3, column === 3 ? ocean : ink);
        const chunk = cell.slice(offset, offset + rows);
        if (chunk.length) pdf.text(chunk, x + 2, y + 5, { lineHeightFactor: lineHeight / (9 * 0.352778) });
        x += columns[column];
      });
      y += height;
      offset += rows;
    }
  });
  y += 5;
  paragraph('Composição do consumo diário', 11, true, ocean);
  entries(report.consumption);
  if (report.excludedLoadsNote) paragraph(report.excludedLoadsNote, 10, true, copper);

  heading(3, 'Banco de baterias estimado');
  entries(report.battery);
  heading(4, 'Inversor');
  entries(report.inverter);
  if (report.inverterNote) paragraph(report.inverterNote, 9, false, muted);
  heading(5, 'Premissas e limites');
  for (const note of report.notes) paragraph(`• ${note}`, 9, false, muted);
  y += 3;
  paragraph(report.disclaimer, 10, true);

  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page);
    font(8, false, muted);
    pdf.text('Guia de planejamento · não substitui projeto executivo', margin, 285);
    pdf.text(`${page} / ${pages}`, margin + width, 285, { align: 'right' });
  }
  return pdf;
}
