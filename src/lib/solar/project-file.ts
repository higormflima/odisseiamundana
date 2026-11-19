import { batteryCatalog, equipmentCategories, equipmentCatalog, solarResourceCountries } from './catalogs.ts';
import type { BatteryChemistry, ElectricalLoad, LoadBasis } from './calculations.ts';

export interface SolarProjectBatteryFields {
  nominalVoltageV: number | null;
  capacityAh: number | null;
  depthOfDischargePercent: number | null;
  chargeEfficiencyPercent: number | null;
  dischargeEfficiencyPercent: number | null;
  chargeVoltageV: number | null;
  cutoffVoltageV: number | null;
  maxChargeCurrentA: number | null;
  maxContinuousDischargeCurrentA: number | null;
  maxPeakDischargeCurrentA: number | null;
}

export interface SolarProjectConfiguration {
  projectName: string;
  vehicleType: string;
  systemVoltageV: 12 | 24;
  countryIso3: string;
  peakSunHours: number;
  catalogLoads: Array<{ equipmentId: string; selected: boolean; quantity: number; usage?: { powerW: number; hoursPerDay: number } }>;
  customLoads: Array<{ name: string; categoryId: string; load: ElectricalLoad }>;
  autonomyDays: number | null;
  battery: {
    chemistry: BatteryChemistry;
    profileId: string;
    lifepo4: SolarProjectBatteryFields;
    leadAcid: SolarProjectBatteryFields;
    leadUnitVoltageV: 12 | 24;
    agm?: {
      capacityAh: number | null;
      depthOfDischargePercent: number | null;
    };
  };
  inverter: {
    ratedPowerW?: number | null;
    outputVoltageV: 120 | 127 | 220 | 230 | null;
    useVictronReference: boolean;
    efficiencyPercent: number | null;
    standbyPowerW: number | null;
    standbyHoursPerDay: number | null;
  };
}

export interface SolarProjectFile {
  format: 'odisseia-solar-project';
  version: 1 | 2;
  savedAt: string;
  config: SolarProjectConfiguration;
}

const vehicleTypes = [
  'van-compact',
  'van-large',
  'motorhome-medium',
  'motorhome-large',
  'truck-bus',
  'other',
];

const inverterVoltages = [120, 127, 220, 230];

function record(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${path} deve ser um objeto JSON.`);
  }
  return value as Record<string, unknown>;
}

function assertKeys(
  value: Record<string, unknown>,
  path: string,
  requiredKeys: readonly string[],
  optionalKeys: readonly string[] = [],
): void {
  const allowed = new Set([...requiredKeys, ...optionalKeys]);
  const unknownKey = Object.keys(value).find((key) => !allowed.has(key));
  const missingKey = requiredKeys.find((key) => !Object.hasOwn(value, key));
  if (unknownKey) throw new TypeError(`${path} contém a propriedade não reconhecida "${unknownKey}".`);
  if (missingKey) throw new TypeError(`${path} não contém a propriedade obrigatória "${missingKey}".`);
}

function stringValue(value: unknown, path: string, maximumLength: number): asserts value is string {
  if (typeof value !== 'string' || value.length > maximumLength) {
    throw new TypeError(`${path} deve ser um texto de até ${maximumLength} caracteres.`);
  }
}

function numberValue(value: unknown, path: string, minimum: number, maximum = Number.POSITIVE_INFINITY): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${path} deve ser um número entre ${minimum} e ${maximum}.`);
  }
}

function nullableNumberValue(
  value: unknown,
  path: string,
  minimum: number,
  maximum = Number.POSITIVE_INFINITY,
): void {
  if (value !== null) numberValue(value, path, minimum, maximum);
}

function assertBatteryFields(value: unknown, path: string): asserts value is SolarProjectBatteryFields {
  const fields = record(value, path);
  const keys = [
    'nominalVoltageV',
    'capacityAh',
    'depthOfDischargePercent',
    'chargeEfficiencyPercent',
    'dischargeEfficiencyPercent',
    'chargeVoltageV',
    'cutoffVoltageV',
    'maxChargeCurrentA',
    'maxContinuousDischargeCurrentA',
    'maxPeakDischargeCurrentA',
  ];
  assertKeys(fields, path, keys);
  nullableNumberValue(fields.nominalVoltageV, `${path}.nominalVoltageV`, 0.1);
  nullableNumberValue(fields.capacityAh, `${path}.capacityAh`, 0.1);
  nullableNumberValue(fields.depthOfDischargePercent, `${path}.depthOfDischargePercent`, 0.1, 100);
  nullableNumberValue(fields.chargeEfficiencyPercent, `${path}.chargeEfficiencyPercent`, 0.1, 100);
  nullableNumberValue(fields.dischargeEfficiencyPercent, `${path}.dischargeEfficiencyPercent`, 0.1, 100);
  nullableNumberValue(fields.chargeVoltageV, `${path}.chargeVoltageV`, 0.1);
  nullableNumberValue(fields.cutoffVoltageV, `${path}.cutoffVoltageV`, 0.1);
  nullableNumberValue(fields.maxChargeCurrentA, `${path}.maxChargeCurrentA`, 0);
  nullableNumberValue(fields.maxContinuousDischargeCurrentA, `${path}.maxContinuousDischargeCurrentA`, 0);
  nullableNumberValue(fields.maxPeakDischargeCurrentA, `${path}.maxPeakDischargeCurrentA`, 0);
}

function assertLoadBasis(value: unknown, path: string): asserts value is LoadBasis {
  const basis = record(value, path);
  if (typeof basis.kind !== 'string') throw new TypeError(`${path}.kind deve ser um texto.`);
  const numberFields = (keys: string[], limits: Array<[string, number, number?]>) => {
    assertKeys(basis, path, ['kind', ...keys]);
    limits.forEach(([key, minimum, maximum]) => numberValue(basis[key], `${path}.${key}`, minimum, maximum));
  };
  switch (basis.kind) {
    case 'power-time':
      numberFields(['powerW', 'hoursPerDay'], [['powerW', 0.1], ['hoursPerDay', 0, 24]]);
      return;
    case 'average-power-24h':
      numberFields(['averagePowerW'], [['averagePowerW', 0.1]]);
      return;
    case 'compressor-cycle':
      numberFields(
        ['runningPowerW', 'operatingWindowHoursPerDay', 'dutyCycle'],
        [['runningPowerW', 0.1], ['operatingWindowHoursPerDay', 0, 24], ['dutyCycle', 0, 1]],
      );
      return;
    case 'daily-energy':
      numberFields(['energyWhPerDay'], [['energyWhPerDay', 0.1]]);
      return;
    case 'current-time':
      numberFields(['currentA', 'voltageV', 'hoursPerDay'], [
        ['currentA', 0.1],
        ['voltageV', 0.1],
        ['hoursPerDay', 0, 24],
      ]);
      return;
    default:
      throw new TypeError(`${path}.kind não corresponde a uma base de consumo compatível.`);
  }
}

function assertElectricalLoad(value: unknown, path: string): asserts value is ElectricalLoad {
  const load = record(value, path);
  assertKeys(load, path, ['id', 'supply', 'quantity', 'basis', 'simultaneous'], ['ratedPowerW', 'startupPowerW']);
  if (typeof load.id !== 'string' || !/^custom-load-[1-9]\d*$/.test(load.id)) {
    throw new TypeError(`${path}.id não é um identificador de carga personalizada válido.`);
  }
  if (load.supply !== 'dc' && load.supply !== 'ac') throw new TypeError(`${path}.supply deve ser "dc" ou "ac".`);
  numberValue(load.quantity, `${path}.quantity`, 1);
  if (!Number.isInteger(load.quantity)) throw new TypeError(`${path}.quantity deve ser um número inteiro.`);
  if (typeof load.simultaneous !== 'boolean') throw new TypeError(`${path}.simultaneous deve ser booleano.`);
  assertLoadBasis(load.basis, `${path}.basis`);
  if (load.supply === 'ac' && (load.basis as LoadBasis).kind === 'current-time') {
    throw new TypeError(`${path} não pode usar corrente DC para uma carga AC.`);
  }
  if (Object.hasOwn(load, 'ratedPowerW')) numberValue(load.ratedPowerW, `${path}.ratedPowerW`, 0.1);
  if (Object.hasOwn(load, 'startupPowerW')) numberValue(load.startupPowerW, `${path}.startupPowerW`, 0.1);
  if (load.supply === 'ac' && !Object.hasOwn(load, 'ratedPowerW')) {
    throw new TypeError(`${path}.ratedPowerW é obrigatório para cargas AC.`);
  }
}

function assertProjectConfiguration(value: unknown, version: 1 | 2): asserts value is SolarProjectConfiguration {
  const config = record(value, 'config');
  assertKeys(config, 'config', [
    'projectName',
    'vehicleType',
    'systemVoltageV',
    'countryIso3',
    'peakSunHours',
    'catalogLoads',
    'customLoads',
    'autonomyDays',
    'battery',
    'inverter',
  ]);
  stringValue(config.projectName, 'config.projectName', 100);
  if (typeof config.vehicleType !== 'string' || !vehicleTypes.includes(config.vehicleType)) {
    throw new TypeError('config.vehicleType não corresponde a um tipo de veículo disponível.');
  }
  if (config.systemVoltageV !== 12 && config.systemVoltageV !== 24) {
    throw new TypeError('config.systemVoltageV deve ser 12 ou 24.');
  }
  if (typeof config.countryIso3 !== 'string'
    || (config.countryIso3 !== 'manual' && !solarResourceCountries.some((country) => country.countryIso3 === config.countryIso3))) {
    throw new TypeError('config.countryIso3 não corresponde a um país disponível ou ao modo manual.');
  }
  numberValue(config.peakSunHours, 'config.peakSunHours', 0.1, 24);
  if (config.autonomyDays !== null) numberValue(config.autonomyDays, 'config.autonomyDays', 0.1, 365);

  if (!Array.isArray(config.catalogLoads)) throw new TypeError('config.catalogLoads deve ser uma lista.');
  const catalogIds = new Set<string>();
  config.catalogLoads.forEach((value, index) => {
    const path = `config.catalogLoads[${index}]`;
    const item = record(value, path);
    assertKeys(item, path, ['equipmentId', 'selected', 'quantity'], version === 2 ? ['usage'] : []);
    if (typeof item.equipmentId !== 'string' || !equipmentCatalog.some((equipment) => equipment.id === item.equipmentId)) {
      throw new TypeError(`${path}.equipmentId não corresponde a um equipamento do catálogo.`);
    }
    if (catalogIds.has(item.equipmentId)) throw new TypeError(`${path}.equipmentId está repetido.`);
    catalogIds.add(item.equipmentId);
    if (typeof item.selected !== 'boolean') throw new TypeError(`${path}.selected deve ser booleano.`);
    numberValue(item.quantity, `${path}.quantity`, 1);
    if (!Number.isInteger(item.quantity)) throw new TypeError(`${path}.quantity deve ser um número inteiro.`);
    if (item.usage !== undefined) {
      const equipment = equipmentCatalog.find((equipment) => equipment.id === item.equipmentId);
      if (equipment?.defaultLoad.basis.kind !== 'power-time') throw new TypeError(`${path}.usage não se aplica a esse equipamento.`);
      const usage = record(item.usage, `${path}.usage`);
      assertKeys(usage, `${path}.usage`, ['powerW', 'hoursPerDay']);
      numberValue(usage.powerW, `${path}.usage.powerW`, 0.1);
      numberValue(usage.hoursPerDay, `${path}.usage.hoursPerDay`, 0, 24);
    }
  });

  if (!Array.isArray(config.customLoads)) throw new TypeError('config.customLoads deve ser uma lista.');
  const loadIds = new Set<string>();
  config.customLoads.forEach((value, index) => {
    const path = `config.customLoads[${index}]`;
    const item = record(value, path);
    assertKeys(item, path, ['name', 'categoryId', 'load']);
    stringValue(item.name, `${path}.name`, 80);
    if (item.name.trim().length === 0) throw new TypeError(`${path}.name não pode estar vazio.`);
    if (typeof item.categoryId !== 'string' || !equipmentCategories.some((category) => category.id === item.categoryId)) {
      throw new TypeError(`${path}.categoryId não corresponde a uma categoria disponível.`);
    }
    assertElectricalLoad(item.load, `${path}.load`);
    if (loadIds.has(item.load.id)) throw new TypeError(`${path}.load.id está repetido.`);
    loadIds.add(item.load.id);
  });

  const battery = record(config.battery, 'config.battery');
  assertKeys(battery, 'config.battery', ['chemistry', 'profileId', 'lifepo4', 'leadAcid', 'leadUnitVoltageV', ...(version === 2 ? ['agm'] : [])]);
  if (battery.chemistry !== 'lead-acid' && battery.chemistry !== 'lifepo4'
    && !(version === 2 && battery.chemistry === 'agm')) {
    throw new TypeError('config.battery.chemistry não é compatível.');
  }
  if (typeof battery.profileId !== 'string'
    || !batteryCatalog.some((profile) => profile.id === battery.profileId && profile.systemVoltageV === config.systemVoltageV)) {
    throw new TypeError('config.battery.profileId não corresponde à tensão do banco.');
  }
  assertBatteryFields(battery.lifepo4, 'config.battery.lifepo4');
  assertBatteryFields(battery.leadAcid, 'config.battery.leadAcid');
  if (version === 2) {
    const agm = record(battery.agm, 'config.battery.agm');
    assertKeys(agm, 'config.battery.agm', ['capacityAh', 'depthOfDischargePercent']);
    nullableNumberValue(agm.capacityAh, 'config.battery.agm.capacityAh', 0.1);
    nullableNumberValue(agm.depthOfDischargePercent, 'config.battery.agm.depthOfDischargePercent', 0.1, 100);
  }
  if (battery.leadUnitVoltageV !== 12 && battery.leadUnitVoltageV !== 24) {
    throw new TypeError('config.battery.leadUnitVoltageV deve ser 12 ou 24.');
  }
  if (battery.leadUnitVoltageV > config.systemVoltageV) {
    throw new RangeError('config.battery.leadUnitVoltageV não pode superar a tensão do banco.');
  }

  const inverter = record(config.inverter, 'config.inverter');
  assertKeys(inverter, 'config.inverter', [
    'outputVoltageV',
    'useVictronReference',
    'efficiencyPercent',
    'standbyPowerW',
    'standbyHoursPerDay',
  ], version === 2 ? ['ratedPowerW'] : []);
  if (inverter.ratedPowerW !== undefined) nullableNumberValue(inverter.ratedPowerW, 'config.inverter.ratedPowerW', 1);
  if (inverter.outputVoltageV !== null
    && (typeof inverter.outputVoltageV !== 'number' || !inverterVoltages.includes(inverter.outputVoltageV))) {
    throw new TypeError('config.inverter.outputVoltageV não corresponde a uma tensão disponível.');
  }
  if (typeof inverter.useVictronReference !== 'boolean') {
    throw new TypeError('config.inverter.useVictronReference deve ser booleano.');
  }
  nullableNumberValue(inverter.efficiencyPercent, 'config.inverter.efficiencyPercent', 1, 100);
  nullableNumberValue(inverter.standbyPowerW, 'config.inverter.standbyPowerW', 0);
  nullableNumberValue(inverter.standbyHoursPerDay, 'config.inverter.standbyHoursPerDay', 0, 24);
  if (inverter.useVictronReference && inverter.outputVoltageV !== 230) {
    throw new TypeError('A referência Victron SUN só pode ser usada com saída de 230 V.');
  }
}

export function validateSolarProjectFile(value: unknown): SolarProjectFile {
  const file = record(value, 'arquivo');
  assertKeys(file, 'arquivo', ['format', 'version', 'savedAt', 'config']);
  if (file.format !== 'odisseia-solar-project') throw new TypeError('O arquivo não é um projeto do Planejador Elétrico.');
  if (file.version !== 1 && file.version !== 2) throw new TypeError('A versão do arquivo não é compatível com esta versão do Planejador Elétrico.');
  if (typeof file.savedAt !== 'string' || !Number.isFinite(Date.parse(file.savedAt))) {
    throw new TypeError('arquivo.savedAt deve conter uma data válida.');
  }
  assertProjectConfiguration(file.config, file.version);
  return value as SolarProjectFile;
}
