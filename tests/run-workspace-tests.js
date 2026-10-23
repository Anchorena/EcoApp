/*
 * EcoApp — pruebas del selector de equipo y del workspace de revisión M7.
 *
 * Corre sin dependencias, con Node:
 *   node tests/run-workspace-tests.js
 * o con el JavaScriptCore que trae macOS:
 *   sh tests/run-workspace-tests.sh
 *
 * Usa las funciones puras de app.js (parseEchoPdfTextForDevice, buildReviewWorkspaceModel…)
 * con config.js y device-profiles.js, igual que el navegador. Fixtures sintéticos únicamente.
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

  const app = new Function(`${readText(`${repoRoot}/config.js`)}
    ${readText(`${repoRoot}/device-profiles.js`)}
    ${extractTopLevelFunctions(readText(`${repoRoot}/app.js`))}
    return { parseEchoPdfText, parseEchoPdfTextForDevice, normalizeEchoPdfText, buildReviewWorkspaceModel,
      classifyReviewItem, calculateDerived, formatInputNumber, safeNumber, getDeviceProfile };`)();

  const fixture = (path) => readText(`${repoRoot}/tests/fixtures/${path}`);

  // Formulario vacío como getFormData(); los valores del parser entran como en applyImportedMeasurements().
  const NUMERIC_FIELDS = ["edad", "fc", "peso", "talla", "ddvi", "dsvi", "sivd", "ppd", "aiDiam", "volAI", "raizAo", "dvao",
    "vdBasal", "tapse", "ad", "volAD", "volADi", "vci", "vciColapso", "vtdSimpson", "vtsSimpson", "gls", "ondaE", "ondaA",
    "eSeptal", "eLateral", "eeSeptal", "eeLateral", "eePromedioManual", "phtMitral", "vmaxAo", "gradAo", "gradAoPico", "vtiAo",
    "aoArea", "diamTsvi", "vtiTsvi", "vmaxTsvi", "vmaxPulm", "gradPulm", "gradPulmPico", "trVmax", "prADmanual", "psapManual",
    "vmaxTric", "tvPg", "miEroa", "miRVol"];
  function formFromReport(report, overrides = {}) {
    const data = { paciente: "", dni: "", studyId: "", sexo: "", fecha: "", pericardio: "" };
    NUMERIC_FIELDS.forEach((field) => { data[field] = null; });
    const decimalMap = { edad: 0, fc: 0, peso: 1, talla: 1, vciColapso: 0 };
    Object.entries(report.values).forEach(([field, value]) => {
      if (!(field in data)) return;
      data[field] = typeof value === "number" ? app.safeNumber(app.formatInputNumber(value, decimalMap[field] ?? 2)) : value;
    });
    return Object.assign(data, overrides);
  }
  function workspaceFor(path, overrides) {
    const report = app.parseEchoPdfTextForDevice(fixture(path), "auto");
    const data = formFromReport(report, overrides);
    const calc = app.calculateDerived(data);
    const model = app.buildReviewWorkspaceModel(report, data, calc);
    const row = (sectionId, key) => {
      const section = model.sections.find((s) => s.id === sectionId);
      return section ? section.rows.find((r) => r.key === key || r.label === key) : undefined;
    };
    const rowsOf = (sectionId) => ((model.sections.find((s) => s.id === sectionId) || {}).rows || []);
    return { report, data, calc, model, row, rowsOf };
  }

  const results = [];
  function test(name, fn) {
    const failures = [];
    const expect = {
      equal: (label, got, want) => { if (got !== want) failures.push(`${label}: esperado ${JSON.stringify(want)}, obtenido ${JSON.stringify(got)}`); },
      near: (label, got, want, tol = 0.01) => { if (typeof got !== "number" || Math.abs(got - want) > tol) failures.push(`${label}: esperado ≈${want}, obtenido ${got}`); },
      ok: (label, cond) => { if (!cond) failures.push(label); },
      includes: (label, text, fragment) => { if (!String(text).includes(fragment)) failures.push(`${label}: debía contener "${fragment}" (obtenido "${text}")`); }
    };
    try { fn(expect); } catch (error) { failures.push(`excepción: ${error && error.stack ? error.stack : error}`); }
    results.push({ name, failures });
  }

  const M7 = "mindray-m7/teichm-simpsonbp-ai-monoplano.txt";

  test("Selector Auto → Mindray M7 (PDF declara MINDRAY M7)", (expect) => {
    const report = app.parseEchoPdfTextForDevice(fixture(M7), "auto");
    expect.equal("equipment", report.equipment, "Mindray M7");
    expect.equal("deviceProfileId", report.deviceProfileId, "mindray-m7");
    expect.equal("deviceMode", report.deviceMode, "auto");
    expect.equal("autoImport", report.autoImport, true);
  });

  test("Override manual M7 cuando Auto no lo detecta; el texto no se modifica", (expect) => {
    // Sin "Equipo usado" ni encabezado "Cardiology Ultrasound Report": Auto no reconoce el M7.
    const original = fixture(M7).split("\n").filter((l) => !/^Equipo usado:|^Cardiology Ultrasound Report/.test(l)).join("\n");
    const copy = String(original);
    const auto = app.parseEchoPdfTextForDevice(original, "auto");
    expect.ok(`Auto no debía elegir M7 (obtuvo ${auto.deviceProfileId})`, auto.deviceProfileId !== "mindray-m7");
    expect.equal("Auto sin importación automática", auto.autoImport, false);
    const forced = app.parseEchoPdfTextForDevice(original, "mindray-m7");
    expect.equal("forzado: equipment", forced.equipment, "Mindray M7");
    expect.equal("forzado: deviceMode", forced.deviceMode, "mindray-m7");
    expect.equal("forzado sin modelo declarado: autoImport", forced.autoImport, true);
    expect.equal("forzado: lee la misma estructura", forced.values.vtdSimpson, 125);
    expect.equal("el texto de entrada no cambia", original, copy);
  });

  test("Forzar otro equipo contra lo que declara el PDF: aviso y sin importación automática", (expect) => {
    const forced = app.parseEchoPdfTextForDevice(fixture(M7), "sonoscape-s6");
    expect.equal("deviceProfileId", forced.deviceProfileId, "sonoscape-s6");
    expect.equal("autoImport", forced.autoImport, false);
    expect.includes("warning", forced.warnings.join("\n"), "Equipo forzado manualmente (Sonoscape S6)");
  });

  test("AI/Ao calculado cuando hay AI y Ao", (expect) => {
    const ws = workspaceFor(M7);
    const row = ws.row("dimensions", "relAiAo");
    expect.equal("estado", row && row.status, "calc");
    expect.near("calc.relAiAo", ws.calc.relAiAo, 38 / 32);
    expect.includes("valor mostrado", row && row.display, "1,19");
  });

  test("Volumen AD indexado calculado con volumen AD + BSA", (expect) => {
    const ws = workspaceFor(M7);
    const row = ws.row("auriculas", "volADi");
    expect.equal("volAD importado", ws.data.volAD, 40);
    expect.equal("volADi no viene del PDF", ws.data.volADi, null);
    expect.equal("estado", row && row.status, "calc");
    expect.near("valor", row && row.calcValue, 40 / ws.calc.bsa);
  });

  test("AI A2C/A4C visibles como secundarios sin rellenar volAI", (expect) => {
    const ws = workspaceFor(M7);
    expect.equal("volAI vacío", ws.data.volAI, null);
    const field = ws.row("auriculas", "volAI");
    expect.equal("volAI: estado", field && field.status, "no-informado");
    expect.includes("volAI: motivo", field && field.note, "monoplano");
    ["AI Vol(A2C)", "AI Vol(A4C)"].forEach((label) => {
      const row = ws.rowsOf("auriculas").find((r) => r.kind === "review" && r.label === label);
      expect.equal(`${label} en Aurículas como PDF · secundario`, row && row.status, "secundario");
    });
  });

  test("'No informado' separado de 'Revisar'", (expect) => {
    const ws = workspaceFor(M7);
    expect.equal("e′ septal (no está en el PDF)", ws.row("mitral", "eSeptal").status, "no-informado");
    expect.equal("TR Vmax (baja confiabilidad)", ws.row("tricuspide", "trVmax").status, "revisar");
    const conflict = workspaceFor("mindray-m7/valores-contradictorios.txt");
    expect.equal("Diámetro AI en conflicto", conflict.row("dimensions", "aiDiam").status, "revisar");
    expect.ok("los conflictos no van al final: Diám AI está en 2D / Dimensions",
      conflict.rowsOf("dimensions").some((r) => r.kind === "review" && r.label === "Diám AI" && r.status === "revisar"));
  });

  test("DNI no se sustituye por el ID de estudio/ecógrafo", (expect) => {
    const ws = workspaceFor(M7);
    expect.equal("dni", ws.data.dni, "");
    expect.equal("studyId", ws.data.studyId, "SYN-M7-0001");
    expect.equal("fila DNI", ws.row("paciente", "dni").status, "no-informado");
    expect.equal("fila ID estudio", ws.row("paciente", "studyId").status, "pdf");
  });

  test("Estados PDF / MANUAL / CALC de un mismo campo", (expect) => {
    expect.equal("DDVI del PDF", workspaceFor(M7).row("dimensions", "ddvi").status, "pdf");
    expect.equal("DDVI corregido por el médico", workspaceFor(M7, { ddvi: 50 }).row("dimensions", "ddvi").status, "manual");
    expect.equal("FEVI Simpson BP", workspaceFor(M7).row("simpson", "feySimpson").status, "calc");
    const fe = workspaceFor(M7).row("simpson", "raw:FE(Simp BP)");
    expect.equal("FE(Simp BP) del equipo: estado", fe && fe.status, "secundario");
    expect.equal("FE(Simp BP) del equipo: valor", fe && fe.display, "58,4 %");
    const teich = workspaceFor(M7).row("vi", "feyTeichholz");
    expect.includes("Teichholz como estimación secundaria", teich && teich.note, "secundaria");
  });

  test("Ángulos de insonación (θ) no se listan para revisión", (expect) => {
    const ws = workspaceFor(M7);
    const thetaRows = ws.model.sections.flatMap((s) => s.rows).filter((r) => /θ/.test(r.label));
    expect.equal("filas con θ", thetaRows.length, 0);
    expect.ok("siguen en rawEntries", ws.report.rawEntries.some((e) => /θ/.test(e.label)));
  });

  test("Sonoscape S6 sin cambios: mismo parser, importación automática y sin workspace M7", (expect) => {
    const text = fixture("sonoscape-s6/basico.txt");
    const report = app.parseEchoPdfTextForDevice(text, "auto");
    expect.equal("deviceProfileId", report.deviceProfileId, "sonoscape-s6");
    expect.equal("autoImport", report.autoImport, true);
    expect.equal("sin workspace M7", app.getDeviceProfile(report.deviceProfileId).workspace, undefined);
    expect.equal("valores idénticos al parser de siempre", JSON.stringify(report.values), JSON.stringify(app.parseEchoPdfText(text).values));
  });

  test("M8/M9 declarado: perfil no validado, sin importación automática", (expect) => {
    const report = app.parseEchoPdfTextForDevice(fixture("mindray-m7/deteccion-m8-explicito.txt"), "auto");
    expect.equal("deviceProfileId", report.deviceProfileId, "mindray-m8m9");
    expect.equal("autoImport", report.autoImport, false);
    expect.includes("aviso", report.warnings.join("\n"), "No validado / soporte futuro");
  });

  test("Philips (sin parser): no procesa mediciones", (expect) => {
    const report = app.parseEchoPdfTextForDevice(fixture(M7), "philips");
    expect.equal("sin valores", Object.keys(report.values).length, 0);
    expect.equal("autoImport", report.autoImport, false);
    expect.includes("aviso", report.warnings.join("\n"), "sin parser (soporte futuro)");
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
