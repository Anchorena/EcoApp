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
  const match=js.match(/  function interpretDiastolic\(calc\) \{[\s\S]*?\n  \}/);
  assert.ok(match);
  const interpret=vm.runInNewContext('('+match[0].trim()+')');
  assert.match(interpret({ea:null,eSobreEprima:null}),/No es posible definir/);
  assert.match(interpret({ea:null,eSobreEprima:15}),/No es posible definir/);
  assert.match(interpret({ea:0.75,eSobreEprima:null}),/relajación prolongada/);
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
