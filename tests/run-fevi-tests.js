/*
 * EcoApp — pruebas de FEVI (Simpson / Teichholz) y de su uso en la narrativa.
 *
 * Corre sin dependencias, con Node:
 *   node tests/run-fevi-tests.js
 * o con el JavaScriptCore que trae macOS:
 *   sh tests/run-fevi-tests.sh
 *
 * Extrae de app.js las declaraciones `function` de primer nivel (no se ejecuta nada del DOM)
 * y llama directamente a calculateDerived(), interpretFeyFromCalc(), buildDescription()
 * y buildConclusion(). No agrega ningún hook a la app en producción.
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
      calculateDerived,
      interpretFey,
      interpretFeyFromCalc: typeof interpretFeyFromCalc === "function" ? interpretFeyFromCalc : null,
      interpretMasa, interpretAI, interpretAD, interpretVD, interpretPSAP, interpretDiastolic, interpretGLS,
      buildDescription, buildConclusion, buildMeasurementTableSection, getNormalText
    };`)();

  // Mismos campos numéricos que getFormData(); todo null salvo lo que el caso define.
  const NUMERIC_FIELDS = ["edad", "fc", "peso", "talla", "ddvi", "dsvi", "sivd", "ppd", "aiDiam", "volAI", "raizAo", "dvao",
    "vdBasal", "tapse", "ad", "volAD", "volADi", "vci", "vciColapso", "vtdSimpson", "vtsSimpson", "gls", "ondaE", "ondaA",
    "eSeptal", "eLateral", "eeSeptal", "eeLateral", "eePromedioManual", "phtMitral", "vmaxAo", "gradAo", "gradAoPico", "vtiAo",
    "aoArea", "diamTsvi", "vtiTsvi", "vmaxTsvi", "vmaxPulm", "gradPulm", "gradPulmPico", "trVmax", "prADmanual", "psapManual",
    "vmaxTric", "tvPg", "aoVc", "aoPht", "aoEroa", "aoRVol", "miVc", "miEroa", "miRVol", "miPisa"];
  const TEXT_DEFAULTS = { sexo: "Masculino", motilidadGlobal: "Conservada", septumIA: "No evaluado", trombosMasas: "No",
    vegetaciones: "No", aoMorf: "Normal", aoIns: "No", aoEst: "No", aoJet: "", aoFlowRev: "No", miMorf: "Normal", miIns: "No",
    miEst: "No", miJet: "", puMorf: "Normal", puIns: "No", puEst: "No", trMorf: "Normal", trIns: "No", trEst: "No", pericardio: "Libre" };
  function makeData(overrides) {
    const data = { ...TEXT_DEFAULTS };
    NUMERIC_FIELDS.forEach((field) => { data[field] = null; });
    return Object.assign(data, overrides);
  }

  function narrative(data) {
    const calc = app.calculateDerived(data);
    const interp = {
      fey: app.interpretFeyFromCalc ? app.interpretFeyFromCalc(calc) : app.interpretFey(calc.feyPrincipal, calc.feyMethod),
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
      near: (label, got, want, tol = 0.01) => {
        if (typeof got !== "number" || Math.abs(got - want) > tol) failures.push(`${label}: esperado ≈${want}, obtenido ${got}`);
      },
      equal: (label, got, want) => { if (got !== want) failures.push(`${label}: esperado ${JSON.stringify(want)}, obtenido ${JSON.stringify(got)}`); },
      excludes: (label, text, fragment) => { if (String(text).includes(fragment)) failures.push(`${label}: no debía contener "${fragment}"`); },
      includes: (label, text, fragment) => { if (!String(text).includes(fragment)) failures.push(`${label}: debía contener "${fragment}"`); }
    };
    try {
      fn(expect);
    } catch (error) {
      failures.push(`excepción: ${error && error.stack ? error.stack : error}`);
    }
    results.push({ name, failures });
  }

  // --- Teichholz: V = 7 / (2.4 + D) × D³ con D en cm ---
  [
    ["Caso A 55.2/37.3", 55.2, 37.3, 148.66, 59.26, 60.14],
    ["Caso B 48.8/33.7", 48.8, 33.7, 111.74, 46.43, 58.45],
    ["Caso C 54.0/33.7", 54.0, 33.7, 141.31, 46.43, 67.14],
    ["Caso D 58.5/44.7", 58.5, 44.7, 169.87, 91.0, 46.43]
  ].forEach(([name, ddvi, dsvi, vtd, vts, fey]) => {
    test(`Teichholz ${name}`, (expect) => {
      const calc = app.calculateDerived(makeData({ ddvi, dsvi }));
      expect.near("vtdTeichholz", calc.vtdTeichholz, vtd);
      expect.near("vtsTeichholz", calc.vtsTeichholz, vts);
      expect.near("feyTeichholz", calc.feyTeichholz, fey);
    });
  });

  // --- Entradas inválidas → feyTeichholz null, sin excepciones ---
  [
    ["ddvi null", { ddvi: null, dsvi: 37.3 }],
    ["dsvi null", { ddvi: 55.2, dsvi: null }],
    ["ddvi 0", { ddvi: 0, dsvi: 37.3 }],
    ["dsvi 0", { ddvi: 55.2, dsvi: 0 }],
    ["dsvi > ddvi", { ddvi: 40, dsvi: 45 }],
    ["dsvi = ddvi", { ddvi: 50, dsvi: 50 }],
    ["valores negativos", { ddvi: -50, dsvi: -30 }]
  ].forEach(([name, values]) => {
    test(`Teichholz inválido: ${name}`, (expect) => {
      const calc = app.calculateDerived(makeData(values));
      expect.equal("feyTeichholz", calc.feyTeichholz, null);
      expect.equal("vtdTeichholz", calc.vtdTeichholz, null);
      expect.equal("vtsTeichholz", calc.vtsTeichholz, null);
    });
  });

  // --- Jerarquía de métodos ---
  test("Simpson + Teichholz: Simpson es la FEVI principal", (expect) => {
    const calc = app.calculateDerived(makeData({ ddvi: 58.5, dsvi: 44.7, vtdSimpson: 120, vtsSimpson: 48 }));
    expect.near("feySimpson", calc.feySimpson, 60);
    expect.near("feyPrincipal", calc.feyPrincipal, 60);
    expect.equal("feyMethod", calc.feyMethod, "Simpson");
    expect.near("feyTeichholz (secundaria, se conserva)", calc.feyTeichholz, 46.43);
  });

  test("Sólo Teichholz: no se promueve a FEVI principal", (expect) => {
    const calc = app.calculateDerived(makeData({ ddvi: 55.2, dsvi: 37.3 }));
    expect.near("feyTeichholz", calc.feyTeichholz, 60.14);
    expect.equal("feySimpson", calc.feySimpson, null);
    expect.equal("feyPrincipal", calc.feyPrincipal, null);
    expect.equal("feyMethod", calc.feyMethod, null);
  });

  test("Ninguno disponible: todo null", (expect) => {
    const calc = app.calculateDerived(makeData({}));
    ["feyTeichholz", "vtdTeichholz", "vtsTeichholz", "feySimpson", "feyPrincipal", "feyMethod"].forEach((key) => expect.equal(key, calc[key], null));
  });

  test("Simpson inválido (VTS ≥ VTD) no genera FEVI", (expect) => {
    const calc = app.calculateDerived(makeData({ vtdSimpson: 50, vtsSimpson: 60 }));
    expect.equal("feySimpson", calc.feySimpson, null);
    expect.equal("feyPrincipal", calc.feyPrincipal, null);
  });

  // --- Narrativa ---
  test("Narrativa sin Simpson: no clasifica función sistólica por Teichholz", (expect) => {
    ["Caso A", "Caso D"].forEach((label) => {
      const values = label === "Caso A" ? { ddvi: 55.2, dsvi: 37.3 } : { ddvi: 58.5, dsvi: 44.7 };
      const { description, conclusion, interp } = narrative(makeData(values));
      const text = `${description} ${conclusion}`;
      expect.equal(`${label} interp.fey.grade`, interp.fey.grade, "nr");
      expect.excludes(label, text, "Teichholz");
      expect.excludes(label, text, "Fracción de eyección del ventrículo izquierdo conservada");
      expect.excludes(label, text, "función sistólica global del ventrículo izquierdo preservada");
      ["Función sistólica global del ventrículo izquierdo preservada", "Deterioro leve", "Deterioro moderado", "Deterioro severo"].forEach((fragment) => expect.excludes(label, text, fragment));
      expect.includes(`${label} descripción`, description, "Fracción de eyección por Simpson no disponible.");
    });
  });

  test("Narrativa con Simpson: clasifica normalmente por Simpson", (expect) => {
    const { description, conclusion, interp } = narrative(makeData({ ddvi: 58.5, dsvi: 44.7, vtdSimpson: 120, vtsSimpson: 48 }));
    expect.equal("interp.fey.grade", interp.fey.grade, "normal");
    expect.includes("descripción", description, "Fracción de eyección del ventrículo izquierdo conservada, calculada por método de Simpson biplano.");
    expect.includes("conclusión", conclusion, "Función sistólica global del ventrículo izquierdo preservada.");
    expect.excludes("descripción", description, "Teichholz");
  });

  test("Narrativa sin datos de FEVI: comportamiento previo (sin frase de FEVI)", (expect) => {
    const { description, interp } = narrative(makeData({}));
    expect.equal("interp.fey.grade", interp.fey.grade, "nr");
    expect.excludes("descripción", description, "Fracción de eyección");
  });

  // --- Presentación en el informe ---
  test("Tabla del informe: Teichholz como estimación secundaria, sin rango 55–70", (expect) => {
    const data = makeData({ ddvi: 58.5, dsvi: 44.7, vtdSimpson: 120, vtsSimpson: 48 });
    const table = app.buildMeasurementTableSection(data, app.calculateDerived(data), "eco");
    const teichRow = (table.match(/<tr><td>FEVI Teichholz[^]*?<\/tr>/) || [""])[0];
    const simpsonRow = (table.match(/<tr><td>FEVI Simpson[^]*?<\/tr>/) || [""])[0];
    expect.includes("fila Teichholz", teichRow, "FEVI Teichholz (estimación secundaria)");
    expect.includes("fila Teichholz", teichRow, "<td>—</td>");
    expect.excludes("fila Teichholz", teichRow, "55–70");
    expect.includes("fila Simpson (sin cambios)", simpsonRow, "55–70");
    expect.equal("getNormalText(feyTeichholz)", app.getNormalText("feyTeichholz", "Masculino"), "—");
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
