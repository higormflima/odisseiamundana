import type {
  BatteryParameters,
  BatteryChemistry,
  ElectricalLoad,
  PvModuleParameters,
} from './calculations.ts';

export interface SolarResourceRecord {
  countryIso3: string;
  countryNamePt: string;
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
  accessedOn: '2026-11-18',
  attribution:
    'Contains modified Copernicus Climate Change Service information. Neither the European Commission nor ECMWF is responsible for any use that may be made of the Copernicus information or data it contains. Changes made: monthly grids aggregated to Natural Earth 5.1.1 admin-0 feature area-weighted means.',
} as const;

export const solarResourceNoticePt =
  'A HSP é uma aproximação baseada na média nacional anual modelada. Não representa uma medição local nem uma condição sazonal; em países extensos, a insolação pode variar bastante. Ajuste o valor para o local e a época do projeto quando houver dados mais adequados.';

export const solarResourceCountries: readonly SolarResourceRecord[] = [
  { countryIso3: 'BRA', countryNamePt: 'Brasil', peakSunHours: 5.015 },
  { countryIso3: 'CHN', countryNamePt: 'China', peakSunHours: 4.647 },
  { countryIso3: 'FIN', countryNamePt: 'Finlândia', peakSunHours: 2.318 },
  { countryIso3: 'KEN', countryNamePt: 'Quênia', peakSunHours: 5.85 },
  { countryIso3: 'MEX', countryNamePt: 'México', peakSunHours: 5.723 },
  { countryIso3: 'OMN', countryNamePt: 'Omã', peakSunHours: 6.292 },
  { countryIso3: 'PHL', countryNamePt: 'Filipinas', peakSunHours: 5.031 },
  { countryIso3: 'POL', countryNamePt: 'Polônia', peakSunHours: 2.989 },
];

export const equipmentCategories = [
  { id: 'refrigeration', labelPt: 'Refrigeração' },
  { id: 'lighting', labelPt: 'Iluminação' },
  { id: 'cooking', labelPt: 'Cozinha' },
  { id: 'electronics', labelPt: 'Eletrônicos' },
  { id: 'water', labelPt: 'Água' },
  { id: 'climate', labelPt: 'Climatização' },
  { id: 'other', labelPt: 'Outros' },
] as const;

export interface EquipmentCatalogItem {
  referenceKind: 'manufacturer' | 'usage-example';
  id: string;
  categoryId: (typeof equipmentCategories)[number]['id'];
  namePt: string;
  defaultLoad: ElectricalLoad;
  applicableSystemVoltagesV: readonly (12 | 24)[];
  sourceMeasurement: {
    value: number;
    unit: string;
    voltageV: number;
    conditions: string;
  };
  derivationPt: string;
  source: {
    name: string;
    url: string;
    accessedOn: string;
  };
}

export const equipmentCatalog: readonly EquipmentCatalogItem[] = [
  {
    referenceKind: 'manufacturer',
    id: 'dometic-cfx5-45',
    categoryId: 'refrigeration',
    namePt: 'Geladeira portátil com compressor de 45 L — referência CFX5 45',
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
  ...([
    { id: 'example-led-light', categoryId: 'lighting', namePt: 'Luminária LED 12 V — exemplo', powerW: 3, hoursPerDay: 4, usagePt: '4 h/dia por luminária', supply: 'dc', voltageV: 12 },
    { id: 'example-coffee-maker', categoryId: 'cooking', namePt: 'Cafeteira elétrica AC — exemplo', powerW: 900, hoursPerDay: 0.25, usagePt: '15 min/dia', supply: 'ac', voltageV: 120 },
    { id: 'example-laptop', categoryId: 'electronics', namePt: 'Notebook com carregador AC — exemplo', powerW: 60, hoursPerDay: 4, usagePt: '4 h/dia', supply: 'ac', voltageV: 120 },
    { id: 'example-water-pump', categoryId: 'water', namePt: 'Bomba de água 12 V — exemplo', powerW: 75, hoursPerDay: 1 / 3, usagePt: '20 min/dia de funcionamento efetivo', supply: 'dc', voltageV: 12 },
    { id: 'example-roof-fan', categoryId: 'climate', namePt: 'Exaustor de teto 12 V — exemplo', powerW: 30, hoursPerDay: 6, usagePt: '6 h/dia', supply: 'dc', voltageV: 12 },
    { id: 'example-background-loads', categoryId: 'other', namePt: 'Detectores e controles em espera 12 V — exemplo', powerW: 6, hoursPerDay: 24, usagePt: '24 h/dia para o conjunto de pequenos consumos', supply: 'dc', voltageV: 12 },
  ] as const).map((example): EquipmentCatalogItem => ({
    id: example.id,
    referenceKind: 'usage-example',
    categoryId: example.categoryId,
    namePt: example.namePt,
    defaultLoad: {
      id: example.id,
      supply: example.supply,
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'power-time', powerW: example.powerW, hoursPerDay: example.hoursPerDay },
      ...(example.supply === 'ac' ? { ratedPowerW: example.powerW } : {}),
    },
    applicableSystemVoltagesV: example.supply === 'dc' ? [12] : [12, 24],
    sourceMeasurement: {
      value: example.powerW,
      unit: 'W',
      voltageV: example.voltageV,
      conditions: `Cenário genérico de uso, não medição de fabricante: ${example.powerW} W por ${example.usagePt}. Circuito da fonte: ${example.voltageV} V ${example.supply.toUpperCase()}`,
    },
    derivationPt: `${example.powerW} W × ${example.hoursPerDay.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} h/dia = ${(example.powerW * example.hoursPerDay).toLocaleString('pt-BR')} Wh/dia por unidade, antes das perdas do inversor.${example.id === 'example-water-pump' ? ' O tempo é 20/60 h, sem arredondamento no cálculo.' : ''}`,
    source: {
      name: 'RVing Toolbox — exemplos de consumo diário em motorhomes',
      url: 'https://rvingtoolbox.com/calculators/power-budget',
      accessedOn: '2026-11-19',
    },
  })),
];

export function buildEquipmentLoad(
  item: EquipmentCatalogItem,
  quantity: number,
  usage?: { powerW: number; hoursPerDay: number },
): ElectricalLoad {
  if (!usage) return { ...item.defaultLoad, quantity };
  if (item.defaultLoad.basis.kind !== 'power-time') {
    throw new TypeError('Este equipamento não usa um perfil de potência e tempo.');
  }
  return {
    ...item.defaultLoad,
    quantity,
    basis: { kind: 'power-time', ...usage },
    ...(item.defaultLoad.supply === 'ac' ? { ratedPowerW: usage.powerW } : {}),
  };
}

export interface SolarCatalogSource {
  name: string;
  url: string;
  accessedOn: string;
}

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
