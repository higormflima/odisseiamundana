export const solarStorageKey = 'odisseia-mundana:planejador-eletrico';
const storageVersion = 1;

type FieldElement = HTMLInputElement | HTMLSelectElement;

export interface StoredSolarState<TCustom> {
  version: number;
  savedAt: string;
  activeStep: number;
  fields: Record<string, string | boolean>;
  customLoads: TCustom[];
}

/** Chave estável do campo: nome do grupo de rádio ou primeiro atributo data-*, prefixado pelo equipamento do catálogo. */
function fieldKey(field: FieldElement): string | undefined {
  if (field instanceof HTMLInputElement && field.type === 'radio') return field.name ? `radio:${field.name}` : undefined;
  const dataAttribute = Array.from(field.attributes).find((attribute) => attribute.name.startsWith('data-'))?.name;
  const base = dataAttribute ?? (field.id ? `#${field.id}` : undefined);
  if (!base) return undefined;
  const scope = field.closest<HTMLElement>('[data-equipment-id]')?.dataset.equipmentId;
  return scope ? `${scope}:${base}` : base;
}

function storableFields(form: HTMLElement): FieldElement[] {
  return Array.from(form.querySelectorAll<FieldElement>('input, select'))
    .filter((field) => !(field instanceof HTMLInputElement && ['button', 'submit', 'file'].includes(field.type)))
    .filter((field) => !field.closest('[data-storage-ignore]'));
}

export function collectFields(form: HTMLElement): Record<string, string | boolean> {
  const fields: Record<string, string | boolean> = {};
  for (const field of storableFields(form)) {
    const key = fieldKey(field);
    if (!key) continue;
    if (field instanceof HTMLInputElement && field.type === 'radio') {
      if (field.checked) fields[key] = field.value;
    } else if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      fields[key] = field.checked;
    } else {
      fields[key] = field.value;
    }
  }
  return fields;
}

export function applyFields(form: HTMLElement, fields: Record<string, string | boolean>): void {
  for (const field of storableFields(form)) {
    const key = fieldKey(field);
    if (!key || !(key in fields)) continue;
    const value = fields[key];
    if (field instanceof HTMLInputElement && field.type === 'radio') {
      field.checked = field.value === value;
    } else if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      field.checked = value === true;
    } else if (typeof value === 'string') {
      if (field instanceof HTMLSelectElement && !Array.from(field.options).some((option) => option.value === value)) continue;
      field.value = value;
    }
  }
}

export function readStoredState<TCustom>(): StoredSolarState<TCustom> | undefined {
  try {
    const raw = window.localStorage.getItem(solarStorageKey);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredSolarState<TCustom>;
    if (parsed?.version !== storageVersion || typeof parsed.fields !== 'object' || !Array.isArray(parsed.customLoads)) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function writeStoredState<TCustom>(state: Omit<StoredSolarState<TCustom>, 'version' | 'savedAt'>): boolean {
  try {
    window.localStorage.setItem(solarStorageKey, JSON.stringify({ version: storageVersion, savedAt: new Date().toISOString(), ...state }));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredState(): void {
  try {
    window.localStorage.removeItem(solarStorageKey);
  } catch {
    // Armazenamento indisponível: não há o que limpar.
  }
}
