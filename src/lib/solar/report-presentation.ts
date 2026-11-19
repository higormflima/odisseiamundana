import type { SolarReport } from './report.ts';

export type ReportEntry = [label: string, value: string];

export interface SolarReportDocument {
  title: string;
  identification: ReportEntry[];
  summary: Array<{ label: string; value: string; detail: string }>;
  loads: Array<{ name: string; detail: string; quantity: string; basis: string; energy: string }>;
  consumption: ReportEntry[];
  excludedLoadsNote: string;
  battery: ReportEntry[];
  inverter: ReportEntry[];
  inverterNote: string;
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
  const batteryCount = `${bank.totalCount} ${bank.totalCount === 1 ? 'bateria' : 'baterias'}`;
  const configuration = `${bank.seriesCount} em série × ${bank.parallelCount} em paralelo`;
  const autonomy = `${format(battery.autonomyDays)} ${battery.autonomyDays === 1 ? 'dia' : 'dias'}`;
  const outputVoltage = report.inverterOutputVoltageV === null ? 'Não informada' : `${report.inverterOutputVoltageV} V AC`;

  const batteryEntries: ReportEntry[] = [
    ['Referência de bateria', bank.profileLabelPt],
    ['Capacidade mínima calculada', `${format(battery.nominalCapacityAh)} Ah · ${energy(battery.nominalCapacityWh)} no banco de ${report.systemVoltageV} V`],
    ['Energia necessária para a autonomia', energy(battery.usableCapacityWh)],
    ['Capacidade de cada unidade', `${format(bank.unitVoltageV)} V · ${format(bank.unitCapacityAh)} Ah`],
    ['Quantidade por capacidade', bank.withinKnownLimit ? `${batteryCount} — ${configuration}` : 'Não recomendada: o limite publicado de unidades em paralelo foi excedido.'],
    ['Profundidade de descarga (DoD)', `${format(battery.depthOfDischarge * 100)}% da capacidade nominal`],
    ['Como a capacidade foi estimada', `${dailyEnergy(battery.dailyEnergyAtBatteryBusWh)} × ${autonomy} ÷ ${format(battery.depthOfDischarge * 100)}% de DoD${battery.dischargeEfficiency === undefined ? '' : ` ÷ ${format(battery.dischargeEfficiency * 100)}% de eficiência de descarga`} = ${energy(battery.nominalCapacityWh)} nominais.`],
  ];
  if (battery.capacityBasis === 'published-discharge') {
    batteryEntries.push(['Energia utilizável aproximada por unidade', `${energy(bank.unitVoltageV * bank.unitCapacityAh * battery.depthOfDischarge)} no DoD escolhido`]);
  }

  return {
    title: report.projectName || 'Guia do sistema elétrico',
    identification: [
      ['Veículo', report.vehicleLabelPt],
      ['Tensão do banco', `${report.systemVoltageV} V DC`],
      ['Local / insolação de referência', `${report.countryLabelPt} · ${format(report.peakSunHours, 3)} HSP/dia`],
      ['Gerado em', report.generatedAt],
      ['Versão da calculadora', report.applicationVersion],
    ],
    summary: [
      { label: 'Consumo diário da bateria', value: dailyEnergy(consumption.totalAtBatteryBusWhPerDay), detail: `${format(consumption.totalAtBatteryBusWhPerDay / 1000, 3)} kWh/dia, incluindo as perdas do inversor informadas.` },
      { label: 'Autonomia desejada', value: autonomy, detail: 'Sem reposição de energia durante esse período.' },
      { label: 'Banco estimado', value: bank.withinKnownLimit ? batteryCount : 'Rever configuração', detail: bank.withinKnownLimit ? `${chemistry} · ${configuration}. Estimativa por capacidade, não aprovação da montagem.` : 'A quantidade calculada excede o limite publicado de paralelos.' },
      { label: 'Inversor: potência contínua mínima', value: inverter ? `${format(inverter.minimumContinuousPowerW)} W` : 'Não necessário', detail: inverter ? 'Para as cargas AC marcadas como simultâneas. Confirme também a partida dos aparelhos.' : 'As cargas selecionadas usam apenas corrente contínua (DC).' },
    ],
    loads: report.loads.map((load) => ({
      name: load.name,
      detail: `${load.categoryLabelPt} · ${load.supply.toUpperCase()} · ${load.originLabelPt}`,
      quantity: String(load.quantity),
      basis: load.basisSummaryPt,
      energy: dailyEnergy(load.energyWhPerDay),
    })),
    consumption: [
      ['Equipamentos DC', dailyEnergy(consumption.dcLoadsWhPerDay)],
      ...(inverter ? [
        ['Equipamentos AC, antes das perdas', dailyEnergy(consumption.acLoadsWhPerDay)],
        ['Perdas estimadas no inversor', dailyEnergy(consumption.inverterInputWhPerDay - consumption.acLoadsWhPerDay)],
        ['Inversor ligado sem carga', dailyEnergy(consumption.inverterStandbyWhPerDay)],
      ] satisfies ReportEntry[] : []),
      ['Total exigido da bateria', dailyEnergy(consumption.totalAtBatteryBusWhPerDay)],
    ],
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
    notes: [
      ...report.calculationNotes,
      'A insolação (HSP) foi registrada apenas como referência. Ela não entra na autonomia sem recarga nem garante geração solar.',
    ],
    warnings: [
      ...report.warnings,
      ...(excludedLoads.length ? ['Há equipamentos selecionados que não entraram no consumo. Confira a lista de exclusões antes de usar a estimativa.'] : []),
      ...(usesMaximumInverterEfficiency && inverter ? ['A eficiência do perfil Victron SUN é máxima; o rendimento real varia com a carga.'] : []),
    ],
    disclaimer: 'Este guia é um ponto de partida, não um projeto executivo. Antes da instalação, peça a revisão de um profissional qualificado, considerando as fichas dos equipamentos, as condições reais de montagem e as normas brasileiras aplicáveis.',
  };
}
