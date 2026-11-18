import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSolarReport } from '../src/lib/solar/report.ts';

const battery = {
  chemistry: 'lifepo4',
  nominalVoltageV: 12.8,
  depthOfDischarge: 0.8,
  chargeEfficiency: 0.995,
  dischargeEfficiency: 0.96,
  maxChargeCurrentA: 50,
  maxContinuousDischargeCurrentA: 100,
  maxPeakDischargeCurrentA: 300,
  chargeVoltageV: 14.6,
  dischargeCutoffVoltageV: 11.2,
};

test('monta o relatório a partir dos cálculos existentes e explicita os dados pendentes', () => {
  const report = buildSolarReport({
    projectName: 'Motorhome',
    generatedAt: '16/03/2026',
    applicationVersion: '0.1.0',
    vehicleLabelPt: 'Motorhome médio',
    systemVoltageV: 12,
    countryLabelPt: 'Brasil',
    peakSunHours: 5.015,
    loads: [
      {
        name: 'Geladeira',
        categoryLabelPt: 'Refrigeração',
        originLabelPt: 'Referência do catálogo',
        load: {
          id: 'fridge',
          supply: 'dc',
          quantity: 1,
          simultaneous: true,
          basis: { kind: 'daily-energy', energyWhPerDay: 100 },
        },
      },
      {
        name: 'Bomba AC',
        categoryLabelPt: 'Água',
        originLabelPt: 'Informado pelo usuário',
        load: {
          id: 'custom-load-1',
          supply: 'ac',
          quantity: 1,
          simultaneous: true,
          ratedPowerW: 150,
          startupPowerW: 300,
          basis: { kind: 'power-time', powerW: 150, hoursPerDay: 2 },
        },
      },
    ],
    inverter: {
      efficiency: 0.9,
      standbyPowerW: 2,
      standbyHoursPerDay: 4,
      outputVoltageV: 230,
    },
    battery,
    autonomyDays: 2,
    unitCapacityAh: 100,
    unitVoltageV: 12.8,
    maxParallelBatteries: 6,
    batteryProfileLabelPt: 'Referência LiFePO₄ 12,8 V / 100 Ah',
  });

  assert.equal(report.consumption.totalAtBatteryBusWhPerDay, 100 + (300 / 0.9) + 8);
  assert.equal(report.loads[0].originLabelPt, 'Referência do catálogo');
  assert.equal(report.loads[1].energyWhPerDay, 300);
  assert.equal(report.batteryConfiguration.totalCount, 1);
  assert.equal(report.batteryConfiguration.chargeEfficiency, 0.995);
  assert.equal(report.inverter?.minimumContinuousPowerW, 150);
  assert.equal(report.inverter?.minimumPeakPowerW, 300);
  assert.match(report.pvStatus, /Não foi possível dimensionar com segurança/);
  assert.match(report.mpptStatus, /não foram calculadas/);
  assert.match(report.dcDcChargerStatus, /tempo de recarga/);
  assert.match(report.acDcChargerStatus, /circuito AC/);
  assert.equal(report.cableCircuits.every((circuit) => circuit.statusPt.startsWith('Pendente:')), true);
});

test('não recomenda inversor quando o projeto tem somente cargas DC', () => {
  const report = buildSolarReport({
    projectName: '',
    generatedAt: '16/03/2026',
    applicationVersion: '0.1.0',
    vehicleLabelPt: 'Van grande',
    systemVoltageV: 12,
    countryLabelPt: 'Informada pelo usuário',
    peakSunHours: 4,
    loads: [{
      name: 'Luz',
      categoryLabelPt: 'Iluminação',
      originLabelPt: 'Informado pelo usuário',
      load: {
        id: 'lamp',
        supply: 'dc',
        quantity: 2,
        simultaneous: true,
        basis: { kind: 'power-time', powerW: 5, hoursPerDay: 4 },
      },
    }],
    inverter: { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: null },
    battery: { ...battery, maxPeakDischargeCurrentA: undefined },
    autonomyDays: 1,
    unitCapacityAh: 100,
    unitVoltageV: 12.8,
    maxParallelBatteries: 1,
    batteryProfileLabelPt: 'Referência LiFePO₄',
  });

  assert.equal(report.inverter, undefined);
  assert.equal(report.consumption.totalAtBatteryBusWhPerDay, 40);
  assert.equal(report.batteryConfiguration.withinKnownLimit, true);
});
