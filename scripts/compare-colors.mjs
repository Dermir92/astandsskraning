import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const output = path.resolve("artifacts/color-comparison");
await mkdir(output, { recursive: true });

// Compare only the real reports screen. Neither candidate adds an application theme switch.
const directions = {
  a: {
    name: "A · Navy / petrol + teal",
    ink: "#172f40",
    secondary: "#405463",
    navy: "#142e3d",
    teal: "#17635d",
    hover: "#124f4a",
    paper: "#f3f6f5",
    tint: "#e5f0ee",
    tintStrong: "#d3e7e2",
    navActive: "#284b58",
    navHover: "#213f4d",
    navCount: "#355765",
    navText: "#e2ebef",
    accent: "#93d6c7",
    focus: "#006b7a",
    demoText: "#314b5a",
    demoBg: "#e7eef2",
    line: "#cbd6da",
    control: "#71858e",
  },
  b: {
    name: "B · Evergreen + restrained warm accent",
    ink: "#173a30",
    secondary: "#3b5149",
    navy: "#153c31",
    teal: "#205f4e",
    hover: "#174d3d",
    paper: "#f5f5f0",
    tint: "#e7eee7",
    tintStrong: "#d8e5d8",
    navActive: "#2a5144",
    navHover: "#24483d",
    navCount: "#3a6051",
    navText: "#e4eee7",
    accent: "#d4a193",
    focus: "#1c6e54",
    demoText: "#713f30",
    demoBg: "#f6eae4",
    line: "#d0d8cd",
    control: "#75867b",
  },
};
function overviewCSS(p) {
  return `
  :root { --ink:${p.ink};--navy:${p.navy};--teal:${p.teal};--teal-dark:${p.hover};--paper:${p.paper};--muted:${p.secondary};--line:${p.line}; }
  body {font-size:15px;font-weight:500;}
  .brand-subtitle,.workspace-label,.main-nav a,.help-details,.help-details p,.sidebar-version {color:${p.navText};}
  .brand-subtitle {font-size:11px;letter-spacing:1px;}
  .workspace-label,.sidebar-version,.app-footer,.table-footer {font-size:12px;}
  .main-nav a {font-size:14px;}
  .main-nav a:hover {background:${p.navHover};}
  .main-nav .nav-active {background:${p.navActive};box-shadow:inset 3px 0 ${p.accent};}
  .nav-count {background:${p.navCount};font-size:12px;}
  .brand-mark span {background:${p.accent};box-shadow:0 5px ${p.accent};}
  .workspace-dot,.note-line {background:${p.accent};}
  .note-line {background:${p.teal};}
  .demo-pill {color:${p.demoText};background:${p.demoBg};border-color:${p.control};font-size:12px;}
  .demo-banner {background:${p.demoBg};color:${p.secondary};font-size:12px;}
  .demo-banner-label {font-size:10px;border-color:${p.control};}
  .save-status,.desktop-context {color:${p.secondary};font-size:12px;}
  .page-description {font-size:14px;color:${p.secondary};}
  .eyebrow,.resume-description .eyebrow {font-size:11px;letter-spacing:1px;}
  .button {font-size:14px;}
  .button-secondary,.search-field,.toolbar-select {border-color:${p.control};}
  .button-secondary:hover {background:${p.tint};border-color:${p.teal};}
  .button-primary:hover {background:${p.hover};}
  .asset-icon {color:${p.secondary};background:${p.tint};}
  .resume-panel {background:${p.tint};border-color:${p.line};border-left-color:${p.teal};}
  .resume-icon {background:${p.tintStrong};border-color:${p.line};color:${p.teal};}
  .resume-description > p:last-child {font-size:14px;color:${p.secondary};}
  .report-tabs button {font-size:14px;color:${p.secondary};}
  .report-tabs button span {font-size:12px;color:${p.secondary};background:${p.paper};}
  .report-tabs .tab-active {color:${p.teal};}
  .report-tabs .tab-active span {color:${p.teal};background:${p.tint};}
  .search-field input,.toolbar-select select,.sort-select {font-size:14px;}
  input::placeholder {color:${p.secondary};opacity:1;}
  .reports-table th {font-size:13px;font-weight:650;color:${p.secondary};background:${p.paper};}
  .reports-table td {font-size:14px;}
  .property-name {font-size:15px;}
  .property-cell p {font-size:14px;font-weight:500;color:${p.secondary};}
  .type-cell,.date-cell {font-size:14px;color:${p.secondary};}
  .badge {font-size:12px;font-weight:700;}
  .badge-draft {color:${p.secondary};background:${p.paper};}
  .badge-active {color:${p.teal};background:${p.tint};}
  .badge-reviewed {color:${p.ink};background:${p.demoBg};}
  .table-action {font-size:13px;}
  .table-footer,.reports-note,.reports-note strong {color:${p.secondary};font-size:13px;}
  :focus-visible {outline:3px solid ${p.focus};outline-offset:3px;}
  .app-sidebar :focus-visible {outline-color:${p.accent};}
  @media(max-width:640px) {
    .reports-table tr {gap:3px 8px;}
    .report-tabs {gap:0;padding:0 8px;flex-wrap:wrap;justify-content:flex-start;}
    .report-tabs button {font-size:12px;padding:0 8px;}
    .report-tabs button span {font-size:12px;}
    .table-action,.property-cell p {font-size:13px;}
    .date-cell {font-size:13px!important;}
    .table-footer>span:last-child {font-size:12px;}
    .search-field input {font-size:16px;}
    .toolbar-select select,.sort-select {font-size:13px;}
    .resume-description > p:last-child {font-size:13px;}
    .resume-progress>span {font-size:12px;}
  }`;
}

const browser = await chromium.launch();
const results = {};
for (const [key, palette] of Object.entries(directions)) {
  results[key] = {};
  for (const [screen, viewport] of Object.entries({
    desktop: { width: 1440, height: 1000 },
    mobile: { width: 390, height: 844 },
  })) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:3000/");
    await page.locator(".property-name").first().waitFor();
    await page.addStyleTag({ content: overviewCSS(palette) });
    await page.evaluate(() => document.fonts.ready);
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    results[key][screen] = {
      violations: axe.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    };
    await page.screenshot({
      path: path.join(output, `${key}-${screen}.png`),
      fullPage: true,
    });
    await context.close();
  }
}
await browser.close();
await writeFile(
  path.join(output, "checks.json"),
  JSON.stringify(results, null, 2),
);
await writeFile(
  path.join(output, "index.html"),
  `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ástandsskráning — colour comparison</title>
<style>body{margin:0;padding:28px;background:#f3f6f5;color:#172f40;font:500 15px/1.6 system-ui,sans-serif}main{max-width:1600px;margin:auto}h1{font-size:26px;line-height:1.3;margin:0 0 8px}h2{font-size:18px;margin:0}p{max-width:1000px;color:#405463}button{font:600 14px system-ui;padding:12px 18px;border:1px solid #71858e;border-radius:4px;background:white;color:#172f40;cursor:pointer}button[aria-pressed=true]{background:#17635d;color:white}button:focus-visible,a:focus-visible{outline:3px solid #006b7a;outline-offset:3px}.toolbar{display:flex;gap:10px;margin:22px 0}.comparison{display:grid;grid-template-columns:1fr 1fr;gap:24px}figure{margin:0;min-width:0}figcaption{min-height:95px}figure a{display:block}img{width:100%;height:auto;border:1px solid #71858e;border-radius:5px}.recommendation{border-left:4px solid #17635d;background:#e5f0ee;padding:16px 20px;margin-top:25px}.mobile{display:none;max-width:390px;margin:auto}body[data-view=mobile] .desktop{display:none}body[data-view=mobile] .mobile{display:block}table{border-collapse:collapse;margin-top:24px;width:100%;max-width:1000px}th,td{text-align:left;border-bottom:1px solid #aebfc5;padding:12px}small{font-size:13px;color:#405463}@media(max-width:750px){body{padding:18px}.comparison{grid-template-columns:1fr}figcaption{min-height:0;margin-bottom:12px}table{font-size:13px}th,td{padding:8px}}</style>
<main><h1>Ástandsskráning · two restrained colour directions</h1><p>The same real “Mínar skýrslur” screen, with identical content, layout and stronger typography. Open an image to inspect it at full size. This is a comparison artifact; the product has no theme switch.</p>
<div class="toolbar" role="group" aria-label="Screenshot size"><button aria-pressed="true" onclick="choose('desktop',this)">Desktop · 1440 px</button><button aria-pressed="false" onclick="choose('mobile',this)">Mobile · 390 px</button></div>
<div class="comparison"><figure><figcaption><h2>A · Navy / petrol + teal</h2><small>Cool, precise and operational. Teal carries actions; navy anchors navigation. No brown or gold brand accents.</small></figcaption><a class="desktop" href="a-desktop.png"><img src="a-desktop.png" alt="Option A, actual reports interface at desktop width"></a><a class="mobile" href="a-mobile.png"><img src="a-mobile.png" alt="Option A, actual reports interface at mobile width"></a></figure>
<figure><figcaption><h2>B · Evergreen + subtle warmth</h2><small>Calm and distinctive. Evergreen carries actions; a restrained terracotta accent appears in the mark and demo label.</small></figcaption><a class="desktop" href="b-desktop.png"><img src="b-desktop.png" alt="Option B, actual reports interface at desktop width"></a><a class="mobile" href="b-mobile.png"><img src="b-mobile.png" alt="Option B, actual reports interface at mobile width"></a></figure></div>
<table><caption>Calculated contrast for the candidate palettes</caption><tr><th>Text pair</th><th>A</th><th>B</th></tr><tr><td>Secondary text / white</td><td>7.88:1</td><td>8.54:1</td></tr><tr><td>White text / primary action</td><td>7.05:1</td><td>7.48:1</td></tr></table>
<div class="recommendation"><strong>Recommendation: A.</strong><p>Both palettes support clear, accessible typography. A gives navigation, actions and semantic statuses clearer visual separation and fits residential, vehicle and commercial reporting equally well. B has a warmer identity but brings the navigation and success statuses closer in hue. Accessibility does not select the winner: professionalism, operational clarity and a broad product identity favour A.</p></div>
<p><small>Rendered contrast and accessibility checks are recorded in checks.json. The later full-app audit also checks placeholders, disabled controls, focus rings and control boundaries.</small></p></main>
<script>function choose(view,button){document.body.dataset.view=view;document.querySelectorAll('.toolbar button').forEach(b=>b.setAttribute('aria-pressed',b===button?'true':'false'))}</script></html>`,
);
console.log(JSON.stringify({ output, checks: results }, null, 2));
