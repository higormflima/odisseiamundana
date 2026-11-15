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
 *   system_ids?: string[]
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
 * @param {string} systemId
 */
export function buildSystemCostRows(items, systemId) {
  return items.filter((item) => item.system_ids?.includes(systemId)).map(formatCostRow);
}

/** @param {CostItem[]} items */
export function buildProjectCostRows(items) {
  return items.map((item) => {
    const row = formatCostRow(item);
    return { ...row, detail: [item.category, row.detail].filter(Boolean).join(' · ') };
  });
}
