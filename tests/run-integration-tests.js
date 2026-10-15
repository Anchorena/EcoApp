/*
 * EcoApp — pruebas conjuntas: parser Mindray M7 → calculateDerived() → narrativa.
 *
 * Corre sin dependencias, con Node:
 *   node tests/run-integration-tests.js
 * o con el JavaScriptCore que trae macOS:
 *   sh tests/run-integration-tests.sh
 *
 * Toma un fixture de texto sintético (formato getPdfTextLines() de PDF.js), lo pasa por
 * parseEchoPdfText(), carga los valores importados en un formulario vacío (como
 * applyImportedMeasurements()) y verifica cálculos y narrativa. Nunca usar datos reales.
 */
// En jsc, `arguments` de nivel superior son los argumentos del script.
const jscScriptArgs = typeof arguments !== "undefined" ? Array.from(arguments) : [];

(function () {
  "use strict";

  const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
  const fs = isNode ? require("fs") : null;
  const readText = (p) => (isNode ? fs.readFileSync(p, "utf8") : readFile(p));
  const out = (msg) => (isNode ? console.log(msg) : print(msg));
  const args = isNode ? process.argv.slice(2) : jscScriptArgs;
  const repoRoot = args[0] || (isNode ? require("path").resolve(__dirname, "..") : ".");

  function extractTopLevelFunctions(source) {
    const lines = source.split("\n");
    const blocks = [];
    for (let i = 0; i < lines.length; i += 1) {
      if (!/^ {2}(?:async )?function [A-Za-z0-9_$]+\(/.test(lines[i])) continue;
      const start = i;
      while (i < lines.length && lines[i] !== "  }") i += 1;
      blocks.push(lines.slice(start, i + 1).join("\n"));
    }
    return blocks.join("\n\n");
  }

  // config.js es sólo datos globales (TEXTS, NORMAL_RANGES…) que la app carga antes de app.js.
  const app = new Function(`${readText(`${repoRoot}/config.js`)}
    ${extractTopLevelFunctions(readText(`${repoRoot}/app.js`))}
    return {
      parseEchoPdfText, isMindrayM7Text, normalizeEchoPdfText, formatInputNumber, safeNumber,
      calculateDerived, interpretFeyFromCalc,
      interpretMasa, interpretAI, interpretAD, interpretVD, interpretPSAP, interpretDiastolic, interpretGLS,
      buildDescription, buildConclusion
    };`)();

  // Formulario vacío equivalente a getFormData() (numéricos null, selects con su valor por defecto).
  const NUMERIC_FIELDS = ["edad", "fc", "peso", "talla", "ddvi", "dsvi", "sivd", "ppd", "aiDiam", "volAI", "raizAo", "dvao",
    "vdBasal", "tapse", "ad", "volAD", "volADi", "vci", "vciColapso", "vtdSimpson", "vtsSimpson", "gls", "ondaE", "ondaA",
    "eSeptal", "eLateral", "eeSeptal", "eeLateral", "eePromedioManual", "phtMitral", "vmaxAo", "gradAo", "gradAoPico", "vtiAo",
    "aoArea", "diamTsvi", "vtiTsvi", "vmaxTsvi", "vmaxPulm", "gradPulm", "gradPulmPico", "trVmax", "prADmanual", "psapManual",
    "vmaxTric", "tvPg", "aoVc", "aoPht", "aoEroa", "aoRVol", "miVc", "miEroa", "miRVol", "miPisa"];
  const TEXT_DEFAULTS = { sexo: "", motilidadGlobal: "Conservada", septumIA: "No evaluado", trombosMasas: "No",
    vegetaciones: "No", aoMorf: "Normal", aoIns: "No", aoEst: "No", aoJet: "", aoFlowRev: "No", miMorf: "Normal", miIns: "No",
    miEst: "No", miJet: "", puMorf: "Normal", puIns: "No", puEst: "No", trMorf: "Normal", trIns: "No", trEst: "No", pericardio: "No evaluado" };

  function importFixture(path) {
    const report = app.parseEchoPdfText(readText(`${repoRoot}/tests/fixtures/${path}`));
    const data = { ...TEXT_DEFAULTS };
    NUMERIC_FIELDS.forEach((field) => { data[field] = null; });
    // Igual que applyImportedMeasurements() → input → getFormData(): se redondea con formatInputNumber().
    const decimalMap = { edad: 0, fc: 0, peso: 1, talla: 1, vciColapso: 0 };
    Object.entries(report.values).forEach(([field, value]) => {
      if (!(field in data)) return;
      data[field] = typeof value === "number" ? app.safeNumber(app.formatInputNumber(value, decimalMap[field] ?? 2)) : value;
    });
    const calc = app.calculateDerived(data);
    const interp = {
      fey: app.interpretFeyFromCalc(calc),
      masa: app.interpretMasa(calc.indiceMasaVI, data.sexo),
      ai: app.interpretAI(calc.volAIi),
      ad: app.interpretAD(data.ad, calc.volADi),
      vd: app.interpretVD(data.tapse),
      psap: app.interpretPSAP(calc.psap)
    };
    const segmentText = { long: "", short: "" };
    const diastolic = app.interpretDiastolic(calc);
    const gls = app.interpretGLS(data.gls);
    return {
      report,
      data,
      calc,
      interp,
      description: app.buildDescription(data, calc, interp, diastolic, segmentText, gls),
      conclusion: app.buildConclusion(data, calc, interp, diastolic, segmentText, gls)
    };
  }

  const results = [];
  function test(name, fn) {
    const failures = [];
    const expect = {
      near: (label, got, want, tol = 0.01) => { if (typeof got !== "number" || Math.abs(got - want) > tol) failures.push(`${label}: esperado ≈${want}, obtenido ${got}`); },
      equal: (label, got, want) => { if (got !== want) failures.push(`${label}: esperado ${JSON.stringify(want)}, obtenido ${JSON.stringify(got)}`); },
      includes: (label, text, fragment) => { if (!String(text).includes(fragment)) failures.push(`${label}: debía contener "${fragment}"`); },
      excludes: (label, text, fragment) => { if (String(text).includes(fragment)) failures.push(`${label}: no debía contener "${fragment}"`); }
    };
    try {
      fn(expect);
    } catch (error) {
      failures.push(`excepción: ${error && error.stack ? error.stack : error}`);
    }
    results.push({ name, failures });
  }

  const SYSTOLIC_PHRASES = ["Función sistólica global del ventrículo izquierdo preservada", "Fracción de eyección del ventrículo izquierdo conservada",
    "Deterioro leve", "Deterioro moderado", "Deterioro severo", "Teichholz"];

  test("M7 con Simpson BP → FEVI principal Simpson; Teichholz secundario corregido", (expect) => {
    const r = importFixture("mindray-m7/hr-encabezado-psvd-ai-bp.txt");
    expect.equal("equipment", r.report.equipment, "Mindray M7");
    expect.equal("ddvi importado", r.data.ddvi, 48);
    expect.equal("dsvi importado", r.data.dsvi, 31);
    expect.equal("vtdSimpson importado", r.data.vtdSimpson, 82);
    expect.equal("vtsSimpson importado", r.data.vtsSimpson, 30.5);
    expect.near("feySimpson", r.calc.feySimpson, 62.80);
    expect.near("feyPrincipal", r.calc.feyPrincipal, 62.80);
    expect.equal("feyMethod", r.calc.feyMethod, "Simpson");
    expect.near("vtdTeichholz", r.calc.vtdTeichholz, 107.52);
    expect.near("vtsTeichholz", r.calc.vtsTeichholz, 37.92);
    expect.near("feyTeichholz", r.calc.feyTeichholz, 64.74);
    expect.equal("interp.fey.grade", r.interp.fey.grade, "normal");
    expect.includes("descripción", r.description, "Fracción de eyección del ventrículo izquierdo conservada, calculada por método de Simpson biplano.");
    expect.includes("conclusión", r.conclusion, "Función sistólica global del ventrículo izquierdo preservada.");
    expect.excludes("descripción", r.description, "Teichholz");
    expect.equal("fc del encabezado (no HR 606 de Teichholz)", r.data.fc, 64);
  });

  test("M7 sin Simpson BP → Teichholz calculado pero sin clasificar función sistólica", (expect) => {
    const r = importFixture("integration/m7-sin-simpson.txt");
    expect.equal("equipment", r.report.equipment, "Mindray M7");
    expect.equal("ddvi importado", r.data.ddvi, 58.5);
    expect.equal("dsvi importado", r.data.dsvi, 44.7);
    expect.equal("vtdSimpson (monoplano no se importa)", r.data.vtdSimpson, null);
    expect.equal("vtsSimpson (monoplano no se importa)", r.data.vtsSimpson, null);
    expect.includes("warning parser", r.report.warnings.join("\n"), "El PDF sólo trae Simpson monoplano");
    expect.near("feyTeichholz", r.calc.feyTeichholz, 46.43);
    expect.equal("feySimpson", r.calc.feySimpson, null);
    expect.equal("feyPrincipal", r.calc.feyPrincipal, null);
    expect.equal("feyMethod", r.calc.feyMethod, null);
    expect.equal("interp.fey.grade", r.interp.fey.grade, "nr");
    expect.includes("descripción", r.description, "Fracción de eyección por Simpson no disponible.");
    SYSTOLIC_PHRASES.forEach((fragment) => expect.excludes("descripción + conclusión", `${r.description} ${r.conclusion}`, fragment));
    expect.equal("fc del encabezado (no HR 606 de Teichholz)", r.data.fc, 74);
  });

  [
    ["M9 explícito", "mindray-m7/deteccion-m9-explicito.txt"],
    ["M8 explícito", "mindray-m7/deteccion-m8-explicito.txt"],
    ["M8/M9 base", "mindray-m8/basico.txt"]
  ].forEach(([name, fixture]) => {
    test(`${name} no entra al parser M7`, (expect) => {
      const text = readText(`${repoRoot}/tests/fixtures/${fixture}`);
      expect.equal("isMindrayM7Text", app.isMindrayM7Text(app.normalizeEchoPdfText(text)), false);
      const r = importFixture(fixture);
      expect.equal("equipment", r.report.equipment, "Mindray M8/M9");
    });
  });

  let failed = 0;
  results.forEach(({ name, failures }) => {
    if (failures.length) {
      failed += 1;
      out(`FAIL ${name}`);
      failures.forEach((f) => out(`     - ${f}`));
    } else {
      out(`ok   ${name}`);
    }
  });
  out(`\n${results.length - failed}/${results.length} pruebas OK`);
  if (failed) {
    if (isNode) process.exitCode = 1;
    else throw new Error(`${failed} prueba(s) fallaron`);
  }
})();
