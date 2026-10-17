/* Synthetic presentation fixtures. No application imports, schema or storage. */
(() => {
const original=window.reportFixture;
const names=[['entry','Forstofa',7],['living','Stofa',8],['kitchen','Eldhús',12],['bedroom1','Svefnherbergi 1',8],['bedroom2','Svefnherbergi 2',8],['office','Vinnuherbergi',8],['bath','Baðherbergi',10],['laundry','Þvottahús',8],['storage','Geymsla',7],['balcony','Svalir',8]];
const common=['Gólfefni','Veggir','Loft','Gluggar','Hurðir og læsingar','Ljós og rofar','Skápar','Ofn og hitastillir'];
const special={kitchen:['Gólfefni','Veggir','Loft','Gluggar','Hurðir og læsingar','Ljós og rofar','Innréttingar','Borðplata','Vaskur og krani','Helluborð','Ofn','Eldhúsvifta'],bath:['Gólfefni','Veggir','Loft','Gluggi','Hurð og læsing','Ljós og rofar','Salerni','Sturta','Vaskur og krani','Sýnileg rakamerki'],balcony:['Gólf','Veggir','Svalahurð','Handrið','Frárennsli','Lýsing','Þétting við hurð','Þrif'],laundry:['Gólfefni','Veggir','Loft','Gluggi','Hurð og læsing','Vaskur og krani','Þvottavél','Frárennsli']};
const text={floor:'Engin sýnileg frávik á aðgengilegum fleti. Þrif metin sérstaklega.',walls:'Sýnilegir veggfletir skoðaðir frá gólfi. Ekki opnað inn í veggi.',ceiling:'Sjónskoðun frá gólfi. Engin sýnileg frávik skráð.',window:'Gluggi opnaður og lokaður við einfalda prófun. Þéttleiki ekki mældur.',door:'Hurð opnuð og lokuð. Læsing prófuð þar sem lykill var tiltækur.',lights:'Ljós kviknuðu við prófun rofa. Engin raföryggisúttekt fór fram.',cupboard:'Hurðir opnaðar og lokaðar. Aðgengilegir innri fletir skoðaðir.',heat:'Ytra byrði skoðað. Hitastýring og afköst ekki mæld.'};
const longDetail='Þétting hefur losnað frá neðri brún gluggakarms. Samskeyti við hornið eru ójöfn á þeim hluta sem er aðgengilegur frá gólfi. Ástand var aðeins metið með sjónskoðun; hvorki var mældur raki né kannað hvað er undir yfirborðinu. Ekki er hægt að draga ályktun um orsök eða hvenær breytingin varð út frá þessum upplýsingum. Glugginn var opnaður og lokaður en þéttleiki hans ekki prófaður. Mynd sýnir afmarkaðan hluta svæðisins og kemur ekki í stað rannsóknar á öllum byggingarhlutanum.';
const photos={};let pn=0,an=0;
const addPhoto=(asset,caption,room,item=null)=>{
 const id=`M${String(++pn).padStart(3,'0')}`;
 photos[id]={id,asset,caption,roomId:room,itemId:item,alt:`Tölvugerð sýnimynd: ${caption.toLowerCase()}.`,origin:'synthetic',capturedAt:null,contributor:null}; return id;
};
const rooms=names.map(([slug,name,count],ri)=>{
 const id=`R${String(ri+1).padStart(2,'0')}`;
 const items=Array.from({length:count},(_,j)=>({id:`A${String(++an).padStart(3,'0')}`,name:(special[slug]||common)[j],condition:'good',functionality:j>=3?'works':undefined,cleanliness:[0,3,6].includes(j)?'clean':undefined,description:text[Object.keys(text)[j%8]],photos:[],location:'',damageType:'',note:''}));
 // Deliberately vary explicit assessments; no state inferred from photographs.
 items[0].condition='wear';items[0].description='Grunnar yfirborðsrispur á gönguleið. Skráð sem eðlileg notkunarmerki. Stærð og dýpt ekki mæld.';
 const overview=addPhoto(`${slug}-overview.png`,`${name} · yfirlit yfir sýnilega fleti`,id);
 const detailTargets={entry:0,living:1,kitchen:11,bedroom1:3,bedroom2:0,office:4,bath:0,laundry:5,storage:6,balcony:4};
 const target=items[detailTargets[slug]];
 const captions={entry:'Grunnar rispur við þröskuld',living:'Flögnuð málning á vegg við ofn',kitchen:'Fita á síu eldhúsviftu',bedroom1:'Laus þétting við gluggakarm',bedroom2:'Grunnar rispur á gólfi',office:'Brot í málningu við hurðarkarm',bath:'Gólf og sýnilegt frárennsli',laundry:'Útfellingar við krana',storage:'Takmarkað aðgengi aftan við fasta hillu',balcony:'Lauf við niðurfall'};
 target.photos.push(addPhoto(`${slug}-detail.png`,`${name} · ${captions[slug]}`,id,target.id));
 if(['living','bedroom1','office'].includes(slug)){
  target.condition='defect';target.damageType=slug==='bedroom1'?'Laus þétting':'Yfirborðsgalli';target.location=slug==='living'?'Veggflötur við ofn':slug==='bedroom1'?'Neðri brún gluggakarms':'Neðri brún hurðarkarms';
  target.description=slug==='bedroom1'?longDetail:slug==='living'?'Málning hefur flagnað á litlum hluta veggjar við ofn. Undirlag sést. Orsök og umfang undir yfirborði eru óstaðfest.':'Lítið brot í málningu við neðri brún hurðarkarms. Hurð opnuð og lokuð við prófun.';
 }
 if(slug==='kitchen'){
  const counter=items[7];counter.condition='damaged';counter.damageType='Brot';counter.location='Frambrún við vask';counter.description='Brot í yfirborði frambrúnar borðplötu. Undirlag sést. Stærð ekki mæld.';
  counter.photos.push(addPhoto('../phase-1b3a/assets/counter.png','Eldhús · brot á frambrún borðplötu',id,counter.id));
  const hood=items[11];hood.condition='defect';hood.functionality='broken';hood.cleanliness='dirty';hood.damageType='Bilun';hood.location='Vifta yfir helluborði';hood.description='Vifta fór ekki í gang við prófun rofa. Fita sést á síu. Mynd af síu staðfestir ekki virkni búnaðarins. Orsök bilunar er óstaðfest.';
  items[10].functionality='untested';items[10].description='Ofn ekki gangsettur. Ytra byrði og aðgengilegir innri fletir skoðaðir.';
  items[8].description='Vatnsrennsli prófað. Enginn sýnilegur leki meðan á prófun stóð. Lagnir innan veggja ekki skoðaðar.';
  items[6].photos.push(addPhoto('../phase-1b3a/assets/kitchen.png','Eldhús · viðbótaryfirlit innréttinga',id,items[6].id));
 }
 if(slug==='bath'){
  const shower=items[7];shower.condition='defect';shower.functionality='works';shower.cleanliness='clean';shower.damageType='Laus þétting';shower.location='Samskeyti við sturtubotn';shower.description='Þéttiefni hefur losnað frá vegg við sturtubotn. Vatnsrennsli prófað, en ekki þéttleiki samskeyta. Ekki kannað hvort vatn fer um samskeytin.';
  shower.photos.push(addPhoto('../phase-1b3a/assets/bath.png','Baðherbergi · laus þétting við sturtubotn',id,shower.id));
  items[9].condition='uninspected';items[9].description='Flötur aftan við fastan skáp var óaðgengilegur. Rakamerki þar voru ekki skoðuð. Engin rakamæling fór fram.';
  items[2].condition=undefined;items[2].description='Ástandsmat á lofti hefur ekki verið skráð. Engin niðurstaða liggur fyrir.';
 }
 if(slug==='laundry'){target.cleanliness='dirty';target.description='Ljósar útfellingar við kranabotn. Þörf á þrifum skráð. Krani opnaður og lokaður; enginn sýnilegur leki meðan á prófun stóð.';items[6].functionality='untested';items[6].description='Þvottavél ekki gangsett. Engin niðurstaða um virkni.';}
 if(slug==='storage'){items[3].condition='na';items[3].description='Gluggi er ekki til staðar.';items[3].functionality=undefined;items[3].cleanliness=undefined;target.condition='uninspected';target.description='Aðgengi að horni aftan við fasta hillu var takmarkað. Mynd sýnir hindrunina; hún staðfestir ekki ástand flatarins þar fyrir aftan.';}
 if(slug==='balcony'){target.cleanliness='dirty';target.description='Þurr lauf að hluta yfir niðurfalli. Vatnsrennsli um niðurfall ekki prófað.';target.functionality='untested';items[6].condition='defect';items[6].damageType='Slit';items[6].location='Þétting neðst við svalahurð';items[6].description='Slit skráð á þéttingu neðst við svalahurð. Stoðmynd vantar. Þéttleiki var ekki mældur.';items[6].photos=[];}
 if(slug==='office'){items[2].condition=undefined;items[2].description='Ástandsmat vantar. Engin mynd eða lýsing staðfestir ástand loftsins.';}
 if(!special[slug]&&items[7])items[7].functionality='untested';
 if(slug==='kitchen'){items[9].description='Eitt hellusvæði kveikt og slökkt við einfalda prófun. Ekki lagt mat á öll afköst eða raföryggi.';}
 if(slug==='bath'){items[6].description='Salerni sturtað niður við einfalda prófun. Enginn sýnilegur leki meðan á prófun stóð.';items[8].description='Krani opnaður og lokaður. Vatn rann um sýnilegt frárennsli við prófun.';items[8].cleanliness='clean';}
 if(slug==='laundry')items[7].description='Vatn rann um sýnilegt frárennsli við einfalda prófun. Lagnir innan veggja ekki skoðaðar.';
 if(slug==='balcony'){items[2].functionality='works';items[2].description='Svalahurð opnuð og lokuð. Þéttleiki ekki prófaður.';items[3].functionality=undefined;items[3].description='Handrið skoðað sjónrænt. Engin álagsprófun eða mæling fór fram.';items[6].functionality=undefined;items[7].functionality=undefined;items[7].cleanliness='clean';items[7].description='Aðgengilegir fletir metnir hreinir, að undanskildu niðurfalli sem er metið sérstaklega.';}
 // Applicability matches the kind of observation; a worktop or moisture mark
 // must never acquire a generic "works" assessment just from its position.
 if(slug==='kitchen'){items[7].functionality=undefined;items[7].cleanliness='clean';items[8].cleanliness='clean';items[9].cleanliness='clean';items[10].cleanliness='clean';}
 if(slug==='bath'){items[8].cleanliness='clean';items[9].functionality=undefined;items[9].cleanliness=undefined;}
 if(slug==='laundry')items[7].cleanliness='clean';
 return {id,name,type:slug,scope:'Sjónskoðun sýnilegra, aðgengilegra flata. Einföld virkniprófun aðeins þar sem hún er sérstaklega skráð.',overview:[overview],items};
});
const shared={address:'Sýnigata 24',postalCode:'101',municipality:'Reykjavík',unit:'0201',furnished:'no',role:'representative',inspectionType:'independent',actualInspectionDate:null,actualInspectionTime:null,recorderName:null,attendance:null,review:null,completedAt:null,signature:null,scope:'Sjónskoðun valinna rýma og einfaldar virkniprófanir. Engin opnun byggingarhluta, rakarannsókn eða sérfræðiprófun.',limitations:'Önnur rými og sameign eru utan umfangs. Óaðgengilegir fletir og óprófuð virkni eru merkt við hvert atriði. Upplýsingarnar lýsa aðeins þessu tilbúna dæmi.',deliveryDate:'2026-11-01'};
const handover={keys:[{name:'Útidyralyklar',quantity:2},{name:'Póstkassalykill',quantity:1}],meters:[{kind:'Rafmagn',serial:null,value:'12.345',unit:'kWh',photo:null}],note:'Tilbúin sýnigildi til að prófa valfrjálsan kafla. Afhending ekki staðfest; mælastöðu fylgir engin stoðmynd.'};
const large={...shared,id:'SÝNI-C-084',label:'Stór skoðun',rooms,photos,handover};
const long=structuredClone(large);long.id='SÝNI-C-LANGT';long.label='Álagspróf með löngum lýsingum';
long.rooms[3].items[3].description=Array.from({length:14},(_,i)=>`Athugun ${i+1}. ${longDetail}`).join('\n\n');
long.rooms[6].items[7].description+='\n\n'+Array.from({length:7},()=>'Þéttiefni er laust við neðra horn sturtubotns þar sem það mætir flísalögðum vegg. Samskeyti voru skoðuð sjónrænt án þess að fjarlægja efni eða opna byggingarhluta. Engin mæling eða vatnsprófun fór fram á þessu svæði. Ekki liggja fyrir upplýsingar um hvenær þéttiefnið losnaði. Mynd sýnir aðeins yfirborð aðgengilegs svæðis; ekki er hægt að staðfesta ástand undirliggjandi laga með henni. Ástæða, dýpt og afleiðingar eru því óstaðfest.').join('\n\n');
long.photos.M018.asset=null;
const small=(defects)=>{
 const mappedPhotos={};const rs=original.rooms.map(r=>({...r,overview:r.overview?[r.overview]:[],items:r.items.map(i=>{const a={...i,...(defects?i.change:{})};return {...a,description:a.note,note:'',damageType:a.type||'',photos:a.photo?[a.photo]:[]};})}));
 for(const [id,p] of Object.entries(original.photos))mappedPhotos[id]={...p,id,asset:`../phase-1b3a/assets/${p.src.split('/').pop()}`,roomId:id==='M03'?'R03':'R02',itemId:rs.some(r=>r.overview.includes(id))?null:id==='M02'?'A06':'A12',origin:'synthetic',capturedAt:null,contributor:null};
 return {...shared,id:defects?'SÝNI-C-LÍTIÐ-F':'SÝNI-C-LÍTIÐ-G',label:defects?'Lítið dæmi með frávikum':'Lítið dæmi að mestu í lagi',rooms:rs,photos:mappedPhotos,handover:null};
};
window.refinementFixtures={large,long,quiet:small(false),defects:small(true)};
})();
