import { validateAllRegistries } from './gallery-lib.mjs';

const reports = await validateAllRegistries();
const threshold = process.env.GALLERY_MAX_MIB;
if (threshold !== undefined && (!Number.isFinite(Number(threshold)) || Number(threshold) <= 0)) {
  throw new Error('GALLERY_MAX_MIB deve ser um número positivo.');
}
if (!reports.length) console.log('Nenhum registro de galeria encontrado.');
for (const report of reports) {
  console.log(`${report.collectionId}: ${report.count} foto(s), ${(report.bytes / 1024 / 1024).toFixed(2)} MiB.`);
}
const totalBytes = reports.reduce((sum, report) => sum + report.bytes, 0);
console.log(`Total: ${reports.reduce((sum, report) => sum + report.count, 0)} foto(s), ${(totalBytes / 1024 / 1024).toFixed(2)} MiB.`);
if (threshold !== undefined && totalBytes > Number(threshold) * 1024 * 1024) {
  console.warn(`Aviso: variantes registradas ultrapassam o limite de ${threshold} MiB.`);
}
