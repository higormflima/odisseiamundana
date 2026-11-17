export function observeMotionVisibility(element: HTMLElement) {
  let inView = false;
  const update = () => {
    element.classList.toggle('is-motion-active', inView && !document.hidden);
  };
  const observer = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    update();
  });

  element.classList.add('is-motion-ready');
  observer.observe(element);
  document.addEventListener('visibilitychange', update);
}
