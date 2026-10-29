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


test('Fase B exposes only the four approved wall-only views',()=>{
  const expected=['viewELPEI','viewA2C','viewA4C','viewA5C'];
  for(const id of expected) assert.match(html,new RegExp('id="'+id+'"'));
  for(const id of ['viewA3C','viewSAXBasal','viewSAXMid','viewSAXApical']) {
    assert.doesNotMatch(html,new RegExp('id="'+id+'"'));
  }
  assert.match(js,/drawBullseye\("bull17", true\)/);
  assert.match(js,/drawSegmentViews\(true\)/);
});
test('Fase B uses clinical segment maps with no duplicates',()=>{
  const cfg=fs.readFileSync(path.join(root,'config.js'),'utf8');
  const expected={
    a4c:[3,9,14,6,12,16,17],
    a2c:[4,10,15,1,7,13,17],
    a5c:[2,8,14,6,12,16,17],
    elpei:[2,8,5,11]
  };
  for(const [view,ids] of Object.entries(expected)){
    const pattern=new RegExp(view+': \\{ title: "[^"]+", segments: \\[([^\\]]+)\\]');
    const match=cfg.match(pattern);
    assert.ok(match,view+' config missing');
    const actual=match[1].split(',').map(Number);
    assert.deepEqual(actual,ids);
    assert.equal(new Set(actual).size,ids.length);
  }
});
test('Fase B wall render selects common state and ELPEI excludes apex',()=>{
  const from=js.indexOf('function drawApicalWallOnly(');
  const to=js.indexOf('function atlasBindShape(',from);
  const render=js.slice(from,to);
  assert.ok(from>=0 && to>from);
  assert.match(render,/bindSegmentShape\(shape, segmentId, interactive\)/);
  assert.match(render,/bindSegmentShape\(cap, 17, interactive\)/);
  const elpei=render.slice(render.indexOf('function drawELPEIWallOnly('),render.indexOf('function drawSegmentViews('));
  assert.match(elpei,/id: 8/);
  assert.match(elpei,/id: 2/);
  assert.match(elpei,/id: 11/);
  assert.match(elpei,/id: 5/);
  assert.doesNotMatch(elpei,/id: 17/);
  assert.doesNotMatch(elpei,/bindSegmentShape\(cap/);
  assert.doesNotMatch(render,/baseChambers|segment-chamber/);
  assert.match(js,/segmentStates\[segmentId\] = nextState\(segmentStates\[segmentId\]\)/);
});
test('Fase B keyboard activation and linked highlights remain intact',()=>{
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  assert.match(js,/event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(js,/function highlightLinkedSegment\(segmentId, active\)/);
  assert.match(js,/\.atlas-seg/);
  assert.match(css,/\.segment-view-card svg text\s*\{[^}]*pointer-events:none/s);
});


test('Fase B preserves synthetic segment states through local study storage',()=>{
  const from=js.indexOf('function normalizeSavedStudy(');
  const to=js.indexOf('function setSelectValueOrOther(',from);
  assert.ok(from>=0 && to>from);
  const storage=new Map();
  const localStorage={
    getItem:key=>storage.get(key)||null,
    setItem:(key,value)=>storage.set(key,value)
  };
  const mockData={paciente:'TEST ONLY',fecha:'2026-10-27',segmentStates:{1:'acinesia',14:'hipocinesia',17:'normal'}};
  const context={localStorage,STUDY_STORAGE_KEY:'test_studies',getFormData:()=>mockData,buildStudyBaseName:()=> 'synthetic',Date,Math,JSON,Array};
  const functions=vm.runInNewContext(js.slice(from,to)+';({makeStudyRecord,setSavedStudies,getSavedStudies})',context);
  const record=functions.makeStudyRecord();
  functions.setSavedStudies([record]);
  const restored=functions.getSavedStudies()[0];
  assert.equal(restored.data.segmentStates[1],'acinesia');
  assert.equal(restored.data.segmentStates[14],'hipocinesia');
  assert.equal(restored.data.segmentStates[17],'normal');
});

test('Fase B long report includes all four noninteractive segmental wall views',()=>{
  for(const id of ['A2C','A4C','A5C','ELPEI']){
    assert.match(html,new RegExp('id="printView'+id+'"'));
  }
  assert.match(js,/drawApicalWallOnly\("printViewA2C", \[15, 10, 4\], \[13, 7, 1\], false\)/);
  assert.match(js,/drawApicalWallOnly\("printViewA4C", \[14, 9, 3\], \[16, 12, 6\], false\)/);
  assert.match(js,/drawApicalWallOnly\("printViewA5C", \[14, 8, 2\], \[16, 12, 6\], false\)/);
  assert.match(js,/drawELPEIWallOnly\(false, "printViewELPEI"\)/);
  const short=html.slice(html.indexOf('id="print-report-resumen-os"'));
  assert.doesNotMatch(short,/id="printView(?:A2C|A4C|A5C|ELPEI)"/);
});
test('Fase B names the corresponding walls on each view',()=>{
  for(const wall of ['INFEROSEPTAL','ANTEROLATERAL','INFERIOR','ANTERIOR','SEPTAL','ANTEROSEPTAL','INFEROLATERAL']){
    assert.match(js,new RegExp('"'+wall+'"'));
  }
  assert.match(js,/addSvgText\(svg, 34, 57, "VD", "segment-anatomy-label"\)/);
  assert.match(js,/addSvgText\(svg, 204, 135, "Ao", "segment-anatomy-label"\)/);
});

test('Fase B print ELPEI targets its own SVG and visual row precedes narrative',()=>{
  assert.match(js,/function drawELPEIWallOnly\(interactive, svgId = "viewELPEI"\)/);
  assert.match(js,/const svg = qs\(svgId\)/);
  const print=html.slice(html.indexOf('id="print-report-moderno"'),html.indexOf('id="print-report-clasico"'));
  assert.ok(print.indexOf('class="print-segment-visuals"')>=0);
  assert.ok(print.indexOf('id="printViewELPEI"')>print.indexOf('id="printBull17"'));
  assert.ok(print.indexOf('id="printSegmentosTexto"')>print.indexOf('id="printViewA5C"'));
});

test('Eco largo paginates Doppler before segment atlas and removes old print minimum heights',()=>{
  const start=html.indexOf('id="print-report-moderno"');
  const end=html.indexOf('id="print-report-clasico"',start);
  const long=html.slice(start,end);
  assert.ok(long.indexOf('doppler-print-block')<long.indexOf('segments-print-block'));
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  assert.match(css,/#print-report-moderno \.doppler-print-block \{\s*break-before:auto !important/);
  assert.match(css,/#print-report-moderno \.print-segment-visuals \{[\s\S]*?grid-template-columns:150px minmax\(0,1fr\) !important/);
  assert.match(css,/#print-report-moderno \.segments-print-block \.report-bullseye-text \{[\s\S]*?min-height:0 !important/);
  assert.match(css,/#print-report-moderno \.print-segment-visuals #printBull17,[\s\S]*?width:132px !important/);
});
