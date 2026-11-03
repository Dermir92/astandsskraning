import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixture from './ux3-progress-fixture.json';
import { isReportList, reportStats } from '../src/lib/model';
import { inspectionItems, itemProgress } from '../src/lib/inspection-navigation';
import { auditRenderedContrast } from './contrast-helpers';

export const report = () => { const reports: unknown = structuredClone(fixture.reports); if(!isReportList(reports)) throw Error('Invalid synthetic fixture'); return reports[0]; };
export const key = 'astandsskraning-demo-v1';
export const base = '/skyrslur/u2a-synthetic';
export async function seed(page: Page, r = report(), unsupported = false) {
  const raw = JSON.stringify({...fixture,reports:[r]});
  expect(isReportList([r])).toBe(true);
  await page.addInitScript(({raw,key,unsupported})=>{
    if(!localStorage.getItem(key)) { localStorage.setItem(key,raw);localStorage.setItem('u2b-sentinel','unchanged'); }
    if(unsupported) Object.defineProperty(navigator,'locks',{configurable:true,get:()=>undefined});
  },{raw,key,unsupported});
  return raw;
}
export async function unchanged(page: Page, raw: string) {
  expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
  expect(await page.evaluate(()=>localStorage.getItem('u2b-sentinel'))).toBe('unchanged');
}
export async function enlarge(page: Page) {
  await page.evaluate(()=>{const sizes=[...document.querySelectorAll<HTMLElement>('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const [e,s] of sizes)e.style.fontSize=`${s*2}px`;});
}

test('F03 direct review entry uses neutral step numbers without invented completion',async({page},info)=>{
  const raw=await seed(page);await page.goto(`${base}/yfirferd`);await expect(page.locator('.review-summary')).toBeVisible();
  await page.screenshot({path:info.outputPath('direct-review.png'),fullPage:true});
  await expect(page.locator('.step-number')).toHaveText(['1','2','3','4']);
  await expect(page.locator('.stepper .lucide-check')).toHaveCount(0);
  await expect(page.locator('.stepper a').first()).toHaveAccessibleName('Upplýsingar');
  await expect(page.locator('.stepper [aria-current="step"]')).toHaveText('4Yfirferð');
  await unchanged(page,raw);
});
test('F03 empty selection and empty checklist have no overall success marker',async({page})=>{
  const r=report();r.rooms=[{...r.rooms[0],items:[],observations:{}}];const raw=await seed(page,r);
  await page.goto(`${base}/rymi`);await expect(page.locator('.selected-room-total')).toBeVisible();
  await expect(page.locator('.selected-room-total .lucide-check')).toHaveCount(0);
  await page.goto(`${base}/skraning?rymi=u2a-entry`);await expect(page.locator('.room-heading h2')).toBeVisible();
  await expect(page.locator('.room-link-number')).toHaveText('1');await unchanged(page,raw);
});
test('F06 mandatory fixture keeps recorded deviations and limitations separate from six incomplete items',async({page},info)=>{
  const r=report(),rows=inspectionItems(r);expect(reportStats(r)).toEqual({total:14,recorded:8,unanswered:3,attention:9,deviations:4});
  expect(rows.filter(row=>itemProgress(row.item,row.observation)==='unanswered')).toHaveLength(2);
  expect(rows.filter(row=>itemProgress(row.item,row.observation)==='partial')).toHaveLength(4);
  const raw=await seed(page,r);await page.goto(`${base}/yfirferd`);
  await expect(page.locator('.review-summary > div').filter({hasText:'ófullskráð atriði'})).toHaveText('6ófullskráð atriði');
  await page.goto('/');await page.getByRole('button',{name:'Yfirlit: Prófunargata U2A',exact:true}).click();
  const overview=page.viewportSize()!.width<=1099?page.getByRole('dialog',{name:'Skýrsluyfirlit'}):page.getByRole('complementary',{name:'Yfirlit valinnar skýrslu'});
  await expect(overview).toContainText('6 ófullskráð atriði');await expect(overview).toContainText('9 atriði þarfnast athygli');
  await expect(overview).not.toContainText('óstaðfest svör');await page.screenshot({path:info.outputPath('overview.png'),fullPage:true});
  await page.goto(`${base}/forskodun`);await expect(page.getByText('ófullskráð atriði',{exact:true}).locator('..')).toContainText('6');
  await page.goto(`${base}/skraning?rymi=u2a-entry`);await page.locator('.inspection-overall > details > summary').click();
  await expect(page.locator('.inspection-overall a[href*="atridi="]')).toHaveCount(6);await unchanged(page,raw);
});
test('F03/F06 five-width keyboard, AX, contrast and enlarged-text evidence',async({page},info)=>{
  const raw=await seed(page);
  for(const width of [320,360,390,768,1440]) {
    await page.setViewportSize({width,height:1000});await page.goto(`${base}/yfirferd`);await expect(page.locator('.review-summary')).toBeVisible();
    await page.locator('.stepper a').first().focus();await page.keyboard.press('Tab');await expect(page.locator('.stepper a').nth(1)).toBeFocused();
    const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
    await info.attach(`axe-${width}`,{body:JSON.stringify(audit.violations),contentType:'application/json'});expect(audit.violations).toEqual([]);
    const contrast=await auditRenderedContrast(page);expect(contrast.failures).toEqual([]);
    await info.attach(`stepper-ax-${width}`,{body:await page.locator('.stepper').ariaSnapshot(),contentType:'text/plain'});
    await page.screenshot({path:info.outputPath(`review-${width}.png`)});await enlarge(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({path:info.outputPath(`text200-${width}.png`),fullPage:true});await unchanged(page,raw);
  }
});
