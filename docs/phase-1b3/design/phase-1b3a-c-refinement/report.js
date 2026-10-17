/* Isolated measured layout experiment. No production report or PDF API. */
(async()=>{
const params=new URLSearchParams(location.search);
const scenario=Object.hasOwn(window.refinementFixtures,params.get('fixture'))?params.get('fixture'):'large';
const f=structuredClone(window.refinementFixtures[scenario]);
document.querySelector('#fixture').value=scenario;
document.querySelector('#fixture').addEventListener('change',e=>{location.search=`?fixture=${e.target.value}`;});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isDefect=i=>i.condition!=='na'&&(['defect','damaged'].includes(i.condition)||i.functionality==='broken'||i.cleanliness==='dirty');
const isUntested=i=>i.condition!=='na'&&(i.condition==='uninspected'||i.functionality==='untested'||i.cleanliness==='uninspected');
const activePhotos=[...new Set(f.rooms.flatMap(r=>[...r.overview,...r.items.flatMap(i=>i.photos)]))];
// Reader references follow first appearance. Source media IDs remain unchanged.
const mediaReferences=Object.fromEntries(activePhotos.map((id,n)=>[id,`M${String(n+1).padStart(3,'0')}`]));
const mediaRef=id=>mediaReferences[id];
const items=f.rooms.flatMap(r=>r.items);
const stats={rooms:f.rooms.length,total:items.length,defects:items.filter(isDefect).length,wear:items.filter(i=>i.condition==='wear').length,unanswered:items.filter(i=>!i.condition).length,unexamined:items.filter(isUntested).length,missingEvidence:items.filter(i=>isDefect(i)&&!i.photos.length).length,photos:activePhotos.length};
// Export derivatives retain all source pixels; original synthetic evidence is immutable.
const src=p=>p.asset?`assets/print/${p.asset.split('/').pop().replace(/\.png$/i,'.jpg')}`:null;
await document.fonts.ready;
// Decode the assets before measurement; a missing asset is represented honestly.
await Promise.all(activePhotos.map(async id=>{const p=f.photos[id];try{if(!p.asset)throw Error();const im=new Image();im.src=src(p);await im.decode();p.available=true;}catch{p.available=false;}}));
const labels={good:'Í lagi',wear:'Eðlileg notkunarmerki',defect:'Slit / galli',damaged:'Skemmt',uninspected:'Ekki skoðað',na:'Á ekki við',works:'Virkar',broken:'Virkar ekki',untested:'Ekki prófað',clean:'Hreint',dirty:'Þarfnast þrifa'};
const badge=v=>`<span class="status ${!v||['uninspected','untested'].includes(v)?'unknown':['defect','damaged','broken','dirty'].includes(v)?'warn':''}">${labels[v]||'Óskráð'}</span>`;
const a=id=>`<a href="#item-${escape(id)}">${escape(id)}</a>`;
const heading=(num,kicker,title)=>`<div class="section-heading"><span>${escape(num)}</span><div><p class="eyebrow">${escape(kicker)}</p><h2>${title}</h2></div></div>`;
// Plan at the A4 geometry at every viewport, then apply the mobile reading layout.
const root=document.querySelector('#report');root.classList.add('planning');
const sheets=[];const roomPages={};let current,body,currentRoom;
const columnHead=()=>'<div class="column-head" aria-hidden="true"><span>Atriði</span><span>Ástand</span><span>Virkni</span><span>Þrif</span></div>';
const roomContext=(room,continued)=>`<div class="context"${continued?'':` id="room-${escape(room.id)}"`}>${heading(room.id,`${room.items.length} atriði · Rýmaskráning`,escape(room.name)+(continued?'<span class="continuation">Framhald</span>':''))}${continued?`<p class="room-scope">Framhald skráningar · Umfang á upphafssíðu rýmis, <a href="#room-${escape(room.id)}">bls. ${roomPages[room.id]}</a>.</p>${columnHead()}`:''}</div>`;
function makePage(kind,room=null,continued=false){
 const sheet=document.createElement('article');sheet.className=`sheet ${kind}`;sheet.dataset.kind=kind;if(room){sheet.dataset.room=room.id;sheet.dataset.rooms=room.id;}
 sheet.innerHTML=`<header class="page-head"><strong>Ástandsskoðun</strong><span>${escape(f.id)}<br>Drög · Sýnigögn</span></header><div class="page-body"></div><footer class="page-foot"><span>${escape(f.address)} · Íbúð ${escape(f.unit)}<br>Skoðunardagur óskráður</span><span class="page-number"></span></footer>`;
 root.append(sheet);sheets.push(sheet);current=sheet;body=sheet.querySelector('.page-body');currentRoom=room;
 if(room){
  if(!roomPages[room.id])roomPages[room.id]=sheets.length;
  body.innerHTML=roomContext(room,continued);
 }
 return sheet;
}
const node=html=>{const t=document.createElement('template');t.innerHTML=html;return t.content.firstElementChild;};
const fits=()=>body.scrollHeight<=body.clientHeight+1;
const attach=el=>{body.append(el);if(fits())return true;el.remove();return false;};
function appendBlock(el,kind='support'){
 if(attach(el))return;
 makePage(currentRoom?'room':kind,currentRoom,!!currentRoom);
 if(!attach(el))throw new Error('Óskiptanlegur kafli fer út fyrir A4-síðu.');
}
function photo(id){const p=f.photos[id];const caption=p.caption.split(' · ').slice(1).join(' · ')||p.caption;return `<figure class="photo" id="photo-${escape(id)}" data-photo="${escape(id)}" data-reader-reference="${mediaRef(id)}">${p.available?`<img src="${escape(src(p))}" width="1536" height="1024" alt="${escape(p.alt)}">`:'<div class="photo-unavailable">Myndaskrá ekki tiltæk.<br>Ekki hægt að staðfesta myndinnihald.</div>'}<figcaption><strong>${mediaRef(id)} · ${escape(caption)}</strong><span>${escape(p.roomId)}${p.itemId?' / '+escape(p.itemId):' · Yfirlitsmynd'} · Tölvugerð sýnimynd</span><span class="provenance">Ekki frá raunverulegri skoðun</span></figcaption></figure>`;}
const dimensions=i=>`<dl class="dimensions"><div><dt>Ástand</dt><dd>${badge(i.condition)}</dd></div>${['functionality','cleanliness'].map((key,j)=>`<div><dt>${j?'Þrif':'Virkni'}</dt><dd>${i.condition==='na'?badge('na'):i[key]?badge(i[key]):'<span class="status neutral">Ekki metin í liðnum</span>'}</dd></div>`).join('')}</dl>`;
function observation(i,text,photos=[],continuation=false,photoOnly=false){return node(`<section class="observation ${photos.length?'with-evidence':''}" data-observation="${escape(i.id)}"${continuation?'':` id="item-${escape(i.id)}"`}><div class="assessment-line"><h3><span class="ref">${escape(i.id)}</span>${escape(i.name)}${continuation?' · Framhald':''}</h3>${dimensions(i)}</div><div class="observation-body"><div>${i.damageType?`<p class="location">${escape(i.damageType)} · ${escape(i.location||'Staðsetning óskráð')}</p>`:''}${text?`<p class="${photoOnly?'evidence-context':'description'}"${photoOnly?'':` data-source-text="${escape(i.id)}"`}>${escape(text)}</p>`:''}${!continuation&&isDefect(i)&&!i.photos.length?'<p class="missing-evidence">Stoðmynd vantar. Skráð lýsing stendur án myndgagna.</p>':''}</div>${photos.length?`<div class="evidence-grid ${photos.length===1?'single':''}">${photos.map(photo).join('')}</div>`:''}</div></section>`);}
function addObservation(i){
 const description=[i.description,i.note].filter(Boolean).join('\n\n');
 const itemPhotos=i.photos.filter(id=>!currentRoom.overview.includes(id));
 const all=observation(i,description,itemPhotos);
 if(attach(all))return;
 // Keep an ordinary observation intact on the next page when it fits there.
 const previous=current;
 makePage('room',currentRoom,true);
 if(attach(all))return;
 // An oversized description can use the preceding page's remaining space.
 // The empty trial page has no destinations or content to retain.
 current.remove();sheets.pop();current=previous;body=current.querySelector('.page-body');
 // Oversize prose flows across measured fragments; no font reduction or truncation.
 let words=description.match(/\S+\s*/g)||[],first=true;
 while(words.length){
  let low=0,high=words.length;
  while(low<high){const n=Math.ceil((low+high)/2);const trial=observation(i,words.slice(0,n).join(''),[],!first);if(attach(trial)){trial.remove();low=n;}else high=n-1;}
  if(low<Math.min(24,words.length)){makePage('room',currentRoom,true);continue;}
  // Prefer a nearby sentence/paragraph boundary, preserving the original text.
  let cut=low;
  if(low<words.length){for(let n=low;n>=Math.floor(low*.7);n--){if(/[.!?]\s|\n\n/.test(words[n-1]||'')){cut=n;break;}}}
  body.append(observation(i,words.slice(0,cut).join(''),[],!first));words=words.slice(cut);first=false;
  if(words.length)makePage('room',currentRoom,true);
 }
 // Every continuation image retains the item heading, assessments and location/context.
 for(let j=0;j<itemPhotos.length;j+=2){const context=`Myndgögn fyrir atriði ${i.id}. ${i.location||description.split(/[.!?]/)[0]}.`;appendBlock(observation(i,context,itemPhotos.slice(j,j+2),true,true),'room');}
}
// 1. Executive overview remains one explicitly measured first page.
makePage('cover');
const lead=items.filter(isDefect);
const cover=node(`<section class="cover-content"><div class="mast"><div><p class="eyebrow">Sjálfstæð skoðun · Íbúðarhúsnæði</p><h1>Ástandsskýrsla</h1><h2>${escape(f.address)}</h2><p class="unit">Íbúð ${escape(f.unit)} · ${escape(f.postalCode)} ${escape(f.municipality)}</p></div><div class="identity"><strong>${escape(f.id)}</strong><span class="stamp">DRÖG · TILBÚIÐ DÆMI</span><span>${stats.rooms} rými · ${stats.total} atriði</span></div></div><p class="eyebrow">01 · Yfirlit fyrir lesanda</p><h2 class="overview-title">${stats.defects?`${stats.defects} atriði með fráviki`:'Engin frávik skráð'} · skráning ófullgerð</h2><p class="cover-copy">${stats.wear} atriði eru metin með eðlilegum notkunarmerkjum. Ósvöruð og ókönnuð atriði takmarka það sem hægt er að álykta um ástand eignarinnar.</p><div class="metrics" role="group" aria-label="Samantekt skráningar"><div><strong>${stats.total}</strong><span>skoðunaratriði</span></div><div><strong>${stats.defects}</strong><span>atriði með fráviki</span></div><div><strong>${stats.unanswered}</strong><span>ástandsmat vantar</span></div><div><strong>${stats.unexamined}</strong><span>atriði ekki könnuð að fullu</span></div></div><p class="metric-note">Hvert atriði er talið einu sinni innan flokks. Flokkar geta skarast. Tölurnar eru ekki gæðaeinkunn.</p><dl class="metadata"><div><dt>Skoðunardagur</dt><dd>Óskráður</dd></div><div><dt>Skráningaraðili</dt><dd>Óskráður · hlutverk: fulltrúi leigusala</dd></div><div><dt>Áætluð afhending · sýnigildi</dt><dd>1. nóvember 2026 · ekki staðfest</dd></div><div><dt>Myndgögn</dt><dd>${stats.photos} tengdar sýnimyndir</dd></div></dl><h3 class="eyebrow">${lead.length?'Öll skráð frávik':'Skráð ástand'}</h3><ul class="lead-findings">${lead.length?lead.map(i=>`<li>${a(i.id)}<span>${escape(f.rooms.find(r=>r.items.includes(i)).name)} · ${escape(i.name)}</span></li>`).join(''):'<li>Engin frávik skráð í svöruðum atriðum.</li>'}</ul>${stats.defects>lead.length?`<p class="small">Öll ${stats.defects} frávikin eru í rýmaskráningu. Lesleið og blaðsíðutal eru á næstu síðu.</p>`:''}<div class="notice"><strong>Takmarkanir og gögn sem vantar</strong><p>${stats.missingEvidence} frávik án stoðmyndar. Skoðunardagur og skráningaraðili eru óskráð. Viðvera og yfirferð aðila hafa ekki verið skráð.</p><p>${escape(f.scope)}</p></div><p class="cover-closing">Sýnigögn og tölvugerðar myndir. Engin undirritun, staðfestur frágangur eða niðurstaða um bótaábyrgð.</p></section>`);
if(f.rooms.length<=3)cover.insertAdjacentHTML('beforeend',`<p class="small cover-room-links">Rými: ${f.rooms.map(r=>`<a href="#room-${escape(r.id)}">${escape(r.name)}</a> (<span data-room-page="${escape(r.id)}">bls. 00</span>)`).join(' · ')}.</p>`);
if(!attach(cover))throw new Error('Yfirlit rúmast ekki á fyrstu A4-síðu.');
// 2. Reserve a reading guide; page destinations are resolved after layout.
const indexPage=f.rooms.length>3?makePage('guide'):null;const indexBody=indexPage?body:null;
// 3. Full room records, without duplicating a separate narrative and answer list.
for(const r of f.rooms){
 const overview=node(`<section class="room-overview"><div><h3>Umfang rýmis</h3><p>${r.items.filter(isDefect).length} atriði með fráviki. ${r.items.filter(i=>!i.condition).length} ástandssvör vantar.</p><p class="small">${escape(r.scope)}</p></div><div class="evidence-grid">${r.overview.map(photo).join('')||'<p class="missing-evidence">Yfirlitsmynd vantar.</p>'}</div></section>`);
 let shared=false;
 if(current.dataset.kind==='room'){
  const context=node(roomContext(r,false)),columns=node(columnHead());const first=r.items[0];
  const preview=observation(first,[first.description,first.note].filter(Boolean).join('\n\n'),first.photos.filter(id=>!r.overview.includes(id)));
  body.append(context,overview,columns,preview);
  if(fits()){preview.remove();currentRoom=r;roomPages[r.id]=sheets.length;current.dataset.rooms+=' '+r.id;shared=true;}
  else{context.remove();overview.remove();columns.remove();preview.remove();}
 }
 if(!shared){makePage('room',r,false);appendBlock(overview,'room');body.append(node(columnHead()));}
 for(const i of r.items)addObservation(i);
}
// Balance the final two dedicated pages of a room after room sharing is settled.
// Move only complete ordinary observations, preserving order and image context.
// Never leave an overview without its first record or move long-text fragments.
const usedHeight=s=>{const b=s.querySelector('.page-body');return b.lastElementChild.getBoundingClientRect().bottom-b.getBoundingClientRect().top;};
for(const r of f.rooms){
 const pages=sheets.filter(s=>s.dataset.rooms===r.id);
 if(pages.length<2)continue;
 const last=pages.at(-1),previous=pages.at(-2);
 if(sheets.indexOf(last)!==sheets.indexOf(previous)+1)continue;
 const pb=previous.querySelector('.page-body'),lb=last.querySelector('.page-body');
 while(true){
  const candidates=[...pb.querySelectorAll(':scope > .observation')];
  const move=candidates.at(-1),before=lb.querySelector(':scope > .observation');
  if(candidates.length<2||!move||!before||move.dataset.observation===r.items[0].id)break;
  if(root.querySelectorAll(`[data-observation="${move.dataset.observation}"]`).length!==1)break;
  const oldDifference=Math.abs(usedHeight(previous)-usedHeight(last));
  lb.insertBefore(move,before);
  const better=lb.scrollHeight<=lb.clientHeight+1&&Math.abs(usedHeight(previous)-usedHeight(last))<oldDifference-1;
  if(!better){pb.append(move);break;}
 }
}
// 4. Explicit scope, unknown participation and optional handover data.
makePage('support');
body.innerHTML=heading('04','Forsendur lestrar','Afmörkun og þátttaka');
appendBlock(node(`<section class="text-block" id="limitations"><h3>Umfang og takmarkanir</h3><p>${escape(f.limitations)}</p><p>Ekki liggur fyrir heildarmat á öryggi eignar. Lýsing á sjónskoðun eða einfaldri virkniprófun er ekki vottun á öryggi eða lagalegu samræmi.</p></section>`));
appendBlock(node(`<section class="text-block"><h3>Upplýsingar sem vantar</h3><p>${items.filter(i=>!i.condition).map(i=>a(i.id)).join(', ')||'Engin ósvöruð ástandsatriði'}${stats.unanswered?' · Ástandsmat hefur ekki verið skráð.':''}</p><p>${items.filter(isUntested).map(i=>a(i.id)).join(', ')||'Engin ókönnuð atriði'}${stats.unexamined?' · Óskoðaðir fletir eða óprófuð virkni/þrif. Sjá afmörkun við hvert atriði.':''}</p><p>${items.filter(i=>isDefect(i)&&!i.photos.length).map(i=>a(i.id)).join(', ')||'Engin frávik án tengdrar myndar'}${stats.missingEvidence?' · Stoðmynd vantar.':''}</p></section>`));
appendBlock(node(`<section class="text-block"><h3>Viðvera, yfirferð og frágangur</h3><dl class="facts-list"><div><dt>Viðvera leigusala</dt><dd>Ekki skráð</dd></div><div><dt>Viðvera leigjanda</dt><dd>Ekki skráð</dd></div><div><dt>Yfirferð mótaðila</dt><dd>Ekki skráð · engin staðfesting liggur fyrir</dd></div><div><dt>Undirritun og frágangur</dt><dd>Engin undirritun eða staðfestur frágangur</dd></div></dl><p>Að lesa skýrslu felur ekki í sér samþykki eða viðurkenningu ábyrgðar. Engin svörun telst ekki samþykki.</p></section>`));
appendBlock(node(`<section class="text-block"><h3>Sjálfstæð skoðun</h3><p>Engin upphafs- eða lokaskoðun er tengd þessu dæmi. Ekki er ályktað um breytingu frá fyrra ástandi, tímasetningu frávika eða bótaábyrgð.</p></section>`));
if(f.handover){
 makePage('handover');body.innerHTML=heading('05','Valfrjáls sýnigögn','Lyklar, mælar og afhending');
 appendBlock(node(`<section class="text-block"><h3>Lyklar · sýnigildi</h3><dl class="facts-list">${f.handover.keys.map(k=>`<div><dt>${escape(k.name)}</dt><dd>${k.quantity} stk. · afhending ekki staðfest</dd></div>`).join('')}</dl></section>`));
 appendBlock(node(`<section class="text-block"><h3>Mælastöður · sýnigildi</h3>${f.handover.meters.map(m=>`<dl class="facts-list"><div><dt>${escape(m.kind)}</dt><dd>${escape(m.value)} ${escape(m.unit)}</dd></div><div><dt>Mælisnúmer og aflestrardagur</dt><dd>Óskráð</dd></div></dl><p class="missing-evidence">Stoðmynd vantar. Aflestrardagur og mælisnúmer eru óstaðfest.</p>`).join('')}<p>${escape(f.handover.note)}</p></section>`));
}
// 5. Compact source index, with individually numbered images and page links.
const ledgerOpening=node(f.rooms.length<=3?'<section class="text-block"><h3>Myndaskrá og uppruni</h3><p class="small">Tölvugerðar sýnimyndir, ekki ljósmyndir frá skoðun. Tími og skráningaraðili skoðunar eru óskráð.</p></section>':'<section class="text-block">'+heading('06','Rekjanleiki sýnigagna','Myndaskrá og uppruni')+'<p class="evidence-key">Allar myndir eru tölvugerðar fyrir hönnunarrýni, ekki ljósmyndir frá skoðun. Enginn skoðunartími eða skráningaraðili er staðfestur. Tengsl og númer eru aðeins tilvísanir innan þessa sýnidæmis.</p></section>');
const ledgerEntry=id=>{const p=f.photos[id];return node(`<section class="text-block ledger-entry"><a href="#photo-${escape(id)}"><strong>${mediaRef(id)}</strong></a><span>${escape(p.roomId)}${p.itemId?' / '+escape(p.itemId):' · Yfirlit'}<br><span class="photo-page-ref" data-for="${escape(id)}">bls. 00</span></span><span class="ledger-caption">${escape(p.caption)}${p.available?'':' · MYNDASKRÁ EKKI TILTÆK'}</span></section>`);};
const minimumEntry=ledgerEntry(activePhotos[0]);
body.append(ledgerOpening,minimumEntry);
if(fits())minimumEntry.remove();
else{ledgerOpening.remove();minimumEntry.remove();makePage('ledger');body.append(ledgerOpening);}
for(const id of activePhotos){
 const entry=ledgerEntry(id);
 if(!attach(entry)){makePage('ledger');body.innerHTML=heading('06','Framhald myndaskrár','Myndaskrá og uppruni');if(!attach(entry))throw Error('Myndaskrá fer út fyrir síðu.');}
}
if(indexBody)indexBody.innerHTML=heading('02','Lesleið um skýrsluna','Rými og tilvísanir')+`<p class="index-intro">${stats.rooms} rými, ${stats.total} skoðunaratriði og ${stats.photos} tengdar sýnimyndir. Öll svör fylgja, líka þau sem eru í lagi, með eðlilegum notkunarmerkjum eða merkt „Á ekki við“.</p><ol class="room-index">${f.rooms.map(r=>`<li><a href="#room-${escape(r.id)}"><strong>${escape(r.id)}</strong><span>${escape(r.name)}</span><span class="index-meta">${r.items.length} atriði · bls. ${roomPages[r.id]}</span></a></li>`).join('')}</ol><div class="key"><h3>Hvernig á að lesa skráninguna</h3><p><strong>Ástand</strong> lýsir skráðu mati. <strong>Virkni</strong> og <strong>þrif</strong> eru sjálfstæð svör. „Ekki metin í liðnum“ merkir að sá matsþáttur er ekki hluti liðarins.</p><p>„Óskráð“ er ósvarað atriði. „Ekki skoðað“ og „Ekki prófað“ eru skráðar takmarkanir. „Á ekki við“ er sérstakt svar, ekki jákvætt mat.</p><p>Tilvísanir A vísa í atriði. M-númer eru lesnúmer mynda í birtingarröð innan þessarar skýrslu, ekki auðkenni upprunaskráa. Mynd og myndatexti fylgja viðeigandi rými eða atriði. Framhaldssíður endurtaka rýmis- og atriðisauðkenni.</p></div>`;
for(const el of root.querySelectorAll('[data-room-page]'))el.textContent=`bls. ${roomPages[el.dataset.roomPage]}`;
const measureCheck=[];
for(const [n,s] of sheets.entries()){
 s.querySelector('.page-number').textContent=`${n+1} / ${sheets.length}`;s.setAttribute('aria-label',`Síða ${n+1} af ${sheets.length}`);
 for(const el of s.querySelectorAll('[data-photo]')){
  for(const target of root.querySelectorAll('.photo-page-ref'))if(target.dataset.for===el.dataset.photo)target.textContent=`bls. ${n+1}`;
 }
 const b=s.querySelector('.page-body');measureCheck.push({page:n+1,kind:s.dataset.kind,room:s.dataset.room||null,bodyHeight:b.clientHeight,bodyContentHeight:b.scrollHeight,overflow:b.scrollHeight>b.clientHeight+1});
}
if(measureCheck.some(p=>p.overflow))throw Error('Síða fer út fyrir A4-prentflöt.');
root.className='screen-pages';
document.querySelector('#loading').remove();document.title=`Hugmynd C · ${f.label} · ${sheets.length} síður`;
window.refinementResult={scenario,fixture:f,stats,pages:measureCheck,pageCount:sheets.length,roomPages,activePhotos,mediaReferences};
document.documentElement.dataset.ready='true';
})().catch(e=>{document.querySelector('#loading').textContent=`Ekki tókst að raða sýnidæminu: ${e.message}`;document.documentElement.dataset.error=e.message;console.error(e);});
