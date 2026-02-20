/**
 * Scroll vers un élément en tenant compte des éléments sticky (header + stepper).
 * Positionne l'élément au 1/3 supérieur de l'espace disponible sous les sticky.
 */
export function scrollToElement(element: HTMLElement | null): void {
  if (!element) return;
  const header = document.querySelector("header");
  const headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;
  const stepper = document.querySelector("[class*='sticky top-16']");
  const stepperHeight = stepper instanceof HTMLElement ? stepper.offsetHeight : 0;
  const stickyOffset = headerHeight + stepperHeight;
  const availableHeight = window.innerHeight - stickyOffset;
  const topOffset = availableHeight / 5;
  const top = element.getBoundingClientRect().top + window.scrollY - stickyOffset - topOffset;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}
