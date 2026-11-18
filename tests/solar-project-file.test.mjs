import assert from 'node:assert/strict';
import test from 'node:test';
import { validateSolarProjectFile } from '../src/lib/solar/project-file.ts';

const batteryFields = {
  nominalVoltageV: 12.8,
  capacityAh: 100,
  depthOfDischargePercent: 100,
  chargeEfficiencyPercent: 99.5,
  dischargeEfficiencyPercent: 96,
  chargeVoltageV: 14.6,
  cutoffVoltageV: 11.2,
  maxChargeCurrentA: 50,
  maxContinuousDischargeCurrentA: 100,
  maxPeakDischargeCurrentA: 300,
};

function createProjectFile() {
  return {
    format: 'odisseia-solar-project',
    version: 1,
    savedAt: '2026-03-16T12:00:00.000Z',
    config: {
      projectName: 'Viagem de teste',
      vehicleType: 'motorhome-medium',
      systemVoltageV: 12,
      countryIso3: 'BRA',
      peakSunHours: 5.015,
      catalogLoads: [{ equipmentId: 'dometic-cfx5-45', selected: true, quantity: 1 }],
      customLoads: [],
      autonomyDays: 2,
      battery: {
        chemistry: 'lifepo4',
        profileId: 'npp-lfp12-8-100',
        lifepo4: batteryFields,
        leadAcid: {
          nominalVoltageV: null,
          capacityAh: null,
          depthOfDischargePercent: null,
          chargeEfficiencyPercent: null,
          dischargeEfficiencyPercent: null,
          chargeVoltageV: null,
          cutoffVoltageV: null,
          maxChargeCurrentA: null,
          maxContinuousDischargeCurrentA: null,
          maxPeakDischargeCurrentA: null,
        },
        leadUnitVoltageV: 12,
      },
      inverter: {
        outputVoltageV: null,
        useVictronReference: false,
        efficiencyPercent: null,
        standbyPowerW: null,
        standbyHoursPerDay: null,
      },
    },
  };
}

test('valida e preserva um arquivo de projeto versionado', () => {
  const file = createProjectFile();
  assert.deepEqual(validateSolarProjectFile(file), file);
});

test('rejeita versão incompatível, propriedades extras e perfil de tensão divergente', () => {
  const wrongVersion = createProjectFile();
  wrongVersion.version = 2;
  assert.throws(() => validateSolarProjectFile(wrongVersion), /versão do arquivo não é compatível/);

  const extraProperty = createProjectFile();
  extraProperty.config.untrustedMarkup = '<script>alert(1)</script>';
  assert.throws(() => validateSolarProjectFile(extraProperty), /propriedade não reconhecida/);

  const mismatchedProfile = createProjectFile();
  mismatchedProfile.config.systemVoltageV = 24;
  assert.throws(() => validateSolarProjectFile(mismatchedProfile), /profileId não corresponde à tensão/);
});

test('rejeita valores inválidos em cargas e configurações importadas', () => {
  const invalidQuantity = createProjectFile();
  invalidQuantity.config.catalogLoads[0].quantity = 0;
  assert.throws(() => validateSolarProjectFile(invalidQuantity), /quantity deve ser um número entre/);

  const invalidCustomLoad = createProjectFile();
  invalidCustomLoad.config.customLoads.push({
    name: 'Carga incompatível',
    categoryId: 'electronics',
    load: {
      id: 'custom-load-1',
      supply: 'ac',
      quantity: 1,
      simultaneous: true,
      basis: { kind: 'current-time', currentA: 1, voltageV: 12, hoursPerDay: 1 },
      ratedPowerW: 12,
    },
  });
  assert.throws(() => validateSolarProjectFile(invalidCustomLoad), /não pode usar corrente DC para uma carga AC/);

  const invalidHsp = createProjectFile();
  invalidHsp.config.peakSunHours = Number.NaN;
  assert.throws(() => validateSolarProjectFile(invalidHsp), /peakSunHours deve ser um número/);
});
