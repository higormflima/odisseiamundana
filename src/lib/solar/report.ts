import {
  calculateBatteryCapacity,
  calculateDailyConsumption,
  calculateInverterSizing,
} from './calculations.ts';
import type { BatteryParameters, DailyConsumption, ElectricalLoad, InverterSizing } from './calculations.ts';

export interface SolarReportLoadInput {
  name: string;
  categoryLabelPt: string;
  originLabelPt: string;
  load: ElectricalLoad;
}

export interface SolarReportInput {
  projectName: string;
  generatedAt: string;
  applicationVersion: string;
  vehicleLabelPt: string;
  systemVoltageV: 12 | 24;
  countryLabelPt: string;
  peakSunHours: number;
  loads: SolarReportLoadInput[];
  inverter: {
    efficiency: number;
    standbyPowerW: number;
    standbyHoursPerDay: number;
    outputVoltageV: number | null;
  };
  battery: BatteryParameters & {
    nominalVoltageV: number;
    chargeVoltageV: number;
    dischargeCutoffVoltageV: number;
  };
  autonomyDays: number;
  unitCapacityAh: number;
  unitVoltageV: number;
  maxParallelBatteries?: number;
  batteryProfileLabelPt: string;
}

export interface SolarReportLoad {
  id: string;
  name: string;
  categoryLabelPt: string;
  originLabelPt: string;
  supply: 'dc' | 'ac';
  quantity: number;
  basisSummaryPt: string;
  energyWhPerDay: number;
}

export interface SolarReport {
  projectName: string;
  generatedAt: string;
  applicationVersion: string;
  vehicleLabelPt: string;
  systemVoltageV: 12 | 24;
  countryLabelPt: string;
  peakSunHours: number;
  loads: SolarReportLoad[];
  consumption: DailyConsumption;
  battery: ReturnType<typeof calculateBatteryCapacity>;
  batteryConfiguration: {
    unitVoltageV: number;
    unitCapacityAh: number;
    seriesCount: number;
    parallelCount: number;
    totalCount: number;
    maxParallelBatteries?: number;
    withinKnownLimit: boolean;
    profileLabelPt: string;
    chargeEfficiency: number;
    chargeVoltageV: number;
    dischargeCutoffVoltageV: number;
  };
  inverter: InverterSizing | undefined;
  inverterOutputVoltageV: number | null;
  inverterEfficiency: number;
  inverterStandbyPowerW: number;
  inverterStandbyHoursPerDay: number;
  pvStatus: string;
  mpptStatus: string;
  dcDcChargerStatus: string;
  acDcChargerStatus: string;
  cableCircuits: Array<{ namePt: string; statusPt: string }>;
  warnings: string[];
  calculationNotes: string[];
}

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const displayNumber = (value: number) => numberFormat.format(value);

function describeLoadBasis(load: ElectricalLoad): string {
  const basis = load.basis;
  switch (basis.kind) {
    case 'power-time':
      return `${displayNumber(basis.powerW)} W × ${displayNumber(basis.hoursPerDay)} h/dia`;
    case 'average-power-24h':
      return `${displayNumber(basis.averagePowerW)} W médios × 24 h/dia`;
    case 'compressor-cycle':
      return `${displayNumber(basis.runningPowerW)} W × ${displayNumber(basis.operatingWindowHoursPerDay)} h/dia × ${displayNumber(basis.dutyCycle * 100)}%`;
    case 'daily-energy':
      return `${displayNumber(basis.energyWhPerDay)} Wh/dia informado`;
    case 'current-time':
      return `${displayNumber(basis.currentA)} A × ${displayNumber(basis.voltageV)} V × ${displayNumber(basis.hoursPerDay)} h/dia`;
  }
}

export function buildSolarReport(input: SolarReportInput): SolarReport {
  const loads = input.loads.map((item) => item.load);
  const consumption = calculateDailyConsumption(
    loads,
    input.systemVoltageV,
    input.inverter.efficiency,
    input.inverter.standbyPowerW,
    input.inverter.standbyHoursPerDay,
  );
  const battery = calculateBatteryCapacity(
    consumption.totalAtBatteryBusWhPerDay,
    input.autonomyDays,
    input.systemVoltageV,
    input.battery,
  );
  const seriesCount = input.battery.chemistry === 'lifepo4'
    ? 1
    : input.systemVoltageV / input.unitVoltageV;
  if (!Number.isInteger(seriesCount) || seriesCount < 1) {
    throw new RangeError('A tensão por bateria não forma uma configuração compatível com o banco.');
  }
  const parallelCount = Math.ceil(battery.nominalCapacityAh / input.unitCapacityAh);
  const hasAcLoads = loads.some((load) => load.supply === 'ac');
  const inverter = hasAcLoads
    ? calculateInverterSizing(loads, input.systemVoltageV, input.inverter.efficiency, input.battery)
    : undefined;
  const energyByLoadId = new Map(consumption.loads.map((item) => [item.id, item.applianceEnergyWhPerDay]));
  const reportLoads = input.loads.map(({ load, ...item }) => ({
    id: load.id,
    name: item.name,
    categoryLabelPt: item.categoryLabelPt,
    originLabelPt: item.originLabelPt,
    supply: load.supply,
    quantity: load.quantity,
    basisSummaryPt: describeLoadBasis(load),
    energyWhPerDay: energyByLoadId.get(load.id) ?? 0,
  }));
  const withinKnownLimit = input.maxParallelBatteries === undefined
    || parallelCount <= input.maxParallelBatteries;
  const warnings = [
    'O dimensionamento fotovoltaico e a compatibilidade do MPPT permanecem pendentes: faltam parâmetros validados de perdas, temperatura do módulo e limites do controlador.',
    'Os carregadores DC-DC e AC-DC permanecem pendentes: faltam metas de recarga e limites das fontes de entrada.',
    'Cabos e proteções permanecem sem valores numéricos: faltam comprimentos, método de instalação, temperatura, agrupamento e validação normativa específica.',
    ...(input.battery.maxChargeCurrentA === undefined
      ? ['A corrente máxima de carga da bateria/BMS não foi informada; a compatibilidade dos carregadores não pode ser verificada.']
      : []),
    ...(input.battery.maxContinuousDischargeCurrentA === undefined
      ? ['A corrente contínua máxima de descarga da bateria/BMS não foi informada; a compatibilidade da corrente do inversor não pode ser verificada.']
      : []),
    ...(input.battery.chemistry === 'lifepo4' && input.battery.maxPeakDischargeCurrentA === undefined
      ? ['A ficha de referência não informa limite de descarga de pico; a verificação de picos do inversor depende da bateria escolhida.']
      : []),
    ...(inverter?.compatibility === 'exceeds-known-limits'
      ? ['A corrente calculada do inversor excede um limite de descarga informado para a bateria/BMS.']
      : []),
    ...(!withinKnownLimit
      ? [`A quantidade em paralelo calculada (${parallelCount}) excede o limite publicado de ${input.maxParallelBatteries}; não há recomendação de configuração.`]
      : []),
  ];

  return {
    projectName: input.projectName,
    generatedAt: input.generatedAt,
    applicationVersion: input.applicationVersion,
    vehicleLabelPt: input.vehicleLabelPt,
    systemVoltageV: input.systemVoltageV,
    countryLabelPt: input.countryLabelPt,
    peakSunHours: input.peakSunHours,
    loads: reportLoads,
    consumption,
    battery,
    batteryConfiguration: {
      unitVoltageV: input.unitVoltageV,
      unitCapacityAh: input.unitCapacityAh,
      seriesCount,
      parallelCount,
      totalCount: seriesCount * parallelCount,
      maxParallelBatteries: input.maxParallelBatteries,
      withinKnownLimit,
      profileLabelPt: input.batteryProfileLabelPt,
      chargeEfficiency: input.battery.chargeEfficiency,
      chargeVoltageV: input.battery.chargeVoltageV,
      dischargeCutoffVoltageV: input.battery.dischargeCutoffVoltageV,
    },
    inverter,
    inverterOutputVoltageV: input.inverter.outputVoltageV,
    inverterEfficiency: input.inverter.efficiency,
    inverterStandbyPowerW: input.inverter.standbyPowerW,
    inverterStandbyHoursPerDay: input.inverter.standbyHoursPerDay,
    pvStatus: 'Não foi possível dimensionar com segurança: faltam o fator de desempenho do arranjo, coeficientes térmicos confirmados do módulo e parâmetros validados do controlador.',
    mpptStatus: 'Tipo sugerido: MPPT. Corrente, potência suportada, tensão PV máxima e configuração série/paralelo não foram calculadas porque dependem dos parâmetros confirmados do arranjo e do controlador.',
    dcDcChargerStatus: 'Não foi possível dimensionar com segurança: informe a energia a repor, o tempo de recarga e a corrente que sobra no alternador após as cargas do veículo.',
    acDcChargerStatus: 'Não foi possível dimensionar com segurança: informe a energia a repor, o tempo de recarga e os limites de eficiência, fator de potência e corrente do circuito AC.',
    cableCircuits: [
      { namePt: 'Painéis → controlador MPPT', statusPt: 'Pendente: arranjo, corrente e comprimento do circuito.' },
      { namePt: 'Controlador MPPT → bateria', statusPt: 'Pendente: corrente e comprimento do circuito.' },
      ...(hasAcLoads ? [{ namePt: 'Bateria → inversor', statusPt: 'Pendente: corrente, pico e comprimento do circuito.' }] : []),
      { namePt: 'Carregador DC-DC → bateria', statusPt: 'Pendente: carregador e comprimento do circuito.' },
      { namePt: 'Carregador AC-DC → bateria', statusPt: 'Pendente: carregador e comprimento do circuito.' },
    ],
    warnings,
    calculationNotes: [
      'Consumo no barramento da bateria = cargas DC + cargas AC divididas pela eficiência do inversor + consumo em espera informado.',
      'Capacidade utilizável = consumo diário no barramento × autonomia; capacidade nominal = capacidade utilizável ÷ (DoD × eficiência de descarga).',
      'A corrente contínua do inversor considera somente cargas AC marcadas como simultâneas. A potência de pico considera os picos informados para esse mesmo grupo.',
      'Nenhum valor de cabo, fusível ou disjuntor é estimado sem dados de instalação suficientes.',
    ],
  };
}
