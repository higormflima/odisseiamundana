import type { BatteryCapacityParameters, BatteryChemistry, ElectricalLoad } from '../lib/solar/calculations.ts';
import {
  agmBatteryReference,
  batteryCatalog,
  buildEquipmentLoad,
  equipmentCategories,
  equipmentCatalog,
  inverterCatalog,
  initialInverterScenario,
  loadProfiles,
  solarCoverageDefaults,
  solarResourceCountries,
} from '../lib/solar/catalogs.ts';
import {
  calculateBatteryCapacity,
  calculateDailyConsumption,
  calculateSolarCoverage,
} from '../lib/solar/calculations.ts';
import { buildSolarReport } from '../lib/solar/report.ts';
import type { SolarReportSolarInput } from '../lib/solar/report.ts';
import { describeBatteryBank, presentSolarReport } from '../lib/solar/report-presentation.ts';
import type { SolarReportDocument } from '../lib/solar/report-presentation.ts';
import { localizeValidation } from '../lib/solar/validation.ts';
import { createSolarPdfPreview } from '../lib/solar/pdf-preview.ts';
import { createSolarReportWorkbook } from '../lib/solar/report-xlsx.ts';
import { applyFields, clearStoredState, collectFields, readStoredState, writeStoredState } from './solarWizardStorage.ts';

type CustomLoadEntry = { name: string; categoryId: string; load: ElectricalLoad };

const solarApplicationVersion = '0.3.0';
export function initSolarWizard(root: HTMLElement): void {
  const get = <T extends HTMLElement>(selector: string): T => {
    const element = root.querySelector<T>(selector);
    if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
    return element;
  };
  const pdfPreview = createSolarPdfPreview(get<HTMLDialogElement>('[data-pdf-preview]'));
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-step-panel]'));
  const progressItems = Array.from(root.querySelectorAll<HTMLElement>('[data-progress-item]'));
  const stepStatus = get<HTMLElement>('[data-step-status]');
  const form = get<HTMLFormElement>('[data-solar-form]');
  const customLoads: CustomLoadEntry[] = [];
  let activeStep = 0;
  let customLoadNumber = 0;
  let preparedPdfUrl: string | undefined;
  let preparedPdfFile: File | undefined;
  let pdfGeneration = 0;
  let lastReportDocument: SolarReportDocument | undefined;
  let restoring = false;
  let saveTimer: number | undefined;

  function scheduleSave() {
    if (restoring) return;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      writeStoredState<CustomLoadEntry>({ activeStep, fields: collectFields(form), customLoads });
    }, 300);
  }

  const format = (value: number, maximumFractionDigits = 1) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value);
  const numeric = (selector: string): number | undefined => {
    const raw = get<HTMLInputElement | HTMLSelectElement>(selector).value.trim();
    if (!raw) return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
  };
  const systemVoltage = (): 12 | 24 =>
    get<HTMLInputElement>('input[name="systemVoltageV"]:checked').value === '24' ? 24 : 12;
  const selectedChemistry = (): BatteryChemistry => {
    const value = get<HTMLInputElement>('input[name="batteryChemistry"]:checked').value;
    if (value !== 'lead-acid' && value !== 'lifepo4' && value !== 'agm') throw new TypeError('Tecnologia de bateria não suportada.');
    return value;
  };

  function setPanel(panelIndex: number) {
    if (panelIndex !== panels.length - 1) clearPreparedPdf();
    activeStep = panelIndex;
    root.dataset.reportVisible = String(activeStep === panels.length - 1);
    panels.forEach((panel, index) => {
      panel.hidden = index !== activeStep;
    });
    progressItems.forEach((item, index) => {
      if (index === activeStep) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    get<HTMLElement>('[data-progress-count]').textContent = `Etapa ${activeStep + 1} de ${panels.length}`;
    get<HTMLButtonElement>('[data-step-back]').disabled = activeStep === 0;
    get<HTMLButtonElement>('[data-step-next]').hidden = activeStep === panels.length - 1;
    get<HTMLButtonElement>('[data-step-next]').textContent =
      activeStep === panels.length - 2 ? 'Gerar relatório' : 'Continuar';
    stepStatus.textContent = '';
    updateSummary();
    scheduleSave();
    if (activeStep === panels.length - 1) renderReport();
    if (activeStep > 0) panels[activeStep].querySelector<HTMLElement>('legend')?.focus();
  }

  function validatePanel(): boolean {
    const panel = panels[activeStep];
    const fields = Array.from(panel.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea'));
    fields.forEach(localizeValidation);
    const invalid = fields.find((field) => !field.disabled && !field.checkValidity());
    if (invalid) {
      invalid.closest('details')?.setAttribute('open', '');
      invalid.reportValidity();
      return false;
    }
    if (panels[activeStep].hasAttribute('data-loads-step') && getCompatibleLoads().length === 0) {
      stepStatus.textContent = 'Adicione ao menos uma carga compatível com a tensão escolhida para calcular o consumo.';
      return false;
    }
    return true;
  }

  function getCompatibleLoads(): ElectricalLoad[] {
    const voltage = systemVoltage();
    const catalogLoads = equipmentCatalog.flatMap((item) => {
      const card = root.querySelector<HTMLElement>(`[data-equipment-id="${item.id}"]`);
      const choice = card?.querySelector<HTMLInputElement>('[data-catalog-choice]');
      const quantity = card?.querySelector<HTMLInputElement>('[data-catalog-quantity]');
      if (!choice?.checked || !item.applicableSystemVoltagesV.includes(voltage) || !quantity) return [];
      const kind = item.defaultLoad.basis.kind;
      const scope = `[data-equipment-id="${item.id}"]`;
      const usage = kind === 'power-time' || kind === 'compressor-cycle' ? {
        powerW: numeric(`${scope} [data-catalog-power]`) ?? Number.NaN,
        hoursPerDay: numeric(`${scope} [data-catalog-hours]`) ?? Number.NaN,
        ...(kind === 'compressor-cycle' ? { dutyCycle: (numeric(`${scope} [data-catalog-duty]`) ?? Number.NaN) / 100 } : {}),
      } : undefined;
      return [buildEquipmentLoad(item, Number(quantity.value), usage)];
    });
    return [...catalogLoads, ...customLoads.map(({ load }) => load)];
  }

  function renderSelectedLoads() {
    const list = get<HTMLUListElement>('[data-selected-loads]');
    list.replaceChildren();
    for (const item of equipmentCatalog) {
      const card = root.querySelector<HTMLElement>(`[data-equipment-id="${item.id}"]`);
      const choice = card?.querySelector<HTMLInputElement>('[data-catalog-choice]');
      if (!choice?.checked) continue;
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = item.namePt;
      li.append(text);
      if (!item.applicableSystemVoltagesV.includes(systemVoltage())) {
        const note = document.createElement('small');
        note.textContent = `Não incluída: referência disponível para ${item.applicableSystemVoltagesV.join('/')} V.`;
        li.append(note);
      }
      list.append(li);
    }
    customLoads.forEach((entry, index) => {
      const li = document.createElement('li');
      const text = document.createElement('span');
      text.textContent = entry.name;
      const quantityLabel = document.createElement('label');
      quantityLabel.textContent = 'Quantidade ';
      const quantityInput = document.createElement('input');
      quantityInput.type = 'number';
      quantityInput.min = '1';
      quantityInput.step = '1';
      quantityInput.value = String(entry.load.quantity);
      quantityInput.setAttribute('aria-label', `Quantidade de ${entry.name}`);
      quantityInput.addEventListener('input', () => {
        entry.load.quantity = Number(quantityInput.value);
        updateSummary();
      });
      quantityLabel.append(quantityInput);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'solar-remove-load';
      remove.textContent = 'Remover';
      remove.setAttribute('aria-label', `Remover ${entry.name}`);
      remove.addEventListener('click', () => {
        customLoads.splice(index, 1);
        renderSelectedLoads();
        updateInverterFields();
        updateSummary();
      });
      li.append(text, quantityLabel, remove);
      list.append(li);
    });
    scheduleSave();
  }

  function normalizeSearch(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function updateCatalogChoices() {
    const voltage = systemVoltage();
    const query = normalizeSearch(get<HTMLInputElement>('[data-catalog-search]').value);
    const terms = query.split(/\s+/).filter(Boolean);
    let hiddenByVoltage = 0;
    equipmentCatalog.forEach((item) => {
      const card = root.querySelector<HTMLElement>(`[data-equipment-id="${item.id}"]`);
      const choice = card?.querySelector<HTMLInputElement>('[data-catalog-choice]');
      const quantity = card?.querySelector<HTMLInputElement>('[data-catalog-quantity]');
      if (!card || !choice || !quantity) return;
      const compatible = item.applicableSystemVoltagesV.includes(voltage);
      const matches = terms.every((term) => (card.dataset.searchText ?? '').includes(term));
      if (!compatible && !choice.checked) hiddenByVoltage += 1;
      card.hidden = !matches || (!compatible && !choice.checked);
      choice.disabled = !compatible && !choice.checked;
      const active = compatible && choice.checked;
      quantity.disabled = !active;
      const fields = card.querySelector<HTMLElement>('[data-catalog-fields]');
      if (fields) fields.hidden = !choice.checked;
      card.querySelectorAll<HTMLInputElement>('[data-catalog-power], [data-catalog-hours], [data-catalog-duty]').forEach((field) => {
        field.disabled = !active;
      });
    });
    let visibleTotal = 0;
    root.querySelectorAll<HTMLDetailsElement>('[data-catalog-category]').forEach((category) => {
      const cards = Array.from(category.querySelectorAll<HTMLElement>('[data-catalog-equipment]'));
      const visible = cards.filter((card) => !card.hidden).length;
      const selected = cards.filter((card) => card.querySelector<HTMLInputElement>('[data-catalog-choice]')?.checked).length;
      visibleTotal += visible;
      category.hidden = terms.length > 0 && visible === 0;
      if (terms.length > 0 && visible > 0) category.open = true;
      const empty = category.querySelector<HTMLElement>('[data-category-empty]');
      if (empty) empty.hidden = visible > 0;
      const count = category.querySelector<HTMLElement>('[data-category-count]');
      const itemsLabel = `${visible} ${visible === 1 ? 'item' : 'itens'}`;
      if (count) count.textContent = selected ? `${selected} ${selected === 1 ? 'selecionado' : 'selecionados'} · ${itemsLabel}` : itemsLabel;
    });
    get<HTMLElement>('[data-catalog-no-results]').hidden = visibleTotal > 0;
    get<HTMLElement>('[data-catalog-voltage-note]').textContent = hiddenByVoltage
      ? `${hiddenByVoltage} equipamentos DC de referência existem apenas para outra tensão e estão ocultos no banco de ${voltage} V. Se usar um conversor, adicione-os manualmente com o consumo do seu aparelho.`
      : '';
    renderSelectedLoads();
  }

  function applyLoadProfile(profileId: string) {
    const profile = loadProfiles.find((item) => item.id === profileId);
    if (!profile) return;
    const choices = Array.from(root.querySelectorAll<HTMLInputElement>('[data-catalog-choice]'));
    if (choices.some((choice) => choice.checked)
      && !window.confirm(`Substituir a seleção atual do catálogo pelo perfil “${profile.namePt}”? Os equipamentos adicionados manualmente serão mantidos.`)) return;
    const quantities = new Map(profile.items.map((item) => [item.equipmentId, item.quantity]));
    equipmentCatalog.forEach((item) => {
      const card = root.querySelector<HTMLElement>(`[data-equipment-id="${item.id}"]`);
      if (!card) return;
      const choice = card.querySelector<HTMLInputElement>('[data-catalog-choice]');
      const quantity = card.querySelector<HTMLInputElement>('[data-catalog-quantity]');
      if (!choice || !quantity) return;
      choice.checked = quantities.has(item.id);
      quantity.value = String(quantities.get(item.id) ?? 1);
      const basis = item.defaultLoad.basis;
      const power = card.querySelector<HTMLInputElement>('[data-catalog-power]');
      const hours = card.querySelector<HTMLInputElement>('[data-catalog-hours]');
      const duty = card.querySelector<HTMLInputElement>('[data-catalog-duty]');
      if (basis.kind === 'power-time') {
        if (power) power.value = String(basis.powerW);
        if (hours) hours.value = String(basis.hoursPerDay);
      } else if (basis.kind === 'compressor-cycle') {
        if (power) power.value = String(basis.runningPowerW);
        if (hours) hours.value = String(basis.operatingWindowHoursPerDay);
        if (duty) duty.value = String(basis.dutyCycle * 100);
      }
    });
    root.querySelectorAll<HTMLDetailsElement>('[data-catalog-category]').forEach((category) => {
      category.open = Array.from(category.querySelectorAll<HTMLInputElement>('[data-catalog-choice]')).some((choice) => choice.checked);
    });
    updateCatalogChoices();
    updateInverterFields();
    updateSummary();
    scheduleSave();
    const unavailable = profile.items.filter(({ equipmentId }) =>
      !equipmentCatalog.find((item) => item.id === equipmentId)?.applicableSystemVoltagesV.includes(systemVoltage()));
    get<HTMLElement>('[data-profile-status]').textContent = unavailable.length
      ? `Perfil “${profile.namePt}” aplicado. ${unavailable.length} ${unavailable.length === 1 ? 'item DC de referência só existe' : 'itens DC de referência só existem'} em 12 V e não entram no banco de ${systemVoltage()} V; adicione-os manualmente se tiver a versão ${systemVoltage()} V.`
      : `Perfil “${profile.namePt}” aplicado. Ajuste os valores à sua rotina.`;
  }

  function updateLoadTotal() {
    const node = get<HTMLElement>('[data-load-total]');
    const loads = getCompatibleLoads();
    if (!loads.length) {
      node.textContent = 'Nenhum equipamento selecionado';
      return;
    }
    try {
      const total = loads.reduce((sum, load) =>
        sum + calculateDailyConsumption([load], systemVoltage(), 1, 0, 0).loads[0].applianceEnergyWhPerDay, 0);
      node.textContent = `${loads.length} ${loads.length === 1 ? 'equipamento' : 'equipamentos'} · ${format(total)} Wh/dia antes das perdas do inversor`;
    } catch {
      node.textContent = `${loads.length} ${loads.length === 1 ? 'equipamento' : 'equipamentos'} · revise os valores informados`;
    }
  }

  function updateHsp() {
    const country = get<HTMLSelectElement>('[data-country]').value;
    const hsp = get<HTMLInputElement>('[data-hsp]');
    const countryRecord = solarResourceCountries.find((item) => item.countryIso3 === country);
    if (country === 'manual') {
      hsp.value = '';
      get<HTMLElement>('[data-hsp-status]').textContent = 'Informe a HSP de uma fonte ou local de referência. O aplicativo não estima esse valor.';
    } else if (countryRecord) {
      hsp.value = String(countryRecord.peakSunHours);
      get<HTMLElement>('[data-hsp-status]').textContent = 'Média nacional anual do catálogo. Para viajar no inverno ou em regiões de pouco sol, informe um valor menor.';
    }
    updateSummary();
  }

  function updateCustomBasis() {
    const basis = get<HTMLSelectElement>('[data-custom-basis]').value;
    root.querySelectorAll<HTMLElement>('[data-basis-fields]').forEach((group) => {
      const visible = group.dataset.basisFields === basis;
      group.hidden = !visible;
      group.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((field) => {
        field.disabled = !visible;
      });
    });
    const supply = get<HTMLSelectElement>('[data-custom-supply]').value;
    const basisSelect = get<HTMLSelectElement>('[data-custom-basis]');
    const dcOnlyBases = ['current-time', 'amp-hours-per-day'];
    dcOnlyBases.forEach((kind) => {
      const option = basisSelect.querySelector<HTMLOptionElement>(`option[value="${kind}"]`);
      if (option) option.disabled = supply === 'ac';
    });
    if (supply === 'ac' && dcOnlyBases.includes(basis)) {
      basisSelect.value = 'power-time';
      updateCustomBasis();
      return;
    }
    const acFields = get<HTMLElement>('[data-custom-ac-fields]');
    acFields.hidden = supply !== 'ac';
    acFields.querySelectorAll<HTMLInputElement>('input').forEach((field) => {
      field.disabled = supply !== 'ac';
    });
  }

  function addCustomLoad() {
    const name = get<HTMLInputElement>('[data-custom-name]').value.trim();
    const supply = get<HTMLSelectElement>('[data-custom-supply]').value as 'dc' | 'ac';
    const basisKind = get<HTMLSelectElement>('[data-custom-basis]').value;
    const quantity = numeric('[data-custom-quantity]');
    const error = get<HTMLElement>('[data-custom-error]');
    let basis: ElectricalLoad['basis'] | undefined;
    const power = numeric('[data-custom-power]');
    const hours = numeric('[data-custom-hours]');
    const energy = numeric('[data-custom-daily-energy]');
    const averagePower = numeric('[data-custom-average-power]');
    const runningPower = numeric('[data-custom-running-power]');
    const operatingHours = numeric('[data-custom-operating-hours]');
    const dutyCycle = numeric('[data-custom-duty-cycle]');
    const current = numeric('[data-custom-current]');
    const currentHours = numeric('[data-custom-current-hours]');
    const currentVoltage = Number(get<HTMLSelectElement>('[data-custom-voltage]').value);
    const monthlyEnergy = numeric('[data-custom-monthly-energy]');
    const ampHours = numeric('[data-custom-amp-hours]');
    const ampHoursVoltage = Number(get<HTMLSelectElement>('[data-custom-amp-hours-voltage]').value);

    if (basisKind === 'power-time' && power !== undefined && hours !== undefined && power > 0 && hours >= 0 && hours <= 24) {
      basis = { kind: 'power-time', powerW: power, hoursPerDay: hours };
    } else if (basisKind === 'monthly-energy' && monthlyEnergy !== undefined && monthlyEnergy > 0) {
      basis = { kind: 'monthly-energy', energyKWhPerMonth: monthlyEnergy };
    } else if (basisKind === 'amp-hours-per-day' && supply === 'dc' && ampHours !== undefined && ampHours > 0) {
      basis = { kind: 'amp-hours-per-day', ampHoursPerDay: ampHours, voltageV: ampHoursVoltage };
    } else if (basisKind === 'daily-energy' && energy !== undefined && energy > 0) {
      basis = { kind: 'daily-energy', energyWhPerDay: energy };
    } else if (basisKind === 'average-power-24h' && averagePower !== undefined && averagePower > 0) {
      basis = { kind: 'average-power-24h', averagePowerW: averagePower };
    } else if (basisKind === 'compressor-cycle'
      && runningPower !== undefined && runningPower > 0
      && operatingHours !== undefined && operatingHours >= 0 && operatingHours <= 24
      && dutyCycle !== undefined && dutyCycle >= 0 && dutyCycle <= 100) {
      basis = { kind: 'compressor-cycle', runningPowerW: runningPower, operatingWindowHoursPerDay: operatingHours, dutyCycle: dutyCycle / 100 };
    } else if (basisKind === 'current-time'
      && supply === 'dc' && current !== undefined && current > 0
      && currentHours !== undefined && currentHours >= 0 && currentHours <= 24) {
      basis = { kind: 'current-time', currentA: current, voltageV: currentVoltage, hoursPerDay: currentHours };
    }

    const ratedPowerW = numeric('[data-custom-rated-power]');
    const startupPowerW = numeric('[data-custom-startup-power]');
    if (!name || quantity === undefined || !Number.isInteger(quantity) || quantity < 1 || !basis
      || (supply === 'ac' && (ratedPowerW === undefined || ratedPowerW <= 0))
      || (startupPowerW !== undefined && startupPowerW <= 0)) {
      error.textContent = 'Preencha o nome, a quantidade e os valores necessários para a base de consumo escolhida.';
      error.hidden = false;
      return;
    }

    const load: ElectricalLoad = {
      id: `custom-load-${++customLoadNumber}`,
      supply,
      quantity,
      simultaneous: get<HTMLInputElement>('[data-custom-simultaneous]').checked,
      basis,
      ...(supply === 'ac' && ratedPowerW !== undefined ? { ratedPowerW } : {}),
      ...(supply === 'ac' && startupPowerW !== undefined ? { startupPowerW } : {}),
    };
    try {
      calculateDailyConsumption([load], systemVoltage(), 1, 0, 0);
    } catch (calculationError) {
      if (!(calculationError instanceof TypeError || calculationError instanceof RangeError)) throw calculationError;
      error.textContent = calculationError.message;
      error.hidden = false;
      return;
    }
    customLoads.push({
      name,
      categoryId: get<HTMLSelectElement>('[data-custom-category]').value,
      load,
    });
    error.hidden = true;
    get<HTMLInputElement>('[data-custom-name]').value = '';
    renderSelectedLoads();
    updateInverterFields();
    updateSummary();
  }

  function profileForCurrentVoltage() {
    return batteryCatalog.find((profile) => profile.systemVoltageV === systemVoltage()) ?? batteryCatalog[0];
  }

  function applyLifepo4Profile(profileId: string) {
    const profile = batteryCatalog.find((item) => item.id === profileId);
    if (!profile) throw new Error(`Perfil de bateria não encontrado: ${profileId}`);
    get<HTMLSelectElement>('[data-battery-profile]').value = profile.id;
    get<HTMLInputElement>('[data-lfp-nominal-voltage]').value = String(profile.parameters.nominalVoltageV);
    get<HTMLInputElement>('[data-lfp-capacity]').value = String(profile.nominalCapacityAh);
    get<HTMLInputElement>('[data-lfp-dod]').value = String(profile.parameters.depthOfDischarge * 100);
    get<HTMLInputElement>('[data-lfp-charge-efficiency]').value = String(profile.parameters.chargeEfficiency * 100);
    get<HTMLInputElement>('[data-lfp-discharge-efficiency]').value = String(profile.parameters.dischargeEfficiency * 100);
    get<HTMLInputElement>('[data-lfp-charge-voltage]').value = String(profile.parameters.chargeVoltageV);
    get<HTMLInputElement>('[data-lfp-cutoff-voltage]').value = String(profile.parameters.dischargeCutoffVoltageV);
    get<HTMLInputElement>('[data-lfp-max-charge]').value = String(profile.parameters.maxChargeCurrentA ?? '');
    get<HTMLInputElement>('[data-lfp-max-discharge]').value = String(profile.parameters.maxContinuousDischargeCurrentA ?? '');
    get<HTMLInputElement>('[data-lfp-max-peak]').value = String(profile.parameters.maxPeakDischargeCurrentA ?? '');
    get<HTMLElement>('[data-battery-profile-note]').textContent = `${profile.notePt} ${profile.depthOfDischargeBasisPt}`;
    const source = get<HTMLAnchorElement>('[data-battery-source]');
    source.href = profile.sources[0].url;
    source.textContent = `Abrir ficha técnica do perfil ${profile.namePt}`;
  }

  function updateBatteryChoice() {
    const isLifepo4 = selectedChemistry() === 'lifepo4';
    const isLeadAcid = selectedChemistry() === 'lead-acid';
    const lifepo4Panel = get<HTMLElement>('[data-lifepo4-panel]');
    const leadAcidPanel = get<HTMLElement>('[data-lead-acid-panel]');
    const agmPanel = get<HTMLElement>('[data-agm-panel]');
    const profileSelect = get<HTMLSelectElement>('[data-battery-profile]');
    const compatibleProfile = profileForCurrentVoltage();
    Array.from(profileSelect.options).forEach((option) => {
      const profile = batteryCatalog.find((item) => item.id === option.value);
      option.disabled = Boolean(profile && profile.systemVoltageV !== systemVoltage());
    });
    if (isLifepo4 && profileSelect.value !== compatibleProfile.id) {
      applyLifepo4Profile(compatibleProfile.id);
    }
    lifepo4Panel.hidden = !isLifepo4;
    leadAcidPanel.hidden = !isLeadAcid;
    agmPanel.hidden = selectedChemistry() !== 'agm';
    lifepo4Panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((field) => {
      field.disabled = !isLifepo4;
    });
    leadAcidPanel.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((field) => {
      field.disabled = !isLeadAcid;
    });
    agmPanel.querySelectorAll<HTMLInputElement>('input').forEach((field) => {
      field.disabled = Boolean(agmPanel.hidden);
      field.required = !agmPanel.hidden;
    });
    [
      '[data-lfp-nominal-voltage]', '[data-lfp-capacity]', '[data-lfp-dod]',
      '[data-lfp-charge-efficiency]', '[data-lfp-discharge-efficiency]',
      '[data-lfp-charge-voltage]', '[data-lfp-cutoff-voltage]',
    ].forEach((selector) => { get<HTMLInputElement>(selector).required = isLifepo4; });
    [
      '[data-lead-unit-voltage]', '[data-lead-capacity]', '[data-lead-dod]',
    ].forEach((selector) => {
      const field = get<HTMLInputElement | HTMLSelectElement>(selector);
      field.required = isLeadAcid;
    });
    const unitVoltage = get<HTMLSelectElement>('[data-lead-unit-voltage]');
    Array.from(unitVoltage.options).forEach((option) => {
      option.disabled = Number(option.value) > systemVoltage();
    });
    if (Number(unitVoltage.value) > systemVoltage()) unitVoltage.value = String(systemVoltage());
    updateSummary();
  }

  function updateInverterFields() {
    const hasAcLoads = getCompatibleLoads().some((load) => load.supply === 'ac');
    const settings = get<HTMLElement>('[data-inverter-settings]');
    settings.hidden = !hasAcLoads;
    const outputVoltage = get<HTMLSelectElement>('[data-ac-output]');
    const referenceWrap = get<HTMLElement>('[data-inverter-reference-wrap]');
    const referenceNote = get<HTMLElement>('[data-inverter-reference-note]');
    const useReference = get<HTMLInputElement>('[data-use-victron-reference]');
    const fields = [
      get<HTMLInputElement>('[data-inverter-rated-power]'),
      get<HTMLInputElement>('[data-inverter-efficiency]'),
      get<HTMLInputElement>('[data-inverter-standby]'),
      get<HTMLInputElement>('[data-inverter-standby-hours]'),
    ];
    outputVoltage.required = hasAcLoads;
    fields.forEach((field) => {
      field.required = hasAcLoads;
      field.disabled = !hasAcLoads;
    });
    referenceWrap.hidden = !hasAcLoads || outputVoltage.value !== '230';
    referenceWrap.querySelector('input')?.toggleAttribute('disabled', !hasAcLoads || outputVoltage.value !== '230');
    if ((!hasAcLoads || outputVoltage.value !== '230') && useReference.checked) {
      useReference.checked = false;
    }
    referenceNote.hidden = !hasAcLoads || !useReference.checked;
    get<HTMLElement>('[data-inverter-status]').textContent = useReference.checked
      ? 'Perfil de referência: eficiência máxima e consumo sem carga do modelo Victron correspondente a 12/24 V; ajuste as horas em espera.'
      : initialInverterScenario.notePt;
    updateSummary();
  }

  function applyInverterReference() {
    const inverter = inverterCatalog.find((item) => item.batteryVoltageV === systemVoltage() && item.outputVoltageV === 230);
    if (!inverter) throw new Error(`Perfil de inversor 230 V não encontrado para ${systemVoltage()} V.`);
    get<HTMLInputElement>('[data-inverter-rated-power]').value = String(inverter.continuousOutputPowerW);
    get<HTMLInputElement>('[data-inverter-efficiency]').value = String(inverter.maximumEfficiency * 100);
    get<HTMLInputElement>('[data-inverter-standby]').value = String(inverter.zeroLoadPowerW);
    updateInverterFields();
  }

  function readBatteryConfig(): {
    battery: BatteryCapacityParameters & { nominalVoltageV: number };
    chargeVoltageV?: number;
    dischargeCutoffVoltageV?: number;
    unitCapacityAh: number;
    unitVoltageV: number;
    maxParallelBatteries?: number;
  } | undefined {
    const chemistry = selectedChemistry();
    if (chemistry === 'lifepo4') {
      const profile = batteryCatalog.find((item) => item.id === get<HTMLSelectElement>('[data-battery-profile]').value);
      const nominalVoltageV = numeric('[data-lfp-nominal-voltage]');
      const unitCapacityAh = numeric('[data-lfp-capacity]');
      const depthOfDischarge = numeric('[data-lfp-dod]');
      const chargeEfficiency = numeric('[data-lfp-charge-efficiency]');
      const dischargeEfficiency = numeric('[data-lfp-discharge-efficiency]');
      const chargeVoltageV = numeric('[data-lfp-charge-voltage]');
      const dischargeCutoffVoltageV = numeric('[data-lfp-cutoff-voltage]');
      if (!profile || profile.systemVoltageV !== systemVoltage()
        || nominalVoltageV === undefined || unitCapacityAh === undefined
        || depthOfDischarge === undefined || chargeEfficiency === undefined
        || dischargeEfficiency === undefined || chargeVoltageV === undefined
        || dischargeCutoffVoltageV === undefined
        || Math.abs(nominalVoltageV - systemVoltage()) > systemVoltage() * 0.1
        || chargeVoltageV <= systemVoltage() || dischargeCutoffVoltageV >= systemVoltage()) return undefined;
      const optionalCurrent = (selector: string) => numeric(selector);
      return {
        battery: {
          chemistry,
          nominalVoltageV,
          depthOfDischarge: depthOfDischarge / 100,
          chargeEfficiency: chargeEfficiency / 100,
          dischargeEfficiency: dischargeEfficiency / 100,
          maxChargeCurrentA: optionalCurrent('[data-lfp-max-charge]'),
          maxContinuousDischargeCurrentA: optionalCurrent('[data-lfp-max-discharge]'),
          maxPeakDischargeCurrentA: optionalCurrent('[data-lfp-max-peak]'),
        },
        chargeVoltageV,
        dischargeCutoffVoltageV,
        unitCapacityAh,
        unitVoltageV: nominalVoltageV,
        maxParallelBatteries: profile.maxParallelBatteries,
      };
    }

    if (chemistry === 'agm') {
      const unitCapacityAh = numeric('[data-agm-capacity]');
      const depthOfDischarge = numeric('[data-agm-dod]');
      if (unitCapacityAh === undefined || depthOfDischarge === undefined) return undefined;
      return {
        battery: {
          chemistry,
          capacityBasis: 'published-discharge',
          nominalVoltageV: systemVoltage(),
          depthOfDischarge: depthOfDischarge / 100,
        },
        unitCapacityAh,
        unitVoltageV: agmBatteryReference.nominalVoltageV,
      };
    }

    const unitCapacityAh = numeric('[data-lead-capacity]');
    const depthOfDischarge = numeric('[data-lead-dod]');
    const unitVoltageV = Number(get<HTMLSelectElement>('[data-lead-unit-voltage]').value);
    if (unitCapacityAh === undefined || depthOfDischarge === undefined) return undefined;
    return {
      battery: {
        capacityBasis: 'published-discharge',
        chemistry,
        nominalVoltageV: systemVoltage(),
        depthOfDischarge: depthOfDischarge / 100,
      },
      unitCapacityAh,
      unitVoltageV,
    };
  }

  function solarEnabled(): boolean {
    return get<HTMLInputElement>('[data-solar-enabled]').checked;
  }

  function batteryEfficiencyAutoValue(): { key: string; percent?: number } {
    const chemistry = selectedChemistry();
    if (chemistry !== 'lifepo4') {
      return { key: chemistry, percent: solarCoverageDefaults.leadAcidRoundTripEfficiency * 100 };
    }
    const charge = numeric('[data-lfp-charge-efficiency]');
    const discharge = numeric('[data-lfp-discharge-efficiency]');
    return {
      key: `lifepo4:${charge}:${discharge}`,
      percent: charge !== undefined && discharge !== undefined ? Math.round(charge * discharge) / 100 : undefined,
    };
  }

  /** Preenche a eficiência global conforme a química, preservando edições do usuário até a química mudar. */
  function syncSolarBatteryEfficiency() {
    const field = get<HTMLInputElement>('[data-solar-battery-efficiency]');
    const auto = batteryEfficiencyAutoValue();
    if (field.dataset.autoSource === auto.key) return;
    field.dataset.autoSource = auto.key;
    field.value = auto.percent === undefined ? '' : String(auto.percent);
  }

  function updateSolarFields() {
    const enabled = solarEnabled();
    const wrapper = get<HTMLElement>('[data-solar-fields]');
    wrapper.hidden = !enabled;
    wrapper.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select').forEach((field) => {
      field.disabled = !enabled;
    });
  }

  function readSolarConfig(): SolarReportSolarInput | undefined {
    const peakSunHours = numeric('[data-hsp]');
    const moduleDeratingFactor = numeric('[data-solar-red1]');
    const systemDeratingFactor = numeric('[data-solar-red2]');
    const batteryEfficiency = numeric('[data-solar-battery-efficiency]');
    const availableArrayPowerWp = numeric('[data-solar-max-wp]');
    if (peakSunHours === undefined || moduleDeratingFactor === undefined
      || systemDeratingFactor === undefined || batteryEfficiency === undefined) return undefined;
    const countryIso3 = get<HTMLSelectElement>('[data-country]').value;
    const country = solarResourceCountries.find((item) => item.countryIso3 === countryIso3);
    return {
      countryLabelPt: country?.countryNamePt ?? 'Informada pelo usuário',
      peakSunHours,
      moduleDeratingFactor,
      systemDeratingFactor,
      batteryRoundTripEfficiency: batteryEfficiency / 100,
      ...(availableArrayPowerWp === undefined ? {} : { availableArrayPowerWp }),
    };
  }

  function renderSolarResults(dailyEnergyWh: number | undefined) {
    const summaryNode = get<HTMLElement>('[data-summary-sun]');
    const results = get<HTMLDListElement>('[data-solar-results]');
    const status = get<HTMLElement>('[data-solar-status]');
    results.replaceChildren();
    status.textContent = '';
    if (!solarEnabled()) {
      summaryNode.textContent = 'Opcional · etapa 4';
      return;
    }
    const config = readSolarConfig();
    if (dailyEnergyWh === undefined || !config) {
      summaryNode.textContent = 'Aguardando dados';
      status.textContent = dailyEnergyWh === undefined
        ? 'Complete as cargas e o inversor para calcular a energia solar.'
        : 'Informe a HSP e os fatores de perda para calcular a energia solar.';
      return;
    }
    try {
      const coverage = calculateSolarCoverage({ ...config, dailyEnergyAtBatteryBusWh: dailyEnergyWh, systemVoltageV: systemVoltage() });
      const rows: Array<[string, string]> = [
        ['Potência ideal de painéis', `${format(Math.ceil(coverage.idealArrayPowerWp), 0)} Wp`],
      ];
      if (coverage.coverageFraction !== undefined) {
        rows.push(
          ['Geração estimada', `${format(coverage.estimatedGenerationWhPerDay ?? 0)} Wh/dia`],
          ['Cobertura do consumo', coverage.coverageFraction >= 1 ? '100% ou mais' : `${format(coverage.coverageFraction * 100)}%`],
          ['Déficit diário', (coverage.deficitWhPerDay ?? 0) > 0 ? `${format(coverage.deficitWhPerDay ?? 0)} Wh/dia` : 'Sem déficit'],
        );
      }
      rows.push(['Controlador (MPPT): corrente mínima', `${format(Math.ceil(coverage.minimumControllerChargeCurrentA), 0)} A em ${systemVoltage()} V`]);
      rows.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        results.append(row);
      });
      summaryNode.textContent = coverage.coverageFraction === undefined
        ? `${format(Math.ceil(coverage.idealArrayPowerWp), 0)} Wp ideais`
        : `Cobertura de ${coverage.coverageFraction >= 1 ? '100% ou mais' : `${format(coverage.coverageFraction * 100, 0)}%`}`;
      status.textContent = coverage.coverageFraction === undefined
        ? 'Informe a potência que cabe no veículo para ver a cobertura do consumo.'
        : (coverage.deficitWhPerDay ?? 0) > 0
          ? 'O déficit pode vir do alternador (carregador DC-DC), de tomada externa ou da redução do consumo.'
          : 'Com a HSP informada, os painéis repõem o consumo diário. Em dias nublados a geração cai.';
    } catch (calculationError) {
      if (!(calculationError instanceof TypeError || calculationError instanceof RangeError)) throw calculationError;
      summaryNode.textContent = 'Verifique os dados solares';
      status.textContent = calculationError.message;
    }
  }

  function readInverterConfig() {
    const hasAcLoads = getCompatibleLoads().some((load) => load.supply === 'ac');
    if (!hasAcLoads) return { efficiency: 1, standbyPowerW: 0, standbyHoursPerDay: 0 };
    const outputVoltage = get<HTMLSelectElement>('[data-ac-output]').value;
    const ratedPowerW = numeric('[data-inverter-rated-power]');
    const efficiencyPercent = numeric('[data-inverter-efficiency]');
    const standbyPowerW = numeric('[data-inverter-standby]');
    const standbyHoursPerDay = numeric('[data-inverter-standby-hours]');
    if (!outputVoltage || ratedPowerW === undefined || efficiencyPercent === undefined || standbyPowerW === undefined || standbyHoursPerDay === undefined) return undefined;
    return { ratedPowerW, efficiency: efficiencyPercent / 100, standbyPowerW, standbyHoursPerDay };
  }

  function setReportDefinitionList(selector: string, entries: Array<[string, string]>) {
    const list = get<HTMLDListElement>(selector);
    list.replaceChildren();
    entries.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      list.append(row);
    });
  }

  function setReportLoads(loads: SolarReportDocument['loads']) {
    const body = get<HTMLTableSectionElement>('[data-report-loads]');
    body.replaceChildren();
    loads.forEach((load) => {
      const row = document.createElement('tr');
      [load.name, load.quantity, load.basis, load.energy].forEach((value, index) => {
        const cell = document.createElement('td');
        cell.dataset.label = ['Equipamento', 'Quantidade', 'Uso por unidade', 'Energia por dia'][index];
        if (index === 0) {
          const name = document.createElement('strong');
          name.textContent = value;
          const detail = document.createElement('small');
          detail.textContent = load.detail;
          cell.append(name, detail);
        } else cell.textContent = value;
        row.append(cell);
      });
      body.append(row);
    });
  }

  function setReportList(selector: string, entries: string[]) {
    const list = get<HTMLUListElement>(selector);
    list.replaceChildren();
    entries.forEach((entry) => {
      const item = document.createElement('li');
      item.textContent = entry;
      list.append(item);
    });
  }

  function clearPreparedPdf() {
    pdfGeneration += 1;
    pdfPreview.reset();
    get<HTMLButtonElement>('[data-open-pdf]').hidden = true;
    const downloadLink = get<HTMLAnchorElement>('[data-save-pdf]');
    downloadLink.hidden = true;
    downloadLink.removeAttribute('href');
    downloadLink.removeAttribute('download');
    const shareButton = get<HTMLButtonElement>('[data-share-pdf]');
    shareButton.hidden = true;
    shareButton.disabled = false;
    shareButton.removeAttribute('aria-busy');
    if (preparedPdfUrl) URL.revokeObjectURL(preparedPdfUrl);
    preparedPdfUrl = undefined;
    preparedPdfFile = undefined;
    const button = get<HTMLButtonElement>('[data-download-pdf]');
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.textContent = 'Gerar PDF';
  }

  function renderReport(): SolarReportDocument | undefined {
    clearPreparedPdf();
    const status = get<HTMLElement>('[data-project-file-status]');
    const reportContent = get<HTMLElement>('[data-report-content]');
    const downloadButton = get<HTMLButtonElement>('[data-download-pdf]');
    reportContent.hidden = true;
    lastReportDocument = undefined;
    downloadButton.disabled = true;
    const loads = getCompatibleLoads();
    const inverter = readInverterConfig();
    const batteryConfig = readBatteryConfig();
    const autonomyDays = numeric('[data-autonomy]');
    const solar = solarEnabled() ? readSolarConfig() : undefined;
    if (!loads.length || !inverter || !batteryConfig || autonomyDays === undefined || (solarEnabled() && !solar)) {
      status.textContent = 'Não foi possível gerar o relatório. Revise as cargas, a autonomia, os dados da bateria/inversor e, se ativada, a etapa solar.';
      return;
    }

    try {
      const vehicle = get<HTMLSelectElement>('[data-vehicle-type]');
      const vehicleLabelPt = vehicle.selectedOptions[0]?.textContent?.trim() || 'Não informado';
      const categoryLabel = (categoryId: string) =>
        equipmentCategories.find((category) => category.id === categoryId)?.labelPt ?? 'Outros';
      const reportLoads = loads.map((load) => {
        const catalogItem = equipmentCatalog.find((item) => item.id === load.id);
        if (catalogItem) {
          return {
            name: catalogItem.namePt,
            categoryLabelPt: categoryLabel(catalogItem.categoryId),
            originLabelPt: catalogItem.referenceKind === 'usage-example'
              ? 'Cenário genérico de uso; valores editáveis'
              : load.quantity === 1 ? 'Referência do catálogo (editável)' : 'Referência do catálogo; quantidade ajustada',
            load,
          };
        }
        const customItem = customLoads.find((item) => item.load.id === load.id);
        if (!customItem) throw new Error(`Carga selecionada sem identificação para o relatório: ${load.id}.`);
        return {
          name: customItem.name,
          categoryLabelPt: categoryLabel(customItem.categoryId),
          originLabelPt: 'Dados informados pelo usuário',
          load,
        };
      });
      const batteryProfile = batteryCatalog.find((item) => item.id === get<HTMLSelectElement>('[data-battery-profile]').value);
      const batteryProfileLabelPt = selectedChemistry() === 'lifepo4'
        ? batteryProfile?.namePt ?? 'Referência LiFePO₄'
        : selectedChemistry() === 'agm'
          ? 'AGM — capacidade de descarga informada; referência inicial Rolls S12-230AGM-RE'
          : 'Chumbo-ácido — capacidade de descarga informada; referência inicial Freedom DF4100';
      const generatedAt = new Date();
      const report = buildSolarReport({
        projectName: get<HTMLInputElement>('[data-project-name]').value.trim(),
        generatedAt: generatedAt.toLocaleString('pt-BR'),
        applicationVersion: solarApplicationVersion,
        vehicleLabelPt,
        systemVoltageV: systemVoltage(),
        loads: reportLoads,
        ...(solar ? { solar } : {}),
        inverter: {
          ...inverter,
          outputVoltageV: get<HTMLSelectElement>('[data-ac-output]').value
            ? Number(get<HTMLSelectElement>('[data-ac-output]').value)
            : null,
        },
        battery: {
          ...batteryConfig.battery,
          chargeVoltageV: batteryConfig.chargeVoltageV,
          dischargeCutoffVoltageV: batteryConfig.dischargeCutoffVoltageV,
        },
        autonomyDays,
        unitCapacityAh: batteryConfig.unitCapacityAh,
        unitVoltageV: batteryConfig.unitVoltageV,
        maxParallelBatteries: batteryConfig.maxParallelBatteries,
        batteryProfileLabelPt,
      });
      const excludedCatalogLoads = equipmentCatalog.flatMap((item) => {
        const card = root.querySelector<HTMLElement>(`[data-equipment-id="${item.id}"]`);
        const choice = card?.querySelector<HTMLInputElement>('[data-catalog-choice]');
        return choice?.checked && !item.applicableSystemVoltagesV.includes(systemVoltage())
          ? [item.namePt]
          : [];
      });
      const reportDocument = presentSolarReport(report, excludedCatalogLoads, get<HTMLInputElement>('[data-use-victron-reference]').checked);
      get<HTMLElement>('[data-report-title]').textContent = reportDocument.title;
      setReportDefinitionList('[data-report-identification]', reportDocument.identification);
      const summary = get<HTMLDListElement>('[data-report-summary]');
      summary.replaceChildren();
      reportDocument.summary.forEach((metric) => {
        const row = document.createElement('div');
        const label = document.createElement('dt');
        label.textContent = metric.label;
        const value = document.createElement('dd');
        const primary = document.createElement('strong');
        primary.textContent = metric.value;
        const detail = document.createElement('small');
        detail.textContent = metric.detail;
        value.append(primary, detail);
        row.append(label, value);
        summary.append(row);
      });
      setReportLoads(reportDocument.loads);
      setReportDefinitionList('[data-report-consumption]', reportDocument.consumption);
      get<HTMLElement>('[data-report-excluded-loads]').textContent = reportDocument.excludedLoadsNote;
      setReportDefinitionList('[data-report-battery]', reportDocument.battery);
      setReportDefinitionList('[data-report-components]', reportDocument.inverter);
      get<HTMLElement>('[data-report-inverter-note]').textContent = reportDocument.inverterNote;
      setReportDefinitionList('[data-report-solar]', reportDocument.solar);
      get<HTMLElement>('[data-report-solar-note]').textContent = reportDocument.solarNote;
      get<HTMLElement>('[data-report-solar-section]').hidden = reportDocument.solar.length === 0;
      get<HTMLElement>('[data-report-notes-number]').textContent = reportDocument.solar.length ? '06' : '05';
      setReportList('[data-report-calculation-notes]', reportDocument.notes);
      setReportList('[data-report-warnings]', reportDocument.warnings);
      get<HTMLElement>('[data-report-warning-box]').hidden = reportDocument.warnings.length === 0;
      get<HTMLElement>('[data-report-disclaimer]').textContent = reportDocument.disclaimer;
      reportContent.hidden = false;
      downloadButton.disabled = false;
      status.textContent = 'Guia atualizado com as estimativas de consumo, bateria e inversor.';
      lastReportDocument = reportDocument;
      return reportDocument;
    } catch (calculationError) {
      if (!(calculationError instanceof TypeError || calculationError instanceof RangeError)) throw calculationError;
      status.textContent = `Não foi possível gerar o relatório: ${calculationError.message}`;
    }
  }

  function filenameBase(name: string): string {
    return name.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'odisseia-solar';
  }

  let summaryBusEnergyWh: number | undefined;

  function updateSummary() {
    summaryBusEnergyWh = undefined;
    syncSolarBatteryEfficiency();
    updateLoadTotal();
    updateSummaryCore();
    renderSolarResults(summaryBusEnergyWh);
  }

  function updateSummaryCore() {
    const vehicle = get<HTMLSelectElement>('[data-vehicle-type]');
    get<HTMLElement>('[data-summary-vehicle]').textContent = vehicle.selectedOptions[0]?.textContent?.trim() || 'Aguardando seleção';
    get<HTMLElement>('[data-summary-voltage]').textContent = `${systemVoltage()} V`;

    const loads = getCompatibleLoads();
    const energyNode = get<HTMLElement>('[data-summary-energy]');
    const capacityNode = get<HTMLElement>('[data-summary-capacity]');
    const countNode = get<HTMLElement>('[data-summary-battery-count]');
    const summaryStatus = get<HTMLElement>('[data-summary-status]');
    const summaryNote = get<HTMLElement>('[data-summary-note]');
    summaryNote.textContent = '';
    if (!loads.length) {
      energyNode.textContent = 'Selecione as cargas';
      capacityNode.textContent = 'Aguardando consumo';
      countNode.textContent = '—';
      summaryStatus.textContent = 'Adicione uma carga compatível com a tensão selecionada.';
      return;
    }

    let applianceEnergy = 0;
    try {
      applianceEnergy = loads.reduce((sum, load) =>
        sum + calculateDailyConsumption([load], systemVoltage(), 1, 0, 0).loads[0].applianceEnergyWhPerDay, 0);
    } catch (calculationError) {
      if (!(calculationError instanceof TypeError || calculationError instanceof RangeError)) throw calculationError;
      energyNode.textContent = 'Verifique quantidade e tensão';
      capacityNode.textContent = 'Corrija os dados das cargas';
      countNode.textContent = '—';
      summaryStatus.textContent = calculationError.message;
      return;
    }
    const inverter = readInverterConfig();
    if (!inverter) {
      energyNode.textContent = 'Pendente: dados do inversor';
      capacityNode.textContent = 'Pendente: perdas AC';
      countNode.textContent = '—';
      summaryStatus.textContent = `As cargas representam ${format(applianceEnergy)} Wh/dia antes das perdas do inversor.`;
      summaryNote.textContent = 'Informe eficiência, consumo sem carga e horas em espera do inversor para incluir as cargas AC no banco.';
      return;
    }

    try {
      const consumption = calculateDailyConsumption(
        loads,
        systemVoltage(),
        inverter.efficiency,
        inverter.standbyPowerW,
        inverter.standbyHoursPerDay,
      );
      energyNode.textContent = `${format(consumption.totalAtBatteryBusWhPerDay)} Wh/dia`;
      summaryBusEnergyWh = consumption.totalAtBatteryBusWhPerDay;
      const autonomyDays = numeric('[data-autonomy]');
      const batteryConfig = readBatteryConfig();
      if (autonomyDays === undefined || !batteryConfig) {
        capacityNode.textContent = autonomyDays === undefined ? 'Informe a autonomia' : 'Complete os dados da bateria';
        countNode.textContent = '—';
        summaryStatus.textContent = 'Consumo calculado; capacidade depende da autonomia e dos parâmetros completos da bateria.';
        return;
      }
      const sizing = calculateBatteryCapacity(
        consumption.totalAtBatteryBusWhPerDay,
        autonomyDays,
        systemVoltage(),
        batteryConfig.battery,
      );
      capacityNode.textContent = `${format(sizing.nominalCapacityWh)} Wh · ${format(sizing.nominalCapacityAh)} Ah`;
      const seriesCount = selectedChemistry() === 'lifepo4'
        ? 1
        : systemVoltage() / batteryConfig.unitVoltageV;
      if (!Number.isInteger(seriesCount) || seriesCount < 1) {
        countNode.textContent = 'Verifique a tensão por bateria';
        summaryStatus.textContent = 'A tensão da unidade não forma um banco compatível com o sistema selecionado.';
        return;
      }
      const parallelCount = Math.ceil(sizing.nominalCapacityAh / batteryConfig.unitCapacityAh);
      if (batteryConfig.maxParallelBatteries !== undefined && parallelCount > batteryConfig.maxParallelBatteries) {
        countNode.textContent = `Excede ${batteryConfig.maxParallelBatteries} em paralelo`;
        summaryStatus.textContent = 'A capacidade calculada supera a configuração em paralelo publicada para esse perfil. Não há recomendação de quantidade.';
        return;
      }
      const bankDescription = describeBatteryBank({
        chemistryLabel: { lifepo4: 'LiFePO4', agm: 'AGM', 'lead-acid': 'Chumbo-ácido' }[selectedChemistry()],
        unitVoltageV: batteryConfig.unitVoltageV,
        unitCapacityAh: batteryConfig.unitCapacityAh,
        seriesCount,
        parallelCount,
      });
      countNode.textContent = `${bankDescription.headline} (${bankDescription.unitPt}), ${bankDescription.connectionShortPt}`;
      summaryStatus.textContent = `Estimativa para ${format(autonomyDays)} ${autonomyDays === 1 ? 'dia' : 'dias'} de autonomia; confira os limites da bateria e da instalação.`;
      summaryNote.textContent = `${bankDescription.connectionPt} ${selectedChemistry() !== 'lifepo4'
        ? 'Confirme no manual da bateria a montagem e os limites de corrente.'
        : 'Revise o perfil, as eficiências e a condição de uso antes de escolher a bateria.'}`;
    } catch (calculationError) {
      if (!(calculationError instanceof TypeError || calculationError instanceof RangeError)) throw calculationError;
      energyNode.textContent = 'Não foi possível calcular';
      capacityNode.textContent = 'Verifique os valores informados';
      countNode.textContent = '—';
      summaryStatus.textContent = calculationError.message;
    }
  }

  get<HTMLSelectElement>('[data-country]').addEventListener('change', updateHsp);
  get<HTMLInputElement>('[data-solar-enabled]').addEventListener('change', () => {
    updateSolarFields();
    updateSummary();
  });
  get<HTMLInputElement>('[data-hsp]').addEventListener('input', () => {
    const status = get<HTMLElement>('[data-hsp-status]');
    if (get<HTMLSelectElement>('[data-country]').value !== 'manual') {
      status.textContent = 'Valor editado pelo usuário; a média nacional do catálogo pode não representar a região ou estação.';
    }
    updateSummary();
  });
  get<HTMLSelectElement>('[data-custom-basis]').addEventListener('change', updateCustomBasis);
  get<HTMLSelectElement>('[data-custom-supply]').addEventListener('change', updateCustomBasis);
  get<HTMLButtonElement>('[data-add-custom-load]').addEventListener('click', addCustomLoad);
  get<HTMLSelectElement>('[data-battery-profile]').addEventListener('change', (event) => {
    applyLifepo4Profile((event.currentTarget as HTMLSelectElement).value);
    updateSummary();
  });
  get<HTMLInputElement>('[data-use-victron-reference]').addEventListener('change', (event) => {
    const checked = (event.currentTarget as HTMLInputElement).checked;
    if (checked) applyInverterReference();
    else {
      get<HTMLInputElement>('[data-inverter-rated-power]').value = String(initialInverterScenario.ratedPowerW);
      get<HTMLInputElement>('[data-inverter-efficiency]').value = String(initialInverterScenario.efficiencyPercent);
      get<HTMLInputElement>('[data-inverter-standby]').value = String(initialInverterScenario.standbyPowerW);
      updateInverterFields();
    }
  });
  get<HTMLSelectElement>('[data-ac-output]').addEventListener('change', updateInverterFields);
  root.querySelectorAll<HTMLInputElement>('input[name="batteryChemistry"]').forEach((radio) =>
    radio.addEventListener('change', updateBatteryChoice));
  root.querySelectorAll<HTMLInputElement>('input[name="systemVoltageV"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      updateCatalogChoices();
      if (selectedChemistry() === 'lifepo4') applyLifepo4Profile(profileForCurrentVoltage().id);
      updateBatteryChoice();
      if (get<HTMLInputElement>('[data-use-victron-reference]').checked) applyInverterReference();
      updateInverterFields();
      updateSummary();
    });
  });
  root.querySelectorAll<HTMLInputElement>('[data-catalog-choice]').forEach((choice) => {
    choice.addEventListener('change', () => {
      updateCatalogChoices();
      updateInverterFields();
      updateSummary();
    });
  });
  get<HTMLInputElement>('[data-catalog-search]').addEventListener('input', updateCatalogChoices);
  root.querySelectorAll<HTMLButtonElement>('[data-load-profile]').forEach((button) => {
    button.addEventListener('click', () => applyLoadProfile(button.dataset.loadProfile ?? ''));
  });
  root.querySelectorAll<HTMLInputElement>('[data-catalog-quantity]').forEach((quantity) =>
    quantity.addEventListener('input', updateSummary));
  root.addEventListener('invalid', (event) => {
    const field = event.target;
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      localizeValidation(field);
    }
  }, true);
  root.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea').forEach((field) => {
    const updateField = () => {
      localizeValidation(field);
      updateSummary();
    };
    field.addEventListener('input', updateField);
    field.addEventListener('change', updateField);
  });

  get<HTMLButtonElement>('[data-step-back]').addEventListener('click', () => {
    if (activeStep > 0) setPanel(activeStep - 1);
  });
  get<HTMLButtonElement>('[data-step-next]').addEventListener('click', () => {
    if (activeStep >= panels.length - 1) return;
    if (!validatePanel()) return;
    setPanel(activeStep + 1);
  });
  get<HTMLButtonElement>('[data-download-xlsx]').addEventListener('click', () => {
    const reportDocument = lastReportDocument ?? renderReport();
    if (!reportDocument) return;
    const file = new Blob([createSolarReportWorkbook(reportDocument)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filenameBase(reportDocument.title)}.xlsx`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    get<HTMLElement>('[data-project-file-status]').textContent = 'Planilha baixada. Ela abre no Excel, no Numbers e no Google Planilhas, com as abas Resumo e Consumo.';
  });
  get<HTMLButtonElement>('[data-download-pdf]').addEventListener('click', async (event) => {
    const reportDocument = renderReport();
    if (!reportDocument) return;
    const button = event.currentTarget as HTMLButtonElement;
    const status = get<HTMLElement>('[data-project-file-status]');
    const generation = pdfGeneration;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.textContent = 'Gerando PDF…';
    status.textContent = 'Preparando seu PDF neste dispositivo…';
    try {
      const [{ createSolarReportPdf }, [regular, bold, display]] = await Promise.all([
        import('../lib/solar/report-pdf.ts'),
        Promise.all(['Manrope-Regular.ttf', 'Manrope-Bold.ttf', 'DMSerifDisplay-Regular.ttf'].map(async (filename) => {
          const response = await fetch(`${import.meta.env.BASE_URL}media/branding/fonts/${filename}`);
          if (!response.ok) throw new Error('Não foi possível carregar as fontes do PDF.');
          const bytes = new Uint8Array(await response.arrayBuffer());
          return btoa(bytes.reduce((text, byte) => text + String.fromCharCode(byte), ''));
        })),
      ]);
      if (generation !== pdfGeneration) return;
      const pdf = createSolarReportPdf(reportDocument, { regular, bold, display });
      preparedPdfFile = new File([pdf.output('blob')], `${filenameBase(reportDocument.title)}.pdf`, { type: 'application/pdf' });
      preparedPdfUrl = URL.createObjectURL(preparedPdfFile);
      get<HTMLButtonElement>('[data-open-pdf]').hidden = false;
      const downloadLink = get<HTMLAnchorElement>('[data-save-pdf]');
      downloadLink.href = preparedPdfUrl;
      downloadLink.download = preparedPdfFile.name;
      const canShareFile = typeof navigator.share === 'function'
        && typeof navigator.canShare === 'function'
        && navigator.canShare({ files: [preparedPdfFile] });
      get<HTMLButtonElement>('[data-share-pdf]').hidden = !canShareFile;
      downloadLink.hidden = canShareFile;
      status.textContent = canShareFile
        ? 'PDF pronto. Toque em Salvar/Compartilhar PDF para abrir o menu do dispositivo. No iPhone, escolha Salvar em Arquivos.'
        : 'PDF pronto. Toque em Baixar PDF para salvar o arquivo. O compartilhamento de arquivos não está disponível neste navegador.';
    } catch (error) {
      console.error('Falha ao gerar o relatório PDF.', error);
      if (generation === pdfGeneration) {
        status.textContent = 'Não foi possível gerar o PDF. Confira sua conexão para carregar os arquivos da ferramenta e tente novamente. Seus dados continuam no formulário.';
      }
    } finally {
      if (generation === pdfGeneration) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = preparedPdfFile ? 'Gerar novamente' : 'Gerar PDF';
      }
    }
  });
  get<HTMLButtonElement>('[data-share-pdf]').addEventListener('click', async (event) => {
    const status = get<HTMLElement>('[data-project-file-status]');
    if (!preparedPdfFile) {
      status.textContent = 'Gere o PDF antes de salvar ou compartilhar.';
      return;
    }
    const button = event.currentTarget as HTMLButtonElement;
    const generation = pdfGeneration;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    status.textContent = 'Escolha o destino no menu do dispositivo. No iPhone, use Salvar em Arquivos.';
    try {
      await navigator.share({ files: [preparedPdfFile] });
      if (generation === pdfGeneration) {
        status.textContent = 'Confira no destino escolhido se o PDF foi salvo ou compartilhado.';
      }
    } catch (error) {
      const canceled = error instanceof DOMException && error.name === 'AbortError';
      if (!canceled) console.error('Falha ao compartilhar o relatório PDF.', error);
      if (generation === pdfGeneration) {
        status.textContent = canceled
          ? 'O menu do dispositivo foi fechado. Se você escolheu salvar, confira o PDF no destino. Para tentar novamente, use Salvar/Compartilhar PDF.'
          : 'Não foi possível concluir o compartilhamento do dispositivo. Tente novamente usando Salvar/Compartilhar PDF.';
      }
    } finally {
      if (generation === pdfGeneration) {
        button.disabled = false;
        button.removeAttribute('aria-busy');
      }
    }
  });
  get<HTMLButtonElement>('[data-open-pdf]').addEventListener('click', () => {
    if (!preparedPdfFile) {
      get<HTMLElement>('[data-project-file-status]').textContent = 'Gere o PDF antes de visualizar.';
      return;
    }
    void pdfPreview.open(preparedPdfFile);
  });

  form.addEventListener('input', scheduleSave);
  form.addEventListener('change', scheduleSave);
  root.querySelector<HTMLButtonElement>('[data-reset-wizard]')?.addEventListener('click', () => {
    if (!window.confirm('Apagar os dados salvos neste navegador e recomeçar o planejamento?')) return;
    window.clearTimeout(saveTimer);
    clearStoredState();
    window.location.reload();
  });

  const stored = readStoredState<CustomLoadEntry>();
  if (stored) {
    restoring = true;
    applyFields(form, stored.fields);
    stored.customLoads
      .filter((entry) => typeof entry?.name === 'string' && typeof entry.load?.id === 'string')
      .forEach((entry) => customLoads.push(entry));
    customLoadNumber = customLoads.reduce((max, entry) => Math.max(max, Number(entry.load.id.replace('custom-load-', '')) || 0), 0);
    const efficiencyField = get<HTMLInputElement>('[data-solar-battery-efficiency]');
    if (efficiencyField.value) efficiencyField.dataset.autoSource = batteryEfficiencyAutoValue().key;
  }

  updateSolarFields();
  updateCustomBasis();
  updateCatalogChoices();
  updateBatteryChoice();
  updateInverterFields();
  renderSelectedLoads();
  updateSummary();
  if (stored) {
    restoring = false;
    const savedStep = Number.isInteger(stored.activeStep) ? Math.min(Math.max(stored.activeStep, 0), panels.length - 1) : 0;
    if (savedStep > 0) setPanel(savedStep);
    const restoreNote = root.querySelector<HTMLElement>('[data-storage-status]');
    if (restoreNote) restoreNote.textContent = 'Retomamos o planejamento salvo neste navegador.';
  }
}
