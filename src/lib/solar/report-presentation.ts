import type { SolarReport } from './report.ts';
import type { SolarCoverage } from './calculations.ts';

export type ReportEntry = [label: string, value: string];

/** Texto da sugestão de controladores, compartilhado entre tela, PDF e planilha. */
export function describeChargeControllers(coverage: Pick<SolarCoverage, 'minimumControllerChargeCurrentA' | 'controllerArrayPowerWp' | 'controllerSuggestion' | 'systemVoltageV'>): {
  minimumPt: string;
  suggestionPt: string;
} {
  const format = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value);
  const { count, unitCurrentA, arrayPowerPerControllerWp } = coverage.controllerSuggestion;
  return {
    minimumPt: `${format(Math.ceil(coverage.minimumControllerChargeCurrentA))} A em ${coverage.systemVoltageV} V, para ${format(coverage.controllerArrayPowerWp)} Wp de painéis`,
    suggestionPt: count === 1
      ? `1 controlador MPPT de ${unitCurrentA} A`
      : `${count} controladores MPPT de ${unitCurrentA} A, cada um ligado a uma parte dos painéis (cerca de ${format(arrayPowerPerControllerWp)} Wp por controlador). Os controladores comuns no mercado vão até 40 A; também existem modelos de corrente maior.`,
  };
}

export interface BatteryBankDescription {
  /** Ex.: "3 baterias de 100 Ah". */
  headline: string;
  /** Ex.: "LiFePO4 de 12,8 V e 100 Ah cada". */
  unitPt: string;
  /** Forma curta da ligação, para espaços pequenos. */
  connectionShortPt: string;
  /** Instrução de ligação com a tensão e a capacidade resultantes. */
  connectionPt: string;
}

/** Descreve o banco em linguagem direta: quantas baterias, de que tipo e como ligá-las. */
export function describeBatteryBank(bank: {
  chemistryLabel: string;
  unitVoltageV: number;
  unitCapacityAh: number;
  seriesCount: number;
  parallelCount: number;
}): BatteryBankDescription {
  const format = (value: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value);
  const total = bank.seriesCount * bank.parallelCount;
  const bankVoltage = `${format(bank.unitVoltageV * bank.seriesCount)} V`;
  const bankCapacity = `${format(bank.unitCapacityAh * bank.parallelCount)} Ah`;
  const headline = `${total} ${total === 1 ? 'bateria' : 'baterias'} de ${format(bank.unitCapacityAh)} Ah`;
  const unitPt = `${bank.chemistryLabel} de ${format(bank.unitVoltageV)} V e ${format(bank.unitCapacityAh)} Ah ${total === 1 ? '' : 'cada'}`.trim();
  if (total === 1) {
    return { headline, unitPt, connectionShortPt: 'bateria única', connectionPt: `Uma única bateria, sem ligação entre baterias: o banco tem ${bankVoltage} e ${bankCapacity}.` };
  }
  if (bank.seriesCount === 1) {
    return {
      headline,
      unitPt,
      connectionShortPt: 'ligadas em paralelo',
      connectionPt: `Ligação em paralelo (positivo com positivo, negativo com negativo): a tensão continua ${bankVoltage} e as capacidades se somam, formando um banco de ${bankCapacity}.`,
    };
  }
  if (bank.parallelCount === 1) {
    return {
      headline,
      unitPt,
      connectionShortPt: 'ligadas em série',
      connectionPt: `Ligação em série (positivo de uma no negativo da seguinte): as tensões se somam, formando ${bankVoltage}, e a capacidade continua ${bankCapacity}.`,
    };
  }
  return {
    headline,
    unitPt,
    connectionShortPt: `${bank.parallelCount} conjuntos de ${bank.seriesCount} em série, ligados em paralelo`,
    connectionPt: `Ligação mista: monte ${bank.parallelCount} conjuntos com ${bank.seriesCount} baterias em série cada (cada conjunto tem ${bankVoltage}) e ligue os conjuntos em paralelo, formando um banco de ${bankVoltage} e ${bankCapacity}.`,
  };
}

export interface SolarReportDocument {
  title: string;
  identification: ReportEntry[];
  summary: Array<{ label: string; value: string; detail: string }>;
  loads: Array<{
    name: string;
    detail: string;
    category: string;
    supply: string;
    quantity: string;
    quantityValue: number;
    basis: string;
    energy: string;
    energyWhPerDay: number;
  }>;
  consumption: ReportEntry[];
  /** Mesmos itens de `consumption`, em Wh/dia numéricos, para a planilha. */
  consumptionWh: Array<[label: string, whPerDay: number]>;
  excludedLoadsNote: string;
  battery: ReportEntry[];
  inverter: ReportEntry[];
  inverterNote: string;
  solar: ReportEntry[];
  solarNote: string;
  notes: string[];
  warnings: string[];
  disclaimer: string;
}

export function presentSolarReport(
  report: SolarReport,
  excludedLoads: string[],
  usesMaximumInverterEfficiency: boolean,
): SolarReportDocument {
  const format = (value: number, maximumFractionDigits = 2) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits }).format(value);
  const energy = (value: number) => `${format(value)} Wh`;
  const dailyEnergy = (value: number) => `${energy(value)}/dia`;
  const bank = report.batteryConfiguration;
  const battery = report.battery;
  const consumption = report.consumption;
  const inverter = report.inverter;
  const chemistry = battery.chemistry === 'lifepo4' ? 'LiFePO4' : battery.chemistry === 'agm' ? 'AGM' : 'Chumbo-ácido';
  const bankDescription = describeBatteryBank({
    chemistryLabel: chemistry,
    unitVoltageV: bank.unitVoltageV,
    unitCapacityAh: bank.unitCapacityAh,
    seriesCount: bank.seriesCount,
    parallelCount: bank.parallelCount,
  });
  const autonomy = `${format(battery.autonomyDays)} ${battery.autonomyDays === 1 ? 'dia' : 'dias'}`;
  const outputVoltage = report.inverterOutputVoltageV === null ? 'Não informada' : `${report.inverterOutputVoltageV} V AC`;

  const batteryEntries: ReportEntry[] = [
    ['Referência de bateria', bank.profileLabelPt],
    ['Capacidade mínima calculada', `${format(battery.nominalCapacityAh)} Ah · ${energy(battery.nominalCapacityWh)} no banco de ${report.systemVoltageV} V`],
    ['Energia necessária para a autonomia', energy(battery.usableCapacityWh)],
    ['Capacidade de cada unidade', `${format(bank.unitVoltageV)} V · ${format(bank.unitCapacityAh)} Ah`],
    ['Quantidade por capacidade', bank.withinKnownLimit ? `${bankDescription.headline} — ${bankDescription.unitPt}` : 'Não recomendada: o limite publicado de unidades em paralelo foi excedido.'],
    ...(bank.withinKnownLimit ? [['Como ligar as baterias', bankDescription.connectionPt]] satisfies ReportEntry[] : []),
    ['Profundidade de descarga (DoD)', `${format(battery.depthOfDischarge * 100)}% da capacidade nominal`],
    ['Como a capacidade foi estimada', `${dailyEnergy(battery.dailyEnergyAtBatteryBusWh)} × ${autonomy} ÷ ${format(battery.depthOfDischarge * 100)}% de DoD${battery.dischargeEfficiency === undefined ? '' : ` ÷ ${format(battery.dischargeEfficiency * 100)}% de eficiência de descarga`} = ${energy(battery.nominalCapacityWh)} nominais.`],
  ];
  if (battery.capacityBasis === 'published-discharge') {
    batteryEntries.push(['Energia utilizável aproximada por unidade', `${energy(bank.unitVoltageV * bank.unitCapacityAh * battery.depthOfDischarge)} no DoD escolhido`]);
  }

  const solar = report.solar;
  const consumptionWh: Array<[string, number]> = [
    ['Equipamentos DC', consumption.dcLoadsWhPerDay],
    ...(inverter ? [
      ['Equipamentos AC, antes das perdas', consumption.acLoadsWhPerDay],
      ['Perdas estimadas no inversor', consumption.inverterInputWhPerDay - consumption.acLoadsWhPerDay],
      ['Inversor ligado sem carga', consumption.inverterStandbyWhPerDay],
    ] satisfies Array<[string, number]> : []),
    ['Total exigido da bateria', consumption.totalAtBatteryBusWhPerDay],
  ];
  const percent = (value: number) => `${format(value * 100, 1)}%`;
  const coverageLabel = (fraction: number) => fraction >= 1 ? '100% ou mais' : percent(fraction);
  const solarEntries: ReportEntry[] = solar ? [
    ['Local / insolação usada', `${solar.countryLabelPt} · ${format(solar.peakSunHours, 3)} HSP/dia`],
    ['Potência ideal de painéis', `${format(Math.ceil(solar.idealArrayPowerWp))} Wp para repor 100% do consumo diário`],
    ...(solar.availableArrayPowerWp === undefined ? [] : [
      ['Potência que cabe no veículo', `${format(solar.availableArrayPowerWp)} Wp`],
      ...(solar.availableArrayPowerWp > solar.idealArrayPowerWp
        ? [['Potência recomendada para instalar', `${format(Math.ceil(solar.idealArrayPowerWp))} Wp: o espaço disponível comporta mais do que o consumo exige`]] satisfies ReportEntry[]
        : []),
      ['Geração estimada', `${dailyEnergy(solar.estimatedGenerationWhPerDay ?? 0)} disponíveis para as cargas`],
      ['Cobertura do consumo', coverageLabel(solar.coverageFraction ?? 0)],
      ['Déficit diário', (solar.deficitWhPerDay ?? 0) > 0 ? `${dailyEnergy(solar.deficitWhPerDay ?? 0)} a repor por outra fonte` : 'Sem déficit com a HSP informada'],
    ] satisfies ReportEntry[]),
    ['Controlador de carga (MPPT): corrente mínima', describeChargeControllers(solar).minimumPt],
    ['Controlador sugerido', describeChargeControllers(solar).suggestionPt],
    ['Fatores de perda usados', `Módulos (Red1) ${format(solar.moduleDeratingFactor)} · sistema (Red2) ${format(solar.systemDeratingFactor)} · eficiência global da bateria ${percent(solar.batteryRoundTripEfficiency)}`],
    ['Como a potência foi estimada', `${dailyEnergy(solar.dailyEnergyAtBatteryBusWh)} ÷ ${percent(solar.batteryRoundTripEfficiency)} ÷ (${format(solar.peakSunHours, 3)} h × ${format(solar.moduleDeratingFactor)} × ${format(solar.systemDeratingFactor)}) = ${format(solar.idealArrayPowerWp, 0)} Wp`],
  ] : [];
  const solarNote = !solar
    ? ''
    : solar.deficitWhPerDay !== undefined && solar.deficitWhPerDay > 0
      ? 'O déficit pode ser reposto pelo alternador (com carregador DC-DC), por tomada externa ou com redução do consumo. Em dias nublados a geração cai, e a autonomia do banco cobre esse intervalo.'
      : 'Valores para a HSP informada. Em dias nublados ou meses de pouco sol a geração cai; a autonomia do banco cobre esse intervalo.';

  return {
    title: report.projectName || 'Guia do sistema elétrico',
    identification: [
      ['Veículo', report.vehicleLabelPt],
      ['Tensão do banco', `${report.systemVoltageV} V DC`],
      ...(solar ? [['Local / insolação de referência', `${solar.countryLabelPt} · ${format(solar.peakSunHours, 3)} HSP/dia`]] satisfies ReportEntry[] : []),
      ['Gerado em', report.generatedAt],
      ['Versão da calculadora', report.applicationVersion],
    ],
    summary: [
      { label: 'Consumo diário da bateria', value: dailyEnergy(consumption.totalAtBatteryBusWhPerDay), detail: `${format(consumption.totalAtBatteryBusWhPerDay / 1000, 3)} kWh/dia, incluindo as perdas do inversor informadas.` },
      { label: 'Autonomia desejada', value: autonomy, detail: 'Sem reposição de energia durante esse período.' },
      { label: 'Banco estimado', value: bank.withinKnownLimit ? bankDescription.headline : 'Rever configuração', detail: bank.withinKnownLimit ? `${bankDescription.unitPt}. ${bankDescription.connectionPt} Estimativa por capacidade; confira a montagem no manual da bateria.` : 'A quantidade calculada excede o limite publicado de paralelos.' },
      { label: 'Inversor: potência contínua mínima', value: inverter ? `${format(inverter.minimumContinuousPowerW)} W` : 'Não necessário', detail: inverter ? 'Para as cargas AC marcadas como simultâneas. Confirme também a partida dos aparelhos.' : 'As cargas selecionadas usam apenas corrente contínua (DC).' },
      ...(solar ? [solar.coverageFraction === undefined
        ? { label: 'Painéis solares', value: `${format(Math.ceil(solar.idealArrayPowerWp))} Wp`, detail: 'Potência ideal para repor o consumo diário com a HSP informada.' }
        : { label: 'Cobertura solar', value: coverageLabel(solar.coverageFraction), detail: `${format(solar.availableArrayPowerWp ?? 0)} Wp no veículo; o ideal seria ${format(Math.ceil(solar.idealArrayPowerWp))} Wp.` }] : []),
    ],
    loads: report.loads.map((load) => ({
      name: load.name,
      detail: `${load.categoryLabelPt} · ${load.supply.toUpperCase()} · ${load.originLabelPt}`,
      category: load.categoryLabelPt,
      supply: load.supply.toUpperCase(),
      quantity: String(load.quantity),
      quantityValue: load.quantity,
      basis: load.basisSummaryPt,
      energy: dailyEnergy(load.energyWhPerDay),
      energyWhPerDay: load.energyWhPerDay,
    })),
    consumption: consumptionWh.map(([label, value]) => [label, dailyEnergy(value)]),
    consumptionWh,
    excludedLoadsNote: excludedLoads.length
      ? `Não incluídos por incompatibilidade com a tensão do banco: ${excludedLoads.join('; ')}.`
      : '',
    battery: batteryEntries,
    inverter: inverter ? [
      ...(report.inverterRatedPowerW === undefined ? [] : [['Potência contínua escolhida', `${format(report.inverterRatedPowerW)} W`]] satisfies ReportEntry[]),
      ['Potência contínua mínima', `${format(inverter.minimumContinuousPowerW)} W`],
      ['Pico mínimo com os dados informados', `${format(inverter.minimumPeakPowerW)} W`],
      ['Tensão de saída escolhida', outputVoltage],
      ['Corrente estimada no banco', `${format(inverter.minimumContinuousBatteryCurrentA)} A contínuos · ${format(inverter.minimumPeakBatteryCurrentA)} A de pico`],
      ['Eficiência usada no cálculo', `${format(report.inverterEfficiency * 100)}%`],
      ['Funcionamento sem carga', `${format(report.inverterStandbyPowerW)} W por ${format(report.inverterStandbyHoursPerDay)} h/dia`],
    ] : [['Para as cargas selecionadas', 'Não é necessário inversor: todos os equipamentos usam DC.']],
    inverterNote: inverter
      ? 'As potências são mínimos calculados, não a indicação de um modelo. Sem dados de partida de todos os aparelhos, o pico não confirma que eles conseguirão ligar. Confira a tensão dos equipamentos, a forma de onda e os limites da bateria antes da compra.'
      : '',
    solar: solarEntries,
    solarNote,
    notes: [
      ...report.calculationNotes,
    ],
    warnings: [
      ...report.warnings,
      ...(excludedLoads.length ? ['Há equipamentos selecionados que não entraram no consumo. Confira a lista de exclusões antes de usar a estimativa.'] : []),
      ...(usesMaximumInverterEfficiency && inverter ? ['A eficiência do perfil Victron SUN é máxima; o rendimento real varia com a carga.'] : []),
    ],
    disclaimer: 'Este guia é um ponto de partida, não um projeto executivo. Antes da instalação, peça a revisão de um profissional qualificado, considerando as fichas dos equipamentos, as condições reais de montagem e as normas brasileiras aplicáveis.',
  };
}
