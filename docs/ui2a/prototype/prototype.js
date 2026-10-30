// Interaction model for independent design review; never writes storage or data.
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const rooms = UI1.options;
let currentRoom = 'demo-living';
let currentItem = null;
let correction = false;
let returnTarget = null;
const params = new URLSearchParams(location.search);
const scenario = params.get('scenario');
$('#rail-slot').innerHTML = UI1.rail;
for (const link of $$('#rail-slot a')) { link.href = '../index.html'; }
$('#rail-slot button')?.addEventListener('click',()=>reveal($('#prototype-info')));
$('#room-choice').innerHTML = rooms.map(r => `<option value="${r.id}">${r.label.replace(/^\d+\. /,'').replace(/ \(.+\)$/,'')}</option>`).join('');
$('#fire-content').innerHTML = ['rental','meters'].includes(scenario) ? UI1.rentalFire : UI1.fire;
$('#meter-content').innerHTML = scenario === 'meters' ? UI1.activeMeters : UI1.meters;
$('#meter-readings').open = false;
$('#inspection-work').className += ' ' + UI1.pageClass;
// Actual UI1 fields are present as a visual reference, with assessment disabled.
for (const node of $$('#fire-content input,#fire-content textarea,#fire-content button,#meter-content input,#meter-content textarea,#meter-content button')) node.disabled = true;
for (const target of ['#fire-safety','#meter-readings']) {
  const copy = document.createElement('p'); copy.className = 'p-disabled-copy';
  copy.textContent = 'Hönnunarfrumgerð: mat og vistun eru óvirk.';
  $(target).querySelector(':scope > summary').after(copy);
}
const originalIncomplete = document.createElement('div'); originalIncomplete.innerHTML = UI1.incomplete;
const original = originalIncomplete.querySelector('details');
original.querySelector(':scope > summary')?.remove();
$('#unfinished-rooms').innerHTML = original.innerHTML;
for (const link of $$('#unfinished-rooms a')) {
  const url = new URL(link.getAttribute('href'), 'http://127.0.0.1:3212');
  link.dataset.room = url.searchParams.get('rymi'); link.dataset.item = url.searchParams.get('atridi');
  link.href = '#room-work';
}
if (['rental','meters'].includes(scenario)) {
  $('.p-property p').textContent = 'Leiguskoðun · upphaf · Íbúð 0201';
  $$('[data-fire-copy]').forEach(n => n.textContent = '3 flokkar ósvaraðir');
  const context = document.createElement('p'); context.className = 'p-disabled-copy';
  context.textContent = 'Leiguskoðun: svör um reykskynjara, slökkvitæki og sýnilegar flóttaleiðir vantar. Enginn flokkur er merktur fullskráður.';
  $('#fire-safety').querySelector(':scope > summary').after(context);
}
if (scenario === 'meters') {
  $$('[data-meter-short]').forEach(n => n.textContent = '2 svör vantar');
  $$('[data-meter-copy]').forEach(n => n.textContent = '2 svör um mælafyrirkomulag vantar');
  const info = document.createElement('p'); info.className = 'p-disabled-copy';
  info.textContent = 'Sýnidæmi: mælaskráning við afhendingu er virk. Mælafyrirkomulag rafmagns og heits vatns er ósvarað. Talningin nær ekki til valfrjáls mælisnúmers eða athugasemdar.';
  $('#meter-readings').querySelector(':scope > summary').after(info);
}
function selectSection(id) {
  $$('.p-sections a').forEach(a => a.dataset.section === id ? a.setAttribute('aria-current','location') : a.removeAttribute('aria-current'));
}
function reveal(element) {
  if (!element) return;
  for (let p = element.parentElement; p; p = p.parentElement) if (p instanceof HTMLDetailsElement) p.open = true;
  if (element instanceof HTMLDetailsElement) element.open = true;
  const target = element instanceof HTMLDetailsElement ? element.querySelector('summary') : element;
  target.focus({preventScroll:true}); target.scrollIntoView({block:'start',behavior:'instant'});
}
function section(id) {
  selectSection(id); reveal($('#'+id));
}
function updateURL() {
  const query = new URLSearchParams();
  if (scenario) query.set('scenario',scenario);
  query.set('rymi',currentRoom);
  if (currentItem) query.set('atridi',currentItem);
  if (correction) { query.set('fra','yfirferd'); query.set('yfirferdRymi','demo-living'); query.set('yfirferdAtridi','walls'); }
  history.replaceState(null,'',location.pathname+'?'+query);
}
function renderRoom(id, item = null, focus = false) {
  currentRoom = id; currentItem = item;
  const index = rooms.findIndex(r => r.id === id);
  const name = rooms[index].label.replace(/^\d+\. /,'').replace(/ \(.+\)$/,'');
  $('#room-current-heading').textContent = `Núverandi rými · ${name}`;
  const stats = rooms[index].label.match(/\((\d+)\/(\d+)\)/);
  $('#room-choice').value = id;
  $('#room-count').textContent = `RÝMI ${index+1} AF ${rooms.length}`;
  $('#room-choice').setAttribute('aria-label',`Velja rými · Rými ${index+1} af ${rooms.length}`);
  $('#footer-count').textContent = `${index+1} / ${rooms.length}`;
  const deviations = id === 'demo-living' ? 1 : id === 'demo-kitchen' ? 2 : 0;
  $('#room-status').textContent = `${stats[1]} af ${stats[2]} skráð${deviations ? ` · ${deviations} frávik` : ''}`;
  const source = id === 'demo-living' && item === 'walls' ? UI1.defect : UI1.rooms[id];
  $('#room-content').innerHTML = source;
  $('#room-content .room-heading')?.remove();
  if (item && !(id === 'demo-living' && item === 'walls')) {
    const row = $(`#room-content [data-item="${CSS.escape(item)}"]`);
    if (row) {
      row.classList.add('checklist-item-open');
      row.querySelector('.checklist-toggle')?.setAttribute('aria-expanded','true');
      const preview = document.createElement('div'); preview.className='observation-body';
      const message = document.createElement('p'); message.className='p-disabled-copy';
      message.textContent='Leiðsögn að völdu atriði. Óbreyttur UI1-ritill verður notaður við innleiðingu. Mat er óvirkt í þessari hönnunarfrumgerð.';
      preview.append(message); row.append(preview);
    }
  }
  const checklistHeading = $('#room-content .checklist-heading');
  const remainingCopy = (checklistHeading?.querySelector('span')?.textContent || '').split(' · ').filter(c=>!c.startsWith('0 ')).join(' · ');
  if (remainingCopy) $('#room-status').textContent += ` · ${remainingCopy}`;
  if (checklistHeading) { checklistHeading.classList.add('sr-only'); checklistHeading.querySelector('span')?.remove(); }
  for (const node of $$('#room-content input,#room-content select,#room-content textarea')) { if (node.tagName === 'TEXTAREA') node.readOnly = true; else node.disabled = true; }
  for (const button of $$('#room-content button')) {
    if (button.matches('.checklist-toggle')) continue;
    if (button.textContent === 'Loka atriði') button.dataset.closeItem = 'true';
    else { button.disabled = true; button.title = 'Mat er óvirkt í hönnunarfrumgerð'; }
  }
  const editor = $('#room-content .observation-body:not([hidden])');
  if (editor) { const info=document.createElement('p'); info.className='p-disabled-copy'; info.textContent='UI1-frávik birt til viðmiðunar. Mat og myndaaðgerðir eru óvirk.'; editor.prepend(info); }
  $$('#room-content .checklist-toggle').forEach(button => {
    button.addEventListener('click', () => {
      const targetItem = button.closest('[data-item]')?.dataset.item;
      renderRoom(id,currentItem === targetItem ? null : targetItem,true);
    });
  });
  $('#room-content [data-close-item]')?.addEventListener('click',()=>renderRoom(id,null,true));
  $$('[data-prev]').forEach(b => { b.disabled = index===0 && !!b.closest('.p-room-arrows'); if (b.closest('.p-room-footer')) b.textContent=index===0?'Breyta rýmum':'← Fyrra rými'; });
  $$('[data-next]').forEach(b => { b.disabled = index===rooms.length-1 && !!b.closest('.p-room-arrows'); if (b.closest('.p-room-footer')) b.textContent=index===rooms.length-1?'Yfirferð →':'Næsta rými →'; });
  $$('[data-room-name]').forEach(n => n.textContent = id === 'demo-living' ? 'Stofu' : name);
  $('#desktop-rooms').innerHTML = rooms.map(r => `<a href="#room-work" data-room="${r.id}" ${r.id===id?'aria-current="location"':''}><strong>${r.label.replace(/^\d+\. /,'').replace(/ \(.+\)$/,'')}</strong><span>${r.label.match(/\((.+)\)/)[1]} skráð</span></a>`).join('');
  updateURL();
  if (focus) { selectSection('room-work'); const target = item ? $(`#room-content [data-item="${item}"] .checklist-toggle`) : $('#room-work'); reveal(target); }
}
function openWorkflow(title) {
  $('#workflow-title').textContent=title; $('#workflow-dialog').showModal();
}
$('#workflow-dialog').setAttribute('aria-labelledby','workflow-title');
$('#close-dialog').addEventListener('click',()=>$('#workflow-dialog').close());
$('#room-choice').addEventListener('change',e=>renderRoom(e.target.value,null,true));
$$('[data-prev]').forEach(b=>b.addEventListener('click',()=>{ const index=rooms.findIndex(r=>r.id===currentRoom); if (index===0) openWorkflow('Rými'); else renderRoom(rooms[index-1].id,null,true); }));
$$('[data-next]').forEach(b=>b.addEventListener('click',()=>{ const index=rooms.findIndex(r=>r.id===currentRoom); if (index===rooms.length-1) { $('#review').hidden=false; reveal($('#review')); } else renderRoom(rooms[index+1].id,null,true); }));
document.addEventListener('click',e=>{
  const a=e.target.closest('a'); if (!a) return;
  if (a.dataset.workflow) { e.preventDefault(); openWorkflow(a.dataset.workflow); }
  else if (a.dataset.correct) {
    e.preventDefault(); returnTarget=a; correction=true; $('#review').hidden=true; $('#correction-context').hidden=false; $$('.p-review').forEach(n=>n.innerHTML='Aftur í yfirferð →');
    if (a.dataset.correct==='walls') renderRoom('demo-living','walls',true);
    else { updateURL(); section(a.dataset.correct==='fire'?'fire-safety':'meter-readings'); }
  } else if (a.hasAttribute('data-review')) {
    e.preventDefault(); $('#review').hidden=false; selectSection('room-work');
    if (returnTarget) { reveal(returnTarget); returnTarget=null; }
    else reveal($('#review'));
    correction=false; $('#correction-context').hidden=true; $$('.p-review').forEach(n=>n.innerHTML='Yfirferð →'); updateURL();
  } else if (a.dataset.room) { e.preventDefault(); $('#unfinished').open=false; renderRoom(a.dataset.room,a.dataset.item||null,true); }
  else if (a.hasAttribute('data-return-room')) { e.preventDefault(); selectSection('room-work'); reveal(currentItem ? $(`#room-content [data-item="${currentItem}"] .checklist-toggle`) : $('#room-work')); }
  else if (a.dataset.section) { e.preventDefault(); $('#unfinished').open=false; section(a.dataset.section); }
});
renderRoom(rooms.some(r=>r.id===params.get('rymi')) ? params.get('rymi') : 'demo-living',params.get('atridi'));
if (scenario==='correction') { correction=true; $('#correction-context').hidden=false; $$('.p-review').forEach(n=>n.innerHTML='Aftur í yfirferð →'); renderRoom('demo-living','walls'); }
// Keep the section indicator in sync while users scroll between visible sections.
addEventListener('scroll',()=>{
  const points=['room-work','fire-safety','meter-readings'].map(id=>({id,top:$('#'+id).getBoundingClientRect().top}));
  const passed=points.filter(p=>p.top<180); selectSection(passed.at(-1)?.id || 'room-work');
},{passive:true});
