function distance(left, right) {
  if (!left || !right || left.length !== right.length) return 0;
  let sum = 0;
  for (let index = 0; index < left.length; index += 1) {
    const delta = left[index] - right[index];
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

function distanceToSelected(photo, selected) {
  if (!photo.signature) return 0;
  let nearest = Infinity;
  for (const current of selected) {
    if (!current.signature) continue;
    nearest = Math.min(nearest, distance(photo.signature, current.signature));
  }
  return Number.isFinite(nearest) ? nearest : 0;
}

export function orderPhotosByVariety(photos) {
  if (photos.length < 2) return [...photos];
  const featuredIndex = photos.findIndex((photo) => photo.featured);
  const start = featuredIndex >= 0 ? featuredIndex : 0;
  const selected = [photos[start]];
  const remaining = photos.filter((_, index) => index !== start);

  while (remaining.length) {
    let bestIndex = 0;
    let bestDistance = -1;
    remaining.forEach((photo, index) => {
      const currentDistance = distanceToSelected(photo, selected);
      const closerTie = Math.abs(currentDistance - bestDistance) <= 1e-9 && index < bestIndex;
      if (currentDistance > bestDistance + 1e-9 || closerTie) {
        bestDistance = currentDistance;
        bestIndex = index;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
}
