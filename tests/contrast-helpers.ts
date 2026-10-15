import type { Page } from "@playwright/test";

// Audit computed, rendered styles rather than relying on token names. This covers
// placeholders and disabled controls, which axe's colour rule may exclude.
export async function auditRenderedContrast(page: Page) {
  return page.evaluate(() => {
    type RGBA = [number, number, number, number];
    type Finding = {
      element: string;
      text: string;
      ratio: number;
      required: number;
      kind: string;
      foreground: string;
      background: string;
    };
    const findings: Finding[] = [];
    const failures: Finding[] = [];
    const typeFailures: {
      element: string;
      text: string;
      size: number;
      opacity: number;
    }[] = [];
    const parse = (value: string): RGBA => {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0];
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };
    const over = (top: RGBA, bottom: RGBA): RGBA => [
      top[0] * top[3] + bottom[0] * (1 - top[3]),
      top[1] * top[3] + bottom[1] * (1 - top[3]),
      top[2] * top[3] + bottom[2] * (1 - top[3]),
      1,
    ];
    const luminance = (colour: RGBA) => {
      const c = colour.slice(0, 3).map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
      return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
    };
    const contrast = (a: RGBA, b: RGBA) => {
      const l1 = luminance(a),
        l2 = luminance(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const describe = (el: Element) =>
      `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${el.classList.length ? `.${[...el.classList].join(".")}` : ""}`;
    const background = (el: Element | null): RGBA => {
      const ancestors: Element[] = [];
      for (let node = el; node; node = node.parentElement)
        ancestors.unshift(node);
      return ancestors.reduce<RGBA>(
        (colour, node) =>
          over(parse(getComputedStyle(node).backgroundColor), colour),
        [255, 255, 255, 1],
      );
    };
    const visible = (el: Element) => {
      if (el.closest(".sr-only") || el.tagName === "OPTION") return false;
      const box = el.getBoundingClientRect();
      if (!box.width || !box.height) return false;
      for (let node: Element | null = el; node; node = node.parentElement) {
        const s = getComputedStyle(node);
        if (
          s.display === "none" ||
          s.visibility === "hidden" ||
          s.clipPath === "inset(50%)" ||
          Number(s.opacity) === 0
        )
          return false;
      }
      return true;
    };
    const check = (
      el: Element,
      colour: string,
      bg: RGBA,
      required: number,
      kind: string,
      text = "",
    ) => {
      const foreground = over(parse(colour), bg);
      const result = {
        element: describe(el),
        text: text.slice(0, 120),
        ratio: contrast(foreground, bg),
        required,
        kind,
        foreground: colour,
        background: `rgb(${bg.slice(0, 3).map(Math.round).join(", ")})`,
      };
      findings.push(result);
      if (result.ratio < required) failures.push(result);
    };
    const elements = [...document.querySelectorAll(".app-shell *")].filter(
      visible,
    );
    for (const el of elements) {
      const style = getComputedStyle(el);
      let text = [...el.childNodes]
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent)
        .join(" ")
        .trim();
      if (
        el instanceof HTMLInputElement &&
        !["radio", "file", "checkbox"].includes(el.type)
      )
        text = el.value;
      if (el instanceof HTMLTextAreaElement) text = el.value;
      if (el instanceof HTMLSelectElement)
        text = el.selectedOptions[0]?.textContent?.trim() ?? "";
      if (text) {
        const size = parseFloat(style.fontSize);
        const large =
          size >= 24 || (size >= 18.6667 && parseInt(style.fontWeight) >= 700);
        check(el, style.color, background(el), large ? 3 : 4.5, "text", text);
        let opacity = 1;
        for (let node: Element | null = el; node; node = node.parentElement)
          opacity *= Number(getComputedStyle(node).opacity);
        if ((!el.matches(".brand-subtitle") && size < 12) || opacity < 1)
          typeFailures.push({
            element: describe(el),
            text: text.slice(0, 80),
            size,
            opacity,
          });
      }
      if (
        (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
        el.placeholder
      ) {
        const placeholder = getComputedStyle(el, "::placeholder");
        check(
          el,
          placeholder.color,
          background(el),
          4.5,
          "placeholder",
          el.placeholder,
        );
        if (Number(placeholder.opacity) < 1)
          typeFailures.push({
            element: describe(el),
            text: el.placeholder,
            size: parseFloat(placeholder.fontSize),
            opacity: Number(placeholder.opacity),
          });
      }
      if (
        el.matches(
          ".button-secondary,.search-field,.toolbar-select,.quantity-control,.answer-option,.radio-option,.form-field input,.form-field select,.form-field textarea,.custom-room-form input,.room-name-field input,.mobile-room-select select,.sort-select,.register-filter select,.demo-pill,.context-dialog",
        ) &&
        parseFloat(style.borderTopWidth) > 0 &&
        style.borderTopStyle !== "none"
      ) {
        check(
          el,
          style.borderTopColor,
          background(el),
          3,
          "control border / inside",
        );
        check(
          el,
          style.borderTopColor,
          background(el.parentElement),
          3,
          "control border / outside",
        );
      }
      if (
        el.matches("svg") &&
        el.closest(
          "button,a,.save-status,.review-state,.review-missing,.field-error,.quantity-control",
        )
      )
        check(el, style.color, background(el), 3, "interface icon");
      if (el.matches(".answer-indicator"))
        check(
          el,
          style.borderTopColor,
          background(el.parentElement),
          3,
          "radio indicator",
        );
      if (
        el.matches(".progress-track > div") &&
        el.getBoundingClientRect().width > 0
      )
        check(
          el,
          style.backgroundColor,
          background(el.parentElement),
          3,
          "progress fill",
        );
    }
    const textFindings = findings.filter(
      (f) => f.kind === "text" || f.kind === "placeholder",
    );
    return {
      checked: findings.length,
      textChecked: textFindings.length,
      minimumTextRatio: Math.min(...textFindings.map((f) => f.ratio)),
      failures,
      typeFailures,
      findings,
    };
  });
}

export async function auditFocusContrast(page: Page, selector: string) {
  const target = page.locator(selector).first();
  await target.focus();
  // The normal text audit includes every colour-bearing label; this assertion
  // additionally guarantees the keyboard outline is visible and substantial.
  return target.evaluate((el) => {
    const indicator = el.closest(".answer-option,.search-field") ?? el;
    const s = getComputedStyle(indicator);
    const parse = (value: string) =>
      value
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number);
    const luminance = (c: number[]) => {
      const channels = c.map((v) => {
        const n = v / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    let bg = "rgb(255, 255, 255)";
    for (let node = indicator.parentElement; node; node = node.parentElement) {
      const colour = getComputedStyle(node).backgroundColor;
      if (colour !== "rgba(0, 0, 0, 0)" && colour !== "transparent") {
        bg = colour;
        break;
      }
    }
    const a = luminance(parse(s.outlineColor)),
      b = luminance(parse(bg));
    return {
      style: s.outlineStyle,
      width: parseFloat(s.outlineWidth),
      colour: s.outlineColor,
      offset: parseFloat(s.outlineOffset),
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    };
  });
}
