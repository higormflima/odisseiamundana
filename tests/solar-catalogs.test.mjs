import assert from 'node:assert/strict';
import test from 'node:test';
import {
  batteryCatalog,
  batteryTechnologyCatalog,
  buildEquipmentLoad,
  equipmentCatalog,
  inverterCatalog,
  loadProfiles,
  mpptCatalog,
  pvModuleCatalog,
  solarResourceContinentOrderPt,
  solarResourceCountries,
  solarResourceDataset,
} from '../src/lib/solar/catalogs.ts';
import { calculateDailyConsumption } from '../src/lib/solar/calculations.ts';

test('HSP cobre todos os países da fonte com códigos ISO, continentes e valores de referência', () => {
  assert.equal(solarResourceDataset.referencePeriodStartYear, 1991);
  assert.equal(solarResourceDataset.referencePeriodEndYear, 2020);
  assert.equal(solarResourceDataset.sourceUnit, 'kWh/m2/day');
  assert.equal(solarResourceCountries.length, 238);
  assert.equal(new Set(solarResourceCountries.map((country) => country.countryIso3)).size, solarResourceCountries.length);
  for (const country of solarResourceCountries) {
    assert.match(country.countryIso3, /^[A-Z]{3}$/);
    assert.ok(country.countryNamePt.trim());
    assert.ok(solarResourceContinentOrderPt.includes(country.continentPt), country.countryIso3);
    assert.ok(country.peakSunHours > 1 && country.peakSunHours < 8, country.countryIso3);
  }

  const byIso = Object.fromEntries(solarResourceCountries.map(({ countryIso3, peakSunHours }) => [countryIso3, peakSunHours]));
  assert.deepEqual(
    ['BRA', 'CHN', 'FIN', 'KEN', 'MEX', 'OMN', 'PHL', 'POL', 'AUS', 'DEU', 'EGY', 'ISL'].map((iso) => byIso[iso]),
    [5.015, 4.647, 2.318, 5.85, 5.723, 6.292, 5.031, 2.989, 5.704, 3.056, 6.372, 2.292],
  );
  assert.equal(byIso.ATA, undefined);
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
      ['agm', 'has-model-specific-reference'],
      ['lifepo4', 'has-model-specific-reference'],
    ],
  );

  const [leadAcid, agm, lifepo4] = batteryTechnologyCatalog;
  assert.ok(!leadAcid.requiredDatasheetFields.includes('chargeEfficiency'));
  assert.ok(!leadAcid.requiredDatasheetFields.includes('dischargeEfficiency'));
  assert.ok(!agm.requiredDatasheetFields.includes('chargeEfficiency'));
  assert.ok(!agm.requiredDatasheetFields.includes('dischargeEfficiency'));
  assert.ok(lifepo4.requiredDatasheetFields.includes('chargeEfficiency'));
  assert.ok(lifepo4.requiredDatasheetFields.includes('dischargeEfficiency'));
});

test('exemplos originais calculam consumo diário sem preencher campos', () => {
  const expectedWh = {
    'example-led-light': 12,
    'example-coffee-maker': 225,
    'example-laptop': 240,
    'example-water-pump': 25,
    'example-roof-fan': 180,
    'example-background-loads': 144,
  };
  const examples = equipmentCatalog.filter((item) => item.id in expectedWh);
  assert.equal(examples.length, 6);
  for (const item of examples) {
    const result = calculateDailyConsumption([buildEquipmentLoad(item, 1)], 12, 0.9, 0, 0);
    assert.equal(result.loads[0].applianceEnergyWhPerDay, expectedWh[item.id]);
  }
  const result = calculateDailyConsumption(examples.map((item) => buildEquipmentLoad(item, 1)), 12, 0.9, 0, 0);
  assert.equal(result.totalAtBatteryBusWhPerDay, 361 + 465 / 0.9);
});

test('todo item do catálogo tem fonte, id único e calcula nas tensões declaradas', () => {
  assert.ok(equipmentCatalog.length >= 35);
  assert.equal(new Set(equipmentCatalog.map((item) => item.id)).size, equipmentCatalog.length);
  for (const item of equipmentCatalog) {
    assert.ok(item.source.url.startsWith('https://'), item.id);
    assert.match(item.source.accessedOn, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(item.defaultLoad.id, item.id);
    if (item.referenceKind === 'usage-example' && item.defaultLoad.supply === 'dc') {
      assert.deepEqual(item.applicableSystemVoltagesV, [12], `${item.id}: DC genérico só em 12 V`);
    }
    for (const voltage of item.applicableSystemVoltagesV) {
      const [load] = calculateDailyConsumption([buildEquipmentLoad(item, 1)], voltage, 1, 0, 0).loads;
      assert.ok(load.applianceEnergyWhPerDay > 0, item.id);
    }
  }
  const categories = new Set(equipmentCatalog.map((item) => item.categoryId));
  assert.equal(categories.size, 7);
});

test('perfis prontos usam apenas equipamentos existentes, sem repetição e com quantidades inteiras', () => {
  assert.deepEqual(loadProfiles.map((profile) => profile.id), ['weekend', 'full-time', 'remote-work']);
  for (const profile of loadProfiles) {
    const ids = profile.items.map((item) => item.equipmentId);
    assert.equal(new Set(ids).size, ids.length, profile.id);
    for (const { equipmentId, quantity } of profile.items) {
      assert.ok(equipmentCatalog.some((item) => item.id === equipmentId), `${profile.id}: ${equipmentId}`);
      assert.ok(Number.isInteger(quantity) && quantity >= 1);
    }
  }
});

test('referências Resfri Ar cobrem 12 e 24 V com a corrente publicada e ciclo genérico editável', () => {
  const fridge24 = equipmentCatalog.find((item) => item.id === 'resfriar-geladeira-67l-24v');
  assert.deepEqual(fridge24.applicableSystemVoltagesV, [24]);
  assert.equal(calculateDailyConsumption([fridge24.defaultLoad], 24, 1, 0, 0).totalAtBatteryBusWhPerDay, 1.9 * 24 * 24 * 0.5);
  const edited = buildEquipmentLoad(fridge24, 1, { powerW: 45.6, hoursPerDay: 24, dutyCycle: 0.3 });
  assert.equal(edited.basis.dutyCycle, 0.3);
  const ac12 = equipmentCatalog.find((item) => item.id === 'resfriar-rt8000-12v');
  assert.equal(calculateDailyConsumption([ac12.defaultLoad], 12, 1, 0, 0).totalAtBatteryBusWhPerDay, 650 * 8 * 0.6);
  const cfx3 = equipmentCatalog.find((item) => item.id === 'dometic-cfx3-45');
  assert.ok(Math.abs(cfx3.defaultLoad.basis.energyWhPerDay - 1.03 * 24 * 12) < 1e-9);
});

test('editar o cenário atualiza energia e potência AC sem alterar a referência do catálogo', () => {
  const item = equipmentCatalog.find((item) => item.id === 'example-laptop');
  const load = buildEquipmentLoad(item, 2, { powerW: 80, hoursPerDay: 3 });
  assert.equal(load.ratedPowerW, 80);
  assert.equal(calculateDailyConsumption([load], 24, 0.8, 0, 0).totalAtBatteryBusWhPerDay, 600);
  assert.equal(item.defaultLoad.basis.powerW, 60);
  assert.equal(item.defaultLoad.basis.hoursPerDay, 4);
  assert.throws(() => buildEquipmentLoad(equipmentCatalog[0], 1, { powerW: 20, hoursPerDay: 3 }), /não usa um perfil/);
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
