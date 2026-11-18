import assert from 'node:assert/strict';
import test from 'node:test';
import {
  batteryCatalog,
  batteryTechnologyCatalog,
  equipmentCatalog,
  inverterCatalog,
  mpptCatalog,
  pvModuleCatalog,
  solarResourceCountries,
  solarResourceDataset,
} from '../src/lib/solar/catalogs.ts';
import { calculateDailyConsumption } from '../src/lib/solar/calculations.ts';

test('HSP usa códigos ISO, período e valores nacionais da fonte aprovada', () => {
  assert.equal(solarResourceDataset.referencePeriodStartYear, 1991);
  assert.equal(solarResourceDataset.referencePeriodEndYear, 2020);
  assert.equal(solarResourceDataset.sourceUnit, 'kWh/m2/day');
  assert.equal(new Set(solarResourceCountries.map((country) => country.countryIso3)).size, 8);

  assert.deepEqual(
    Object.fromEntries(solarResourceCountries.map(({ countryIso3, peakSunHours }) => [countryIso3, peakSunHours])),
    {
      BRA: 5.015,
      CHN: 4.647,
      FIN: 2.318,
      KEN: 5.85,
      MEX: 5.723,
      OMN: 6.292,
      PHL: 5.031,
      POL: 2.989,
    },
  );
});

test('geladeira usa consumo diário derivado do fabricante sem multiplicar por horas outra vez', () => {
  const [fridge] = equipmentCatalog;
  const result = calculateDailyConsumption([fridge.defaultLoad], 12, 0.9, 0, 0);

  assert.equal(fridge.defaultLoad.basis.kind, 'daily-energy');
  assert.equal(result.totalAtBatteryBusWhPerDay, 218.88);
  assert.equal(fridge.sourceMeasurement.value, 0.76);
  assert.deepEqual(fridge.applicableSystemVoltagesV, [12]);
});

test('químicas de bateria não recebem eficiências genéricas sem fonte direcional', () => {
  assert.deepEqual(
    batteryTechnologyCatalog.map(({ chemistry, profileStatus }) => [chemistry, profileStatus]),
    [
      ['lead-acid', 'requires-battery-specific-data'],
      ['lifepo4', 'has-model-specific-reference'],
    ],
  );

  for (const technology of batteryTechnologyCatalog) {
    assert.ok(technology.requiredDatasheetFields.includes('chargeEfficiency'));
    assert.ok(technology.requiredDatasheetFields.includes('dischargeEfficiency'));
  }
});

test('perfis LiFePO4 mantêm valores e condições publicados para cada tensão de banco', () => {
  assert.deepEqual(
    batteryCatalog.map(({ id, systemVoltageV, nominalCapacityAh }) =>
      [id, systemVoltageV, nominalCapacityAh]),
    [
      ['npp-lfp12-8-100', 12, 100],
      ['npp-lfp25-6-100', 24, 100],
    ],
  );

  const [battery12V, battery24V] = batteryCatalog;
  assert.deepEqual(
    [battery12V.parameters.nominalVoltageV, battery12V.parameters.chargeVoltageV, battery12V.parameters.dischargeCutoffVoltageV],
    [12.8, 14.6, 11.2],
  );
  assert.deepEqual(
    [battery24V.parameters.nominalVoltageV, battery24V.parameters.chargeVoltageV, battery24V.parameters.dischargeCutoffVoltageV],
    [25.6, 29.2, 22.4],
  );
  assert.equal(battery12V.parameters.chargeEfficiency, 0.995);
  assert.equal(battery24V.parameters.chargeEfficiency, 0.995);
  assert.equal(battery12V.parameters.dischargeEfficiency, 0.96);
  assert.equal(battery24V.parameters.dischargeEfficiency, 0.96);
  assert.equal(battery12V.parameters.depthOfDischarge, 1);
  assert.equal(battery24V.parameters.depthOfDischarge, 1);
  assert.equal(battery12V.parameters.maxPeakDischargeCurrentA, 300);
  assert.equal(battery12V.maxPeakDischargeDurationMs, 100);
  assert.equal(battery24V.parameters.maxPeakDischargeCurrentA, undefined);
  assert.ok(batteryCatalog.every((battery) => battery.sources[0].url.includes('npp-power.eu')));
  assert.ok(batteryCatalog.every((battery) => battery.notePt.includes('editável')));
});

test('catálogo de componentes usa referências editáveis e preserva lacunas das fichas', () => {
  const [panel] = pvModuleCatalog;
  assert.equal(panel.parameters.powerWp, 100);
  assert.equal(panel.powerTolerancePercent, 3);
  assert.equal(panel.parameters.vmpV, 20.7);
  assert.equal(panel.parameters.impA, 4.84);
  assert.equal(panel.parameters.vocTemperatureCoefficientPerC, undefined);
  assert.equal(panel.parameters.vmpTemperatureCoefficientPerC, undefined);
  assert.equal(panel.parameters.iscTemperatureCoefficientPerC, undefined);
  assert.equal(panel.parameters.impTemperatureCoefficientPerC, undefined);

  const [mppt] = mpptCatalog;
  assert.deepEqual(mppt.supportedBatteryVoltagesV, [12, 24, 48]);
  assert.equal(mppt.maxPvOpenCircuitVoltageV, 100);
  assert.equal(mppt.maxPvShortCircuitCurrentA, 20);
  assert.equal(mppt.maxPvOperatingCurrentA, undefined);
  assert.equal(mppt.nominalPvPowerWpByBatteryVoltage[12], 290);
  assert.equal(mppt.nominalPvPowerWpByBatteryVoltage[24], 580);
  assert.equal(mppt.peakEfficiency, 0.98);

  assert.deepEqual(
    inverterCatalog.map(({ batteryVoltageV, outputVoltageV, maximumEfficiency }) =>
      [batteryVoltageV, outputVoltageV, maximumEfficiency]),
    [[12, 230, 0.87], [24, 230, 0.88]],
  );
  assert.ok(inverterCatalog.every((inverter) => inverter.notePt.includes('não representa inversor nominal')));
});
