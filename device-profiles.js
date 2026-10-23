// Perfiles de equipo y estructura del workspace de revisión.
// Sólo datos (como config.js): la lógica vive en app.js. Se carga antes de app.js.
//
// status:
//   "validated"   → parser validado con PDFs reales; importación automática de campos vacíos.
//   "unvalidated" → existe un parser inicial pero sin validación suficiente: no se importa
//                   automáticamente y se marca "No validado / soporte futuro".
//   "future"      → sin parser: el PDF sólo se adjunta.

const DEVICE_PROFILES = [
  { id: "auto", label: "Auto", status: "auto" },
  { id: "mindray-m7", label: "Mindray M7", status: "validated", parser: "mindrayM7", equipment: ["Mindray M7"], autoImport: true, workspace: "m7" },
  { id: "mindray-m8m9", label: "Mindray M8/M9", status: "unvalidated", parser: "mindrayM8M9", equipment: ["Mindray M8/M9"], autoImport: false },
  { id: "sonoscape-s6", label: "Sonoscape S6", status: "validated", parser: "sonoscape", equipment: ["Sonoscape"], autoImport: true, workspace: "s6" },
  { id: "esaote", label: "Esaote", status: "unvalidated", parser: "esaote", equipment: ["ESAOTE MyLab"], autoImport: false },
  { id: "philips", label: "Philips", status: "future" },
  { id: "otro", label: "Otro", status: "future" }
];

const DEVICE_STATUS_LABELS = {
  auto: "Detección automática",
  validated: "Validado",
  unvalidated: "No validado / soporte futuro",
  future: "No validado / soporte futuro"
};

// Workspace de revisión Mindray M7, en el orden del reporte del equipo.
// Cada ítem es uno de:
//   { field }        → input del modelo común (misma fuente que getFormData()).
//   { calc }         → derivado de calculateDerived() (sólo lectura, CALC).
//   { field, calc }  → input que, vacío, muestra el valor calculado por EcoApp (p. ej. volADi).
//   { raw }          → valor del PDF que no alimenta el modelo (PDF · secundario).
// `secondary`: etiquetas del PDF (regex) que no se importan y se muestran en esta sección.
// `reviewFor`: etiquetas del PDF que, si quedaron en revisión, explican por qué el campo está vacío.
const M7_REVIEW_SECTIONS = [
  {
    id: "paciente", title: "Paciente / estudio",
    items: [
      { field: "paciente", label: "Paciente" },
      { field: "dni", label: "DNI", note: "El ID del ecógrafo no es DNI." },
      { field: "studyId", label: "ID estudio/ecógrafo" },
      { field: "sexo", label: "Sexo" },
      { field: "edad", label: "Edad", unit: "años" },
      { field: "fecha", label: "Fecha" },
      { field: "peso", label: "Peso", unit: "kg" },
      { field: "talla", label: "Talla", unit: "cm" },
      { field: "fc", label: "FC", unit: "lpm", reviewFor: ["HR"] },
      { calc: "bsa", label: "BSA", unit: "m²", decimals: 2 }
    ]
  },
  {
    id: "dimensions", title: "2D / Dimensions",
    items: [
      { field: "ddvi", label: "DDVI", unit: "mm", reviewFor: ["DIVId"] },
      { field: "dsvi", label: "DSVI", unit: "mm", reviewFor: ["DIVIs"] },
      { field: "sivd", label: "Septum IV", unit: "mm", reviewFor: ["SIVd"] },
      { field: "ppd", label: "Pared posterior", unit: "mm", reviewFor: ["PPVId"] },
      { field: "aiDiam", label: "Diámetro AI", unit: "mm", reviewFor: ["Diám AI"] },
      { field: "raizAo", label: "Raíz aórtica", unit: "mm", reviewFor: ["Diám ao"] },
      { calc: "relAiAo", label: "AI/Ao", decimals: 2 },
      { field: "diamTsvi", label: "Diámetro TSVI", unit: "mm", reviewFor: ["Diám TSVI"] }
    ],
    secondary: [/^Diám VA$/, /^Diám (Asc|Des) Aórt$/, /^VD (Mayor|Menor)$/]
  },
  {
    id: "vi", title: "VI / función sistólica",
    items: [
      { calc: "feyTeichholz", label: "FEVI Teichholz (estimación secundaria)", unit: "%", decimals: 1, secondary: true },
      { calc: "fa", label: "Fracción de acortamiento", unit: "%", decimals: 1 },
      { calc: "masaVIase", label: "Masa VI (ASE)", unit: "g", decimals: 0 },
      { calc: "indiceMasaVI", label: "Índice de masa VI", unit: "g/m²", decimals: 0 }
    ],
    secondary: [/^SIVs$/, /^PPVIs$/, /^DIVI[ds]$/, /^SIVd$/, /^PPVId$/]
  },
  {
    id: "simpson", title: "Simpson BP",
    items: [
      { field: "vtdSimpson", label: "VTD Simpson BP", unit: "ml", reviewFor: ["VFD(Simp BP)", "VFD(A4C)", "VFD(A2C)"] },
      { field: "vtsSimpson", label: "VTS Simpson BP", unit: "ml", reviewFor: ["VFS(Simp BP)", "VFS(A4C)", "VFS(A2C)"] },
      { calc: "feySimpson", label: "FEVI Simpson BP", unit: "%", decimals: 1 },
      { raw: "FE(Simp BP)", label: "FE(Simp BP) informada por el equipo" }
    ],
    secondary: [/^VF[DS]\((A2C|A4C)\)$/, /^(LVId|LVIs|AVId|AVIs)$/]
  },
  {
    id: "auriculas", title: "Aurículas",
    items: [
      { field: "volAI", label: "Volumen AI (BP)", unit: "ml", reviewFor: ["AI Vol(BP)", "AI Vol(Simp BP)", "AI Vol(A2C)", "AI Vol(A4C)"] },
      { calc: "volAIi", label: "Volumen AI indexado", unit: "ml/m²", decimals: 1 },
      { field: "volAD", label: "Volumen AD", unit: "ml", reviewFor: ["AD Vol(A4C)"] },
      { field: "volADi", calc: "volADi", label: "Volumen AD indexado", unit: "ml/m²", decimals: 1 },
      { field: "ad", label: "Aurícula derecha (área/diámetro)" }
    ],
    secondary: [/^AI Vol\(/, /^AD Vol\(/]
  },
  {
    id: "mitral", title: "Mitral / TDI",
    items: [
      { field: "ondaE", label: "Onda E", unit: "m/s", reviewFor: ["E Vel VM"] },
      { field: "ondaA", label: "Onda A", unit: "m/s", reviewFor: ["VM A Vel"] },
      { calc: "ea", label: "E/A", decimals: 2 },
      { field: "eSeptal", label: "e′ septal", unit: "cm/s" },
      { field: "eLateral", label: "e′ lateral", unit: "cm/s" },
      { field: "eeSeptal", label: "E/e′ septal", reviewFor: ["MV E/E' Septal"] },
      { field: "eeLateral", label: "E/e′ lateral", reviewFor: ["E/E' lateral VM"] },
      { calc: "eSobreEprima", label: "E/e′ promedio", decimals: 1 },
      { field: "phtMitral", label: "PHT mitral", unit: "ms" }
    ],
    secondary: [/^(E Dur VM|VM A Dur)$/, /^MV E\/E'/, /^E\/E'/]
  },
  {
    id: "aortica", title: "Aórtica / TSVI",
    items: [
      { field: "vmaxAo", label: "Vmáx VA", unit: "m/s", reviewFor: ["Vmáx VA"] },
      { field: "gradAoPico", label: "Gradiente pico Ao", unit: "mmHg", reviewFor: ["PGmáx VA"] },
      { field: "gradAo", label: "Gradiente medio Ao", unit: "mmHg", reviewFor: ["PGmed VA"] },
      { field: "vtiAo", label: "VTI VA", unit: "cm", reviewFor: ["VTI VA"] },
      { field: "diamTsvi", label: "Diámetro TSVI", unit: "mm", reviewFor: ["Diám TSVI"] },
      { field: "vtiTsvi", label: "VTI TSVI", unit: "cm", reviewFor: ["VTI TSVI"] },
      { field: "vmaxTsvi", label: "Vmáx TSVI", unit: "m/s", reviewFor: ["Vmáx TSVI"] },
      { field: "aoArea", label: "AVA / VAA(VTI)", unit: "cm²", reviewFor: ["VAA(VTI)"] }
    ],
    secondary: [/^Vmed (TSVI|VA)$/]
  },
  {
    id: "pulmonar", title: "Pulmonar",
    items: [
      { field: "vmaxPulm", label: "Vmáx pulmonar", unit: "m/s", reviewFor: ["Vmáx VP"] },
      { field: "gradPulmPico", label: "Gradiente pico pulmonar", unit: "mmHg", reviewFor: ["PGmáx VP"] },
      { field: "gradPulm", label: "Gradiente medio pulmonar", unit: "mmHg", reviewFor: ["PGmed VP"] }
    ],
    secondary: [/^(VTI VP|Vmed VP)$/]
  },
  {
    id: "vd", title: "VD / función derecha",
    items: [
      { field: "vdBasal", label: "Diámetro basal VD", unit: "mm" },
      { field: "tapse", label: "TAPSE", unit: "mm" },
      { field: "vci", label: "Diámetro VCI", unit: "mm" },
      { field: "vciColapso", label: "Colapso VCI", unit: "%" }
    ],
    secondary: [/^VD (Mayor|Menor)$/]
  },
  {
    id: "tricuspide", title: "Tricúspide / PSAP",
    items: [
      { field: "vmaxTric", label: "Vmáx transvalvular tricuspídea", unit: "m/s", reviewFor: ["TV Vmax"] },
      { field: "trVmax", label: "TR Vmax", unit: "m/s", reviewFor: ["TR Vmax"] },
      { field: "tvPg", label: "Gradiente TR", unit: "mmHg", reviewFor: ["TR PGmax"] },
      { field: "prADmanual", label: "RAP / Pres RA", unit: "mmHg", reviewFor: ["RAP", "Pres RA"] },
      { field: "psapManual", label: "PSVD informada", unit: "mmHg", reviewFor: ["PSVD"] },
      { calc: "psap", label: "PSAP usada por EcoApp", unit: "mmHg", decimals: 0 }
    ],
    secondary: [/^TV (E Vel|A Vel|Vmean|PGmax|PGmean)$/, /^VTI VT$/, /^TR (Vmax|PGmax)$/, /^PSVD$/]
  },
  {
    id: "otros", title: "Otros / revisión",
    items: [],
    secondary: [/./]
  }
];

// S6 comparte el modelo ecocardiográfico y los mismos controles editables.
// Se excluyen etiquetas y valores secundarios exclusivos del reporte M7.
const S6_REVIEW_SECTIONS = M7_REVIEW_SECTIONS.map((section) => ({
  id: section.id,
  title: section.title,
  items: section.items.filter((item) => !item.raw).map(({ reviewFor, ...item }) => item)
}));
