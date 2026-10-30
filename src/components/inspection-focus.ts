// Keep the focused answer unchanged while revealing its question and options
// below the section bar. Centering a single radio can leave adjacent options
// obscured by the sticky navigation, especially in a narrow correction view.
export function scrollInspectionField(field: HTMLElement, target: HTMLElement) {
  const page = field.closest<HTMLElement>(".inspection-page");
  const bar = page?.querySelector<HTMLElement>("[data-inspection-sections]");
  const offset = page ? parseFloat(getComputedStyle(page).getPropertyValue("--inspection-section-offset")) || 150 : 0;
  const groupFits = !!bar && field.matches("fieldset") && field.getBoundingClientRect().height <= innerHeight - offset - 32;
  (groupFits ? field : target).scrollIntoView({ block: groupFits ? "start" : "center", behavior: "instant" });
}
