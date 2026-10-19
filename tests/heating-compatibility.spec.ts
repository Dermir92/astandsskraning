import { expect, test } from "@playwright/test";
import { DemoStore, STORAGE_KEY } from "../src/components/demo-provider";
import { EMPTY_OBSERVATION, initialRooms, isReportList, makeRoom, observationComplete, reportStats, reportStatus, requiresDamage } from "../src/lib/model";
import { heatingItem, heatingState, validHeating } from "../src/lib/heating";
import { itemProgress, missingAnswers, nextIncomplete } from "../src/lib/inspection-navigation";
import { heatingObservation, heatingReport, triedHeating } from "./heating-fixtures";
import { legacyCoreReport } from "./inspection-core-fixtures";

test("new templates are explicit, empty, one item per indoor room, independent of cooking appliances", () => {
  expect(initialRooms().reduce((n,r) => n+r.items.length,0)).toBe(46);
  const rooms = initialRooms({ includeHeating: true });
  expect(rooms.reduce((n,r) => n+r.items.length,0)).toBe(51);
  for (const room of rooms) { expect(room.items.filter(i => i.kind === "space_heating")).toHaveLength(1); expect(room.observations).toEqual({}); expect(room.items.findIndex(i => i.kind === "space_heating")).toBe(room.items.findIndex(i => i.id === "lights")+1); }
  for (const type of ["laundry","storage","custom"] as const) expect(makeRoom(type,"Sýni",undefined,{includeHeating:true}).items.some(i=>i.kind==="space_heating")).toBe(true);
  expect(makeRoom("balcony","Svalir",undefined,{includeHeating:true}).items.some(i=>i.kind==="space_heating")).toBe(false);
  expect(rooms.find(r=>r.type==="kitchen")!.items.find(i=>i.id==="oven")).toEqual({id:"oven",name:"Ofn",functionality:true,cleanliness:true});
});
test("visible parts require equipment OR scope, while fully reported concealed requires description AND source", () => {
  const h = { visibility: "visible_parts" as const, visibleCondition: "good" as const, operation: "not_tried" as const };
  expect(heatingState(heatingObservation(h)).missing.map(i=>i.key)).toEqual(["equipment"]);
  for (const extra of [{ equipment: ["radiators" as const] },{ scope: "Sýnilegur hitastillir við hurð" }]) expect(heatingState(heatingObservation({...h,...extra})).complete).toBe(true);
  const concealed = {visibility:"reported_concealed" as const,operation:"not_tried" as const};
  expect(heatingState(heatingObservation(concealed)).missing.map(i=>i.key)).toEqual(["scope","informationSource"]);
  expect(heatingState(heatingObservation({...concealed,scope:"Gólfhiti sagður undir gólfi"})).missing.map(i=>i.key)).toEqual(["informationSource"]);
  expect(heatingState(heatingObservation({...concealed,scope:"Gólfhiti sagður undir gólfi",informationSource:"Sýnileigusali, óstaðfest frásögn"})).complete).toBe(true);
});
test("other visibility states add no equipment or scope requirement; incomplete drafts remain loadable", () => {
  for (const visibility of ["none_visible","not_examined","unknown"] as const) {
    const report=heatingReport({visibility,operation:"not_tried"});expect(isReportList([report])).toBe(true);
    expect(heatingState(report.rooms[0].observations['space-heating']).complete).toBe(true);
    expect(heatingState(report.rooms[0].observations['space-heating']).limitations).not.toHaveLength(0);
  }
  expect(isReportList([heatingReport({})])).toBe(true);
});
test("no response and mixed responses are factual summaries, never automatic defects or repair counts", () => {
  for (const response of ["none_observed","mixed"] as const) {
    const report=heatingReport(triedHeating(response)); const o=report.rooms[0].observations['space-heating']; const item=report.rooms[0].items[1];
    expect(heatingState(o)).toMatchObject({complete:true,defect:false,limitations:[]});
    expect(heatingState(o).status).toMatch(response==="mixed"?/Ólík/:/Ekkert viðbragð/);
    expect(requiresDamage(o,item)).toBe(false);expect(reportStats(report)).toMatchObject({deviations:0,attention:0});
    expect(observationComplete(item,o)).toBe(true);expect(itemProgress(item,o)).toBe("recorded");expect(reportStatus(report)).toBe("active");
  }
});
test("mixed visibility retains one record and grades only visible parts; inactive facts never become current", () => {
  for (const response of ["observed","mixed"] as const) {
    const h={...triedHeating(response),equipment:["thermostat","underfloor"] as ("thermostat"|"underfloor")[],scope:"Hitastillir sást. Gólfhiti undir gólfi samkvæmt sýniupplýsingum.",informationSource:"Sýnileigusali"};
    const report=heatingReport(h);const o=report.rooms[0].observations['space-heating'];const item=report.rooms[0].items[1];
    expect(heatingState(o)).toMatchObject({complete:true,missing:[],defect:false,limitations:["Uppgefinn búnaður sem sást ekki"]});
    expect(observationComplete(item,o)).toBe(true);expect(itemProgress(item,o)).toBe("recorded");expect(requiresDamage(o,item)).toBe(false);expect(reportStats(report)).toMatchObject({recorded:2,unanswered:0,deviations:0,attention:1});expect(nextIncomplete(report,{roomId:report.rooms[0].id,itemId:item.id})).toBeNull();expect(o).not.toHaveProperty('functionality');
    if (response === "mixed") expect(heatingState(o).status).toMatch(/Ólík viðbrögð/);
    for (const visibility of ["none_visible","not_examined","unknown"] as const) {
      const retained=heatingObservation({...h,visibility});
      const withoutSource=heatingObservation({...h,visibility,informationSource:undefined});
      expect(heatingState(retained)).toEqual(heatingState(withoutSource));
      expect(heatingState(retained)).toMatchObject({complete:true,defect:false});
      expect(heatingState(retained).limitations).not.toContain("Uppgefinn búnaður sem sást ekki");
      expect(retained.heating!.informationSource).toBe("Sýnileigusali");
    }
    const retained=heatingObservation({...h,visibility:"reported_concealed",visibleCondition:"damaged",operation:"not_tried"});
    expect(heatingState(retained)).toMatchObject({complete:true,defect:false,limitations:["Uppgefinn búnaður sem sást ekki","Nei, ekki prófað"]});
    expect(retained.heating!.response).toBe(response); expect(heatingState(retained).status).not.toMatch(/Ekkert viðbragð|Skemmt/);
  }
});

test("mixed visibility limitations use only a nonblank structured source, never prose or equipment inference", () => {
  const h={...triedHeating('observed'),equipment:["thermostat","underfloor"] as ("thermostat"|"underfloor")[],scope:"Gólfhiti sagður hulinn samkvæmt sýnileigusala"};
  for (const informationSource of [undefined,""," \n\t"]) expect(heatingState(heatingObservation({...h,informationSource}))).toMatchObject({complete:true,missing:[],defect:false,limitations:[]});
  expect(heatingState(heatingObservation({...h,equipment:["thermostat"],scope:undefined,informationSource:" Sýnileigusali "}))).toMatchObject({complete:true,missing:[],defect:false,limitations:["Uppgefinn búnaður sem sást ekki"]});
});
test("only explicit active visual defects require existing defect details; attempted operation has conditional facts", () => {
  const o=heatingObservation({...triedHeating(),visibleCondition:"defect"});
  expect(heatingState(o).defect).toBe(true);expect(heatingState(o).missing.map(i=>i.key)).toEqual(["damageType","location","description"]);
  const report=heatingReport({visibility:"none_visible",operation:"tried"});
  expect(missingAnswers(report.rooms[0].items[1],report.rooms[0].observations['space-heating']).map(i=>i.key)).toEqual(["action","response","responseDescription"]);
  expect(nextIncomplete(report,{roomId:report.rooms[0].id,itemId:"walls"})?.itemId).toBe("space-heating");
});
test("known malformed fields are protected; unknown extensions and reserved-key collisions are never normalized", () => {
  for (const bad of [null,[],"yes",{visibility:"na"},{visibleCondition:"na"},{operation:"works"},{equipment:["oven"]},{equipment:["radiators","radiators"]},{scope:42},{informationSource:false},{response:"broken"}]) expect(validHeating(bad)).toBe(false);
  expect(validHeating({...triedHeating(),future:{keep:[false,0]}})).toBe(true);
  const bad=heatingReport();(bad.rooms[0].items[1] as unknown as {kind:string}).kind="other-feature";expect(isReportList([bad])).toBe(false);
  const room=legacyCoreReport().rooms[0];room.observations['space-heating']={...EMPTY_OBSERVATION,note:"orphan preserved"};const item=heatingItem(room)!;expect(item.id).not.toBe("space-heating");expect(room.observations['space-heating'].note).toBe("orphan preserved");
});
test.describe("v1 heating preservation",()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,"localStorage");let values:Map<string,string>;let fail=false;
  test.beforeEach(()=>{values=new Map();fail=false;Object.defineProperty(globalThis,"localStorage",{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{if(fail)throw Error("synthetic quota");values.set(k,v);}}});});
  test.afterEach(()=>{if(descriptor)Object.defineProperty(globalThis,"localStorage",descriptor);else Reflect.deleteProperty(globalThis,"localStorage");});
  test("legacy reads and analysis do not backfill, change timestamps or progress; explicit add preserves all other data",()=>{
    const report=legacyCoreReport();const doc={version:1,envelopeExtra:{keep:false},reports:[report,{...report,id:"unrelated"}]};const raw=JSON.stringify(doc,null,2);values.set(STORAGE_KEY,raw);
    const store=new DemoStore();store.hydrate();const before=reportStats(report);reportStats(store.getSnapshot().reports[0]);expect(values.get(STORAGE_KEY)).toBe(raw);expect(reportStats(store.getSnapshot().reports[0])).toEqual(before);
    const id=store.addHeating(report.id,report.rooms[0].id)!;expect(id).toBe("space-heating");const saved=JSON.parse(values.get(STORAGE_KEY)!);expect(saved.envelopeExtra).toEqual(doc.envelopeExtra);expect(saved.reports[1]).toEqual(doc.reports[1]);expect(saved.reports[0].rooms[0].observations).toEqual(report.rooms[0].observations);expect(store.addHeating(report.id,report.rooms[0].id)).toBeNull();
  });
  test("nested extensions and pending edits survive writes, failure and retry without changing the envelope or other reports",()=>{
    const report=heatingReport({...triedHeating(),...{future:{keep:[0,false]}}});const doc={version:1,envelopeExtra:[0,false],reports:[report,{...legacyCoreReport(),id:"other"}]};values.set(STORAGE_KEY,JSON.stringify(doc));const store=new DemoStore();store.hydrate();fail=true;
    store.updateRoom(report.id,report.rooms[0].id,room=>({...room,observations:{...room.observations,'space-heating':{...room.observations['space-heating'],heating:{...room.observations['space-heating'].heating,scope:"Sýnisvæði"}}}}));expect(store.getSnapshot().status).toBe("error");expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual(doc);fail=false;store.retrySave();const saved=JSON.parse(values.get(STORAGE_KEY)!);expect(saved.reports[0].rooms[0].observations['space-heating'].heating.future).toEqual({keep:[0,false]});expect(saved.reports[1]).toEqual(doc.reports[1]);expect(saved.envelopeExtra).toEqual(doc.envelopeExtra);
  });
  test("malformed source stays byte protected through add, edit and retry; new drafts contain no heating answers",()=>{
    const raw='{"version":1,"reports":[';values.set(STORAGE_KEY,raw);const locked=new DemoStore();locked.hydrate();expect(locked.addHeating("missing","missing")).toBeNull();locked.retrySave();expect(values.get(STORAGE_KEY)).toBe(raw);
    values.delete(STORAGE_KEY);const store=new DemoStore();store.hydrate();const id=store.createReport();const created=store.getSnapshot().reports.find(r=>r.id===id)!;expect(reportStats(created).total).toBe(51);expect(created.rooms.every(r=>Object.keys(r.observations).length===0)).toBe(true);
  });
});
