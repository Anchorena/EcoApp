const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
// Synthetic-only regression checks. Do not commit patient PDFs.
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const profiles=fs.readFileSync(path.join(root,'device-profiles.js'),'utf8');

test('zero E velocity does not produce diastolic grade',()=>{
  assert.match(js,/data\.ondaE > 0 && data\.ondaA !== null && data\.ondaA > 0/);
  assert.match(js,/const ondaEcm = data\.ondaE !== null && data\.ondaE > 0/);
  const match=js.match(/  function interpretDiastolic\(calc, data = null\) \{[\s\S]*?\n  \}/);
  assert.ok(match);
  const interpret=vm.runInNewContext('('+match[0].trim()+')');
  assert.match(interpret({ea:null,eSobreEprima:null}),/No es posible definir/);
  assert.match(interpret({ea:null,eSobreEprima:15}),/No es posible definir/);
  assert.match(interpret({ea:0.75,eSobreEprima:null}),/relajación prolongada/);
});
test('isolated E is described as monophasic without diagnosing atrial fibrillation',()=>{
  const jsFunction=js.match(/  function interpretDiastolic\(calc, data = null\) \{[\s\S]*?\n  \}/);
  assert.ok(jsFunction);
  const interpret=vm.runInNewContext('('+jsFunction[0].trim()+')');
  const message=interpret({ea:null,eSobreEprima:null},{ondaE:0.81,ondaA:null});
  assert.match(message,/monofásico/);
  assert.match(message,/puede observarse en contexto de fibrilación auricular/);
  assert.doesNotMatch(message,/grado I|grado II|grado III/);
  assert.match(interpret({ea:null,eSobreEprima:null},{ondaE:0,ondaA:null}),/No es posible definir/);
});
test('Simpson requires both biplane volumes',()=>{
  assert.match(js,/hasValue\(data\.vtdSimpson\) && hasValue\(data\.vtsSimpson\)/);
  assert.match(js,/data\.vtsSimpson < data\.vtdSimpson/);
});
test('short report remains distinct and annex free',()=>{
  const start=html.indexOf('id="print-report-resumen-os"');
  assert.ok(start>0);
  const end=html.indexOf('</section>',start);
  const short=html.slice(start,end);
  assert.doesNotMatch(short,/summaryAnexoWrap|summaryAnexoPages|annex-print-page/);
  assert.match(html,/id="printAnexoWrap"/);
  assert.match(html,/id="printAnexoPages"/);
  assert.match(js,/mode === "resumen-os" \? qs\("print-report-resumen-os"\)/);
});
test('top-toolbar annex removal retains existing click handler',()=>{
  const attach=html.indexOf('id="btnAdjuntarAnexo"');
  const remove=html.indexOf('id="btnAnexoLimpiar"');
  assert.ok(attach>0 && remove>attach && remove-attach<450);
  assert.equal(html.split('id="btnAnexoLimpiar"').length-1,1);
  assert.match(js,/btnAnexoLimpiar\.addEventListener\("click", \(\) => clearAnnex\(true\)\)/);
});
test('RV review fields map once and controls remain unique',()=>{
  assert.match(profiles,/id: "vd", title: "VD \/ función derecha"/);
  for(const field of ['vdBasal','tapse','vci','vciColapso']){
    const matches=profiles.match(new RegExp('field: "'+field+'"','g'))||[];
    assert.equal(matches.length,1,field);
  }
  assert.match(js,/tapse: safeNumber\(getValue\("tapse"/);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
});
test('legacy manual inputs are not removed',()=>{
  assert.match(html,/<details class="legacy-measurements">/);
  assert.match(html,/id="camposEco"/);
  assert.match(html,/id="camposDoppler"/);
});

test('custom valvular morphology is available for all valves',()=>{
  const config=fs.readFileSync(path.join(root,'config.js'),'utf8');
  for(const id of ['aoMorf','miMorf','puMorf','trMorf']){
    assert.match(config,new RegExp(id+': \\['));
    assert.match(html,new RegExp('id="'+id+'Otro"'));
    assert.match(js,new RegExp(id+': customMorphology\\("'+id+'"\\)'));
  }
  assert.equal((config.match(/Descripción personalizada…/g)||[]).length,4);
});
test('new requester and coverage options persist locally, not remotely',()=>{
  assert.match(js,/function rememberCustomOption\(key, value\)/);
  assert.match(js,/localStorage\.setItem\("ecoapp-options-" \+ key/);
  assert.match(js,/storedCustomOptions\("coberturas"\)/);
  assert.match(js,/storedCustomOptions\("solicitantes"\)/);
  assert.match(js,/function saveCustomFromInputs\(\)/);
});

test('valve narrative does not assert preserved closure with regurgitation',()=>{
  assert.match(js,/morphologyText = insufficiency !== "No" \|\| stenosis !== "No"/);
  assert.match(js,/morphologyText = data\.miIns !== "No" \|\| data\.miEst !== "No"/);
  assert.match(js,/replace\(\/,\?\\s\*apertura y cierre conservados\/gi/);
});

test('Sonoscape S6 renders the same normalized editable workspace as M7',()=>{
  assert.match(profiles,/id: "sonoscape-s6"[\s\S]*?workspace: "s6"/);
  assert.match(profiles,/const S6_REVIEW_SECTIONS = M7_REVIEW_SECTIONS\.map/);
  assert.match(js,/profile\.workspace !== "m7" && profile\.workspace !== "s6"/);
  assert.match(js,/profile\.workspace === "s6" \? S6_REVIEW_SECTIONS : M7_REVIEW_SECTIONS/);
  assert.match(js,/buildReviewWorkspaceModel\(report, data, calc, reviewSections\)/);
});

test('S6 imports study ID and report date, without confusing patient DOB',()=>{
  assert.match(js,/const studyIdMatch = normalized\.match/);
  assert.match(js,/const datedFooter = normalized\.match/);
  assert.match(js,/studyId: studyIdMatch \? normalizeImportedId/);
  assert.match(js,/fecha: studyDate/);
  assert.match(profiles,/TV PG \(gradiente transvalvular\)/);
  assert.doesNotMatch(profiles,/field: "tvPg", label: "Gradiente TR"/);
});

test('Fase B six views share the same 17 segment state and remain keyboard accessible',()=>{
  const config=fs.readFileSync(path.join(root,'config.js'),'utf8');
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  for(const id of ['viewA4C','viewA2C','viewA3C','viewSAXBasal','viewSAXMid','viewSAXApical']){
    assert.match(html,new RegExp('id="'+id+'"'));
    assert.ok(js.includes('"'+id+'"'), `Missing SVG draw call for ${id}`);
  }
  assert.match(config,/a3c:\s*\{ title: "A3C", segments: \[2, 8, 14, 5, 11, 16, 17\]/);
  assert.match(js,/segmentStates\[segmentId\] = nextState\(segmentStates\[segmentId\]\)/);
  assert.match(js,/event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(css,/\.segment-views-grid\s*\{\s*display:grid/);
});
