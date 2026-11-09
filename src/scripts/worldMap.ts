import type { Map as LeafletMap, Marker } from 'leaflet';

export interface WorldMapMarker {
  journeyId: string;
  title: string;
  pointName: string;
  lat: number;
  lng: number;
}

const TILE_LAYER = {
  url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 18,
};

const INITIAL_VIEW = { center: [30, 12] as [number, number], zoom: 2 };

export function initWorldMaps() {
  document.querySelectorAll<HTMLElement>('[data-world-map]').forEach((root) => {
    const canvas = root.querySelector<HTMLElement>('[data-world-map-canvas]');
    if (!canvas) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      mountWorldMap(root, canvas).catch((error) => {
        console.error('Falha ao carregar o mapa:', error);
        root.classList.add('is-unavailable');
      });
    }, { rootMargin: '200px' });
    observer.observe(canvas);
  });
}

async function mountWorldMap(root: HTMLElement, canvas: HTMLElement) {
  const [{ default: L }] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')]);
  const markers: WorldMapMarker[] = JSON.parse(root.querySelector('[data-world-map-data]')?.textContent ?? '[]');
  const panel = root.querySelector<HTMLElement>('[data-world-map-panel]');
  const cards = [...root.querySelectorAll<HTMLElement>('[data-journey-card]')];
  const closeButton = root.querySelector<HTMLButtonElement>('[data-world-map-close]');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(pointer: coarse)').matches;

  // Em telas de toque, um dedo continua rolando a página; dois dedos movem e aproximam o mapa.
  const map: LeafletMap = L.map(canvas, {
    center: INITIAL_VIEW.center,
    zoom: INITIAL_VIEW.zoom,
    minZoom: 1,
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: !isTouch,
    worldCopyJump: true,
  });
  L.control.zoom({ zoomInTitle: 'Aproximar', zoomOutTitle: 'Afastar', position: 'topleft' }).addTo(map);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  L.tileLayer(TILE_LAYER.url, { attribution: TILE_LAYER.attribution, maxZoom: TILE_LAYER.maxZoom }).addTo(map);

  canvas.addEventListener('focus', () => map.scrollWheelZoom.enable());
  map.on('click', () => map.scrollWheelZoom.enable());
  canvas.addEventListener('mouseleave', () => map.scrollWheelZoom.disable());

  const markerById = new Map<string, Marker>();
  let selectedId: string | undefined;

  const icon = L.divIcon({ className: 'world-map-marker', html: '<span></span>', iconSize: [36, 36] });

  for (const entry of markers) {
    const marker = L.marker([entry.lat, entry.lng], { icon, keyboard: true, riseOnHover: true }).addTo(map);
    const element = marker.getElement();
    element?.setAttribute('aria-label', `${entry.title} — ${entry.pointName}`);
    element?.setAttribute('aria-pressed', 'false');
    marker.on('click', () => select(entry));
    markerById.set(entry.journeyId, marker);
  }

  function setMarkerState(journeyId: string | undefined, selected: boolean) {
    const element = journeyId ? markerById.get(journeyId)?.getElement() : undefined;
    element?.classList.toggle('is-selected', selected);
    element?.setAttribute('aria-pressed', String(selected));
  }

  function select(entry: WorldMapMarker) {
    if (!panel) return;
    setMarkerState(selectedId, false);
    selectedId = entry.journeyId;
    setMarkerState(selectedId, true);

    cards.forEach((card) => { card.hidden = card.dataset.journeyCard !== entry.journeyId; });
    panel.hidden = false;
    panel.focus({ preventScroll: true });

    const isWide = matchMedia('(min-width: 761px)').matches;
    map.panInside([entry.lat, entry.lng], {
      paddingTopLeft: [24, 24],
      paddingBottomRight: isWide ? [panel.offsetWidth + 48, 24] : [24, panel.offsetHeight + 24],
      animate: !reduceMotion,
    });
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    const marker = selectedId ? markerById.get(selectedId) : undefined;
    setMarkerState(selectedId, false);
    selectedId = undefined;
    marker?.getElement()?.focus();
  }

  closeButton?.addEventListener('click', close);
  map.on('click', close);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  root.classList.add('is-ready');
}
