# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-refinement.spec.ts >> mobile report names open quick context and labelled actions directly open existing destinations
- Location: tests\mobile-refinement.spec.ts:168:5

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "hidden"
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - link "Fara beint í efni" [ref=e3] [cursor=pointer]:
      - /url: "#main"
    - generic [ref=e4]:
      - banner [ref=e5]:
        - link "Ástandsskráning" [ref=e6] [cursor=pointer]:
          - /url: /
        - generic [ref=e9]:
          - status [ref=e10]: Sýnigögn tilbúin
          - button "Um sýniham" [ref=e13] [cursor=pointer]: Sýnihamur
      - main [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]:
              - heading "Mínar skýrslur" [level=1] [ref=e18]
              - paragraph [ref=e19]: 6 skýrslur
            - link "Ný skýrsla" [ref=e20] [cursor=pointer]:
              - /url: /skyrslur/ny
          - generic [ref=e22]:
            - textbox "Leita að eign eða heimilisfangi" [ref=e27]:
              - /placeholder: Leita að eign eða heimilisfangi…
            - button "Sía og raða Nýjast fyrst" [ref=e29] [cursor=pointer]:
              - generic [ref=e31]: Sía og raða
              - generic [ref=e32]: Nýjast fyrst
          - paragraph [aria-hidden] [ref=e35]: Heiti skýrslu opnar stutt yfirlit. Framhaldshnappurinn opnar skráninguna eða sýniskýrsluna.
          - region "Skýrsluyfirlit" [ref=e37]:
            - status [ref=e39]: 6 af 6 skýrslum
            - region "Ólokið" [ref=e40]:
              - list [ref=e41]:
                - listitem [ref=e42]:
                  - 'button "Yfirlit: Sýnigata 14" [active] [ref=e43] [cursor=pointer]':
                    - generic [ref=e48]:
                      - generic [ref=e49]:
                        - generic [ref=e50]: Sýnigata 14
                        - generic [aria-hidden] [ref=e51]: Yfirlit
                      - generic [ref=e54]: 101 Reykjavík · 0201 · 2. hæð
                  - generic [ref=e55]:
                    - generic [ref=e56]: Í skráningu
                    - generic [ref=e58]: 24/53 skráð
                  - 'link "Halda áfram: Sýnigata 14" [ref=e60] [cursor=pointer]':
                    - /url: /skyrslur/syni-ibud/skraning
                    - generic [ref=e61]: Halda áfram
                - listitem [ref=e64]:
                  - 'button "Yfirlit: Dæmishlíð 8" [ref=e65] [cursor=pointer]':
                    - generic [ref=e70]:
                      - generic [ref=e71]:
                        - generic [ref=e72]: Dæmishlíð 8
                        - generic [aria-hidden] [ref=e73]: Yfirlit
                      - generic [ref=e76]: 200 Kópavogur
                  - generic [ref=e77]: Drög
                  - 'link "Opna drög: Dæmishlíð 8" [ref=e81] [cursor=pointer]':
                    - /url: /skyrslur/syni-hlid/upplysingar
                    - generic [ref=e82]: Opna drög
            - region "Yfirfarið · sýni" [ref=e85]:
              - list [ref=e86]:
                - listitem [ref=e87]:
                  - 'button "Yfirlit: Sýnibíll · SB-000" [ref=e88] [cursor=pointer]':
                    - generic [ref=e93]:
                      - generic [ref=e94]:
                        - generic [ref=e95]: Sýnibíll · SB-000
                        - generic [aria-hidden] [ref=e96]: Yfirlit
                      - generic [ref=e99]: Fólksbíll · Afhending
                  - generic [ref=e100]: Yfirfarið · sýni
                  - 'link "Skoða sýniskýrslu: Sýnibíll · SB-000" [ref=e104] [cursor=pointer]':
                    - /url: /skyrslur/syni-bill/yfirferd
                    - generic [ref=e105]: Skoða sýniskýrslu
                - listitem [ref=e108]:
                  - 'button "Yfirlit: Sýnigeymsla 03" [ref=e109] [cursor=pointer]':
                    - generic [ref=e114]:
                      - generic [ref=e115]:
                        - generic [ref=e116]: Sýnigeymsla 03
                        - generic [aria-hidden] [ref=e117]: Yfirlit
                      - generic [ref=e120]: Dæmisbraut 6 · 12 m²
                  - generic [ref=e121]: Yfirfarið · sýni
                  - 'link "Skoða sýniskýrslu: Sýnigeymsla 03" [ref=e125] [cursor=pointer]':
                    - /url: /skyrslur/syni-geymsla/yfirferd
                    - generic [ref=e126]: Skoða sýniskýrslu
                - listitem [ref=e129]:
                  - 'button "Yfirlit: Sýniskrifstofa" [ref=e130] [cursor=pointer]':
                    - generic [ref=e136]:
                      - generic [ref=e137]:
                        - generic [ref=e138]: Sýniskrifstofa
                        - generic [aria-hidden] [ref=e139]: Yfirlit
                      - generic [ref=e142]: Dæmisgarður 2 · 80 m²
                  - generic [ref=e143]: Yfirfarið · sýni
                  - 'link "Skoða sýniskýrslu: Sýniskrifstofa" [ref=e147] [cursor=pointer]':
                    - /url: /skyrslur/syni-atvinna/yfirferd
                    - generic [ref=e148]: Skoða sýniskýrslu
                - listitem [ref=e151]:
                  - 'button "Yfirlit: Dæmisgata 22" [ref=e152] [cursor=pointer]':
                    - generic [ref=e157]:
                      - generic [ref=e158]:
                        - generic [ref=e159]: Dæmisgata 22
                        - generic [aria-hidden] [ref=e160]: Yfirlit
                      - generic [ref=e163]: 220 Hafnarfjörður · Íbúð 0301
                  - generic [ref=e164]: Yfirfarið · sýni
                  - 'link "Skoða sýniskýrslu: Dæmisgata 22" [ref=e168] [cursor=pointer]':
                    - /url: /skyrslur/syni-lokid/yfirferd
                    - generic [ref=e169]: Skoða sýniskýrslu
            - paragraph [ref=e173]: Eingöngu tilbúin gögn · Drög haldast opin
      - contentinfo [ref=e174]:
        - generic [ref=e175]: Ástandsskráning · Framendafrumgerð
        - generic [ref=e176]: Tilbúin gögn · Enginn frágangur eða boð
  - alert [ref=e177]
```

# Test source

```ts
  96  |     ".register-mobile-property",
  97  |     ".register-next",
  98  |   ]) {
  99  |     for (const target of await page
  100 |       .locator(selector)
  101 |       .filter({ visible: true })
  102 |       .all())
  103 |       expect(
  104 |         (await target.boundingBox())!.height,
  105 |         selector,
  106 |       ).toBeGreaterThanOrEqual(44);
  107 |   }
  108 | });
  109 |
  110 | test("mobile filter disclosure works by keyboard and announces active filters and sorting", async ({
  111 |   page,
  112 | }) => {
  113 |   if (page.viewportSize()!.width > 800)
  114 |     await page.setViewportSize({ width: 768, height: 900 });
  115 |   await page.goto("/");
  116 |   await page.keyboard.press("Tab");
  117 |   await page.keyboard.press("Enter");
  118 |   await expect(page.locator("main")).toBeFocused();
  119 |   await page.keyboard.press("Tab");
  120 |   await expect(page.locator(".reports-heading .button")).toBeFocused();
  121 |   await page.keyboard.press("Tab");
  122 |   await expect(
  123 |     page.getByRole("textbox", { name: "Leita að eign eða heimilisfangi" }),
  124 |   ).toBeFocused();
  125 |   await page.keyboard.press("Tab");
  126 |   const toggle = page.getByRole("button", { name: /Sía og raða/ });
  127 |   await expect(toggle).toBeFocused();
  128 |   await page.keyboard.press("Space");
  129 |   await expect(toggle).toHaveAttribute("aria-expanded", "true");
  130 |   await page.keyboard.press("Tab");
  131 |   const status = page.getByRole("combobox", { name: "Staða", exact: true });
  132 |   await expect(status).toBeFocused();
  133 |   await page.keyboard.press("Home");
  134 |   await page.keyboard.press("ArrowDown");
  135 |   await page.keyboard.press("ArrowDown");
  136 |   await expect(status).toHaveValue("draft");
  137 |   await page.keyboard.press("Tab");
  138 |   const asset = page.getByRole("combobox", {
  139 |     name: "Eignategund",
  140 |     exact: true,
  141 |   });
  142 |   await expect(asset).toBeFocused();
  143 |   await asset.selectOption("apartment");
  144 |   await expect(toggle).toContainText("2 virkar síur");
  145 |   await expect(
  146 |     page.getByText("1 af 6 skýrslum", { exact: true }),
  147 |   ).toBeVisible();
  148 |   await page.keyboard.press("Tab");
  149 |   const sort = page.getByRole("combobox", { name: "Röðun skýrslna" });
  150 |   await expect(sort).toBeFocused();
  151 |   await sort.selectOption("name");
  152 |   await expect(toggle).toContainText("Eftir heiti");
  153 |   await page.keyboard.press("Escape");
  154 |   await expect(toggle).toBeFocused();
  155 |   await expect(toggle).toHaveAttribute("aria-expanded", "false");
  156 |   await expect(toggle).toContainText("2 virkar síur");
  157 |   await page.keyboard.press("Enter");
  158 |   await page.getByRole("button", { name: "Endurstilla leit og síur" }).click();
  159 |   await expect(status).toHaveValue("all");
  160 |   await expect(asset).toHaveValue("all");
  161 |   await expect(sort).toHaveValue("name");
  162 |   await expect(toggle).not.toContainText("virk");
  163 |   await expect(page.locator(".property-name:visible")).toHaveCount(6);
  164 |   await page.keyboard.press("Escape");
  165 |   await expect(toggle).toBeFocused();
  166 | });
  167 |
  168 | test("mobile report names open quick context and labelled actions directly open existing destinations", async ({
  169 |   page,
  170 | }) => {
  171 |   if (page.viewportSize()!.width > 800)
  172 |     await page.setViewportSize({ width: 768, height: 900 });
  173 |   await page.goto("/");
  174 |   const title = page.getByRole("button", {
  175 |     name: "Yfirlit: Sýnigata 14",
  176 |     exact: true,
  177 |   });
  178 |   await expect(title).toHaveAttribute("aria-haspopup", "dialog");
  179 |   await expect(title).toHaveAccessibleDescription(
  180 |     /Heiti skýrslu opnar stutt yfirlit/,
  181 |   );
  182 |   await expect(title).toHaveAccessibleDescription(
  183 |     /101 Reykjavík · 0201 · 2. hæð/,
  184 |   );
  185 |   await title.focus();
  186 |   await page.keyboard.press("Enter");
  187 |   const sheet = page.getByRole("dialog", { name: "Skýrsluyfirlit" });
  188 |   const close = sheet.getByRole("button", { name: "Loka yfirliti" });
  189 |   await expect(close).toBeFocused();
  190 |   await page.keyboard.press("Shift+Tab");
  191 |   expect(
  192 |     await sheet.evaluate((element) => element.contains(document.activeElement)),
  193 |   ).toBe(true);
  194 |   await page.keyboard.press("Escape");
  195 |   await expect(title).toBeFocused();
> 196 |   expect(await page.evaluate(() => document.body.style.overflow)).not.toBe(
      |                                                                       ^ Error: expect(received).not.toBe(expected) // Object.is equality
  197 |     "hidden",
  198 |   );
  199 |   for (const [name, suffix] of [
  200 |     ["Sýnigata 14", "/syni-ibud/skraning"],
  201 |     ["Dæmishlíð 8", "/syni-hlid/upplysingar"],
  202 |     ["Sýnibíll · SB-000", "/syni-bill/yfirferd"],
  203 |   ]) {
  204 |     const next = reportDestination(page, name);
  205 |     await expect(next).toContainText(
  206 |       name.startsWith("Sýnibíll")
  207 |         ? "Skoða sýniskýrslu"
  208 |         : name.startsWith("Dæmishlíð")
  209 |           ? "Opna drög"
  210 |           : "Halda áfram",
  211 |     );
  212 |     await next.click();
  213 |     await expect(page).toHaveURL(new RegExp(suffix + "$"));
  214 |     await expect(page.locator("main h1")).toBeVisible();
  215 |     await expect(page.getByRole("dialog")).toHaveCount(0);
  216 |     await page
  217 |       .locator("main")
  218 |       .getByRole("link", { name: "Mínar skýrslur", exact: true })
  219 |       .click();
  220 |   }
  221 | });
  222 |
  223 | test("mobile filters, active states, demo help and sheet retain contrast and axe semantics", async ({
  224 |   page,
  225 | }, testInfo) => {
  226 |   if (page.viewportSize()!.width > 800)
  227 |     await page.setViewportSize({ width: 768, height: 900 });
  228 |   await page.goto("/");
  229 |   const audits: ({ name: string } & Awaited<
  230 |     ReturnType<typeof auditRenderedContrast>
  231 |   >)[] = [];
  232 |   async function audit(name: string) {
  233 |     const contrast = await auditRenderedContrast(page);
  234 |     audits.push({ name, ...contrast });
  235 |     expect(contrast.failures, name).toEqual([]);
  236 |     expect(contrast.typeFailures, name).toEqual([]);
  237 |     const axe = await new AxeBuilder({ page })
  238 |       .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
  239 |       .analyze();
  240 |     expect(
  241 |       axe.violations.map((violation) => ({
  242 |         id: violation.id,
  243 |         nodes: violation.nodes.map((node) => node.target),
  244 |       })),
  245 |       name,
  246 |     ).toEqual([]);
  247 |   }
  248 |   await audit("collapsed-controls");
  249 |   const toggle = page.getByRole("button", { name: /Sía og raða/ });
  250 |   await toggle.focus();
  251 |   const focus = await auditFocusContrast(page, ".mobile-filter-toggle");
  252 |   expect(focus.width).toBeGreaterThanOrEqual(3);
  253 |   expect(focus.ratio).toBeGreaterThanOrEqual(3);
  254 |   await toggle.click();
  255 |   await audit("expanded-controls-disabled-reset");
  256 |   await page
  257 |     .getByRole("combobox", { name: "Staða", exact: true })
  258 |     .selectOption("draft");
  259 |   await page
  260 |     .getByRole("combobox", { name: "Eignategund", exact: true })
  261 |     .selectOption("apartment");
  262 |   await toggle.click();
  263 |   await toggle.hover();
  264 |   await audit("active-collapsed-controls-hover");
  265 |   await page
  266 |     .getByRole("button", { name: "Yfirlit: Dæmishlíð 8", exact: true })
  267 |     .click();
  268 |   await audit("draft-sheet");
  269 |   await page.keyboard.press("Escape");
  270 |   await page.getByRole("button", { name: "Um sýniham", exact: true }).click();
  271 |   await expect(page.getByRole("dialog")).toContainText(
  272 |     "Notaðu eingöngu tilbúin gögn",
  273 |   );
  274 |   await audit("demo-help");
  275 |   await page.keyboard.press("Escape");
  276 |   const output = testInfo.outputPath("mobile-refinement-contrast.json");
  277 |   await writeFile(output, JSON.stringify(audits, null, 2));
  278 |   await testInfo.attach("mobile-refinement-contrast", {
  279 |     path: output,
  280 |     contentType: "application/json",
  281 |   });
  282 | });
  283 |
```
