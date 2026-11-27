// Gera src/lib/solar/solar-resource-countries.ts a partir da série Solar Analytica (ERA5).
// Uso: node scripts/generate-solar-resource-countries.mjs
import { writeFile } from 'node:fs/promises';

const dataUrl = 'https://solaranalytica.com/solar-resource-by-nation/data.json';
const isoCodesUrl = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';
const outputPath = new URL('../src/lib/solar/solar-resource-countries.ts', import.meta.url);

// Feições sem código ISO 3166 próprio na fonte, mas que correspondem a países.
const isoOverrides = { FRA: 'FRA', NOR: 'NOR', KOS: 'XKX' };
// Ajustes de nomes do ICU que fogem do uso corrente no Brasil.
const nameOverridesPt = {
  COD: 'República Democrática do Congo',
  HKG: 'Hong Kong',
  MAC: 'Macau',
  MMR: 'Mianmar',
  ALA: 'Ilhas Åland',
};
const continentNamesPt = {
  Africa: 'África',
  Asia: 'Ásia',
  Europe: 'Europa',
  'North America': 'América do Norte, Central e Caribe',
  'South America': 'América do Sul',
  Oceania: 'Oceania',
  'Seven seas (open ocean)': 'Ilhas oceânicas',
};

const [dataset, isoCodes] = await Promise.all([
  fetch(dataUrl).then((response) => response.json()),
  fetch(isoCodesUrl).then((response) => response.json()),
]);
const alpha2ByAlpha3 = new Map(isoCodes.map((country) => [country.cca3, country.cca2]));
alpha2ByAlpha3.set('XKX', 'XK');
const regionNames = new Intl.DisplayNames(['pt-BR'], { type: 'region' });
const { from, to } = dataset.referencePeriod;

const countries = dataset.features.flatMap((feature) => {
  const countryIso3 = feature.isoA3 ?? isoOverrides[feature.iso];
  if (!countryIso3 || feature.flags.includes('antarctica')) return [];
  const alpha2 = alpha2ByAlpha3.get(countryIso3);
  if (!alpha2) throw new Error(`Sem código ISO alfa-2 para ${countryIso3} (${feature.name}).`);
  const values = feature.annual.slice(from - dataset.firstYear, to - dataset.firstYear + 1);
  if (values.length !== to - from + 1 || values.some((value) => typeof value !== 'number')) {
    throw new Error(`Série incompleta para ${countryIso3}.`);
  }
  const continentPt = continentNamesPt[feature.continent];
  if (!continentPt) throw new Error(`Continente sem tradução: ${feature.continent}.`);
  return [{
    countryIso3,
    countryNamePt: nameOverridesPt[countryIso3] ?? regionNames.of(alpha2),
    continentPt,
    // Média das médias anuais do período de referência, arredondada a 3 casas como na fonte.
    peakSunHours: Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000 + 1e-9) / 1000,
  }];
}).sort((left, right) => left.countryNamePt.localeCompare(right.countryNamePt, 'pt-BR'));

const lines = countries.map((country) => `  { countryIso3: '${country.countryIso3}', countryNamePt: ${JSON.stringify(country.countryNamePt)}, continentPt: ${JSON.stringify(country.continentPt)}, peakSunHours: ${country.peakSunHours} },`);
const source = `// Arquivo gerado por scripts/generate-solar-resource-countries.mjs; não edite manualmente.
// Fonte: Solar Analytica, Solar resource by nation (ERA5, Copernicus), média de ${from}–${to}, licença CC BY 4.0.
import type { SolarResourceRecord } from './catalogs.ts';

export const solarResourceCountryRecords: readonly SolarResourceRecord[] = [
${lines.join('\n')}
];
`;
await writeFile(outputPath, source, 'utf8');
console.log(`${countries.length} países e territórios gravados.`);
