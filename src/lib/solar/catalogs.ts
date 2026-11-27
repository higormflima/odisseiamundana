import type {
  BatteryParameters,
  BatteryChemistry,
  ElectricalLoad,
  PvModuleParameters,
} from './calculations.ts';
import { solarResourceCountryRecords } from './solar-resource-countries.ts';

export interface SolarResourceRecord {
  countryIso3: string;
  countryNamePt: string;
  continentPt: string;
  peakSunHours: number;
}

export const solarResourceDataset = {
  sourceName: 'Solar Analytica',
  sourceUrl: 'https://solaranalytica.com/solar-resource-by-nation',
  underlyingDataset: 'ERA5 reanalysis, Copernicus Climate Change Service',
  sourceSeriesStartYear: 1940,
  sourceSeriesEndYear: 2025,
  referencePeriodStartYear: 1991,
  referencePeriodEndYear: 2020,
  sourceUnit: 'kWh/m2/day',
  aggregation: 'mean of annual means, area-weighted by country boundary',
  accessedOn: '2026-11-27',
  licence: 'CC BY 4.0',
  attribution:
    'Contains modified Copernicus Climate Change Service information. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. Changes made: monthly grids aggregated to Natural Earth 5.1.1 admin-0 feature area-weighted means.',
} as const;

export const solarResourceNoticePt =
  'A HSP é uma aproximação baseada na média nacional anual modelada. Não representa uma medição local nem uma condição sazonal; em países extensos, a insolação pode variar bastante. Ajuste o valor para o local e a época do projeto quando houver dados mais adequados.';

/** Todos os países e territórios com código ISO na fonte, exceto a Antártida; gerado por script. */
export const solarResourceCountries: readonly SolarResourceRecord[] = solarResourceCountryRecords;

/** Consulta local recomendada no Brasil; a ferramenta não copia dados dessa fonte. */
export const solarLocalResource = {
  name: 'CRESESB SunData',
  url: 'https://cresesb.cepel.br/index.php?section=sundata',
  accessedOn: '2026-11-27',
} as const;

/** Ordem dos grupos no seletor de países; a América do Sul vem primeiro para o público brasileiro. */
export const solarResourceContinentOrderPt = [
  'América do Sul',
  'América do Norte, Central e Caribe',
  'Europa',
  'África',
  'Ásia',
  'Oceania',
  'Ilhas oceânicas',
] as const;

export const equipmentCategories = [
  { id: 'refrigeration', labelPt: 'Refrigeração' },
  { id: 'lighting', labelPt: 'Iluminação' },
  { id: 'cooking', labelPt: 'Cozinha' },
  { id: 'electronics', labelPt: 'Eletrônicos e Internet' },
  { id: 'water', labelPt: 'Água e Higiene' },
  { id: 'climate', labelPt: 'Climatização e Aquecimento' },
  { id: 'other', labelPt: 'Saúde e Outros' },
] as const;

export type EquipmentCategoryId = (typeof equipmentCategories)[number]['id'];

export interface EquipmentCatalogItem {
  referenceKind: 'manufacturer' | 'usage-example';
  id: string;
  categoryId: EquipmentCategoryId;
  namePt: string;
  /** Termos extras para a busca do catálogo. */
  keywordsPt?: string;
  defaultLoad: ElectricalLoad;
  applicableSystemVoltagesV: readonly (12 | 24)[];
  sourceMeasurement: {
    value: number;
    unit: string;
    voltageV: number;
    conditions: string;
  };
  derivationPt: string;
  /** Observação de uso exibida no cartão, por exemplo quando o padrão de uso vem de outra fonte. */
  usageNotePt?: string;
  source: {
    name: string;
    url: string;
    accessedOn: string;
  };
}

const rvingToolboxSource = {
  name: 'RVing Toolbox — exemplos de consumo diário em motorhomes',
  url: 'https://rvingtoolbox.com/calculators/power-budget',
  accessedOn: '2026-11-19',
} as const;

const hookupNotePt = 'Na fonte, este aparelho aparece como uso típico com energia externa (tomada); em sistema somente com bateria, o consumo costuma ser alto.';

interface UsageExample {
  id: string;
  categoryId: EquipmentCategoryId;
  namePt: string;
  keywordsPt?: string;
  powerW: number;
  hoursPerDay: number;
  /** Fração do tempo em que o aparelho efetivamente funciona, quando a fonte informa ciclo de funcionamento. */
  dutyCycle?: number;
  usagePt: string;
  supply: 'dc' | 'ac';
  voltageV: 12 | 120;
  accessedOn?: string;
  usageNotePt?: string;
}

/** Tabela pública da RVing Toolbox (Brian Hamilton), atualizada em 10/10/2026; cenários genéricos, não medições. */
const usageExamples: readonly UsageExample[] = [
  { id: 'example-led-light', categoryId: 'lighting', namePt: 'Luminária LED DC — exemplo', keywordsPt: 'luz lâmpada spot fita', powerW: 3, hoursPerDay: 4, usagePt: '4 h/dia por luminária', supply: 'dc', voltageV: 12 },
  { id: 'example-coffee-maker', categoryId: 'cooking', namePt: 'Cafeteira elétrica AC — exemplo', keywordsPt: 'café', powerW: 900, hoursPerDay: 0.25, usagePt: '15 min/dia', supply: 'ac', voltageV: 120 },
  { id: 'example-laptop', categoryId: 'electronics', namePt: 'Notebook com carregador AC — exemplo', keywordsPt: 'computador laptop trabalho remoto', powerW: 60, hoursPerDay: 4, usagePt: '4 h/dia', supply: 'ac', voltageV: 120 },
  { id: 'example-water-pump', categoryId: 'water', namePt: 'Bomba de água DC — exemplo', keywordsPt: 'pressurizadora torneira chuveiro', powerW: 75, hoursPerDay: 1 / 3, usagePt: '20 min/dia de funcionamento efetivo', supply: 'dc', voltageV: 12 },
  { id: 'example-roof-fan', categoryId: 'climate', namePt: 'Exaustor de teto DC — exemplo', keywordsPt: 'ventilação claraboia maxxfan ventilador', powerW: 30, hoursPerDay: 6, usagePt: '6 h/dia', supply: 'dc', voltageV: 12 },
  { id: 'example-background-loads', categoryId: 'other', namePt: 'Detectores e controles em espera DC — exemplo', keywordsPt: 'alarme detector gás fumaça painel rastreador', powerW: 6, hoursPerDay: 24, usagePt: '24 h/dia para o conjunto de pequenos consumos', supply: 'dc', voltageV: 12 },
  { id: 'example-absorption-fridge-gas', categoryId: 'refrigeration', namePt: 'Geladeira de absorção a gás (controles DC) — exemplo', keywordsPt: 'trivolt gás propano', powerW: 12, hoursPerDay: 24, usagePt: '24 h/dia', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-compressor-fridge-12v', categoryId: 'refrigeration', namePt: 'Geladeira com compressor DC — exemplo', keywordsPt: 'portátil compressor', powerW: 55, hoursPerDay: 24, dutyCycle: 0.5, usagePt: '24 h/dia, compressor ligado 50% do tempo', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-residential-fridge', categoryId: 'refrigeration', namePt: 'Geladeira residencial AC — exemplo', keywordsPt: 'refrigerador doméstico', powerW: 150, hoursPerDay: 24, dutyCycle: 0.4, usagePt: '24 h/dia, compressor ligado 40% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-absorption-fridge-ac', categoryId: 'refrigeration', namePt: 'Geladeira de absorção ligada na tomada AC — exemplo', keywordsPt: 'trivolt', powerW: 325, hoursPerDay: 24, dutyCycle: 0.6, usagePt: '24 h/dia, aquecedor ligado 60% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27', usageNotePt: hookupNotePt },
  { id: 'example-furnace-blower', categoryId: 'climate', namePt: 'Ventilador de aquecedor a gás DC — exemplo', keywordsPt: 'calefação aquecimento furnace', powerW: 100, hoursPerDay: 4.3, usagePt: '4,3 h/dia', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-air-conditioner-13500', categoryId: 'climate', namePt: 'Ar-condicionado AC de 13.500 BTU — exemplo', keywordsPt: 'climatizador split', powerW: 1500, hoursPerDay: 8, dutyCycle: 0.6, usagePt: '8 h/dia, compressor ligado 60% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27', usageNotePt: hookupNotePt },
  { id: 'example-air-conditioner-15000', categoryId: 'climate', namePt: 'Ar-condicionado AC de 15.000 BTU — exemplo', keywordsPt: 'climatizador split', powerW: 1700, hoursPerDay: 8, dutyCycle: 0.6, usagePt: '8 h/dia, compressor ligado 60% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27', usageNotePt: hookupNotePt },
  { id: 'example-space-heater', categoryId: 'climate', namePt: 'Aquecedor elétrico AC — exemplo', keywordsPt: 'calefação', powerW: 1500, hoursPerDay: 4, dutyCycle: 0.7, usagePt: '4 h/dia, ligado 70% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-electric-blanket', categoryId: 'climate', namePt: 'Cobertor elétrico AC — exemplo', keywordsPt: 'manta térmica', powerW: 60, hoursPerDay: 8, dutyCycle: 0.5, usagePt: '8 h/dia, ligado 50% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-tank-heating-pad', categoryId: 'water', namePt: 'Manta de aquecimento de tanque DC — exemplo', keywordsPt: 'antecongelamento inverno', powerW: 100, hoursPerDay: 24, dutyCycle: 0.4, usagePt: '24 h/dia, ligada 40% do tempo', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-electric-water-heater', categoryId: 'water', namePt: 'Aquecedor de água elétrico AC — exemplo', keywordsPt: 'boiler banho quente', powerW: 1400, hoursPerDay: 1.5, usagePt: '1,5 h/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27', usageNotePt: hookupNotePt },
  { id: 'example-phone-charging', categoryId: 'electronics', namePt: 'Carregamento de celular (USB/DC) — exemplo', keywordsPt: 'smartphone usb tablet', powerW: 10, hoursPerDay: 3, usagePt: '3 h/dia', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-tv-32', categoryId: 'electronics', namePt: 'TV LED de 32" AC — exemplo', keywordsPt: 'televisão monitor', powerW: 50, hoursPerDay: 3, usagePt: '3 h/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-starlink-standard', categoryId: 'electronics', namePt: 'Starlink Standard (Gen 3) — exemplo', keywordsPt: 'internet satélite antena', powerW: 88, hoursPerDay: 8, usagePt: '8 h/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-starlink-mini', categoryId: 'electronics', namePt: 'Starlink Mini — exemplo', keywordsPt: 'internet satélite antena', powerW: 25, hoursPerDay: 8, usagePt: '8 h/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-router-hotspot', categoryId: 'electronics', namePt: 'Roteador ou hotspot 4G/5G DC — exemplo', keywordsPt: 'internet wifi modem', powerW: 10, hoursPerDay: 24, usagePt: '24 h/dia', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-game-console', categoryId: 'electronics', namePt: 'Console de videogame AC — exemplo', keywordsPt: 'jogos entretenimento', powerW: 150, hoursPerDay: 2, usagePt: '2 h/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-cpap', categoryId: 'other', namePt: 'CPAP DC — exemplo', keywordsPt: 'saúde apneia respirador', powerW: 40, hoursPerDay: 8, usagePt: '8 h/dia', supply: 'dc', voltageV: 12, accessedOn: '2026-11-27' },
  { id: 'example-microwave', categoryId: 'cooking', namePt: 'Micro-ondas AC — exemplo', keywordsPt: 'forno', powerW: 1200, hoursPerDay: 10 / 60, usagePt: '10 min/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-electric-kettle', categoryId: 'cooking', namePt: 'Chaleira elétrica AC — exemplo', keywordsPt: 'água quente chá chimarrão', powerW: 1500, hoursPerDay: 0.1, usagePt: '6 min/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-toaster', categoryId: 'cooking', namePt: 'Torradeira AC — exemplo', keywordsPt: 'sanduicheira pão', powerW: 1100, hoursPerDay: 5 / 60, usagePt: '5 min/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-induction-cooktop', categoryId: 'cooking', namePt: 'Cooktop de indução AC — exemplo', keywordsPt: 'fogão indução', powerW: 1800, hoursPerDay: 0.5, dutyCycle: 0.7, usagePt: '30 min/dia, aquecendo 70% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-pressure-cooker-air-fryer', categoryId: 'cooking', namePt: 'Panela elétrica ou airfryer AC — exemplo', keywordsPt: 'air fryer fritadeira panela de pressão arroz', powerW: 1000, hoursPerDay: 0.5, dutyCycle: 0.6, usagePt: '30 min/dia, aquecendo 60% do tempo', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
  { id: 'example-hair-dryer', categoryId: 'water', namePt: 'Secador de cabelo AC — exemplo', keywordsPt: 'higiene banho', powerW: 1500, hoursPerDay: 0.1, usagePt: '6 min/dia', supply: 'ac', voltageV: 120, accessedOn: '2026-11-27' },
];

function formatPt(value: number, maximumFractionDigits = 4): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits });
}

function usageExampleItem(example: UsageExample): EquipmentCatalogItem {
  const dailyWh = example.powerW * example.hoursPerDay * (example.dutyCycle ?? 1);
  const basis: ElectricalLoad['basis'] = example.dutyCycle === undefined
    ? { kind: 'power-time', powerW: example.powerW, hoursPerDay: example.hoursPerDay }
    : { kind: 'compressor-cycle', runningPowerW: example.powerW, operatingWindowHoursPerDay: example.hoursPerDay, dutyCycle: example.dutyCycle };
  return {
    id: example.id,
    referenceKind: 'usage-example',
    categoryId: example.categoryId,
    namePt: example.namePt,
    ...(example.keywordsPt ? { keywordsPt: example.keywordsPt } : {}),
    defaultLoad: {
      id: example.id,
      supply: example.supply,
      quantity: 1,
      simultaneous: true,
      basis,
      ...(example.supply === 'ac' ? { ratedPowerW: example.powerW } : {}),
    },
    // Cenário de potência: vale para a versão 12 V ou 24 V do aparelho, sem conversor.
    applicableSystemVoltagesV: [12, 24],
    sourceMeasurement: {
      value: example.powerW,
      unit: 'W',
      voltageV: example.voltageV,
      conditions: `Cenário genérico de uso, não medição de fabricante: ${example.powerW} W por ${example.usagePt}. Circuito da fonte: ${example.voltageV} V ${example.supply.toUpperCase()}`,
    },
    derivationPt: example.dutyCycle === undefined
      ? `${example.powerW} W × ${formatPt(example.hoursPerDay)} h/dia = ${formatPt(dailyWh, 2)} Wh/dia por unidade, antes das perdas do inversor.${example.id === 'example-water-pump' ? ' O tempo é 20/60 h, sem arredondamento no cálculo.' : ''}`
      : `${example.powerW} W × ${formatPt(example.hoursPerDay)} h/dia × ${formatPt(example.dutyCycle * 100)}% = ${formatPt(dailyWh, 2)} Wh/dia por unidade, antes das perdas do inversor.`,
    ...(example.usageNotePt || example.supply === 'dc'
      ? { usageNotePt: example.usageNotePt ?? 'Cenário de potência válido para a versão 12 V ou 24 V do aparelho: escolha o modelo na tensão do seu banco. A fonte mede o circuito de 12 V.' }
      : {}),
    source: { ...rvingToolboxSource, accessedOn: example.accessedOn ?? rvingToolboxSource.accessedOn },
  };
}

const genericCompressorDutyNotePt = 'O fabricante publica a corrente, mas não o tempo de funcionamento do compressor. O ciclo inicial é o cenário genérico da RVing Toolbox para o mesmo tipo de aparelho; ajuste-o ao seu uso.';

interface ResfriArFridgeModel {
  litres: number;
  reference: string;
  label: string;
  url: string;
  currentA: { 12: number; 24: number };
}

const resfriArFridges: readonly ResfriArFridgeModel[] = [
  { litres: 67, reference: 'RESGED67', label: 'geladeira com compressor e freezer', url: 'https://resfriar.com.br/product/refrigerator-67-liters-refrigerator', currentA: { 12: 3.8, 24: 1.9 } },
  { litres: 75, reference: 'RESGED75', label: 'geladeira externa com compressor e freezer', url: 'https://resfriar.com.br/product/refrigerator-75-liters-external', currentA: { 12: 3.8, 24: 1.9 } },
  { litres: 110, reference: 'RESGE110', label: 'geladeira side by side com freezer', url: 'https://resfriar.com.br/product/refrigerator-110-liters-side-by-side', currentA: { 12: 6.4, 24: 3.2 } },
];

function resfriArFridge(model: ResfriArFridgeModel, voltageV: 12 | 24): EquipmentCatalogItem {
  const currentA = model.currentA[voltageV];
  const id = `resfriar-geladeira-${model.litres}l-${voltageV}v`;
  return {
    referenceKind: 'manufacturer',
    id,
    categoryId: 'refrigeration',
    namePt: `Resfri Ar ${model.litres} L (${voltageV} V) — ${model.label}`,
    keywordsPt: 'resfriar freezer compressor caminhão',
    defaultLoad: {
      id,
      supply: 'dc',
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'compressor-cycle', runningPowerW: currentA * voltageV, operatingWindowHoursPerDay: 24, dutyCycle: 0.5 },
    },
    applicableSystemVoltagesV: [voltageV],
    sourceMeasurement: {
      value: currentA,
      unit: 'A',
      voltageV,
      conditions: `Corrente publicada de ${formatPt(currentA)} ± 0,5 A em ${voltageV} V, fora da função Turbo`,
    },
    derivationPt: `${formatPt(currentA)} A × ${voltageV} V = ${formatPt(currentA * voltageV, 2)} W em funcionamento; × 24 h/dia × 50% = ${formatPt(currentA * voltageV * 12, 2)} Wh/dia.`,
    usageNotePt: genericCompressorDutyNotePt,
    source: {
      name: `Resfri Ar — Geladeira ${model.litres} litros (${model.reference}), especificações do fabricante`,
      url: model.url,
      accessedOn: '2026-11-27',
    },
  };
}

function resfriArRt8000(voltageV: 12 | 24, maxPowerW: number, currentA: number, btu: number): EquipmentCatalogItem {
  return {
    referenceKind: 'manufacturer',
    id: `resfriar-rt8000-${voltageV}v`,
    categoryId: 'climate',
    namePt: `Resfri Ar RT8000 (${voltageV} V) — ar-condicionado de teto`,
    keywordsPt: 'resfriar climatizador split inverter',
    defaultLoad: {
      id: `resfriar-rt8000-${voltageV}v`,
      supply: 'dc',
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'compressor-cycle', runningPowerW: maxPowerW, operatingWindowHoursPerDay: 8, dutyCycle: 0.6 },
    },
    applicableSystemVoltagesV: [voltageV],
    sourceMeasurement: {
      value: maxPowerW,
      unit: 'W',
      voltageV,
      conditions: `Consumo máximo publicado de ${maxPowerW} W (${currentA} A) em ${voltageV} V, ${formatPt(btu)} BTU/h`,
    },
    derivationPt: `${maxPowerW} W × 8 h/dia × 60% = ${formatPt(maxPowerW * 8 * 0.6, 2)} Wh/dia. Usa o consumo máximo; o modo inverter tende a consumir menos.`,
    usageNotePt: 'O fabricante publica o consumo máximo, não o uso diário. As 8 h/dia com 60% de funcionamento são o cenário genérico de ar-condicionado da RVing Toolbox; ajuste-os ao seu uso.',
    source: {
      name: 'Resfri Ar — Ar-condicionado RT8000 Série 4 Inverter (400AC), especificações do fabricante',
      url: 'https://www.resfriar.com.br/produto/ar-condicionado-rt8000-serie-4-inverter',
      accessedOn: '2026-11-27',
    },
  };
}

export const equipmentCatalog: readonly EquipmentCatalogItem[] = [
  {
    referenceKind: 'manufacturer',
    id: 'dometic-cfx5-45',
    categoryId: 'refrigeration',
    namePt: 'Dometic CFX5 45 — geladeira portátil com compressor, 45 L',
    keywordsPt: 'dometic portátil compressor',
    defaultLoad: {
      id: 'dometic-cfx5-45',
      supply: 'dc',
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'daily-energy', energyWhPerDay: 218.88 },
    },
    applicableSystemVoltagesV: [12],
    sourceMeasurement: {
      value: 0.76,
      unit: 'Ah/h',
      voltageV: 12,
      conditions: 'Ambiente a 32 °C e interior a 4 °C',
    },
    derivationPt: '0,76 Ah/h × 24 h/dia × 12 V = 218,88 Wh/dia.',
    source: {
      name: 'Dometic CFX5 45 — especificações do fabricante',
      url: 'https://www.dometic.com/en/product/dometic-cfx5-45-9620015959',
      accessedOn: '2026-11-18',
    },
  },
  {
    referenceKind: 'manufacturer',
    id: 'dometic-cfx3-45',
    categoryId: 'refrigeration',
    namePt: 'Dometic CFX3 45 — geladeira portátil com compressor, 45 L',
    keywordsPt: 'dometic portátil compressor',
    defaultLoad: {
      id: 'dometic-cfx3-45',
      supply: 'dc',
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'daily-energy', energyWhPerDay: 296.64 },
    },
    applicableSystemVoltagesV: [12],
    sourceMeasurement: {
      value: 1.03,
      unit: 'Ah/h',
      voltageV: 12,
      conditions: 'Ambiente a 32 °C e interior a 4 °C',
    },
    derivationPt: '1,03 Ah/h × 24 h/dia × 12 V = 296,64 Wh/dia.',
    source: {
      name: 'Dometic CFX3 45 — especificações do fabricante',
      url: 'https://www.dometic.com/en-ae/product/dometic-cfx3-45-9620009573',
      accessedOn: '2026-11-27',
    },
  },
  ...resfriArFridges.flatMap((model) => [resfriArFridge(model, 12), resfriArFridge(model, 24)]),
  resfriArRt8000(12, 650, 55, 6500),
  resfriArRt8000(24, 750, 31, 7500),
  ...usageExamples.map(usageExampleItem),
];

export interface LoadProfile {
  id: string;
  namePt: string;
  descriptionPt: string;
  /** substituteAt24V: item usado no lugar de uma referência que só existe em 12 V. */
  items: ReadonlyArray<{ equipmentId: string; quantity: number; substituteAt24V?: string }>;
}

/** Pontos de partida para a seleção do catálogo; não representam consumo médio de viajantes. */
export const loadProfiles: readonly LoadProfile[] = [
  {
    id: 'weekend',
    namePt: 'Fim de semana',
    descriptionPt: 'Geladeira, iluminação, bomba de água, ventilação e celulares.',
    items: [
      { equipmentId: 'dometic-cfx5-45', quantity: 1, substituteAt24V: 'example-compressor-fridge-12v' },
      { equipmentId: 'example-led-light', quantity: 4 },
      { equipmentId: 'example-water-pump', quantity: 1 },
      { equipmentId: 'example-roof-fan', quantity: 1 },
      { equipmentId: 'example-phone-charging', quantity: 2 },
    ],
  },
  {
    id: 'full-time',
    namePt: 'Viagem em tempo integral',
    descriptionPt: 'O fim de semana, mais cafeteira, notebook, TV, roteador e pequenos consumos contínuos.',
    items: [
      { equipmentId: 'dometic-cfx5-45', quantity: 1, substituteAt24V: 'example-compressor-fridge-12v' },
      { equipmentId: 'example-led-light', quantity: 6 },
      { equipmentId: 'example-water-pump', quantity: 1 },
      { equipmentId: 'example-roof-fan', quantity: 1 },
      { equipmentId: 'example-phone-charging', quantity: 2 },
      { equipmentId: 'example-coffee-maker', quantity: 1 },
      { equipmentId: 'example-laptop', quantity: 1 },
      { equipmentId: 'example-tv-32', quantity: 1 },
      { equipmentId: 'example-router-hotspot', quantity: 1 },
      { equipmentId: 'example-background-loads', quantity: 1 },
    ],
  },
  {
    id: 'remote-work',
    namePt: 'Trabalho remoto',
    descriptionPt: 'Tempo integral com dois notebooks e internet via satélite (Starlink Mini).',
    items: [
      { equipmentId: 'dometic-cfx5-45', quantity: 1, substituteAt24V: 'example-compressor-fridge-12v' },
      { equipmentId: 'example-led-light', quantity: 6 },
      { equipmentId: 'example-water-pump', quantity: 1 },
      { equipmentId: 'example-roof-fan', quantity: 1 },
      { equipmentId: 'example-phone-charging', quantity: 2 },
      { equipmentId: 'example-coffee-maker', quantity: 1 },
      { equipmentId: 'example-laptop', quantity: 2 },
      { equipmentId: 'example-starlink-mini', quantity: 1 },
      { equipmentId: 'example-router-hotspot', quantity: 1 },
      { equipmentId: 'example-background-loads', quantity: 1 },
    ],
  },
];

export type EquipmentUsageOverride =
  | { powerW: number; hoursPerDay: number }
  | { powerW: number; hoursPerDay: number; dutyCycle: number };

/** Aplica potência, horas e ciclo editados no cartão, preservando a base de cálculo do item. */
export function buildEquipmentLoad(
  item: EquipmentCatalogItem,
  quantity: number,
  usage?: EquipmentUsageOverride,
): ElectricalLoad {
  if (!usage) return { ...item.defaultLoad, quantity };
  const basis = item.defaultLoad.basis;
  if (basis.kind === 'power-time') {
    return {
      ...item.defaultLoad,
      quantity,
      basis: { kind: 'power-time', powerW: usage.powerW, hoursPerDay: usage.hoursPerDay },
      ...(item.defaultLoad.supply === 'ac' ? { ratedPowerW: usage.powerW } : {}),
    };
  }
  if (basis.kind === 'compressor-cycle') {
    return {
      ...item.defaultLoad,
      quantity,
      basis: {
        kind: 'compressor-cycle',
        runningPowerW: usage.powerW,
        operatingWindowHoursPerDay: usage.hoursPerDay,
        dutyCycle: 'dutyCycle' in usage ? usage.dutyCycle : basis.dutyCycle,
      },
      ...(item.defaultLoad.supply === 'ac' ? { ratedPowerW: usage.powerW } : {}),
    };
  }
  throw new TypeError('Este equipamento não usa um perfil de potência e tempo.');
}

export interface SolarCatalogSource {
  name: string;
  url: string;
  accessedOn: string;
}

/** Referência editável para ligar aparelhos de 12 V em banco de 24 V por conversor DC-DC. */
export const dcDcConverterReference = {
  namePt: 'Victron Orion-Tr Smart 24/12-30 (360 W), isolado',
  efficiency: 0.88,
  noLoadInputCurrentA: 0.1,
  notePt: 'Eficiência publicada na tabela de especificações (88%), sem indicar se é típica ou máxima; o consumo sem carga (< 100 mA) não entra no cálculo. Ajuste para o conversor escolhido.',
  source: {
    name: 'Victron Energy — Orion-Tr Smart DC-DC Charger Isolated, especificações',
    url: 'https://www.victronenergy.com/media/pg/Orion-Tr_Smart_DC-DC_Charger_-_Isolated/en/specifications.html',
    accessedOn: '2026-11-27',
  },
} as const;

/** Valores default do método do mês crítico (CRESESB/CEPEL, 2014, seção 6.2, p. 309), editáveis no formulário. */
export const solarCoverageDefaults = {
  moduleDeratingFactor: 0.75,
  systemDeratingFactor: 0.9,
  leadAcidRoundTripEfficiency: 0.86,
  source: {
    name: 'CRESESB/CEPEL — Manual de Engenharia para Sistemas Fotovoltaicos (2014), seção 6.2, Eq. 6.2 e 6.3, p. 309',
    url: 'https://cresesb.cepel.br/index.php/publicacoes/download/Manual_de_Engenharia_FV_2014.pdf?section=publicacoes&cid=481',
    accessedOn: '2026-11-27',
  },
} as const;

export const initialInverterScenario = {
  outputVoltageV: 220,
  ratedPowerW: 2000,
  efficiencyPercent: 90,
  standbyPowerW: 20,
  standbyHoursPerDay: 8,
  notePt: 'Cenário inicial editável: 2.000 W para planejar cargas usuais, 90% de eficiência, 20 W sem carga e 8 h/dia sem alimentar aparelhos. São hipóteses de planejamento, não médias estatísticas nem garantia de um modelo. Confira os valores do seu inversor e o tempo real de uso.',
  powerReference: {
    name: 'Epever IPower-Plus — referência de porte 2.000 W e saída 220 V',
    url: 'https://www.epever.com/upload/file/2107/EPEVER-Datasheet_IPower-Plus-220V.pdf',
    accessedOn: '2026-11-19',
  },
} as const;

export interface BatteryCatalogItem {
  id: string;
  namePt: string;
  chemistry: 'lifepo4';
  systemVoltageV: 12 | 24;
  nominalCapacityAh: number;
  parameters: BatteryParameters & {
    chargeVoltageV: number;
    dischargeCutoffVoltageV: number;
  };
  nominalCapacityTestConditionsPt: string;
  chargeEfficiencyTestConditionsPt: string;
  dischargeEfficiencyTestConditionsPt: string;
  depthOfDischargeBasisPt: string;
  maxSeriesBatteries: number;
  maxParallelBatteries: number;
  maxPeakDischargeDurationMs?: number;
  sources: readonly SolarCatalogSource[];
  notePt: string;
}

export const batteryCatalog: readonly BatteryCatalogItem[] = [
  {
    id: 'npp-lfp12-8-100',
    namePt: 'Perfil de referência LiFePO₄ 12,8 V / 100 Ah — NPP LFP12.8-100',
    chemistry: 'lifepo4',
    systemVoltageV: 12,
    nominalCapacityAh: 100,
    parameters: {
      chemistry: 'lifepo4',
      nominalVoltageV: 12.8,
      depthOfDischarge: 1,
      chargeEfficiency: 0.995,
      dischargeEfficiency: 0.96,
      maxChargeCurrentA: 50,
      maxContinuousDischargeCurrentA: 100,
      maxPeakDischargeCurrentA: 300,
      chargeVoltageV: 14.6,
      dischargeCutoffVoltageV: 11.2,
    },
    nominalCapacityTestConditionsPt: 'C5 a 25 °C',
    chargeEfficiencyTestConditionsPt: '0,2C a 25 °C',
    dischargeEfficiencyTestConditionsPt: '1C a 25 °C; aplicado o menor valor da faixa publicada (96–99%)',
    depthOfDischargeBasisPt: '100% DoD é a condição publicada para o ensaio de vida cíclica a 0,2C, não uma garantia de longevidade em qualquer uso.',
    maxSeriesBatteries: 4,
    maxParallelBatteries: 6,
    maxPeakDischargeDurationMs: 100,
    sources: [
      {
        name: 'NPP Power — ficha técnica LFP12.8-100',
        url: 'https://npp-power.eu/wp-content/uploads/2021/12/LFP12.8-100_ext.pdf',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Referência editável de modelo específico, não perfil universal de LiFePO₄. O limite de pico é publicado para menos de 100 ms. As eficiências são válidas somente nas taxas e temperatura indicadas; o catálogo não extrapola esses resultados para outras condições.',
  },
  {
    id: 'npp-lfp25-6-100',
    namePt: 'Perfil de referência LiFePO₄ 25,6 V / 100 Ah — NPP LFP25.6-100',
    chemistry: 'lifepo4',
    systemVoltageV: 24,
    nominalCapacityAh: 100,
    parameters: {
      chemistry: 'lifepo4',
      nominalVoltageV: 25.6,
      depthOfDischarge: 1,
      chargeEfficiency: 0.995,
      dischargeEfficiency: 0.96,
      maxChargeCurrentA: 50,
      maxContinuousDischargeCurrentA: 100,
      chargeVoltageV: 29.2,
      dischargeCutoffVoltageV: 22.4,
    },
    nominalCapacityTestConditionsPt: 'C5 a 25 °C',
    chargeEfficiencyTestConditionsPt: '0,2C a 25 °C',
    dischargeEfficiencyTestConditionsPt: '1C a 25 °C; aplicado o menor valor da faixa publicada (96–99%)',
    depthOfDischargeBasisPt: '100% DoD é a condição publicada para o ensaio de vida cíclica a 0,2C, não uma garantia de longevidade em qualquer uso.',
    maxSeriesBatteries: 2,
    maxParallelBatteries: 6,
    sources: [
      {
        name: 'NPP Power — ficha técnica LFP25.6-100',
        url: 'https://npp-power.eu/wp-content/uploads/2024/01/LFP25.6-100_ext.pdf',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Referência editável de modelo específico, não perfil universal de LiFePO₄. A ficha consultada publica corrente máxima de carga e corrente contínua de descarga, mas não foi cadastrado limite de descarga de pico. As eficiências são válidas somente nas taxas e temperatura indicadas; o catálogo não extrapola esses resultados para outras condições.',
  },
];

export const leadAcidBatteryReference = {
  id: 'freedom-df4100',
  namePt: 'Freedom DF4100 — 12 V / 220 Ah em C20',
  nominalCapacityAh: 220,
  parameters: {
    chemistry: 'lead-acid',
    nominalVoltageV: 12,
    depthOfDischarge: 0.2,
  },
  capacityRatings: [
    { hours: 10, capacityAh: 200 },
    { hours: 20, capacityAh: 220 },
    { hours: 100, capacityAh: 240 },
  ],
  nominalCapacityTestConditionsPt: 'Capacidades a 25 °C; referência de dimensionamento em C20.',
  depthOfDischargeBasisPt:
    '20% DoD a 25 °C é a condição publicada para vida útil projetada superior a quatro anos, não um limite máximo de descarga nem garantia em qualquer uso.',
  chargeVoltageRangeV: { minimum: 14.4, maximum: 15.5 },
  floatVoltageRangeV: { minimum: 13.2, maximum: 13.8 },
  dischargeTestEndVoltageV: 10.5,
  sourceDocumentPt: 'Especifica_o_T_cnica_-_Bateria_Estacion_ria_Freedom_DF.pdf — catálogo técnico Freedom by Heliar fornecido pelo proprietário; páginas 3–5 do PDF.',
  source: {
    name: 'NeoSolar — anúncio da Freedom DF4100',
    url: 'https://www.neosolar.com.br/loja/bateria-estacionaria-freedom-df4001-240ah-220ah.html',
    accessedOn: '2026-11-19',
  },
  notePt:
    'Referência editável de chumbo-ácido com eletrólito fluido; não é AGM ou GEL. Eficiências de carga e descarga e limites máximos de corrente não são informados na ficha fornecida. Não confundir correntes de ensaio com limites de operação.',
} as const;

export const agmBatteryReference = {
  id: 'rolls-s12-230agm-re',
  namePt: 'Rolls S12-230AGM-RE — 12 V / 210 Ah em C20',
  nominalVoltageV: 12,
  nominalCapacityAh: 210,
  depthOfDischarge: 0.5,
  nominalCapacityTestConditionsPt: 'C20 a 25 °C; os 230 Ah do nome correspondem a C100.',
  depthOfDischargeBasisPt:
    'DoD inicial de 50% segue a orientação geral da Rolls para equilibrar capacidade e vida cíclica em sistemas off-grid; é editável, não um limite máximo específico deste modelo nem garantia de vida útil.',
  chargeVoltageV: 14.7,
  floatVoltageV: 13.8,
  recommendedChargeCurrentA: 40,
  maxChargeCurrentA: 65,
  sources: [
    {
      name: 'Rolls Battery — S12-230AGM-RE, revisão 5 de agosto de 2022',
      url: 'https://rollsbattery.com/battery/s12-230agm-re/',
      accessedOn: '2026-11-19',
    },
    {
      name: 'Rolls Battery — dimensionamento de sistemas off-grid',
      url: 'https://support.rollsbattery.com/en/support/solutions/articles/246449-what-is-the-best-battery-for-off-grid-systems-',
      accessedOn: '2026-11-19',
    },
  ],
} as const;

export interface PvModuleCatalogItem {
  id: string;
  namePt: string;
  nominalVoltageV: 12;
  parameters: PvModuleParameters;
  powerTolerancePercent: number;
  sources: readonly SolarCatalogSource[];
  notePt: string;
}

export const pvModuleCatalog: readonly PvModuleCatalogItem[] = [
  {
    id: 'renogy-rng-100db-h',
    namePt: 'Painel solar flexível Renogy 100 W — referência RNG-100DB-H',
    nominalVoltageV: 12,
    parameters: {
      powerWp: 100,
      vocV: 24.4,
      vmpV: 20.7,
      iscA: 5.16,
      impA: 4.84,
    },
    powerTolerancePercent: 3,
    sources: [
      {
        name: 'Renogy — página do produto',
        url: 'https://www.renogy.com/es/products/100-watt-12-volt-flexible-monocrystalline-solar-panel',
        accessedOn: '2026-11-18',
      },
      {
        name: 'Renogy — ficha técnica vinculada à página (RNG-100DB-H-G3)',
        url: 'https://www.renogy.com/cdn/shop/files/RNG-100DB-H-G3_20Datashhet.pdf?v=2121247365811578325',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Valores elétricos de placa publicados pelo fabricante. Não foram cadastrados coeficientes térmicos: a ficha vinculada é identificada como G3, e a página atual não publica coeficientes de Vmp e Imp. As verificações que dependem de correção térmica ficam pendentes, sem estimativas.',
  },
];

export interface MpptCatalogItem {
  id: string;
  namePt: string;
  supportedBatteryVoltagesV: readonly (12 | 24 | 48)[];
  maxPvOpenCircuitVoltageV: number;
  maxPvShortCircuitCurrentA: number;
  maxChargeCurrentA: number;
  peakEfficiency: number;
  nominalPvPowerWpByBatteryVoltage: Readonly<Partial<Record<12 | 24 | 48, number>>>;
  minPvOperatingVoltageAboveBatteryV: number;
  minPvStartupVoltageAboveBatteryV: number;
  sources: readonly SolarCatalogSource[];
  notePt: string;
}

export const mpptCatalog: readonly MpptCatalogItem[] = [
  {
    id: 'victron-smartsolar-mppt-100-20',
    namePt: 'Controlador MPPT Victron SmartSolar 100/20',
    supportedBatteryVoltagesV: [12, 24, 48],
    maxPvOpenCircuitVoltageV: 100,
    maxPvShortCircuitCurrentA: 20,
    maxChargeCurrentA: 20,
    peakEfficiency: 0.98,
    nominalPvPowerWpByBatteryVoltage: { 12: 290, 24: 580, 48: 1160 },
    minPvOperatingVoltageAboveBatteryV: 1,
    minPvStartupVoltageAboveBatteryV: 5,
    sources: [
      {
        name: 'Victron Energy — manual SmartSolar MPPT 75/10 a 100/20',
        url: 'https://www.victronenergy.com/media/pg/Manual_SmartSolar_MPPT_75-10_up_to_100-20/en/technical-specifications.html',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Referência editável; a eficiência publicada é de pico. O controlador limita a potência PV de entrada quando o arranjo excede a potência nominal. O fabricante publica limite de corrente de curto-circuito, mas não um limite separado de corrente operacional PV. A tensão PV mínima é relativa à tensão da bateria: +5 V para iniciar e +1 V após iniciar.',
  },
];

export interface InverterCatalogItem {
  id: string;
  namePt: string;
  batteryVoltageV: 12 | 24;
  outputVoltageV: 230;
  outputVoltageTolerancePercent: 3;
  continuousOutputPowerW: 200;
  peakOutputPowerW: 400;
  maximumEfficiency: number;
  zeroLoadPowerW: number;
  ecoModePowerW: number;
  sources: readonly SolarCatalogSource[];
  notePt: string;
}

export const inverterCatalog: readonly InverterCatalogItem[] = [
  {
    id: 'victron-sun-inverter-12-250',
    namePt: 'Inversor Victron SUN 12/250 — referência 230 Vac',
    batteryVoltageV: 12,
    outputVoltageV: 230,
    outputVoltageTolerancePercent: 3,
    continuousOutputPowerW: 200,
    peakOutputPowerW: 400,
    maximumEfficiency: 0.87,
    zeroLoadPowerW: 4.2,
    ecoModePowerW: 0.8,
    sources: [
      {
        name: 'Victron Energy — SUN Inverter, especificações técnicas',
        url: 'https://www.victronenergy.com/media/pg/Sun_Inverter/en/technical-specifications.html',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Referência editável de saída nominal 230 Vac; não representa inversor nominal de 127 V ou 220 V. A eficiência informada é máxima, não uma eficiência garantida em todas as cargas.',
  },
  {
    id: 'victron-sun-inverter-24-250',
    namePt: 'Inversor Victron SUN 24/250 — referência 230 Vac',
    batteryVoltageV: 24,
    outputVoltageV: 230,
    outputVoltageTolerancePercent: 3,
    continuousOutputPowerW: 200,
    peakOutputPowerW: 400,
    maximumEfficiency: 0.88,
    zeroLoadPowerW: 5.2,
    ecoModePowerW: 1.3,
    sources: [
      {
        name: 'Victron Energy — SUN Inverter, especificações técnicas',
        url: 'https://www.victronenergy.com/media/pg/Sun_Inverter/en/technical-specifications.html',
        accessedOn: '2026-11-18',
      },
    ],
    notePt:
      'Referência editável de saída nominal 230 Vac; não representa inversor nominal de 127 V ou 220 V. A eficiência informada é máxima, não uma eficiência garantida em todas as cargas.',
  },
];

export interface BatteryTechnologyCatalogEntry {
  chemistry: BatteryChemistry;
  labelPt: string;
  profileStatus: 'has-model-specific-reference' | 'requires-battery-specific-data';
  referenceProfileIds: readonly string[];
  requiredDatasheetFields: readonly (
    | 'nominalVoltageV'
    | 'nominalCapacityAh'
    | 'depthOfDischarge'
    | 'chargeEfficiency'
    | 'dischargeEfficiency'
    | 'chargeVoltageV'
    | 'dischargeCutoffVoltageV'
  )[];
  optionalDatasheetFields: readonly (
    | 'maxChargeCurrentA'
    | 'maxContinuousDischargeCurrentA'
    | 'maxPeakDischargeCurrentA'
  )[];
  notePt: string;
}

export const batteryTechnologyCatalog: readonly BatteryTechnologyCatalogEntry[] = [
  {
    chemistry: 'lead-acid',
    labelPt: 'Chumbo-ácido',
    profileStatus: 'requires-battery-specific-data',
    referenceProfileIds: [leadAcidBatteryReference.id],
    requiredDatasheetFields: [
      'nominalVoltageV',
      'nominalCapacityAh',
      'depthOfDischarge',
    ],
    optionalDatasheetFields: [
      'maxChargeCurrentA',
      'maxContinuousDischargeCurrentA',
      'maxPeakDischargeCurrentA',
    ],
    notePt:
      'A referência Freedom DF4100 usa a capacidade de descarga publicada em C20 a 25 °C para o guia básico. Não exige eficiências direcionais ou tensões de carga/corte para estimar a quantidade de baterias; esses parâmetros pertencem ao projeto de recarga e proteção.',
  },
  {
    chemistry: 'agm',
    labelPt: 'AGM',
    profileStatus: 'has-model-specific-reference',
    referenceProfileIds: [agmBatteryReference.id],
    requiredDatasheetFields: ['nominalVoltageV', 'nominalCapacityAh', 'depthOfDischarge'],
    optionalDatasheetFields: ['maxChargeCurrentA', 'maxContinuousDischargeCurrentA', 'maxPeakDischargeCurrentA'],
    notePt:
      'AGM também é chumbo-ácido; a opção separada usa a Rolls S12-230AGM-RE em C20 e estima o banco pela capacidade de descarga publicada, sem presumir eficiências direcionais.',
  },
  {
    chemistry: 'lifepo4',
    labelPt: 'Lítio LiFePO4',
    profileStatus: 'has-model-specific-reference',
    referenceProfileIds: ['npp-lfp12-8-100', 'npp-lfp25-6-100'],
    requiredDatasheetFields: [
      'nominalVoltageV',
      'nominalCapacityAh',
      'depthOfDischarge',
      'chargeEfficiency',
      'dischargeEfficiency',
      'chargeVoltageV',
      'dischargeCutoffVoltageV',
    ],
    optionalDatasheetFields: [
      'maxChargeCurrentA',
      'maxContinuousDischargeCurrentA',
      'maxPeakDischargeCurrentA',
    ],
    notePt:
      'Há referências editáveis de modelos específicos, não valores genéricos para toda a química. Eficiências, profundidade de descarga e limites do BMS variam por modelo e condições; use os dados da bateria escolhida.',
  },
];
