import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAcDcChargerSizing,
  calculateBatteryCapacity,
  calculateDailyConsumption,
  calculateDcDcChargerSizing,
  calculateInverterSizing,
  calculatePvSizing,
  calculateSolarSystem,
} from '../src/lib/solar/calculations.ts';

const lifepo4 = {
  chemistry: 'lifepo4',
  depthOfDischarge: 0.8,
  chargeEfficiency: 0.9,
  dischargeEfficiency: 0.95,
  maxChargeCurrentA: 25,
  maxContinuousDischargeCurrentA: 30,
  maxPeakDischargeCurrentA: 70,
};

const module = {
  powerWp: 150,
  vocV: 22,
  vmpV: 18,
  iscA: 9,
  impA: 8.33,
  vocTemperatureCoefficientPerC: -0.003,
  vmpTemperatureCoefficientPerC: -0.004,
  iscTemperatureCoefficientPerC: 0.0005,
  impTemperatureCoefficientPerC: 0.0005,
};

const pvParameters = {
  peakSunHours: 4,
  arrayPerformanceRatio: 0.75,
  mpptEfficiency: 0.95,
  minimumModuleTemperatureC: -10,
  maximumModuleTemperatureC: 70,
  modulesInSeries: 2,
  module,
  mppt: {
    minPvOperatingVoltageV: 25,
    maxPvVoltageV: 60,
    maxPvOperatingCurrentA: 10,
    maxPvShortCircuitCurrentA: 11,
    maxChargeCurrentA: 25,
    batteryChargeVoltageV: 14.4,
  },
};

test('distingue potência média em 24 h, ciclo do compressor e Wh/dia direto', () => {
  const loads = [
    { id: 'fridge-average', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'average-power-24h', averagePowerW: 50 } },
    { id: 'fridge-cycle', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'compressor-cycle', runningPowerW: 80, operatingWindowHoursPerDay: 24, dutyCycle: 0.25 } },
    { id: 'fridge-manufacturer', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 750 } },
  ];

  const result = calculateDailyConsumption(loads, 12, 0.9, 0, 0);
  assert.deepEqual(result.loads.map((load) => load.applianceEnergyWhPerDay), [1200, 480, 750]);
  assert.equal(result.totalAtBatteryBusWhPerDay, 2430);
});

test('calcula potência-tempo e corrente-tempo, validando tensão DC do banco', () => {
  const result = calculateDailyConsumption([
    { id: 'lamp', supply: 'dc', quantity: 2, simultaneous: true, basis: { kind: 'power-time', powerW: 60, hoursPerDay: 3 } },
    { id: 'pump', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'current-time', currentA: 5, voltageV: 12, hoursPerDay: 2 } },
  ], 12, 0.9, 0, 0);

  assert.deepEqual(result.loads.map((load) => load.applianceEnergyWhPerDay), [360, 120]);
  assert.throws(() => calculateDailyConsumption([
    { id: 'pump', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'current-time', currentA: 5, voltageV: 12, hoursPerDay: 2 } },
  ], 24, 0.9, 0, 0), /difere do banco/);
});

test('converte consumo AC pela eficiência do inversor e inclui seu consumo em espera', () => {
  const result = calculateDailyConsumption([
    { id: 'screen', supply: 'ac', quantity: 1, simultaneous: true, ratedPowerW: 100, basis: { kind: 'daily-energy', energyWhPerDay: 100 } },
    { id: 'lights', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 50 } },
  ], 12, 0.8, 10, 8);

  assert.equal(result.acLoadsWhPerDay, 100);
  assert.equal(result.inverterInputWhPerDay, 125);
  assert.equal(result.inverterStandbyWhPerDay, 80);
  assert.equal(result.totalAtBatteryBusWhPerDay, 255);
});

test('calcula capacidade nominal para 12 V/LiFePO4 e 24 V/chumbo-ácido', () => {
  const twelveVolt = calculateBatteryCapacity(480, 2, 12, lifepo4);
  assert.equal(twelveVolt.usableCapacityWh, 960);
  assert.equal(twelveVolt.nominalCapacityWh, 960 / (0.8 * 0.95));
  assert.equal(twelveVolt.nominalCapacityAh, 960 / (0.8 * 0.95 * 12));

  const leadAcid = calculateBatteryCapacity(720, 3, 24, {
    chemistry: 'lead-acid',
    depthOfDischarge: 0.5,
    chargeEfficiency: 0.8,
    dischargeEfficiency: 0.8,
  });
  assert.equal(leadAcid.usableCapacityWh, 2160);
  assert.equal(leadAcid.nominalCapacityWh, 5400);
  assert.equal(leadAcid.nominalCapacityAh, 225);
});

test('usa a tensão nominal real da bateria para converter capacidade em Ah', () => {
  const twelvePointEightVolt = calculateBatteryCapacity(480, 2, 12, {
    ...lifepo4,
    nominalVoltageV: 12.8,
  });
  assert.equal(twelvePointEightVolt.systemVoltageV, 12);
  assert.equal(twelvePointEightVolt.batteryNominalVoltageV, 12.8);
  assert.equal(twelvePointEightVolt.nominalCapacityAh, twelvePointEightVolt.nominalCapacityWh / 12.8);

  const twentyFivePointSixVolt = calculateBatteryCapacity(720, 3, 24, {
    ...lifepo4,
    nominalVoltageV: 25.6,
  });
  assert.equal(twentyFivePointSixVolt.systemVoltageV, 24);
  assert.equal(twentyFivePointSixVolt.batteryNominalVoltageV, 25.6);
  assert.equal(twentyFivePointSixVolt.nominalCapacityAh, twentyFivePointSixVolt.nominalCapacityWh / 25.6);
});

test('registra a memória manual do dimensionamento PV, incluindo a série e a correção de Voc', () => {
  const result = calculatePvSizing(600, lifepo4, pvParameters);

  assert.ok(Math.abs(result.requiredPowerWp - 600 / (4 * 0.75 * 0.95 * 0.9)) < 1e-10);
  assert.equal(result.moduleCount, 2);
  assert.equal(result.parallelStrings, 1);
  assert.equal(result.installedPowerWp, 300);
  assert.equal(result.arrayVocAtMinimumTemperatureV, 22 * (1 + -0.003 * (-10 - 25)) * 2);
  assert.equal(result.arrayVmpAtMaximumTemperatureV, 18 * (1 + -0.004 * (70 - 25)) * 2);
  assert.equal(result.arrayOperatingCurrentAtMaximumTemperatureA, 8.33 * (1 + 0.0005 * (70 - 25)));
  assert.equal(result.arrayShortCircuitCurrentAtMaximumTemperatureA, 9 * (1 + 0.0005 * (70 - 25)));
  assert.equal(result.minimumMpptChargeCurrentA, 300 * 0.95 / 14.4);
  assert.equal(result.compatibility, 'compatible');
});

test('sinaliza incompatibilidade do MPPT quando tensão corrigida ou corrente excedem limites', () => {
  const result = calculatePvSizing(600, lifepo4, {
    ...pvParameters,
    modulesInSeries: 3,
    mppt: { ...pvParameters.mppt, maxPvVoltageV: 50, maxPvOperatingCurrentA: 8 },
  });

  assert.equal(result.compatibility, 'incompatible');
  assert.ok(result.checks.some((check) => check.name === 'pv_voltage' && !check.passed));
  assert.ok(result.checks.some((check) => check.name === 'pv_operating_current' && !check.passed));
});

test('pede confirmação quando a saída do MPPT pode limitar a potência do arranjo', () => {
  const result = calculatePvSizing(600, lifepo4, {
    ...pvParameters,
    mppt: { ...pvParameters.mppt, maxChargeCurrentA: 10 },
  });

  assert.ok(result.checks.some((check) => check.name === 'mppt_charge_current' && !check.passed));
  assert.equal(result.compatibility, 'requires-confirmation');
});

test('mantém como pendentes as verificações térmicas sem coeficientes publicados', () => {
  const moduleWithoutThermalCoefficients = { ...module };
  delete moduleWithoutThermalCoefficients.vocTemperatureCoefficientPerC;
  delete moduleWithoutThermalCoefficients.vmpTemperatureCoefficientPerC;
  delete moduleWithoutThermalCoefficients.iscTemperatureCoefficientPerC;
  delete moduleWithoutThermalCoefficients.impTemperatureCoefficientPerC;
  const mpptWithoutOperatingCurrentLimit = { ...pvParameters.mppt };
  delete mpptWithoutOperatingCurrentLimit.maxPvOperatingCurrentA;

  const result = calculatePvSizing(600, lifepo4, {
    ...pvParameters,
    module: moduleWithoutThermalCoefficients,
    mppt: mpptWithoutOperatingCurrentLimit,
  });

  assert.equal(result.arrayVocAtMinimumTemperatureV, undefined);
  assert.equal(result.arrayVmpAtMaximumTemperatureV, undefined);
  assert.equal(result.arrayOperatingCurrentAtMaximumTemperatureA, undefined);
  assert.equal(result.arrayShortCircuitCurrentAtMaximumTemperatureA, undefined);
  for (const name of [
    'pv_operating_voltage',
    'pv_voltage',
    'pv_operating_current',
    'pv_short_circuit_current',
  ]) {
    assert.equal(result.checks.find((check) => check.name === name).passed, undefined);
  }
  assert.equal(result.compatibility, 'requires-confirmation');
});

test('preserva incompatibilidade conhecida mesmo quando outras verificações estão pendentes', () => {
  const moduleWithMissingOperatingCoefficients = { ...module };
  delete moduleWithMissingOperatingCoefficients.vmpTemperatureCoefficientPerC;
  delete moduleWithMissingOperatingCoefficients.impTemperatureCoefficientPerC;
  const mpptWithoutOperatingCurrentLimit = { ...pvParameters.mppt };
  delete mpptWithoutOperatingCurrentLimit.maxPvOperatingCurrentA;

  const result = calculatePvSizing(600, lifepo4, {
    ...pvParameters,
    module: moduleWithMissingOperatingCoefficients,
    mppt: { ...mpptWithoutOperatingCurrentLimit, maxPvVoltageV: 20 },
  });

  assert.equal(result.checks.find((check) => check.name === 'pv_voltage').passed, false);
  assert.equal(result.checks.find((check) => check.name === 'pv_operating_voltage').passed, undefined);
  assert.equal(result.compatibility, 'incompatible');
});

test('dimensiona inversor pela simultaneidade informada e verifica correntes da bateria', () => {
  const loads = [
    { id: 'compressor', supply: 'ac', quantity: 1, simultaneous: true, ratedPowerW: 200, startupPowerW: 600, basis: { kind: 'power-time', powerW: 200, hoursPerDay: 2 } },
    { id: 'kettle', supply: 'ac', quantity: 1, simultaneous: true, ratedPowerW: 1000, basis: { kind: 'power-time', powerW: 1000, hoursPerDay: 0.2 } },
    { id: 'heater', supply: 'ac', quantity: 1, simultaneous: false, ratedPowerW: 1500, basis: { kind: 'power-time', powerW: 1500, hoursPerDay: 1 } },
  ];
  const result = calculateInverterSizing(loads, 12, 0.9, {
    ...lifepo4,
    nominalVoltageV: 12.8,
  });

  assert.equal(result.minimumContinuousPowerW, 1200);
  assert.equal(result.minimumPeakPowerW, 1600);
  assert.equal(result.minimumContinuousBatteryCurrentA, 1200 / (12.8 * 0.9));
  assert.equal(result.minimumPeakBatteryCurrentA, 1600 / (12.8 * 0.9));
  assert.equal(result.compatibility, 'exceeds-known-limits');
});

test('dimensiona carregadores e explicita limites de bateria, alternador e circuito AC', () => {
  const dcDc = calculateDcDcChargerSizing({
    energyToStoreWh: 360,
    chargeTimeHours: 3,
    chargerEfficiency: 0.9,
    vehicleInputVoltageV: 12,
    alternatorAvailableCurrentA: 18,
  }, lifepo4, 12);
  assert.ok(Math.abs(dcDc.requiredOutputCurrentA - 360 / (3 * 12 * 0.9)) < 1e-10);
  assert.ok(Math.abs(dcDc.requiredInputCurrentA - (dcDc.requiredOutputPowerW / 0.9 / 12)) < 1e-10);
  assert.equal(dcDc.compatibility, 'within-known-limits');

  const acDc = calculateAcDcChargerSizing({
    energyToStoreWh: 360,
    chargeTimeHours: 3,
    chargerEfficiency: 0.9,
    inputVoltageV: 230,
    inputPowerFactor: 0.9,
    maxInputCurrentA: 2,
  }, lifepo4, 12);
  assert.ok(acDc.requiredInputCurrentA < 2);
  assert.equal(acDc.compatibility, 'within-known-limits');

  const missingAlternatorLimit = calculateDcDcChargerSizing({
    energyToStoreWh: 360,
    chargeTimeHours: 3,
    chargerEfficiency: 0.9,
    vehicleInputVoltageV: 12,
  }, { ...lifepo4, maxChargeCurrentA: undefined }, 12);
  assert.equal(missingAlternatorLimit.compatibility, 'requires-confirmation');
});

test('a validação rejeita unidades, limites e entradas inválidas sem mascarar erros', () => {
  assert.throws(() => calculateBatteryCapacity(0, 1, 12, lifepo4), /maior que zero/);
  assert.throws(() => calculateBatteryCapacity(100, 1, 48, lifepo4), /12 V ou 24 V/);
  assert.throws(() => calculateBatteryCapacity(100, 1, 12, { ...lifepo4, depthOfDischarge: 1.1 }), /intervalo/);
  assert.throws(() => calculateDailyConsumption([
    { id: 'lamp', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'power-time', powerW: 0, hoursPerDay: 2 } },
  ], 12, 0.9, 0, 0), /maior que zero/);
  assert.throws(() => calculateDailyConsumption([
    { id: 'lamp', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'power-time', powerW: 10, hoursPerDay: 25 } },
  ], 12, 0.9, 0, 0), /entre 0 e 24/);
  assert.throws(() => calculateDailyConsumption([
    { id: 'lamp', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 10 } },
    { id: 'lamp', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 10 } },
  ], 12, 0.9, 0, 0), /repetido/);
});

test('a composição mantém carregadores sem dados e cabos/proteções explicitamente adiados', () => {
  const input = {
    systemVoltageV: 12,
    loads: [{ id: 'lamp', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 100 } }],
    inverter: { efficiency: 0.9, standbyPowerW: 0, standbyHoursPerDay: 0 },
    battery: { ...lifepo4, chargeVoltageV: 14.4 },
    autonomyDays: 2,
    pv: pvParameters,
  };
  const original = structuredClone(input);
  const result = calculateSolarSystem(input);

  assert.equal(result.consumption.totalAtBatteryBusWhPerDay, 100);
  assert.equal(result.dcDcCharger.status, 'requires-inputs');
  assert.equal(result.acDcCharger.status, 'requires-inputs');
  assert.equal(result.cablesAndProtections.status, 'deferred');
  assert.equal(result.parametersUsed.pv.module.powerWp, module.powerWp);
  assert.ok(result.warnings.some((warning) => warning.includes('instalação em veículo')));
  assert.deepEqual(input, original);
});

test('três cenários de referência conferem com a memória de cálculo manual', () => {
  // Valores sintéticos para conferir a aritmética; não são parâmetros de catálogo.
  const batteryTwelveVolt = calculateBatteryCapacity(480, 2, 12, lifepo4);
  assert.equal(batteryTwelveVolt.nominalCapacityAh, (480 * 2) / (0.8 * 0.95 * 12));

  const pvSixHundredWh = calculatePvSizing(600, lifepo4, pvParameters);
  assert.ok(Math.abs(
    pvSixHundredWh.requiredPowerWp - 600 / (4 * 0.75 * 0.95 * 0.9),
  ) < 1e-10);

  const charger = calculateDcDcChargerSizing({
    energyToStoreWh: 360,
    chargeTimeHours: 3,
    chargerEfficiency: 0.9,
    vehicleInputVoltageV: 12,
    alternatorAvailableCurrentA: 18,
  }, lifepo4, 12);
  assert.ok(Math.abs(
    charger.requiredOutputCurrentA - 360 / (3 * 12 * 0.9),
  ) < 1e-10);
});
