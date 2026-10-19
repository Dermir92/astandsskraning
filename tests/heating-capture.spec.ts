import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { STORAGE_KEY } from "../src/components/demo-provider";
import { heatingReport, triedHeating } from "./heating-fixtures";
import { legacyCoreReport } from "./inspection-core-fixtures";
import { type HeatingObservation, type Report } from "../src/lib/model";
import { positionKey } from "../src/lib/inspection-navigation";

const base="/skyrslur/heating-case";
const raw=(page:Page)=>page.evaluate(k=>localStorage.getItem(k),STORAGE_KEY);
const saved=async(page:Page):Promise<Report>=>JSON.parse((await raw(page))!).reports[0];
const row=(page:Page)=>page.locator('[data-kind="space_heating"]');
async function seed(page:Page,report=heatingReport(),path=`${base}/skraning?rymi=legacy-room&atridi=space-heating`) {
  const document=JSON.stringify({version:1,envelopeExtra:{keep:[0,false]},reports:[report,{...legacyCoreReport(),id:"other"}]},null,2);
  await page.addInitScript(({document,key})=>{if(!sessionStorage.getItem("heating-seed")){localStorage.setItem(key,document);sessionStorage.setItem("heating-seed","yes");}}, {document,key:STORAGE_KEY});
  await page.goto(path);await expect(page.locator('.topbar .save-status')).toHaveText("Vistað í þessum vafra");return document;
}
async function choice(page:Page,key:string,name:string){await row(page).locator(`[data-question="${key}"]`).getByRole('radio',{name,exact:true}).check();}
async function review(page:Page){await page.getByRole('link',{name:'Yfirferð',exact:true}).first().click();await expect(page.locator('[data-heating-review]')).toBeVisible();}

test("legacy viewing never backfills; explicit add makes one empty item and opens it without touching cooking records",async({page})=>{
  const old={...legacyCoreReport(),id:"heating-case"};const before=await seed(page,old,`${base}/skraning?rymi=legacy-room`);
  expect(await raw(page)).toBe(before);await expect(row(page)).toHaveCount(0);
  await page.getByRole('button',{name:'Bæta við hitaskráningu',exact:true}).click();await expect(row(page)).toBeVisible();await expect(row(page).locator('.checklist-toggle')).toHaveAttribute('aria-expanded','true');
  const after=await saved(page);expect(after.rooms[0].observations).toEqual(old.rooms[0].observations);expect(after.rooms[0].items).toHaveLength(2);await expect(page.getByRole('button',{name:'Bæta við hitaskráningu',exact:true})).toHaveCount(0);
  await expect(row(page).getByRole('radio',{checked:true})).toHaveCount(0);const bytes=await raw(page);await row(page).getByRole('button',{name:'Loka atriði',exact:true}).click();await expect(row(page).locator('.checklist-toggle')).toBeFocused();expect(await raw(page)).toBe(bytes);await page.reload();expect(await raw(page)).toBe(bytes);
});
test("conditional completion accepts equipment OR scope and requires both reported facts and their source",async({page})=>{
  await seed(page);await choice(page,'visibility','Sýnilegir hlutar');await choice(page,'visibleCondition','Í lagi');await choice(page,'operation','Nei, ekki prófað');await expect(row(page)).toHaveAttribute('data-state','incomplete');
  await row(page).getByRole('checkbox',{name:'Ofnar',exact:true}).check();await expect(row(page)).toHaveAttribute('data-state','recorded');await row(page).getByRole('checkbox',{name:'Ofnar',exact:true}).uncheck();
  await row(page).getByText('Afmörkun og heimild',{exact:true}).click();await page.getByLabel('Hvaða hlutar sáust eða hvað var tilkynnt?',{exact:true}).fill('Sýnilegur hitastillir við hurð');await expect(row(page)).toHaveAttribute('data-state','recorded');
  await choice(page,'visibility','Uppgefinn búnaður sem sást ekki');await expect(row(page)).toHaveAttribute('data-state','incomplete');await page.getByLabel('Heimild upplýsinga um ósýnilegan búnað',{exact:true}).fill('Sýnileigusali, ekki staðfest');await expect(row(page)).toHaveAttribute('data-state','recorded');
  await review(page);const facts=page.locator('[data-heating-review]');await expect(facts).toContainText('Sýnilegur hitastillir við hurð');await expect(facts.locator('dt').filter({hasText:'Sýnilegt ástand tilgreindra hluta'})).toHaveCount(0);await expect(page.locator('[data-heating-defect-count]')).toHaveText('0 atriði með skráð frávik');
});
for (const response of ['observed','mixed'] as const) {
  test(`mixed visibility with ${response} response keeps its limitation without false defects or repair tasks`,async({page})=>{
    await seed(page,heatingReport({...triedHeating(response),equipment:['thermostat','underfloor'],scope:'Hitastillir sást. Gólfhiti sagður undir gólfi; ekki séður.',informationSource:'Sýnileigusali'}));await expect(row(page)).toHaveAttribute('data-state','recorded');const before=await raw(page);await review(page);const facts=page.locator('[data-heating-review]');if(response==='mixed')await expect(facts).toContainText('Ólík viðbrögð');await expect(facts).toContainText('Sýnileigusali');await expect(facts).toContainText('Sýnilegt ástand tilgreindra hluta');await expect(facts).not.toContainText('Virkar ekki');await expect(facts.locator('[data-heating-defect]')).toHaveCount(0);
    await expect(page.locator('[data-heating-incomplete-count]')).toHaveText('0 ófullskráð atriði');await expect(page.locator('[data-heating-limitation-count]')).toHaveText('1 atriði með skráðar takmarkanir');await expect(facts.locator('[data-heating-limitations]')).toContainText('Uppgefinn búnaður sem sást ekki');await expect(page.locator('[data-heating-defect-count]')).toHaveText('0 atriði með skráð frávik');expect(await raw(page)).toBe(before);
    await facts.getByRole('link',{name:'Hiti · Breyta skráningu',exact:true}).click();await choice(page,'response','Ekkert viðbragð sást eða fannst meðan athugun stóð');expect((await saved(page)).rooms[0].observations['space-heating']).not.toHaveProperty('functionality');await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();await expect(facts).toContainText('Ekkert viðbragð sást eða fannst meðan athugun stóð');await expect(page.locator('[data-heating-limitation-count]')).toHaveText('1 atriði með skráðar takmarkanir');await expect(page.locator('[data-heating-defect-count]')).toHaveText('0 atriði með skráð frávik');
    await facts.getByRole('link',{name:'Hiti · Breyta skráningu',exact:true}).click();await choice(page,'visibility','Enginn hitabúnaður sást');await expect(row(page)).toHaveAttribute('data-state','recorded');await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();
    await expect(facts.locator('[data-heating-limitations]')).toContainText('Enginn hitabúnaður sást');await expect(facts.locator('[data-heating-limitations]')).not.toContainText('Uppgefinn búnaður sem sást ekki');await expect(facts.getByText('Varðveitt gögn um hita',{exact:true})).toBeVisible();await expect(page.locator('[data-heating-incomplete-count]')).toHaveText('0 ófullskráð atriði');await expect(page.locator('[data-heating-limitation-count]')).toHaveText('1 atriði með skráðar takmarkanir');await expect(page.locator('[data-heating-defect-count]')).toHaveText('0 atriði með skráð frávik');
    expect((await saved(page)).rooms[0].observations['space-heating'].heating!.informationSource).toBe('Sýnileigusali');const retained=await raw(page);await page.reload();expect(await raw(page)).toBe(retained);await expect(facts.locator('[data-heating-limitations]')).not.toContainText('Uppgefinn búnaður sem sást ekki');
  });
}
test("other states need no extra scope; parent changes retain editable inactive answers without current defect claims",async({page})=>{
  const report=heatingReport({...triedHeating(),visibleCondition:'damaged'});Object.assign(report.rooms[0].observations['space-heating'],{damageType:'Sýnigalli',location:'Sýniofn',description:'Sýnileg skemmd í sýnigögnum'});await seed(page,report);
  await choice(page,'visibility','Enginn hitabúnaður sást');await choice(page,'operation','Nei, ekki prófað');await expect(row(page)).toHaveAttribute('data-state','recorded');const bytes=await raw(page);
  for(const d of await row(page).locator('details').all())if(await d.getAttribute('open')===null)await d.locator(':scope > summary').click();expect(await raw(page)).toBe(bytes);
  await review(page);const facts=page.locator('[data-heating-review]');await expect(facts).toContainText('Enginn hitabúnaður sást');await expect(facts.locator('[data-heating-defect]')).toHaveCount(0);await expect(page.locator('[data-heating-defect-count]')).toHaveText('0 atriði með skráð frávik');await expect(facts.getByText('Varðveitt gögn um hita',{exact:true})).toBeVisible();
  expect((await saved(page)).rooms[0].observations['space-heating'].heating).toMatchObject({visibleCondition:'damaged',response:'none_observed'});expect(await raw(page)).toBe(bytes);
});
test("review correction reveals the missing source after reload, preserves focus through typing and returns visibly",async({page})=>{
  const report=heatingReport({visibility:'reported_concealed',scope:'Gólfhiti sagður til staðar',operation:'not_tried'});const before=await seed(page,report,`${base}/yfirferd`);
  await page.locator('[data-heating-review]').getByRole('link',{name:'Hiti · Breyta skráningu',exact:true}).click();const source=page.getByLabel('Heimild upplýsinga um ósýnilegan búnað',{exact:true});await expect(source).toBeFocused();expect(await raw(page)).toBe(before);
  await source.pressSequentially('Sýnileigusali');await expect(source).toBeFocused();const bytes=await raw(page);await page.reload();expect(await raw(page)).toBe(bytes);await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();await expect(page.locator('.review-room')).toBeInViewport();expect(await raw(page)).toBe(bytes);
  expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).itemId,positionKey(report.id))).toBe('space-heating');
});
test("failed heating writes keep pending data, unrelated reports and extensions for retry",async({page})=>{
  await seed(page,heatingReport({...triedHeating(),...{future:{keep:[false,0]}}}));const original=await raw(page);
  await page.evaluate(()=>{const original=Storage.prototype.setItem;(window as unknown as {restoreHeat:()=>void}).restoreHeat=()=>{Storage.prototype.setItem=original;};Storage.prototype.setItem=function(key,value){if(key==='astandsskraning-demo-v1')throw Error('synthetic quota');return original.call(this,key,value);};});
  await page.getByLabel('Athugasemd um hita',{exact:true}).fill('Sýniathugasemd í minni');await expect(page.locator('.storage-warning')).toContainText('Breytingar eru aðeins í minni');expect(await raw(page)).toBe(original);
  await page.evaluate(()=>(window as unknown as {restoreHeat:()=>void}).restoreHeat());await page.getByRole('button',{name:'Reyna vistun aftur',exact:true}).click();const document=JSON.parse((await raw(page))!);expect(document.envelopeExtra).toEqual({keep:[0,false]});expect(document.reports[0].rooms[0].observations['space-heating'].heating.future).toEqual({keep:[false,0]});expect(document.reports[1]).toEqual(JSON.parse(original!).reports[1]);await page.reload();await expect(page.getByLabel('Athugasemd um hita',{exact:true})).toHaveValue('Sýniathugasemd í minni');
});
test("existing item photo associations survive heating edits and client navigation; reload remains session-only",async({page})=>{
  await seed(page,heatingReport(triedHeating()));await row(page).getByRole('button',{name:'Loka atriði',exact:true}).click();await page.locator('[data-item="walls"] .checklist-toggle').click();
  const bytes=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;return canvas.toDataURL('image/png').split(',')[1];});
  await page.getByLabel('Myndir við atriði: velja myndir',{exact:true}).setInputFiles({name:'synthetic-heating-regression.png',mimeType:'image/png',buffer:Buffer.from(bytes,'base64')});await expect(page.locator('.photo-preview[aria-label="Myndir við atriði"] .photo-actions > span')).toContainText('1/8');
  await row(page).locator('.checklist-toggle').click();await page.getByLabel('Athugasemd um hita',{exact:true}).fill('Sýni');await review(page);await expect(page.getByRole('button',{name:/Forskoða Stofa · Veggir, mynd 1 af 1/})).toBeVisible();await page.reload();await expect(page.getByRole('button',{name:/Forskoða Stofa · Veggir/})).toHaveCount(0);
});
test("new report and new rooms use the new template while an existing room stays unchanged",async({page})=>{
  const old={...legacyCoreReport(),id:'heating-case'};await seed(page,old,`${base}/rymi`);await page.getByRole('button',{name:'Fjölga: Stofa',exact:true}).click();const report=await saved(page);expect(report.rooms[0]).toEqual(old.rooms[0]);expect(report.rooms[1].items.filter(i=>i.kind==='space_heating')).toHaveLength(1);expect(report.rooms[1].observations).toEqual({});
  await page.goto('/skyrslur/ny');await page.getByRole('button',{name:'Velja íbúð',exact:true}).click();const created=await saved(page);expect(created.rooms.reduce((sum,r)=>sum+r.items.length,0)).toBe(51);expect(created.rooms.every(r=>r.items.filter(i=>i.kind==='space_heating').length===1&&Object.keys(r.observations).length===0)).toBe(true);
});
test("explicit active visible defects alone populate defect counts and required defect descriptions",async({page})=>{
  await seed(page,heatingReport({...triedHeating(),visibleCondition:'damaged'}));await expect(row(page)).toHaveAttribute('data-state','incomplete');await page.getByLabel('Tegund skemmdar / galla',{exact:true}).fill('Sýnileg skemmd');await page.getByLabel('Staðsetning fráviks',{exact:true}).fill('Sýniofn við glugga');await page.getByLabel('Lýsing á fráviki',{exact:true}).fill('Sýniskemmd á yfirborði');await expect(row(page)).toHaveAttribute('data-state','deviation');await review(page);await expect(page.locator('[data-heating-defect-count]')).toHaveText('1 atriði með skráð frávik');await expect(page.locator('[data-heating-review] [data-heating-defect]')).toBeVisible();await expect(page.locator('[data-heating-review]')).not.toContainText('Virkar ekki');
});
test("heating mobile and accessibility audit plus representative screenshots",async({page,browser},info)=>{
  test.skip(info.project.name!=='desktop','Five-width, enlarged-text and gallery audits run once.');test.setTimeout(180_000);
  const output=process.env.HEATING_REVIEW_DIR??resolve('artifacts/phase-1b3b4/screenshots');await mkdir(output,{recursive:true});await seed(page,heatingReport({...triedHeating('mixed'),equipment:['thermostat','underfloor'],scope:'Hitastillir sást; gólfhiti er uppgefinn og hulinn.',informationSource:'Sýnileigusali'}));
  const audit=async()=>{expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);};
  for(const width of [320,360,390,768,1440]){
    await page.setViewportSize({width,height:1000});await page.goto(`${base}/skraning?rymi=legacy-room&atridi=space-heating`);await expect(row(page).locator('.checklist-toggle')).toHaveAttribute('aria-expanded','true');await audit();
    for(const control of await row(page).locator('label:has(input),button').all()){if(!await control.isVisible())continue;const b=(await control.boundingBox())!;expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44);}
    await page.screenshot({path:resolve(output,`${width}-editor.png`),fullPage:true});await page.goto(`${base}/yfirferd`);await audit();await page.screenshot({path:resolve(output,`${width}-review.png`),fullPage:true});
  }
  for(const width of [320,360,390]){await page.setViewportSize({width,height:900});await page.goto(`${base}/yfirferd`);await page.evaluate(()=>{const values=[...document.querySelectorAll<HTMLElement>('body *')].map(e=>({e,size:parseFloat(getComputedStyle(e).fontSize)}));values.forEach(({e,size})=>e.style.fontSize=`${size*2}px`);});await audit();await page.screenshot({path:resolve(output,`${width}-text-200.png`),fullPage:true});}
  const scenarios:{name:string;heating?:HeatingObservation}[]=[{name:'empty'},{name:'concealed',heating:{visibility:'reported_concealed',scope:'Gólfhiti samkvæmt lýsingu, ekki séður',informationSource:'Sýnileigusali',operation:'not_tried'}},{name:'none-visible',heating:{visibility:'none_visible',operation:'unknown'}},{name:'unknown-after-attempt',heating:{...triedHeating('unknown')}},{name:'retained',heating:{...triedHeating(),visibility:'not_examined',visibleCondition:'damaged',operation:'not_tried'}},{name:'explicit-defect',heating:{...triedHeating(),visibleCondition:'damaged'}}];
  for(const s of scenarios){const context=await browser.newContext({viewport:{width:390,height:844}});const sample=await context.newPage();const report=heatingReport(s.heating);if(s.name==='explicit-defect')Object.assign(report.rooms[0].observations['space-heating'],{damageType:'Sýni',location:'Ofn við glugga',description:'Sýnileg sýniskemmd'});await seed(sample,report,`${base}/yfirferd`);await sample.screenshot({path:resolve(output,`390-${s.name}.png`),fullPage:true});await context.close();}
});
