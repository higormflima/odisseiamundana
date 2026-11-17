/**
 * @param {number} amount
 * @param {string} currency
 */
export function formatMotorhomeMoney(amount, currency) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(amount).replace(/\s/g, '');
}

/**
 * @typedef {{
 *   description: string, detail?: string, category?: string, quantity: number, unit?: string,
 *   unit_price?: number, shipping?: number, amount: number, currency: string,
 *   system_ids?: string[], allocation_uncertain?: boolean
 * }} CostItem
 */

/** @param {CostItem} item */
function formatCostRow(item) {
  return {
    item: item.description,
    detail: [
      item.detail,
      `${new Intl.NumberFormat('pt-BR').format(item.quantity)}${item.unit ? ` ${item.unit}` : ''}${item.unit_price !== undefined ? ` × ${formatMotorhomeMoney(item.unit_price, item.currency)}` : ''}`,
      item.shipping !== undefined ? `Frete: ${formatMotorhomeMoney(item.shipping, item.currency)}` : undefined,
    ].filter(Boolean).join(' · '),
    amount: formatMotorhomeMoney(item.amount, item.currency),
  };
}

/**
 * @param {CostItem[]} items
 * @param {string | string[]} systemIds
 */
export function buildSystemCostRows(items, systemIds) {
  const ids = new Set(typeof systemIds === 'string' ? [systemIds] : systemIds);
  return items
    .filter((item) => item.system_ids?.some((id) => ids.has(id)))
    .sort((left, right) => Number(Boolean(left.allocation_uncertain)) - Number(Boolean(right.allocation_uncertain)) || right.amount - left.amount)
    .map((item) => {
      const row = formatCostRow(item);
      if (item.allocation_uncertain) row.detail += ' · Uso não individualizado na planilha';
      return row;
    });
}

/** @param {CostItem[]} items */
export function buildProjectCostRows(items) {
  return items.map((item) => {
    const row = formatCostRow(item);
    return { ...row, detail: [item.category, row.detail].filter(Boolean).join(' · ') };
  });
}
