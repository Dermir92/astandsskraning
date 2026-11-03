import { expect, test, type Page, type Locator, type BrowserContext } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fixture from './ux3-progress-fixture.json';
import { isReportList } from '../src/lib/model';
import { navigationTargetId, photoTargetId, inspectionHref, resolvePhotoIntent } from '../src/lib/inspection-navigation';
import { DEMO_LOCK_NAME, DEMO_RECOVERY_KEY } from '../src/lib/demo-storage';

const key='astandsskraning-demo-v1',base='/skyrslur/u2a-synthetic';
const chooserEvents = new WeakMap<BrowserContext, string[]>();
test.beforeEach(({context})=>{
  const events:string[]=[];chooserEvents.set(context,events);
  const watch=(page:Page)=>page.on('filechooser',()=>events.push(page.url()));
  context.on('page',watch);context.pages().forEach(watch);
});
test.afterEach(async({context},info)=>{
  const events=chooserEvents.get(context) ?? [];
  await info.attach('file-chooser-events',{body:JSON.stringify(events),contentType:'application/json'});expect(events).toEqual([]);
});
const report=()=>{const reports:unknown=structuredClone(fixture.reports);if(!isReportList(reports))throw Error('Invalid synthetic fixture');return reports[0];};
const target=(room='u2a-entry',item:string|null=null)=>`${base}/skraning?rymi=${room}${item?`&atridi=${item}`:''}&fra=yfirferd&yfirferdRymi=${room}${item?`&yfirferdAtridi=${item}`:''}&mynd=${item?'atridi':'yfirlit'}`;
const picker=(page:Page,item=false)=>page.getByLabel(`${item?'Myndir við atriði':'Yfirlitsmyndir rýmis'}: velja myndir`,{exact:true});
const task=(page:Page,room='u2a-entry',item:string|null=null)=>page.locator(`.review-attention a[href="${target(room,item)}"]`);
async function seed(page:Page,r=report(),unsupported=false) {
  expect(isReportList([r])).toBe(true);const raw=JSON.stringify({...fixture,reports:[r]});
  await page.addInitScript(({raw,key,unsupported})=>{if(!localStorage.getItem(key)){localStorage.setItem(key,raw);localStorage.setItem('u2b-photo-sentinel','same');}if(unsupported)Object.defineProperty(navigator,'locks',{configurable:true,get:()=>undefined});},{raw,key,unsupported});
  return raw;
}
async function openReview(page:Page) {await page.goto(`${base}/yfirferd`);await expect(page.locator('.review-summary')).toBeVisible();}
async function unchanged(page:Page,raw:string) {expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);expect(await page.evaluate(()=>localStorage.getItem('u2b-photo-sentinel'))).toBe('same');}
async function focusVisible(control:Locator) {
  await expect(control).toBeFocused();await expect(control).toBeInViewport({ratio:1});
  expect(await control.evaluate(e=>{const b=e.getBoundingClientRect(),bar=document.querySelector('[data-inspection-sections]');return !bar||getComputedStyle(bar).position!=='sticky'||b.top>=bar.getBoundingClientRect().bottom;})).toBe(true);
}
async function image(page:Page,name='u2b.png') {return {name,mimeType:'image/png',buffer:Buffer.from(await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=16;c.getContext('2d')!.fillRect(0,0,16,16);return c.toDataURL('image/png').split(',')[1];}),'base64')};}
async function photoIntent(page:Page,url:string) {await page.evaluate(url=>history.replaceState(null,'',url),url);}

test('F05 review overview link reveals the closed photo disclosure and focuses without a chooser',async({page},info)=>{
  const raw=await seed(page);const choosers:string[]=[];page.on('filechooser',()=>choosers.push(page.url()));await openReview(page);
  await page.screenshot({path:info.outputPath('review-photo-tasks.png'),fullPage:true});
  await expect(task(page)).toHaveCount(1);await task(page).focus();await page.keyboard.press('Enter');
  await focusVisible(picker(page));expect(choosers).toEqual([]);await unchanged(page,raw);
  await page.screenshot({path:info.outputPath('overview-photo-focus.png')});
});
test('F05 ordinary partial and heating defects use photo intent before missing-answer focus',async({page})=>{
  const raw=await seed(page);const choosers:string[]=[];page.on('filechooser',()=>choosers.push(page.url()));
  for(const [room,item] of [['u2a-entry','partial-defect'],['u2a-entry','defect'],['u2a-heating','heat-defect']]) {
    await openReview(page);await task(page,room,item).click();await focusVisible(picker(page,true));
    await expect(page.locator('.room-heading h2')).toHaveText(room==='u2a-heating'?'Hitapróf':'Forstofa');
    await expect(page.locator(`.checklist-item[data-item="${item}"] .checklist-toggle`)).toHaveAttribute('aria-expanded','true');await unchanged(page,raw);
  }
  expect(choosers).toEqual([]);
});
test('F05 adding a temporary preview returns to a stable source with exact Back/Forward and reload fallback',async({page})=>{
  const raw=await seed(page);await openReview(page);await task(page,'u2a-entry','defect').click();await focusVisible(picker(page,true));
  const inspection=page.url(),length=await page.evaluate(()=>history.length);await picker(page,true).setInputFiles(await image(page));
  await expect(page.getByRole('img',{name:'Staðbundin forskoðun: u2b.png'})).toBeVisible();expect(await page.evaluate(()=>history.length)).toBe(length);
  await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();
  const source=page.locator(`[id="${navigationTargetId('review','u2a-entry','defect')}"]`);await expect(source).toBeFocused();await expect(task(page,'u2a-entry','defect')).toHaveCount(0);
  await page.goForward();await expect(page).toHaveURL(inspection);await focusVisible(picker(page,true));
  await page.goBack();await expect(source).toBeFocused();await page.goForward();await page.reload();await expect(picker(page,true)).toBeEnabled();
  await expect(page.getByRole('img',{name:'Staðbundin forskoðun: u2b.png'})).toHaveCount(0);
  await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();await expect(source).toBeFocused();await expect(task(page,'u2a-entry','defect')).toHaveCount(1);await unchanged(page,raw);
});
test('F05 disabled reader and unsupported inputs use a visible labeled fallback and survive writer handoff',async({page,context})=>{
  const raw=await seed(page);await openReview(page);const reader=await context.newPage();await openReview(reader);await task(reader,'u2a-entry','defect').click();
  await expect(picker(reader,true)).toBeDisabled();const fallback=reader.locator('.photo-preview summary:not([hidden])').filter({hasText:'Myndaaðgerðir'});await focusVisible(fallback);
  await page.close();await reader.getByRole('button',{name:'Reyna breytingarétt aftur',exact:true}).click();await expect(picker(reader,true)).toBeEnabled();
  // Clicking Retry intentionally moves focus; a permission change must not replay photo intent.
  await expect(picker(reader,true)).not.toBeFocused();await unchanged(reader,raw);
  await reader.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();await task(reader,'u2a-entry','defect').click();await focusVisible(picker(reader,true));
});
test('F05 unsupported coordination retains safe focus and never acquires editing rights',async({page})=>{
  const raw=await seed(page,report(),true);await page.goto(target());await expect(picker(page)).toBeDisabled();await focusVisible(page.locator('.photo-preview .photo-title'));await unchanged(page,raw);
});
test('F05 eight-photo and pending-upload fallbacks reveal controls without selecting files or stealing later focus',async({page})=>{
  const raw=await seed(page);await page.goto(`${base}/skraning?rymi=u2a-entry&atridi=defect`);await expect(picker(page,true)).toBeEnabled();
  const file=await image(page);await picker(page,true).setInputFiles(Array.from({length:8},(_,n)=>({...file,name:`limit-${n}.png`})));
  await expect(page.locator('.photo-preview[aria-label="Myndir við atriði"] .photo-actions > span')).toContainText('8/8');
  await expect(picker(page,true)).toBeDisabled();const summary=page.locator('.photo-preview summary:not([hidden])').filter({hasText:'Myndaaðgerðir'});
  await summary.evaluate(e=>(e.parentElement as HTMLDetailsElement).open=false);await photoIntent(page,target('u2a-entry','defect'));await focusVisible(summary);
  await page.goto(`${base}/skraning?rymi=u2a-entry&atridi=partial-defect`);await expect(picker(page,true)).toBeEnabled();
  await page.evaluate(()=>{const original=createImageBitmap;let release:()=>void=()=>{};(window as unknown as {releaseDecode:()=>void}).releaseDecode=()=>release();window.createImageBitmap=((...args:Parameters<typeof createImageBitmap>)=>new Promise(resolve=>{release=()=>{void original(...args).then(resolve);};})) as typeof createImageBitmap;});
  await picker(page,true).setInputFiles(file);await expect(picker(page,true)).toBeDisabled();await photoIntent(page,target('u2a-entry','partial-defect'));
  await focusVisible(page.locator('.checklist-item[data-item="partial-defect"] .photo-title'));
  const note=page.getByRole('textbox',{name:'Athugasemd',exact:false}).last();await note.focus();
  await page.evaluate(()=>(window as unknown as {releaseDecode:()=>void}).releaseDecode());await expect(picker(page,true)).toBeEnabled();await expect(note).toBeFocused();await unchanged(page,raw);
});
test('F05 validation rejects invalid, duplicate, deleted and stale photo targets without photo focus or data changes',async({page})=>{
  const raw=await seed(page);
  for(const query of ['rymi=u2a-entry&mynd=bad','rymi=u2a-entry&mynd=yfirlit&mynd=atridi','rymi=deleted&mynd=yfirlit','rymi=u2a-entry&atridi=deleted&mynd=atridi','rymi=u2a-entry&atridi=defect&mynd=yfirlit','rymi=u2a-entry&rymi=u2a-living&mynd=yfirlit']) {
    await page.goto(`${base}/skraning?${query}`);await expect(page.locator('.room-heading h2')).toBeVisible();await expect(page).not.toHaveURL(/mynd=/);
    expect(await page.evaluate(()=>document.activeElement?.getAttribute('type'))).not.toBe('file');await unchanged(page,raw);
  }
});
test('F05 repeat visits, duplicate long names, room changes and five-width enlarged focus/AX stay usable',async({page},info)=>{
  const r=report();r.rooms[0].name=r.rooms[1].name='Mjög langt sameiginlegt heiti rýmis fyrir myndaleiðréttingu';const raw=await seed(page,r);
  for(const width of [320,360,390,768,1440]) {
    await page.setViewportSize({width,height:1000});await openReview(page);await task(page).click();await focusVisible(picker(page));
    await page.evaluate(()=>{const sizes=[...document.querySelectorAll<HTMLElement>('body *')].map(e=>[e,parseFloat(getComputedStyle(e).fontSize)] as const);for(const [e,s] of sizes)e.style.fontSize=`${s*2}px`;});
    await page.keyboard.press('Tab');await picker(page).focus();await focusVisible(picker(page));expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
    await page.screenshot({path:info.outputPath(`photo-text200-${width}.png`)});
    await info.attach(`photo-ax-${width}`,{body:await page.locator('.photo-preview[aria-label="Yfirlitsmyndir rýmis"]').ariaSnapshot(),contentType:'text/plain'});
    const audit=await new AxeBuilder({page}).include('.photo-preview').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();expect(audit.violations).toEqual([]);await unchanged(page,raw);
  }
  await page.goto(target('u2a-entry','defect'));await focusVisible(picker(page,true));
  await page.getByRole('link',{name:'Næsta rými',exact:true}).first().click();await expect(page).not.toHaveURL(/mynd=/);
  await page.getByRole('link',{name:'Aftur í yfirferð',exact:true}).first().click();await expect(page.locator(`[id="${navigationTargetId('review','u2a-entry','defect')}"]`)).toBeFocused();await unchanged(page,raw);
});
test('F05 owner loss before a correction uses fallback without bypassing the collection lock',async({page,context})=>{
  const raw=await seed(page);await openReview(page);
  const other=await context.newPage();await other.goto('/');
  await expect(other.getByRole('button',{name:'Reyna breytingarétt aftur',exact:true})).toBeVisible();
  await page.evaluate(()=>dispatchEvent(new Event('pagehide')));
  await other.getByRole('button',{name:'Reyna breytingarétt aftur',exact:true}).click();
  await expect.poll(()=>other.evaluate(async name=>(await navigator.locks.query()).held?.some(l=>l.name===name),DEMO_LOCK_NAME)).toBe(true);
  await task(page).click();await expect(picker(page)).toBeDisabled();await focusVisible(page.locator('.photo-preview .photo-title'));await unchanged(page,raw);
});
test('F05 photo-intent contracts preserve encoded identities and reject ambiguous room/item IDs',()=>{
  const r=report();r.rooms[0].id='rými & / ?';r.rooms[0].items[0].id='atriði / & ?';
  const position={roomId:r.rooms[0].id,itemId:r.rooms[0].items[0].id};
  const href=inspectionHref(r.id,position,position,'atridi');const params=new URLSearchParams(href.split('?')[1]);
  expect(params.get('rymi')).toBe(position.roomId);expect(params.get('atridi')).toBe(position.itemId);expect(resolvePhotoIntent(r,params)).toBe('atridi');
  expect(photoTargetId(r.id,position.roomId,position.itemId)).not.toBe(photoTargetId(`${r.id}-other`,position.roomId,position.itemId));
  r.rooms[0].items.push({...r.rooms[0].items[0]});expect(resolvePhotoIntent(r,params)).toBeNull();
  r.rooms.push({...r.rooms[0]});params.delete('atridi');params.set('mynd','yfirlit');expect(resolvePhotoIntent(r,params)).toBeNull();
});
test('F05 read-protected canonical data cannot enable the targeted preview control',async({page})=>{
  const raw='{"version":9,"reports":[]}';await page.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key,raw});
  await page.goto('/skyrslur/syni-ibud/skraning?rymi=demo-living&atridi=walls&mynd=atridi');await expect(picker(page,true)).toBeDisabled();
  await focusVisible(page.locator('.photo-preview summary:not([hidden])').filter({hasText:'Myndaaðgerðir'}));expect(await page.evaluate(key=>localStorage.getItem(key),key)).toBe(raw);
});
test('F05 unresolved recovery keeps correction read-only and preserves canonical and checkpoint bytes',async({page})=>{
  const r=report(),raw=await seed(page,r);r.details.notes='Tilbúinn óafgreiddur endurheimtartexti';
  const checkpoint=JSON.stringify({version:1,purpose:'demo-recovery-only-no-automatic-import',baseRaw:raw,candidateRaw:JSON.stringify({...fixture,reports:[r]}),generation:1});
  await page.addInitScript(({key,checkpoint})=>sessionStorage.setItem(key,checkpoint),{key:DEMO_RECOVERY_KEY,checkpoint});
  await page.goto(target('u2a-entry','defect'));await expect(picker(page,true)).toBeDisabled();
  await focusVisible(page.locator('.photo-preview summary:not([hidden])').filter({hasText:'Myndaaðgerðir'}));await unchanged(page,raw);
  expect(await page.evaluate(key=>sessionStorage.getItem(key),DEMO_RECOVERY_KEY)).toBe(checkpoint);
});
