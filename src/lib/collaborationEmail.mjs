export const MAX_MAILTO_LENGTH = 1800;

export function buildCollaborationEmail(fields) {
  const lines = [
    `Nome: ${fields.name}`,
    `Empresa: ${fields.company}`,
    `E-mail: ${fields.email}`,
    `Site ou Instagram: ${fields.website || 'Não informado'}`,
    `Tipo de colaboração: ${fields.type || 'Não informado'}`,
    `Destino ou projeto: ${fields.destination || 'Não informado'}`,
    '',
    'Proposta:',
    fields.proposal,
  ];
  return `mailto:contato@odisseiamundana.com?subject=${encodeURIComponent('Proposta de colaboração — Odisseia Mundana')}&body=${encodeURIComponent(lines.join('\r\n'))}`;
}
