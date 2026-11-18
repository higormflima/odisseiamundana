export type BatteryChemistry = 'lead-acid' | 'lifepo4';

export type LoadBasis =
  | { kind: 'power-time'; powerW: number; hoursPerDay: number }
  | { kind: 'average-power-24h'; averagePowerW: number }
  | { kind: 'compressor-cycle'; runningPowerW: number; operatingWindowHoursPerDay: number; dutyCycle: number }
  | { kind: 'daily-energy'; energyWhPerDay: number }
  | { kind: 'current-time'; currentA: number; voltageV: number; hoursPerDay: number };

export interface ElectricalLoad {
  id: string;
  supply: 'dc' | 'ac';
  quantity: number;
  basis: LoadBasis;
  simultaneous: boolean;
  ratedPowerW?: number;
  startupPowerW?: number;
}

export interface BatteryParameters {
  chemistry: BatteryChemistry;
  nominalVoltageV?: number;
  depthOfDischarge: number;
  chargeEfficiency: number;
  dischargeEfficiency: number;
  maxChargeCurrentA?: number;
  maxContinuousDischargeCurrentA?: number;
  maxPeakDischargeCurrentA?: number;
}

export interface PvModuleParameters {
  powerWp: number;
  vocV: number;
  vmpV: number;
  iscA: number;
  impA: number;
  vocTemperatureCoefficientPerC?: number;
  vmpTemperatureCoefficientPerC?: number;
  iscTemperatureCoefficientPerC?: number;
  impTemperatureCoefficientPerC?: number;
}

export interface MpptParameters {
  minPvOperatingVoltageV: number;
  maxPvVoltageV: number;
  maxPvOperatingCurrentA?: number;
  maxPvShortCircuitCurrentA: number;
  maxChargeCurrentA: number;
  batteryChargeVoltageV: number;
}

export interface PvSizingParameters {
  peakSunHours: number;
  /** Exclui as perdas do MPPT e da bateria, calculadas separadamente. */
  arrayPerformanceRatio: number;
  mpptEfficiency: number;
  minimumModuleTemperatureC: number;
  maximumModuleTemperatureC: number;
  modulesInSeries: number;
  module: PvModuleParameters;
  mppt: MpptParameters;
}

export interface DcDcChargePlan {
  /** Energia que deve ficar armazenada na bateria, não a energia na saída do carregador. */
  energyToStoreWh: number;
  chargeTimeHours: number;
  chargerEfficiency: number;
  vehicleInputVoltageV: number;
  /** Corrente contínua que sobra no alternador depois das cargas do veículo. */
  alternatorAvailableCurrentA?: number;
}

export interface AcDcChargePlan {
  /** Energia que deve ficar armazenada na bateria, não a energia na saída do carregador. */
  energyToStoreWh: number;
  chargeTimeHours: number;
  chargerEfficiency: number;
  inputVoltageV: number;
  inputPowerFactor: number;
  maxInputCurrentA?: number;
}

export interface DailyConsumption {
  loads: Array<{ id: string; supply: 'dc' | 'ac'; applianceEnergyWhPerDay: number; batteryBusEnergyWhPerDay: number }>;
  dcLoadsWhPerDay: number;
  acLoadsWhPerDay: number;
  inverterInputWhPerDay: number;
  inverterStandbyWhPerDay: number;
  totalAtBatteryBusWhPerDay: number;
}

export interface BatterySizing {
  chemistry: BatteryChemistry;
  dailyEnergyAtBatteryBusWh: number;
  autonomyDays: number;
  systemVoltageV: number;
  batteryNominalVoltageV: number;
  depthOfDischarge: number;
  dischargeEfficiency: number;
  usableCapacityWh: number;
  nominalCapacityWh: number;
  nominalCapacityAh: number;
}

export interface PvSizing {
  dailyEnergyAtBatteryBusWh: number;
  peakSunHours: number;
  arrayPerformanceRatio: number;
  mpptEfficiency: number;
  batteryChargeEfficiency: number;
  minimumModuleTemperatureC: number;
  maximumModuleTemperatureC: number;
  moduleParameters: PvModuleParameters;
  mpptParameters: MpptParameters;
  requiredPowerWp: number;
  moduleCount: number;
  modulesInSeries: number;
  parallelStrings: number;
  installedPowerWp: number;
  arrayVocAtMinimumTemperatureV: number | undefined;
  arrayVmpAtMaximumTemperatureV: number | undefined;
  arrayOperatingCurrentAtMaximumTemperatureA: number | undefined;
  arrayShortCircuitCurrentAtMaximumTemperatureA: number | undefined;
  minimumMpptChargeCurrentA: number;
  compatibility: 'compatible' | 'incompatible' | 'requires-confirmation';
  checks: Array<{ name: string; passed: boolean | undefined }>;
}

export interface InverterSizing {
  minimumContinuousPowerW: number;
  minimumPeakPowerW: number;
  minimumContinuousBatteryCurrentA: number;
  minimumPeakBatteryCurrentA: number;
  compatibility: 'within-known-limits' | 'exceeds-known-limits' | 'requires-confirmation';
  checks: Array<{ name: string; passed?: boolean }>;
}

export interface ChargerSizing {
  requiredOutputCurrentA: number;
  requiredOutputPowerW: number;
  requiredInputPowerW: number;
  requiredInputCurrentA: number;
  compatibility: 'within-known-limits' | 'exceeds-known-limits' | 'requires-confirmation';
  checks: Array<{ name: string; passed?: boolean }>;
}

export interface SolarSystemInput {
  systemVoltageV: 12 | 24;
  loads: ElectricalLoad[];
  inverter: {
    efficiency: number;
    standbyPowerW: number;
    standbyHoursPerDay: number;
  };
  battery: BatteryParameters & { chargeVoltageV: number };
  autonomyDays: number;
  pv: PvSizingParameters;
  dcDcChargePlan?: DcDcChargePlan;
  acDcChargePlan?: AcDcChargePlan;
}

export interface SolarSystemResult {
  parametersUsed: SolarSystemInput;
  consumption: DailyConsumption;
  battery: BatterySizing;
  pv: PvSizing;
  inverter: InverterSizing;
  dcDcCharger: ChargerSizing | { status: 'requires-inputs'; reason: string };
  acDcCharger: ChargerSizing | { status: 'requires-inputs'; reason: string };
  cablesAndProtections: { status: 'deferred'; reason: string };
  calculationNotes: string[];
  warnings: string[];
}

function requirePositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} precisa ser um número maior que zero.`);
}

function requireNonNegative(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} precisa ser um número igual ou maior que zero.`);
}

function requireEfficiency(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1) throw new RangeError(`${name} precisa estar no intervalo (0, 1].`);
}

function requireDayHours(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 24) throw new RangeError(`${name} precisa estar entre 0 e 24 horas.`);
}

function requireInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) throw new RangeError(`${name} precisa ser um inteiro maior que zero.`);
}

function requireSystemVoltage(voltageV: number): asserts voltageV is 12 | 24 {
  if (voltageV !== 12 && voltageV !== 24) throw new RangeError('A tensão nominal do sistema precisa ser 12 V ou 24 V.');
}

function calculateLoadEnergy(load: ElectricalLoad, systemVoltageV: number): number {
  if (typeof load.id !== 'string' || (load.supply !== 'dc' && load.supply !== 'ac')) {
    throw new TypeError('Cada carga precisa de identificador e alimentação DC ou AC válidos.');
  }
  requireInteger(load.quantity, `Quantidade da carga "${load.id}"`);
  if (typeof load.simultaneous !== 'boolean') throw new TypeError(`Informe se a carga "${load.id}" pode operar simultaneamente.`);

  let energyPerUnitWh: number;
  switch (load.basis.kind) {
    case 'power-time':
      requirePositive(load.basis.powerW, `Potência da carga "${load.id}"`);
      requireDayHours(load.basis.hoursPerDay, `Horas diárias da carga "${load.id}"`);
      energyPerUnitWh = load.basis.powerW * load.basis.hoursPerDay;
      break;
    case 'average-power-24h':
      requirePositive(load.basis.averagePowerW, `Potência média da carga "${load.id}"`);
      energyPerUnitWh = load.basis.averagePowerW * 24;
      break;
    case 'compressor-cycle':
      requirePositive(load.basis.runningPowerW, `Potência em funcionamento da carga "${load.id}"`);
      requireDayHours(load.basis.operatingWindowHoursPerDay, `Janela diária da carga "${load.id}"`);
      if (!Number.isFinite(load.basis.dutyCycle) || load.basis.dutyCycle < 0 || load.basis.dutyCycle > 1) {
        throw new RangeError(`O ciclo de trabalho da carga "${load.id}" precisa estar entre 0 e 1.`);
      }
      energyPerUnitWh = load.basis.runningPowerW * load.basis.operatingWindowHoursPerDay * load.basis.dutyCycle;
      break;
    case 'daily-energy':
      requirePositive(load.basis.energyWhPerDay, `Energia diária da carga "${load.id}"`);
      energyPerUnitWh = load.basis.energyWhPerDay;
      break;
    case 'current-time':
      if (load.supply !== 'dc') throw new TypeError(`A base corrente-tempo da carga "${load.id}" aceita somente corrente contínua.`);
      requirePositive(load.basis.currentA, `Corrente da carga "${load.id}"`);
      requirePositive(load.basis.voltageV, `Tensão da carga "${load.id}"`);
      requireDayHours(load.basis.hoursPerDay, `Horas diárias da carga "${load.id}"`);
      if (load.basis.voltageV !== systemVoltageV) {
        throw new RangeError(`A tensão da carga "${load.id}" difere do banco; a eficiência do conversor precisa ser modelada.`);
      }
      energyPerUnitWh = load.basis.voltageV * load.basis.currentA * load.basis.hoursPerDay;
      break;
    default: {
      const exhaustive: never = load.basis;
      throw new TypeError(`Base de consumo não suportada: ${String(exhaustive)}.`);
    }
  }

  if (load.supply === 'ac') {
    if (load.ratedPowerW === undefined) throw new TypeError(`Informe a potência nominal AC da carga "${load.id}" para dimensionar o inversor.`);
    requirePositive(load.ratedPowerW, `Potência nominal AC da carga "${load.id}"`);
    if (load.startupPowerW !== undefined) requirePositive(load.startupPowerW, `Potência de partida da carga "${load.id}"`);
  }

  return energyPerUnitWh * load.quantity;
}

export function calculateDailyConsumption(
  loads: ElectricalLoad[],
  systemVoltageV: 12 | 24,
  inverterEfficiency: number,
  inverterStandbyPowerW: number,
  inverterStandbyHoursPerDay: number,
): DailyConsumption {
  requireSystemVoltage(systemVoltageV);
  requireEfficiency(inverterEfficiency, 'Eficiência do inversor');
  requireNonNegative(inverterStandbyPowerW, 'Consumo em espera do inversor');
  requireDayHours(inverterStandbyHoursPerDay, 'Horas diárias em espera do inversor');

  const ids = new Set<string>();
  const calculatedLoads = loads.map((load) => {
    if (!load.id.trim() || ids.has(load.id)) throw new TypeError(`Identificador de carga vazio ou repetido: "${load.id}".`);
    ids.add(load.id);
    const applianceEnergyWhPerDay = calculateLoadEnergy(load, systemVoltageV);
    return {
      id: load.id,
      supply: load.supply,
      applianceEnergyWhPerDay,
      batteryBusEnergyWhPerDay: load.supply === 'ac' ? applianceEnergyWhPerDay / inverterEfficiency : applianceEnergyWhPerDay,
    };
  });

  const dcLoadsWhPerDay = calculatedLoads.filter((load) => load.supply === 'dc')
    .reduce((sum, load) => sum + load.applianceEnergyWhPerDay, 0);
  const acLoadsWhPerDay = calculatedLoads.filter((load) => load.supply === 'ac')
    .reduce((sum, load) => sum + load.applianceEnergyWhPerDay, 0);
  const inverterInputWhPerDay = acLoadsWhPerDay / inverterEfficiency;
  const inverterStandbyWhPerDay = inverterStandbyPowerW * inverterStandbyHoursPerDay;

  return {
    loads: calculatedLoads,
    dcLoadsWhPerDay,
    acLoadsWhPerDay,
    inverterInputWhPerDay,
    inverterStandbyWhPerDay,
    totalAtBatteryBusWhPerDay: dcLoadsWhPerDay + inverterInputWhPerDay + inverterStandbyWhPerDay,
  };
}

export function calculateBatteryCapacity(
  dailyEnergyAtBatteryBusWh: number,
  autonomyDays: number,
  systemVoltageV: 12 | 24,
  battery: BatteryParameters,
): BatterySizing {
  requirePositive(dailyEnergyAtBatteryBusWh, 'Consumo diário no barramento da bateria');
  requirePositive(autonomyDays, 'Autonomia desejada');
  requireSystemVoltage(systemVoltageV);
  if (battery.chemistry !== 'lead-acid' && battery.chemistry !== 'lifepo4') {
    throw new TypeError('Química de bateria não suportada.');
  }
  requireEfficiency(battery.depthOfDischarge, 'Profundidade de descarga');
  requireEfficiency(battery.chargeEfficiency, 'Eficiência de carga da bateria');
  requireEfficiency(battery.dischargeEfficiency, 'Eficiência de descarga da bateria');
  for (const [name, value] of [
    ['Corrente máxima de carga da bateria', battery.maxChargeCurrentA],
    ['Corrente contínua máxima de descarga da bateria', battery.maxContinuousDischargeCurrentA],
    ['Corrente de pico máxima de descarga da bateria', battery.maxPeakDischargeCurrentA],
  ] as const) {
    if (value !== undefined) requireNonNegative(value, name);
  }

  const batteryNominalVoltageV = getBatteryNominalVoltageV(systemVoltageV, battery);
  const usableCapacityWh = dailyEnergyAtBatteryBusWh * autonomyDays;
  const nominalCapacityWh = usableCapacityWh / (battery.depthOfDischarge * battery.dischargeEfficiency);
  return {
    chemistry: battery.chemistry,
    dailyEnergyAtBatteryBusWh,
    autonomyDays,
    systemVoltageV,
    batteryNominalVoltageV,
    depthOfDischarge: battery.depthOfDischarge,
    dischargeEfficiency: battery.dischargeEfficiency,
    usableCapacityWh,
    nominalCapacityWh,
    nominalCapacityAh: nominalCapacityWh / batteryNominalVoltageV,
  };
}

function getBatteryNominalVoltageV(
  systemVoltageV: 12 | 24,
  battery: BatteryParameters,
): number {
  const nominalVoltageV = battery.nominalVoltageV ?? systemVoltageV;
  requirePositive(nominalVoltageV, 'Tensão nominal da bateria');
  return nominalVoltageV;
}

export function calculatePvSizing(
  dailyEnergyAtBatteryBusWh: number,
  battery: BatteryParameters,
  parameters: PvSizingParameters,
): PvSizing {
  requirePositive(dailyEnergyAtBatteryBusWh, 'Consumo diário no barramento da bateria');
  requireEfficiency(battery.chargeEfficiency, 'Eficiência de carga da bateria');
  requirePositive(parameters.peakSunHours, 'Horas de sol-pico');
  requireEfficiency(parameters.arrayPerformanceRatio, 'Fator global de desempenho do arranjo');
  requireEfficiency(parameters.mpptEfficiency, 'Eficiência do MPPT');
  requireInteger(parameters.modulesInSeries, 'Quantidade de módulos em série');
  requirePositive(parameters.module.powerWp, 'Potência do módulo');
  requirePositive(parameters.module.vocV, 'Tensão de circuito aberto do módulo');
  requirePositive(parameters.module.vmpV, 'Tensão de máxima potência do módulo');
  requirePositive(parameters.module.iscA, 'Corrente de curto-circuito do módulo');
  requirePositive(parameters.module.impA, 'Corrente de máxima potência do módulo');
  const temperatureCoefficients = [
    parameters.module.vocTemperatureCoefficientPerC,
    parameters.module.vmpTemperatureCoefficientPerC,
    parameters.module.iscTemperatureCoefficientPerC,
    parameters.module.impTemperatureCoefficientPerC,
  ];
  if (!Number.isFinite(parameters.minimumModuleTemperatureC)
    || !Number.isFinite(parameters.maximumModuleTemperatureC)
    || parameters.maximumModuleTemperatureC < parameters.minimumModuleTemperatureC
    || temperatureCoefficients.some((coefficient) =>
      coefficient !== undefined && !Number.isFinite(coefficient))) {
    throw new RangeError('Temperaturas e coeficientes térmicos precisam ser finitos e compatíveis.');
  }
  requirePositive(parameters.mppt.maxPvVoltageV, 'Tensão máxima de entrada PV do MPPT');
  requirePositive(parameters.mppt.minPvOperatingVoltageV, 'Tensão mínima operacional PV do MPPT');
  if (parameters.mppt.maxPvOperatingCurrentA !== undefined) {
    requirePositive(parameters.mppt.maxPvOperatingCurrentA, 'Corrente máxima operacional de entrada PV do MPPT');
  }
  requirePositive(parameters.mppt.maxPvShortCircuitCurrentA, 'Corrente máxima de curto-circuito PV do MPPT');
  requirePositive(parameters.mppt.maxChargeCurrentA, 'Corrente máxima de carga do MPPT');
  requirePositive(parameters.mppt.batteryChargeVoltageV, 'Tensão de carga da bateria');
  if (battery.maxChargeCurrentA !== undefined) {
    requireNonNegative(battery.maxChargeCurrentA, 'Corrente máxima de carga da bateria');
  }

  const requiredPowerWp = dailyEnergyAtBatteryBusWh
    / (parameters.peakSunHours * parameters.arrayPerformanceRatio
      * parameters.mpptEfficiency * battery.chargeEfficiency);
  const moduleCountRequired = Math.ceil(requiredPowerWp / parameters.module.powerWp);
  const parallelStrings = Math.ceil(moduleCountRequired / parameters.modulesInSeries);
  const moduleCount = parallelStrings * parameters.modulesInSeries;
  const installedPowerWp = moduleCount * parameters.module.powerWp;
  const minimumTemperatureDeltaC = parameters.minimumModuleTemperatureC - 25;
  const maximumTemperatureDeltaC = parameters.maximumModuleTemperatureC - 25;
  const vocTemperatureFactor = parameters.module.vocTemperatureCoefficientPerC === undefined
    ? undefined
    : 1 + parameters.module.vocTemperatureCoefficientPerC * minimumTemperatureDeltaC;
  const vmpTemperatureFactor = parameters.module.vmpTemperatureCoefficientPerC === undefined
    ? undefined
    : 1 + parameters.module.vmpTemperatureCoefficientPerC * maximumTemperatureDeltaC;
  const impTemperatureFactor = parameters.module.impTemperatureCoefficientPerC === undefined
    ? undefined
    : 1 + parameters.module.impTemperatureCoefficientPerC * maximumTemperatureDeltaC;
  const iscTemperatureFactor = parameters.module.iscTemperatureCoefficientPerC === undefined
    ? undefined
    : 1 + parameters.module.iscTemperatureCoefficientPerC * maximumTemperatureDeltaC;
  if ([vocTemperatureFactor, vmpTemperatureFactor, impTemperatureFactor, iscTemperatureFactor]
    .some((factor) => factor !== undefined && factor <= 0)) {
    throw new RangeError('A correção de tensão ou corrente por temperatura produziu um valor inválido.');
  }
  const arrayVocAtMinimumTemperatureV = vocTemperatureFactor === undefined
    ? undefined
    : parameters.module.vocV * vocTemperatureFactor * parameters.modulesInSeries;
  const arrayVmpAtMaximumTemperatureV = vmpTemperatureFactor === undefined
    ? undefined
    : parameters.module.vmpV * vmpTemperatureFactor * parameters.modulesInSeries;
  const arrayOperatingCurrentAtMaximumTemperatureA = impTemperatureFactor === undefined
    ? undefined
    : parameters.module.impA * impTemperatureFactor * parallelStrings;
  const arrayShortCircuitCurrentAtMaximumTemperatureA = iscTemperatureFactor === undefined
    ? undefined
    : parameters.module.iscA * iscTemperatureFactor * parallelStrings;
  const minimumMpptChargeCurrentA = installedPowerWp * parameters.mpptEfficiency / parameters.mppt.batteryChargeVoltageV;
  const checks = [
    {
      name: 'pv_operating_voltage',
      passed: arrayVmpAtMaximumTemperatureV === undefined
        ? undefined
        : arrayVmpAtMaximumTemperatureV >= parameters.mppt.minPvOperatingVoltageV,
    },
    {
      name: 'pv_voltage',
      passed: arrayVocAtMinimumTemperatureV === undefined
        ? undefined
        : arrayVocAtMinimumTemperatureV <= parameters.mppt.maxPvVoltageV,
    },
    {
      name: 'pv_operating_current',
      passed: arrayOperatingCurrentAtMaximumTemperatureA === undefined
        || parameters.mppt.maxPvOperatingCurrentA === undefined
        ? undefined
        : arrayOperatingCurrentAtMaximumTemperatureA <= parameters.mppt.maxPvOperatingCurrentA,
    },
    {
      name: 'pv_short_circuit_current',
      passed: arrayShortCircuitCurrentAtMaximumTemperatureA === undefined
        ? undefined
        : arrayShortCircuitCurrentAtMaximumTemperatureA <= parameters.mppt.maxPvShortCircuitCurrentA,
    },
    { name: 'mppt_charge_current', passed: minimumMpptChargeCurrentA <= parameters.mppt.maxChargeCurrentA },
    ...(battery.maxChargeCurrentA === undefined
      ? [{ name: 'battery_charge_current', passed: undefined }]
      : [{ name: 'battery_charge_current', passed: minimumMpptChargeCurrentA <= battery.maxChargeCurrentA }]),
  ];
  const needsConfirmation = checks.some((check) =>
    check.passed === undefined || (check.name === 'mppt_charge_current' && !check.passed));
  const hasHardFailure = checks.some((check) =>
    check.passed === false && check.name !== 'mppt_charge_current');

  return {
    dailyEnergyAtBatteryBusWh,
    peakSunHours: parameters.peakSunHours,
    arrayPerformanceRatio: parameters.arrayPerformanceRatio,
    mpptEfficiency: parameters.mpptEfficiency,
    batteryChargeEfficiency: battery.chargeEfficiency,
    minimumModuleTemperatureC: parameters.minimumModuleTemperatureC,
    maximumModuleTemperatureC: parameters.maximumModuleTemperatureC,
    moduleParameters: { ...parameters.module },
    mpptParameters: { ...parameters.mppt },
    requiredPowerWp,
    moduleCount,
    modulesInSeries: parameters.modulesInSeries,
    parallelStrings,
    installedPowerWp,
    arrayVocAtMinimumTemperatureV,
    arrayVmpAtMaximumTemperatureV,
    arrayOperatingCurrentAtMaximumTemperatureA,
    arrayShortCircuitCurrentAtMaximumTemperatureA,
    minimumMpptChargeCurrentA,
    compatibility: hasHardFailure ? 'incompatible' : needsConfirmation ? 'requires-confirmation' : 'compatible',
    checks,
  };
}

export function calculateInverterSizing(
  loads: ElectricalLoad[],
  systemVoltageV: 12 | 24,
  inverterEfficiency: number,
  battery: BatteryParameters,
): InverterSizing {
  requireSystemVoltage(systemVoltageV);
  requireEfficiency(inverterEfficiency, 'Eficiência do inversor');
  for (const load of loads) calculateLoadEnergy(load, systemVoltageV);
  for (const [name, value] of [
    ['Corrente contínua máxima de descarga da bateria', battery.maxContinuousDischargeCurrentA],
    ['Corrente de pico máxima de descarga da bateria', battery.maxPeakDischargeCurrentA],
  ] as const) {
    if (value !== undefined) requireNonNegative(value, name);
  }
  const acLoads = loads.filter((load) => load.supply === 'ac' && load.simultaneous);
  const minimumContinuousPowerW = acLoads.reduce((sum, load) => {
    if (load.ratedPowerW === undefined) throw new TypeError(`Informe a potência nominal AC da carga "${load.id}".`);
    requirePositive(load.ratedPowerW, `Potência nominal AC da carga "${load.id}"`);
    return sum + load.ratedPowerW * load.quantity;
  }, 0);
  const minimumPeakPowerW = acLoads.reduce((sum, load) => {
    if (load.ratedPowerW === undefined) throw new TypeError(`Informe a potência nominal AC da carga "${load.id}".`);
    const peakPerUnit = Math.max(load.ratedPowerW, load.startupPowerW ?? load.ratedPowerW);
    return sum + peakPerUnit * load.quantity;
  }, 0);
  const batteryNominalVoltageV = getBatteryNominalVoltageV(systemVoltageV, battery);
  const minimumContinuousBatteryCurrentA = minimumContinuousPowerW / (batteryNominalVoltageV * inverterEfficiency);
  const minimumPeakBatteryCurrentA = minimumPeakPowerW / (batteryNominalVoltageV * inverterEfficiency);
  const checks: InverterSizing['checks'] = [
    battery.maxContinuousDischargeCurrentA === undefined
      ? { name: 'battery_continuous_discharge_current' }
      : { name: 'battery_continuous_discharge_current', passed: minimumContinuousBatteryCurrentA <= battery.maxContinuousDischargeCurrentA },
    battery.maxPeakDischargeCurrentA === undefined
      ? { name: 'battery_peak_discharge_current' }
      : { name: 'battery_peak_discharge_current', passed: minimumPeakBatteryCurrentA <= battery.maxPeakDischargeCurrentA },
  ];
  const failed = checks.some((check) => check.passed === false);
  const missing = checks.some((check) => check.passed === undefined);

  return {
    minimumContinuousPowerW,
    minimumPeakPowerW,
    minimumContinuousBatteryCurrentA,
    minimumPeakBatteryCurrentA,
    compatibility: failed ? 'exceeds-known-limits' : missing ? 'requires-confirmation' : 'within-known-limits',
    checks,
  };
}

function calculateChargerCurrent(
  energyToStoreWh: number,
  chargeTimeHours: number,
  chargeVoltageV: number,
  chargerEfficiency: number,
  batteryChargeEfficiency: number,
): { currentA: number; outputPowerW: number } {
  requirePositive(energyToStoreWh, 'Energia a armazenar');
  requirePositive(chargeTimeHours, 'Tempo de recarga');
  requirePositive(chargeVoltageV, 'Tensão de carga da bateria');
  requireEfficiency(chargerEfficiency, 'Eficiência do carregador');
  requireEfficiency(batteryChargeEfficiency, 'Eficiência de carga da bateria');
  const currentA = energyToStoreWh / (chargeTimeHours * chargeVoltageV * batteryChargeEfficiency);
  return { currentA, outputPowerW: currentA * chargeVoltageV };
}

export function calculateDcDcChargerSizing(
  plan: DcDcChargePlan,
  battery: BatteryParameters,
  batteryChargeVoltageV: number,
): ChargerSizing {
  if (battery.maxChargeCurrentA !== undefined) {
    requireNonNegative(battery.maxChargeCurrentA, 'Corrente máxima de carga da bateria');
  }
  const sizing = calculateChargerCurrent(
    plan.energyToStoreWh, plan.chargeTimeHours, batteryChargeVoltageV,
    plan.chargerEfficiency, battery.chargeEfficiency,
  );
  requirePositive(plan.vehicleInputVoltageV, 'Tensão de entrada do carregador DC-DC');
  if (plan.alternatorAvailableCurrentA !== undefined) {
    requireNonNegative(plan.alternatorAvailableCurrentA, 'Corrente disponível do alternador');
  }
  const requiredInputPowerW = sizing.outputPowerW / plan.chargerEfficiency;
  const requiredInputCurrentA = requiredInputPowerW / plan.vehicleInputVoltageV;
  const checks: ChargerSizing['checks'] = [
    battery.maxChargeCurrentA === undefined
      ? { name: 'battery_charge_current' }
      : { name: 'battery_charge_current', passed: sizing.currentA <= battery.maxChargeCurrentA },
    plan.alternatorAvailableCurrentA === undefined
      ? { name: 'alternator_available_current' }
      : { name: 'alternator_available_current', passed: requiredInputCurrentA <= plan.alternatorAvailableCurrentA },
  ];
  return buildChargerResult(sizing.currentA, sizing.outputPowerW, requiredInputPowerW, requiredInputCurrentA, checks);
}

export function calculateAcDcChargerSizing(
  plan: AcDcChargePlan,
  battery: BatteryParameters,
  batteryChargeVoltageV: number,
): ChargerSizing {
  if (battery.maxChargeCurrentA !== undefined) {
    requireNonNegative(battery.maxChargeCurrentA, 'Corrente máxima de carga da bateria');
  }
  const sizing = calculateChargerCurrent(
    plan.energyToStoreWh, plan.chargeTimeHours, batteryChargeVoltageV,
    plan.chargerEfficiency, battery.chargeEfficiency,
  );
  requirePositive(plan.inputVoltageV, 'Tensão de entrada do carregador AC-DC');
  requireEfficiency(plan.inputPowerFactor, 'Fator de potência do carregador AC-DC');
  if (plan.maxInputCurrentA !== undefined) requireNonNegative(plan.maxInputCurrentA, 'Corrente máxima disponível do circuito AC');
  const requiredInputPowerW = sizing.outputPowerW / plan.chargerEfficiency;
  const requiredInputCurrentA = requiredInputPowerW / (plan.inputVoltageV * plan.inputPowerFactor);
  const checks: ChargerSizing['checks'] = [
    battery.maxChargeCurrentA === undefined
      ? { name: 'battery_charge_current' }
      : { name: 'battery_charge_current', passed: sizing.currentA <= battery.maxChargeCurrentA },
    plan.maxInputCurrentA === undefined
      ? { name: 'ac_input_current' }
      : { name: 'ac_input_current', passed: requiredInputCurrentA <= plan.maxInputCurrentA },
  ];
  return buildChargerResult(sizing.currentA, sizing.outputPowerW, requiredInputPowerW, requiredInputCurrentA, checks);
}

function buildChargerResult(
  outputCurrentA: number,
  outputPowerW: number,
  inputPowerW: number,
  inputCurrentA: number,
  checks: ChargerSizing['checks'],
): ChargerSizing {
  const failed = checks.some((check) => check.passed === false);
  const missing = checks.some((check) => check.passed === undefined);
  return {
    requiredOutputCurrentA: outputCurrentA,
    requiredOutputPowerW: outputPowerW,
    requiredInputPowerW: inputPowerW,
    requiredInputCurrentA: inputCurrentA,
    compatibility: failed ? 'exceeds-known-limits' : missing ? 'requires-confirmation' : 'within-known-limits',
    checks,
  };
}

export function calculateSolarSystem(input: SolarSystemInput): SolarSystemResult {
  requireSystemVoltage(input.systemVoltageV);
  requirePositive(input.battery.chargeVoltageV, 'Tensão de carga da bateria');
  if (input.pv.mppt.batteryChargeVoltageV !== input.battery.chargeVoltageV) {
    throw new RangeError('A tensão de carga informada para o MPPT precisa coincidir com a tensão adotada para a bateria.');
  }
  const consumption = calculateDailyConsumption(
    input.loads,
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
  const pv = calculatePvSizing(consumption.totalAtBatteryBusWhPerDay, input.battery, input.pv);
  const inverter = calculateInverterSizing(input.loads, input.systemVoltageV, input.inverter.efficiency, input.battery);
  const dcDcCharger = input.dcDcChargePlan
    ? calculateDcDcChargerSizing(input.dcDcChargePlan, input.battery, input.battery.chargeVoltageV)
    : { status: 'requires-inputs' as const, reason: 'Defina energia a repor, tempo de recarga, limites da bateria e corrente disponível do alternador.' };
  const acDcCharger = input.acDcChargePlan
    ? calculateAcDcChargerSizing(input.acDcChargePlan, input.battery, input.battery.chargeVoltageV)
    : { status: 'requires-inputs' as const, reason: 'Defina energia a repor, tempo de recarga, tensão AC, fator de potência e limites do circuito.' };
  const cablesAndProtections = {
    status: 'deferred' as const,
    reason: 'Dimensionamento numérico adiado até validar as referências brasileiras aplicáveis à instalação em veículo.',
  };
  const warnings = [
    ...(pv.compatibility === 'requires-confirmation' ? ['Confirme os limites de carga da bateria/BMS para validar o MPPT.'] : []),
    ...(inverter.compatibility === 'requires-confirmation' ? ['Confirme os limites de descarga contínua e de pico da bateria/BMS para validar o inversor.'] : []),
    ...(dcDcCharger !== undefined && 'compatibility' in dcDcCharger && dcDcCharger.compatibility === 'requires-confirmation'
      ? ['Confirme os limites da bateria/BMS e a corrente disponível do alternador para validar o carregador DC-DC.'] : []),
    ...(acDcCharger !== undefined && 'compatibility' in acDcCharger && acDcCharger.compatibility === 'requires-confirmation'
      ? ['Confirme os limites da bateria/BMS e do circuito AC para validar o carregador AC-DC.'] : []),
    cablesAndProtections.reason,
  ];
  return {
    parametersUsed: structuredClone(input),
    consumption,
    battery,
    pv,
    inverter,
    dcDcCharger,
    acDcCharger,
    cablesAndProtections,
    calculationNotes: [
      'As cargas DC são interpretadas no barramento da bateria; perdas de conversores DC/DC e da distribuição DC não estão incluídas.',
      'A potência de pico do inversor soma os picos de todas as cargas AC marcadas como simultâneas.',
      'O fator de desempenho PV exclui as eficiências do MPPT e da bateria, aplicadas separadamente.',
    ],
    warnings,
  };
}
