import {
  calculateBatteryCapacity,
  calculateDailyConsumption,
  calculateInverterSizing,
  calculateSolarCoverage,
} from './calculations.ts';
import type { BatteryCapacityParameters, DailyConsumption, ElectricalLoad, InverterSizing, SolarCoverage } from './calculations.ts';

export interface SolarReportLoadInput {
  name: string;
  categoryLabelPt: string;
  originLabelPt: string;
  load: ElectricalLoad;
}

export interface SolarReportSolarInput {
  countryLabelPt: string;
  peakSunHours: number;
  moduleDeratingFactor: number;
  systemDeratingFactor: number;
  batteryRoundTripEfficiency: number;
  availableArrayPowerWp?: number;
}

export interface SolarReportInput {
  projectName: string;
  generatedAt: string;
  applicationVersion: string;
  vehicleLabelPt: string;
  systemVoltageV: 12 | 24;
  loads: SolarReportLoadInput[];
  /** Estimativa solar opcional; ausente quando o usuário não pede painéis. */
  solar?: SolarReportSolarInput;
  inverter: {
    ratedPowerW?: number;
    efficiency: number;
    standbyPowerW: number;
    standbyHoursPerDay: number;
    outputVoltageV: number | null;
  };
  battery: BatteryCapacityParameters & {
    nominalVoltageV: number;
    chargeVoltageV?: number;
    dischargeCutoffVoltageV?: number;
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
  loads: SolarReportLoad[];
  solar?: SolarCoverage & { countryLabelPt: string };
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
    chargeEfficiency?: number;
    chargeVoltageV?: number;
    dischargeCutoffVoltageV?: number;
  };
  inverter: InverterSizing | undefined;
  inverterRatedPowerW?: number;
  inverterOutputVoltageV: number | null;
  inverterEfficiency: number;
  inverterStandbyPowerW: number;
  inverterStandbyHoursPerDay: number;
  warnings: string[];
  calculationNotes: string[];
}

const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const displayNumber = (value: number) => numberFormat.format(value);

function describeLoadBasis(load: ElectricalLoad): string {
  const basis = load.basis;
  switch (basis.kind) {
    case 'power-time':
      return `${displayNumber(basis.powerW)} W × ${basis.hoursPerDay > 0 && basis.hoursPerDay < 1 ? `${displayNumber(basis.hoursPerDay * 60)} min/dia` : `${displayNumber(basis.hoursPerDay)} h/dia`}`;
    case 'average-power-24h':
      return `${displayNumber(basis.averagePowerW)} W médios × 24 h/dia`;
    case 'compressor-cycle':
      return `${displayNumber(basis.runningPowerW)} W × ${displayNumber(basis.operatingWindowHoursPerDay)} h/dia × ${displayNumber(basis.dutyCycle * 100)}%`;
    case 'daily-energy':
      return `${displayNumber(basis.energyWhPerDay)} Wh/dia informado`;
    case 'current-time':
      return `${displayNumber(basis.currentA)} A × ${displayNumber(basis.voltageV)} V × ${displayNumber(basis.hoursPerDay)} h/dia`;
    case 'monthly-energy':
      return `${displayNumber(basis.energyKWhPerMonth)} kWh/mês ÷ 30 dias`;
    case 'amp-hours-per-day':
      return `${displayNumber(basis.ampHoursPerDay)} Ah/dia × ${displayNumber(basis.voltageV)} V`;
  }
}

export function buildSolarReport(input: SolarReportInput): SolarReport {
  if (input.inverter.ratedPowerW !== undefined
    && (!Number.isFinite(input.inverter.ratedPowerW) || input.inverter.ratedPowerW <= 0)) {
    throw new RangeError('Informe uma potência do inversor maior que zero.');
  }
  if (!Number.isFinite(input.unitCapacityAh) || input.unitCapacityAh <= 0
    || !Number.isFinite(input.unitVoltageV) || input.unitVoltageV <= 0) {
    throw new RangeError('Informe tensão e capacidade por bateria maiores que zero.');
  }
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
  const solar = input.solar ? {
    countryLabelPt: input.solar.countryLabelPt,
    ...calculateSolarCoverage({
      dailyEnergyAtBatteryBusWh: consumption.totalAtBatteryBusWhPerDay,
      peakSunHours: input.solar.peakSunHours,
      moduleDeratingFactor: input.solar.moduleDeratingFactor,
      systemDeratingFactor: input.solar.systemDeratingFactor,
      batteryRoundTripEfficiency: input.solar.batteryRoundTripEfficiency,
      systemVoltageV: input.systemVoltageV,
      availableArrayPowerWp: input.solar.availableArrayPowerWp,
    }),
  } : undefined;
  const warnings = [
    ...(inverter && input.inverter.ratedPowerW !== undefined && inverter.minimumContinuousPowerW > input.inverter.ratedPowerW
      ? [`A potência contínua escolhida para o inversor (${displayNumber(input.inverter.ratedPowerW)} W) é menor que a exigida pelas cargas simultâneas (${displayNumber(inverter.minimumContinuousPowerW)} W). Escolha um inversor maior ou reduza a simultaneidade.`]
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
    loads: reportLoads,
    solar,
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
      ...(input.battery.capacityBasis === 'published-discharge' ? {} : { chargeEfficiency: input.battery.chargeEfficiency }),
      chargeVoltageV: input.battery.chargeVoltageV,
      dischargeCutoffVoltageV: input.battery.dischargeCutoffVoltageV,
    },
    inverter,
    inverterRatedPowerW: input.inverter.ratedPowerW,
    inverterOutputVoltageV: input.inverter.outputVoltageV,
    inverterEfficiency: input.inverter.efficiency,
    inverterStandbyPowerW: input.inverter.standbyPowerW,
    inverterStandbyHoursPerDay: input.inverter.standbyHoursPerDay,
    warnings,
    calculationNotes: [
      'Consumo da bateria: soma dos equipamentos DC, dos equipamentos AC com as perdas do inversor e do consumo do inversor ligado sem carga.',
      battery.capacityBasis === 'published-discharge'
        ? `Capacidade publicada: usamos a descarga da referência ${battery.chemistry === 'agm' ? 'Rolls S12-230AGM-RE' : 'Freedom DF4100'} em C20 a 25 °C. A energia em Wh é aproximada; não foi presumida eficiência de 100%. Valores editados precisam corresponder à bateria escolhida.`
        : 'Capacidade do banco: consideramos o consumo diário, a autonomia, a profundidade de descarga (DoD) e a eficiência de descarga informada.',
      ...(battery.capacityBasis === 'published-discharge' ? [
        battery.chemistry === 'agm'
          ? 'DoD inicial de 50%: segue a orientação geral da Rolls para equilibrar capacidade e vida útil em sistemas off-grid; não é um limite máximo específico deste modelo.'
          : 'DoD inicial de 20%: é a condição de vida útil publicada pela Freedom, não o limite máximo de descarga.',
      ] : []),
      'Autonomia real: temperatura, envelhecimento, regime de descarga e perdas da instalação podem reduzir o tempo disponível. A contagem por capacidade não aprova a montagem em série/paralelo.',
      ...(inverter ? [
        'Inversor: usamos apenas as cargas AC marcadas como simultâneas e os picos informados. A escolha final também depende dos limites de descarga da bateria e da duração das partidas.',
      ] : []),
      ...(solar ? [
        'Energia solar: método do mês crítico do Manual de Engenharia para Sistemas Fotovoltaicos (CRESESB/CEPEL, 2014), com a HSP informada. Médias anuais escondem os meses de pouco sol; para uso no inverno, informe a HSP do mês mais crítico do local.',
        'Controlador de carga: a corrente mínima é uma estimativa conservadora (potência nominal dos painéis ÷ tensão do banco). Confira na ficha do controlador e dos painéis a tensão máxima de entrada, sobretudo em dias frios, quando a tensão dos módulos aumenta.',
      ] : []),
      `Fora deste guia: ${solar ? '' : 'painéis, controlador, '}carregadores, cabos, proteções e energia/tempo de recarga não foram dimensionados aqui. Esses itens precisam do projeto da instalação e das normas brasileiras aplicáveis ao veículo.`,
    ],
  };
}
