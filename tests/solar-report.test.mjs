import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSolarReport } from '../src/lib/solar/report.ts';
import { describeBatteryBank, presentSolarReport } from '../src/lib/solar/report-presentation.ts';
import { createSolarReportPdf } from '../src/lib/solar/report-pdf.ts';
import { createSolarReportWorkbook } from '../src/lib/solar/report-xlsx.ts';
import { readFileSync } from 'node:fs';

const pdfFonts = {
  regular: readFileSync(new URL('../public/media/branding/fonts/Manrope-Regular.ttf', import.meta.url), 'base64'),
  bold: readFileSync(new URL('../public/media/branding/fonts/Manrope-Bold.ttf', import.meta.url), 'base64'),
  display: readFileSync(new URL('../public/media/branding/fonts/DMSerifDisplay-Regular.ttf', import.meta.url), 'base64'),
};

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

test('monta o guia de consumo, bateria e inversor sem seções técnicas incompletas', () => {
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
  assert.equal(report.warnings.length, 0);
  assert.match(report.calculationNotes.join(' '), /não foram dimensionados aqui/);
  for (const key of ['pvStatus', 'mpptStatus', 'dcDcChargerStatus', 'acDcChargerStatus', 'cableCircuits']) {
    assert.equal(Object.hasOwn(report, key), false);
  }

  const document = presentSolarReport(report, ['Equipamento 24 V'], true);
  assert.equal(document.summary[0].value, '441,33 Wh/dia');
  assert.equal(document.loads[1].energy, '300 Wh/dia');
  assert.match(document.excludedLoadsNote, /Equipamento 24 V/);
  assert.equal(document.warnings.length, 2);
  assert.match(document.inverterNote, /o pico não confirma/);
  const pdf = createSolarReportPdf(document, pdfFonts);
  assert.equal(Buffer.from(pdf.output('arraybuffer')).subarray(0, 5).toString(), '%PDF-');
  assert.ok(pdf.getNumberOfPages() > 1);
  assert.ok(pdf.getFontList().Manrope.includes('bold'));
  const longPdf = createSolarReportPdf({
    ...document,
    title: 'Relatório de João — Água e iluminação',
    loads: Array.from({ length: 60 }, (_, i) => ({ ...document.loads[i % 2], name: `Equipamento ${i + 1} — Água e iluminação` })),
  }, pdfFonts);
  assert.ok(longPdf.getNumberOfPages() > pdf.getNumberOfPages());
});

test('inclui a seção solar somente quando a estimativa é pedida', () => {
  const input = {
    projectName: 'Van', generatedAt: '27/11/2026', applicationVersion: '0.3.0', vehicleLabelPt: 'Van', systemVoltageV: 12,
    loads: [{ name: 'Geladeira', categoryLabelPt: 'Refrigeração', originLabelPt: 'Catálogo', load: { id: 'fridge', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 860 } } }],
    inverter: { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: null },
    battery, autonomyDays: 1, unitCapacityAh: 100, unitVoltageV: 12.8, batteryProfileLabelPt: 'LiFePO₄',
  };
  const withoutSolar = presentSolarReport(buildSolarReport(input), [], false);
  assert.equal(withoutSolar.solar.length, 0);
  assert.match(withoutSolar.notes.join(' '), /painéis, controlador/);

  const report = buildSolarReport({ ...input, solar: {
    countryLabelPt: 'Brasil', peakSunHours: 5, moduleDeratingFactor: 0.75, systemDeratingFactor: 0.9, batteryRoundTripEfficiency: 0.86, availableArrayPowerWp: 200,
  } });
  assert.ok(Math.abs(report.solar.coverageFraction - 580.5 / 860) < 1e-9);
  const document = presentSolarReport(report, [], false);
  const solarEntries = Object.fromEntries(document.solar);
  assert.equal(solarEntries['Potência ideal de painéis'], '297 Wp para repor 100% do consumo diário');
  assert.equal(solarEntries['Cobertura do consumo'], '67,5%');
  assert.equal(solarEntries['Controlador de carga (MPPT): corrente mínima'], '17 A em 12 V, para 200 Wp de painéis');
  assert.equal(solarEntries['Controlador sugerido'], '1 controlador MPPT de 20 A');
  assert.match(document.solarNote, /alternador/);
  assert.ok(document.summary.some((metric) => metric.label === 'Cobertura solar'));
  assert.match(document.notes.join(' '), /CRESESB/);
  assert.equal(Buffer.from(createSolarReportPdf(document, pdfFonts).output('arraybuffer')).subarray(0, 5).toString(), '%PDF-');
});

test('exporta planilha Excel com abas Resumo e Consumo e valores numéricos', () => {
  const report = buildSolarReport({
    projectName: 'Van & "Casa"', generatedAt: '27/11/2026', applicationVersion: '0.3.0', vehicleLabelPt: 'Van', systemVoltageV: 12,
    loads: [{ name: 'Luminária <LED>', categoryLabelPt: 'Iluminação', originLabelPt: 'Catálogo', load: { id: 'led', supply: 'dc', quantity: 4, simultaneous: true, basis: { kind: 'power-time', powerW: 3, hoursPerDay: 4 } } }],
    inverter: { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: null },
    battery, autonomyDays: 1, unitCapacityAh: 100, unitVoltageV: 12.8, batteryProfileLabelPt: 'LiFePO₄',
  });
  const bytes = createSolarReportWorkbook(presentSolarReport(report, [], false));
  assert.deepEqual([...bytes.subarray(0, 4)], [0x50, 0x4B, 0x03, 0x04]);

  // ZIP sem compressão: lê as entradas pelo diretório central.
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength - 22;
  assert.equal(view.getUint32(end, true), 0x06054B50);
  const files = new Map();
  for (let position = view.getUint32(end + 16, true), index = 0; index < view.getUint16(end + 10, true); index += 1) {
    const nameLength = view.getUint16(position + 28, true);
    const size = view.getUint32(position + 24, true);
    const localOffset = view.getUint32(position + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(position + 46, position + 46 + nameLength));
    const dataStart = localOffset + 30 + view.getUint16(localOffset + 26, true);
    files.set(name, new TextDecoder().decode(bytes.subarray(dataStart, dataStart + size)));
    position += 46 + nameLength;
  }
  assert.ok(files.has('[Content_Types].xml'));
  assert.match(files.get('xl/workbook.xml'), /<sheet name="Resumo".*<sheet name="Consumo"/);
  const summary = files.get('xl/worksheets/sheet1.xml');
  assert.match(summary, /Van &amp; &quot;Casa&quot;/);
  assert.match(summary, /Como ligar as baterias/);
  const consumption = files.get('xl/worksheets/sheet2.xml');
  assert.match(consumption, /Luminária &lt;LED&gt;/);
  assert.match(consumption, /<c r="D2"><v>4<\/v><\/c>/);
  assert.match(consumption, /<c r="F2" s="2"><v>48<\/v><\/c>/);
  assert.match(consumption, /Total exigido da bateria.*<v>48<\/v>/);
});

test('descreve o banco com tipo, capacidade e a forma de ligar as baterias', () => {
  const parallel = describeBatteryBank({ chemistryLabel: 'LiFePO4', unitVoltageV: 12.8, unitCapacityAh: 100, seriesCount: 1, parallelCount: 3 });
  assert.equal(parallel.headline, '3 baterias de 100 Ah');
  assert.equal(parallel.unitPt, 'LiFePO4 de 12,8 V e 100 Ah cada');
  assert.match(parallel.connectionPt, /^Ligação em paralelo .*12,8 V.*300 Ah/);

  const series = describeBatteryBank({ chemistryLabel: 'AGM', unitVoltageV: 12, unitCapacityAh: 210, seriesCount: 2, parallelCount: 1 });
  assert.match(series.connectionPt, /^Ligação em série .*24 V.*210 Ah/);

  const mixed = describeBatteryBank({ chemistryLabel: 'Chumbo-ácido', unitVoltageV: 12, unitCapacityAh: 220, seriesCount: 2, parallelCount: 2 });
  assert.equal(mixed.headline, '4 baterias de 220 Ah');
  assert.match(mixed.connectionPt, /2 conjuntos com 2 baterias em série.*24 V e 440 Ah/);

  const single = describeBatteryBank({ chemistryLabel: 'LiFePO4', unitVoltageV: 25.6, unitCapacityAh: 100, seriesCount: 1, parallelCount: 1 });
  assert.equal(single.unitPt, 'LiFePO4 de 25,6 V e 100 Ah');
  assert.match(single.connectionPt, /^Uma única bateria/);
});

test('gera guia Freedom em 12 e 24 V sem eficiências nem tensões de carga e corte', () => {
  for (const voltage of [12, 24]) {
    const report = buildSolarReport({
      projectName: 'Freedom',
      generatedAt: '19/11/2026',
      applicationVersion: '0.2.0',
      vehicleLabelPt: 'Motorhome médio',
      systemVoltageV: voltage,
      countryLabelPt: 'Brasil',
      peakSunHours: 5.015,
      loads: [{
        name: 'Consumo diário',
        categoryLabelPt: 'Outros',
        originLabelPt: 'Informado pelo usuário',
        load: { id: 'daily', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 528 } },
      }],
      inverter: { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: null },
      battery: { chemistry: 'lead-acid', capacityBasis: 'published-discharge', nominalVoltageV: voltage, depthOfDischarge: 0.2 },
      autonomyDays: 2,
      unitCapacityAh: 220,
      unitVoltageV: 12,
      batteryProfileLabelPt: 'Freedom DF4100',
    });
    assert.equal(report.battery.nominalCapacityWh, 5280);
    assert.equal(report.batteryConfiguration.seriesCount, voltage / 12);
    assert.equal(report.batteryConfiguration.parallelCount, 24 / voltage);
    assert.equal(report.batteryConfiguration.totalCount, 2);
    assert.equal(Object.hasOwn(report.batteryConfiguration, 'chargeEfficiency'), false);
    assert.equal(report.inverter, undefined);
    assert.equal(report.warnings.length, 0);
    assert.match(report.calculationNotes.join(' '), /C20 a 25 °C/);
    assert.match(report.calculationNotes.join(' '), /não foi presumida eficiência de 100%/);
  }
});

test('mantém visíveis incompatibilidades conhecidas no guia simplificado', () => {
  const input = {
    projectName: '', generatedAt: '19/11/2026', applicationVersion: '0.2.0',
    vehicleLabelPt: 'Van', systemVoltageV: 12, countryLabelPt: 'Brasil', peakSunHours: 5,
    loads: [{
      name: 'Carga AC', categoryLabelPt: 'Outros', originLabelPt: 'Informado',
      load: { id: 'ac', supply: 'ac', quantity: 1, simultaneous: true, ratedPowerW: 2000, startupPowerW: 4000, basis: { kind: 'power-time', powerW: 2000, hoursPerDay: 2 } },
    }],
    inverter: { efficiency: 0.9, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: 220 },
    battery, autonomyDays: 2, unitCapacityAh: 100, unitVoltageV: 12.8,
    maxParallelBatteries: 1, batteryProfileLabelPt: 'LiFePO₄',
  };
  const report = buildSolarReport(input);
  assert.equal(report.batteryConfiguration.withinKnownLimit, false);
  assert.equal(report.inverter.compatibility, 'exceeds-known-limits');
  assert.equal(report.warnings.length, 2);
  assert.match(report.warnings.join(' '), /excede um limite de descarga/);
  assert.match(report.warnings.join(' '), /não há recomendação de configuração/);
  assert.throws(() => buildSolarReport({ ...input, unitCapacityAh: 0 }), /maiores que zero/);
  const undersized = buildSolarReport({ ...input, inverter: { ...input.inverter, ratedPowerW: 1500 } });
  assert.match(undersized.warnings.join(' '), /potência contínua escolhida.*menor que a exigida/);
  assert.equal(undersized.inverterRatedPowerW, 1500);
  assert.throws(() => buildSolarReport({ ...input, inverter: { ...input.inverter, ratedPowerW: 0 } }), /potência do inversor maior que zero/);
});

test('identifica AGM e aplica sua capacidade C20 nos dois bancos sem reutilizar a Freedom', () => {
  for (const voltage of [12, 24]) {
    const report = buildSolarReport({
      projectName: 'Rolls AGM', generatedAt: '19/11/2026', applicationVersion: '0.2.0',
      vehicleLabelPt: 'Van', systemVoltageV: voltage, countryLabelPt: 'Brasil', peakSunHours: 5,
      loads: [{
        name: 'Carga', categoryLabelPt: 'Outros', originLabelPt: 'Informado',
        load: { id: 'dc', supply: 'dc', quantity: 1, simultaneous: true, basis: { kind: 'daily-energy', energyWhPerDay: 1260 } },
      }],
      inverter: { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0, outputVoltageV: null },
      battery: { chemistry: 'agm', capacityBasis: 'published-discharge', nominalVoltageV: voltage, depthOfDischarge: 0.5 },
      autonomyDays: 2, unitCapacityAh: 210, unitVoltageV: 12, batteryProfileLabelPt: 'Rolls S12-230AGM-RE',
    });
    assert.equal(report.battery.nominalCapacityWh, 5040);
    assert.equal(report.batteryConfiguration.totalCount, 2);
    assert.equal(report.batteryConfiguration.seriesCount, voltage / 12);
    assert.equal(report.batteryConfiguration.parallelCount, 24 / voltage);
    assert.match(report.calculationNotes.join(' '), /Rolls S12-230AGM-RE/);
    assert.doesNotMatch(report.calculationNotes.join(' '), /Freedom/);
    assert.equal(report.warnings.length, 0);
  }
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
