/*
 * EcoApp — pruebas de regresión de los parsers de PDF de ecógrafos.
 *
 * Corre sin dependencias, con Node:
 *   node tests/run-parser-tests.js
 * o con el JavaScriptCore que trae macOS:
 *   sh tests/run-parser-tests.sh
 *
 * Extrae de app.js todas las declaraciones `function` de primer nivel (las que
 * no tocan el DOM al declararse) y ejecuta parseEchoPdfText() sobre cada fixture
 * de texto listado en tests/fixtures/cases.json.
 *
 * Los fixtures son texto SINTÉTICO que reproduce el formato que produce
 * getPdfTextLines() (PDF.js) para cada equipo. Nunca usar datos de pacientes reales.
 *
 * Tipos de expectativa por caso (archivo .expected.json):
 *   values          → campos que deben importarse con ese valor exacto (tolerancia 1e-6)
 *   absent          → campos que NO deben importarse
 *   equipment       → nombre del equipo detectado
 *   notEquipment    → nombre de equipo que NO debe detectarse
 *   isMindrayM7     → resultado esperado de isMindrayM7Text() sobre el texto normalizado
 *   warningsInclude → fragmentos de texto que deben aparecer en warnings
 *   warningsExclude → fragmentos de texto que NO deben aparecer en warnings
 *   reviewInclude   → etiquetas que deben aparecer en report.review; "Etiqueta :: fragmento"
 *                     exige además que el motivo de alguno de esos ítems contenga el fragmento
 *   exactValues     → true: report.values debe ser exactamente `values` (snapshot)
 */
// En jsc, `arguments` de nivel superior son los argumentos del script.
const jscScriptArgs = typeof arguments !== "undefined" ? Array.from(arguments) : [];

(function () {
  "use strict";

  const isNode = typeof process !== "undefined" && process.versions && process.versions.node;
  const fs = isNode ? require("fs") : null;
  const pathJoin = (...parts) => parts.join("/").replace(/\/+/g, "/");
  const readText = (p) => (isNode ? fs.readFileSync(p, "utf8") : readFile(p));
  const out = (msg) => (isNode ? console.log(msg) : print(msg));

  const args = isNode ? process.argv.slice(2) : jscScriptArgs;
  const repoRoot = args[0] || (isNode ? require("path").resolve(__dirname, "..") : ".");
  const updateSnapshots = args.includes("--update-snapshots");

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

  function loadParsers() {
    const source = readText(pathJoin(repoRoot, "app.js"));
    const body = `${extractTopLevelFunctions(source)}
      return { parseEchoPdfText, normalizeEchoPdfText, isMindrayM7Text };`;
    return new Function(body)();
  }

  function approxEqual(a, b) {
    if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < 1e-6;
    return a === b;
  }

  function roundValues(values) {
    const result = {};
    Object.keys(values).sort().forEach((key) => {
      const value = values[key];
      result[key] = typeof value === "number" ? Number(value.toFixed(6)) : value;
    });
    return result;
  }

  function runCase(parsers, testCase) {
    const failures = [];
    const text = readText(pathJoin(repoRoot, "tests/fixtures", testCase.fixture));
    const expected = JSON.parse(readText(pathJoin(repoRoot, "tests/fixtures", testCase.expected)));
    const report = parsers.parseEchoPdfText(text);
    const values = report.values || {};

    if (updateSnapshots && expected.exactValues) {
      out(`--- snapshot ${testCase.expected}\n${JSON.stringify({ equipment: report.equipment, values: roundValues(values) }, null, 2)}`);
    }

    if ("isMindrayM7" in expected) {
      const got = parsers.isMindrayM7Text(parsers.normalizeEchoPdfText(text));
      if (got !== expected.isMindrayM7) failures.push(`isMindrayM7Text: esperado ${expected.isMindrayM7}, obtenido ${got}`);
    }
    if (expected.notEquipment && report.equipment === expected.notEquipment) {
      failures.push(`equipment: NO debía ser "${expected.notEquipment}"`);
    }
    if (expected.equipment && report.equipment !== expected.equipment) {
      failures.push(`equipment: esperado "${expected.equipment}", obtenido "${report.equipment}"`);
    }
    Object.entries(expected.values || {}).forEach(([field, want]) => {
      if (!(field in values)) failures.push(`${field}: esperado ${JSON.stringify(want)}, no importado`);
      else if (!approxEqual(values[field], want)) failures.push(`${field}: esperado ${JSON.stringify(want)}, obtenido ${JSON.stringify(values[field])}`);
    });
    (expected.absent || []).forEach((field) => {
      if (field in values) failures.push(`${field}: NO debía importarse, obtenido ${JSON.stringify(values[field])}`);
    });
    if (expected.exactValues) {
      Object.keys(values).forEach((field) => {
        if (!(field in (expected.values || {}))) failures.push(`${field}: importado sin estar en el snapshot (${JSON.stringify(values[field])})`);
      });
    }
    const warningsText = (report.warnings || []).join("\n");
    const repeated = (report.warnings || []).filter((w, i, all) => all.indexOf(w) !== i);
    if (repeated.length) failures.push(`warnings repetidos: ${[...new Set(repeated)].map((w) => `"${w}"`).join(", ")}`);
    (expected.warningsInclude || []).forEach((fragment) => {
      if (!warningsText.includes(fragment)) failures.push(`warning faltante: "${fragment}"`);
    });
    (expected.warningsExclude || []).forEach((fragment) => {
      if (warningsText.includes(fragment)) failures.push(`warning inesperado: "${fragment}"`);
    });
    const review = report.review || [];
    (expected.reviewInclude || []).forEach((spec) => {
      const [label, reason] = spec.split(" :: ");
      const ok = review.some((item) => item.label === label && (!reason || String(item.reason).includes(reason)));
      if (!ok) failures.push(`review faltante: "${spec}"`);
    });
    return failures;
  }

  const parsers = loadParsers();
  const cases = JSON.parse(readText(pathJoin(repoRoot, "tests/fixtures/cases.json")));
  let failed = 0;
  cases.forEach((testCase) => {
    let failures;
    try {
      failures = runCase(parsers, testCase);
    } catch (error) {
      failures = [`excepción: ${error && error.stack ? error.stack : error}`];
    }
    if (failures.length) {
      failed += 1;
      out(`FAIL ${testCase.fixture}`);
      failures.forEach((f) => out(`     - ${f}`));
    } else {
      out(`ok   ${testCase.fixture}`);
    }
  });
  out(`\n${cases.length - failed}/${cases.length} casos OK`);
  if (failed) {
    if (isNode) process.exitCode = 1;
    else throw new Error(`${failed} caso(s) fallaron`);
  }
})();
