export const GALLERY_PAGE_SIZE = 24;

export function visiblePhotoCount(total, current = 0, pageSize = GALLERY_PAGE_SIZE) {
  if (!Number.isInteger(total) || total < 0 || !Number.isInteger(current) || current < 0 || !Number.isInteger(pageSize) || pageSize < 1) {
    throw new RangeError('Contagem de fotografias ou tamanho da página inválido.');
  }
  return Math.min(total, current + pageSize);
}

export function wrappedPhotoIndex(index, total) {
  if (!Number.isInteger(index) || !Number.isInteger(total) || total < 1) {
    throw new RangeError('Índice ou total de fotografias inválido.');
  }
  return ((index % total) + total) % total;
}
