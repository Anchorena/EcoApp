const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
// Clasificación visual de valores de referencia (sólo NORMAL_RANGES; sin interpretación clínica).
const root=path.resolve(__dirname,'..');
const context=vm.createContext({console,window:{addEventListener(){},location:{search:''}},document:{addEventListener(){}},localStorage:{getItem(){return null;},setItem(){}},URLSearchParams,setTimeout,clearTimeout});
for(const name of ['config.js','device-profiles.js']) vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),context,{filename:name});
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
assert.ok(app.trimEnd().endsWith('})();'));
const exposed=app.replace(/\}\)\(\);\s*$/, '  window.__rangeTest={isOutsideNormalRange,isNormalRangeBorderline};\n})();');
vm.runInContext(exposed,context,{filename:'app.js',timeout:12000});
const {isOutsideNormalRange,isNormalRangeBorderline}=context.window.__rangeTest;

test('VCI colapso 49 % queda fuera del criterio (>50)',()=>{
  assert.equal(isOutsideNormalRange('vciColapso',49,''),true);
  assert.equal(isNormalRangeBorderline('vciColapso',49),false);
});
test('VCI colapso 50 % es limítrofe y no se marca en rojo',()=>{
  assert.equal(isOutsideNormalRange('vciColapso',50,''),false);
  assert.equal(isNormalRangeBorderline('vciColapso',50),true);
});
test('VCI colapso 51 % queda dentro del criterio',()=>{
  assert.equal(isOutsideNormalRange('vciColapso',51,''),false);
  assert.equal(isNormalRangeBorderline('vciColapso',51),false);
});
test('el criterio limítrofe no se extiende a otros límites estrictos',()=>{
  assert.equal(isOutsideNormalRange('vdBasal',36,''),true);   // "<36"
  assert.equal(isNormalRangeBorderline('vdBasal',36),false);
  assert.equal(isOutsideNormalRange('tapse',17,''),true);     // ">17"
});
test('rangos por sexo y textos no evaluables',()=>{
  assert.equal(isOutsideNormalRange('ddvi',59,'Masculino'),false);
  assert.equal(isOutsideNormalRange('ddvi',60,'Masculino'),true);
  assert.equal(isOutsideNormalRange('ddvi',55,'Femenino'),true);
  assert.equal(isOutsideNormalRange('ddvi',55,''),false);      // sin sexo: dentro de alguno
  assert.equal(isOutsideNormalRange('ddvi',38,''),true);       // fuera de ambos
  assert.equal(isOutsideNormalRange('eeSeptal',20,''),null);   // "<15 aprox." no se evalúa
  assert.equal(isOutsideNormalRange('vciColapso',null,''),null);
});
