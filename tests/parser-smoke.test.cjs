const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console,window:{addEventListener(){},location:{search:''}},document:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},URLSearchParams,setTimeout,clearTimeout});
for(const name of ['config.js','device-profiles.js']) vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
assert.ok(app.trimEnd().endsWith('})();'));
const exposed=app.replace(/\}\)\(\);\s*$/, '  window.__parserTest={parseMindrayM7PdfText};\n})();');
vm.runInContext(exposed,context,{filename:'app.js',timeout:12000});
const parse=context.window.__parserTest.parseMindrayM7PdfText;
test('M7 synthetic Simpson BP and Doppler unit conversion',()=>{
 const raw=['Nomb:Paciente Prueba','Equipo usado:MINDRAY M7','2D Measurements','Dimensions','Diám AI:3.75cm','Ventricle Volume','Teichholz(2D)','SIVd:0.98cm    DIVId:5.58cm','DIVIs:3.72cm   FE(Teich):61.3%','Simpson BP','VFD(A2C):72.99ml','VFS(A2C):23.91ml   VFD(A4C):74.28ml','VFS(A4C):32.35ml   VFD(Simp BP):75.20ml','VFS(Simp BP):27.93ml','FE(Simp BP):62.9%','Doppler Measurements','Mitral Valve','E Vel VM:71.16cm/s','VM A Vel:61.73cm/s'].join('\n');
 const r=parse(raw); assert.equal(r.equipment,'Mindray M7'); assert.equal(r.values.vtdSimpson,75.2); assert.equal(r.values.vtsSimpson,27.93); assert.ok(Math.abs(r.values.ondaE-0.7116)<0.0001); assert.ok(Math.abs(r.values.ondaA-0.6173)<0.0001); assert.equal(r.values.ddvi,55.8);
});
test('M7 synthetic A4C only must not become Simpson BP',()=>{
 const raw=['Nomb:Paciente Prueba','Equipo usado:MINDRAY M7','2D Measurements','Ventricle Volume','Simpson','VFD(A4C):49.32ml    VFS(A4C):19.71ml','SV(A4C):29.61ml    FE(A4C):60.0%'].join('\n');
 const r=parse(raw); assert.ok(r.values.vtdSimpson==null); assert.ok(r.values.vtsSimpson==null);
});
