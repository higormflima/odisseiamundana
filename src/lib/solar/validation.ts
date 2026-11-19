export function localizeValidation(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
  field.setCustomValidity('');
  if (!field.willValidate || field.validity.valid) return;

  const validity = field.validity;
  const input = field instanceof HTMLInputElement ? field : undefined;
  const textField = field instanceof HTMLSelectElement ? undefined : field;
  const formatLimit = (value: string) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 20 }).format(Number(value));
  let message = 'Verifique o valor informado.';
  if (validity.badInput) message = 'Informe um número válido.';
  else if (validity.valueMissing) {
    message = field instanceof HTMLSelectElement
      ? 'Selecione uma opção na lista.'
      : input?.type === 'checkbox' || input?.type === 'radio'
        ? 'Selecione uma opção para continuar.'
        : 'Preencha este campo.';
  } else if (validity.rangeUnderflow && input) message = `Informe um valor maior ou igual a ${formatLimit(input.min)}.`;
  else if (validity.rangeOverflow && input) message = `Informe um valor menor ou igual a ${formatLimit(input.max)}.`;
  else if (validity.stepMismatch && input) message = `Informe um valor válido, em incrementos de ${formatLimit(input.step || '1')}.`;
  else if (validity.typeMismatch) message = input?.type === 'email' ? 'Informe um endereço de e-mail válido.' : 'Informe um endereço válido.';
  else if (validity.tooLong && textField) message = `Use no máximo ${textField.maxLength} caracteres.`;
  else if (validity.tooShort && textField) message = `Use pelo menos ${textField.minLength} caracteres.`;
  else if (validity.patternMismatch) message = 'Use o formato solicitado para este campo.';
  field.setCustomValidity(message);
}
