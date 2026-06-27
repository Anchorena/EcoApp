const APP_CONFIG = {
  appVersion: "EchoReport v1.0",
  medicoDefaultId: "matias_anchorena",
  logoDefaultId: "consultorio_matias",

  // Logos disponibles para el encabezado del informe.
  // Son independientes del médico informante: el logo puede ser institucional
  // aunque el estudio lo informe un médico específico.
  logosInforme: [
    {
      id: "consultorio_matias",
      nombre: "Consultorio Dr. Matías Anchorena",
      tipo: "consultorio",
      logo: "assets/logos/consultorio_matias/logo.png"
    },
    {
      id: "hospital_bicentenario",
      nombre: "Hospital Bicentenario",
      tipo: "institucional",
      logo: "assets/logos/hospital_bicentenario/logo.jpeg"
    },
    {
      id: "hospital_catan",
      nombre: "H.I.G.A. Simplemente Evita - González Catán",
      tipo: "institucional",
      logo: "assets/logos/hospital_catan/logo.jpeg"
    },
    {
      id: "hospital_marzetti",
      nombre: "Hospital Marzetti",
      tipo: "institucional",
      logo: "assets/logos/hospital_marzetti/logo.jpeg"
    }
  ],

  medicoDefault: {
    id: "matias_anchorena",
    nombre: "Dr. Matías Anchorena",
    matriculas: "M.P. 332.578 | M.N. 115607",
    especialidad: "Medicina Crítica y Cardiología",
    firma: "assets/profesionales/matias_anchorena/firma.png"
  },

  // Médicos informantes disponibles. El seleccionado define firma y sello.
  // Cuando firma queda vacía, la app imprime solo la línea y los datos para firma manual.
  profesionalesInformantes: [
    {
      id: "matias_anchorena",
      nombre: "Dr. Matías Anchorena",
      matriculas: "M.P. 332.578 | M.N. 115607",
      especialidad: "Medicina Crítica y Cardiología",
      firma: "assets/profesionales/matias_anchorena/firma.png"
    },
    {
      id: "ender_duarte",
      nombre: "Dr. Ender Duarte",
      matriculas: "M.P. 337524 | M.N. 169290",
      especialidad: "Medicina Crítica y Cardiología",
      firma: "assets/profesionales/ender_duarte/firma.png"
    },
    {
      id: "leo_delrio",
      nombre: "Dr. Leonardo del Río",
      matriculas: "M.P. 113733",
      especialidad: "Especialista en Cardiología",
      firma: ""
    },
    {
      id: "galindez_nicolas",
      nombre: "Dr. Nicolás Galindez",
      matriculas: "M.P. 236955 | M.N. 182669",
      especialidad: "Terapia Intensiva",
      firma: ""
    },
    {
      id: "matias_linardi",
      nombre: "Dr. Matías Linardi",
      matriculas: "M.P. 237260 | M.N. 186351",
      especialidad: "Terapia Intensiva",
      firma: ""
    },
    {
      id: "kalaydjian_federico",
      nombre: "Dr. Federico Kalaydjian",
      matriculas: "M.P. 338748 | M.N. 179174",
      especialidad: "Terapia Intensiva",
      firma: ""
    }
  ]
};

const OBRAS_SOCIALES = [
  { "nombre": "OSDE", "requiereResumen": false },
  { "nombre": "Swiss Medical", "requiereResumen": true },
  { "nombre": "IOMA", "requiereResumen": false },
  { "nombre": "PAMI", "requiereResumen": false },
  { "nombre": "Galeno", "requiereResumen": true },
  { "nombre": "Sancor Salud", "requiereResumen": false },
  { "nombre": "Prevencion Salud", "requiereResumen": false },
  { "nombre": "OMINT", "requiereResumen": true },
  { "nombre": "OSPRERA", "requiereResumen": false },
  { "nombre": "OSCHOCA", "requiereResumen": true },
  { "nombre": "OSMATA", "requiereResumen": true },
  { "nombre": "MEDIFE", "requiereResumen": true },
  { "nombre": "MEDICUS", "requiereResumen": true },
  { "nombre": "OSMECON", "requiereResumen": true },
  { "nombre": "OSPEGYPE", "requiereResumen": true },
  { "nombre": "INTEGRAL", "requiereResumen": true },
  { "nombre": "William Hope", "requiereResumen": true },
  { "nombre": "Particular", "requiereResumen": false },
  { "nombre": "Sin cobertura", "requiereResumen": false },
  { "nombre": "OSPIL", "requiereResumen": true },
  { "nombre": "OSPIM Ensalud", "requiereResumen": true },
  { "nombre": "AMEPBA Banco Pcia", "requiereResumen": true },
  { "nombre": "Accord Salud", "requiereResumen": true },
  { "nombre": "OSSEG", "requiereResumen": true },
  { "nombre": "AVALIAN", "requiereResumen": true },
  { "nombre": "PreMEDIC", "requiereResumen": true },
  { "nombre": "ANDAR-AVRA", "requiereResumen": true },
  { "nombre": "AUSTRAL Plan de Salud", "requiereResumen": true },
  { "nombre": "OSBA", "requiereResumen": true },
  { "nombre": "OSPL Ladrilleros", "requiereResumen": true },
  { "nombre": "SAT (televisión)", "requiereResumen": true },
  { "nombre": "FEDECAMARAS", "requiereResumen": true },
  { "nombre": "UOMA", "requiereResumen": true }
];

const SOLICITANTES_FRECUENTES = [
  "Dr. Anchorena Rogelio",
  "Dr. Cabrera Horacio",
  "Dr. Camilletti Jesus",
  "Dr. Garavaglia Carlos",
  "Dr. Ruiz Sala Martin",
  "Dr. Alonso",
  "Dr. Drago Humberto",
  "Dra. Rutter",
  "Dra. Mozotegui Adriana",
  "Dra. Grima Victoria",
  "Dr. Moldes",
  "Dr. Carpio",
  "Dr. Duarte Ender",
  "Dr. Centeno Pablo",
  "Dra. Benavente Ximena",
  "Dr. Montiel Ernesto",
  "Dr. Canelon Roger",
  "Dr. Rokos Juan Martin",
  "Dra. Benavente Fernanda",
  "Dra. Arena",
  "Dra. Vairo Natalia",
  "Dr. Spala Jose",
  "Dr. Olmedo Pablo",
  "Dra. Izzo Gabriela",
  "Dra. Rodriguez Eva",
  "Dra. Da Fonseca Mariangeles",
  "Dr. Monteagudo German",
  "Dr. Baquerizzo Andres",
  "Dr. Del Rio Leonardo",
  "Dr. Domanico Mariano",
  "Dr. Bernasconi Orlando",
  "Dra. Velazquez",
  "Dra. Betelu",
  "Dra. Maggi Romina",
  "Dr. Angulo Jason"
];

const SOLICITANTES_GENERICOS = [
  "Cardiología",
  "Neumonología",
  "Clínica médica",
  "Pediatría",
  "Terapia intensiva",
  "Infectología",
  "Hematología",
  "Obra social",
  "Otro / no listado"
];

const MOTIVOS_ECO_GROUPS = [
  {
    label: "Motivos frecuentes",
    options: [
      "Control cardiológico",
      "Control de salud",
      "Seguimiento",
      "Repetición de estudio",
      "HTA",
      "Arritmia",
      "Palpitaciones",
      "Síncope / presíncope",
      "Dolor precordial",
      "Angor",
      "Soplo"
    ]
  },
  {
    label: "Cardiopatía isquémica / insuficiencia cardíaca",
    options: [
      "Insuficiencia cardíaca",
      "Cardiopatía isquémica",
      "IAM",
      "Control post IAM",
      "EAP",
      "Control post CRM",
      "Control post angioplastia / stent",
      "Evaluación prequirúrgica",
      "Estratificación cardiovascular",
      "Chequeo deportivo / apto"
    ]
  },
  {
    label: "Inflamatorio / infeccioso",
    options: [
      "Fiebre o síndrome febril",
      "Endocarditis",
      "Miocarditis",
      "Pericarditis",
      "Derrame pericárdico",
      "Taponamiento cardíaco"
    ]
  },
  {
    label: "Valvulopatías",
    options: [
      "Insuficiencia mitral",
      "Estenosis mitral",
      "Insuficiencia aórtica",
      "Estenosis aórtica",
      "Reemplazo valvular",
      "Prótesis valvular / control"
    ]
  },
  {
    label: "Congénitas y otros",
    options: [
      "Cardiopatía congénita",
      "Ductus arterioso persistente",
      "Transposición de grandes vasos",
      "Dextrocardia",
      "Hipertensión pulmonar",
      "Cardio-oncología / cardiotoxicidad"
    ]
  }
];

const NORMAL_RANGES = {
  ddvi: { label: "DDVI", unit: "mm", normal: { male: "42–59", female: "39–53" } },
  dsvi: { label: "DSVI", unit: "mm", normal: { male: "25–40", female: "22–35" } },
  sivd: { label: "Septum IV", unit: "mm", normal: "6–11" },
  ppd: { label: "Pared posterior", unit: "mm", normal: "6–11" },
  aiDiam: { label: "Aurícula izquierda", unit: "mm", normal: { male: "30–40", female: "27–38" } },
  volAI: { label: "Volumen AI", unit: "ml", normal: "según superficie corporal" },
  volAIi: { label: "Vol. AI indexado", unit: "ml/m²", normal: "≤34" },
  raizAo: { label: "Raíz aórtica", unit: "mm", normal: { male: "30–40", female: "27–38" } },
  dvao: { label: "Anillo aórtico", unit: "mm", normal: "18–26 aprox." },
  relAiAo: { label: "Relación AI/Ao", unit: "", normal: "0,6–1,1" },
  vdBasal: { label: "VD basal", unit: "mm", normal: "<36" },
  tapse: { label: "TAPSE", unit: "mm", normal: ">17" },
  ad: { label: "Aurícula derecha", unit: "cm", normal: "hasta 4,4 aprox." },
  volAD: { label: "Volumen AD", unit: "ml", normal: "según superficie corporal" },
  volADi: { label: "Volumen AD indexado", unit: "ml/m²", normal: "≤27 aprox." },
  vci: { label: "VCI", unit: "mm", normal: "≤21" },
  vciColapso: { label: "VCI colapso", unit: "%", normal: ">50" },

  vtdSimpson: { label: "VTD Simpson biplano", unit: "ml", normal: "según sexo/superficie" },
  vtsSimpson: { label: "VTS Simpson biplano", unit: "ml", normal: "según sexo/superficie" },
  feySimpson: { label: "FEVI Simpson", unit: "%", normal: "55–70" },
  feyTeichholz: { label: "FEVI Teichholz", unit: "%", normal: "55–70" },
  fa: { label: "Fracción de acortamiento", unit: "%", normal: "25–45" },

  masaVIase: { label: "Masa VI (ASE)", unit: "g", normal: "según sexo" },
  indiceMasaVI: { label: "Índice masa VI", unit: "g/m²", normal: { male: "≤115", female: "≤95" } },

  ondaE: { label: "Onda E", unit: "m/s", normal: "—" },
  ondaA: { label: "Onda A", unit: "m/s", normal: "—" },
  ea: { label: "Relación E/A", unit: "", normal: "0,8–2,0" },
  eSeptal: { label: "e' septal", unit: "cm/s", normal: ">7" },
  eLateral: { label: "e' lateral", unit: "cm/s", normal: ">10" },
  ePromedio: { label: "e' promedio", unit: "cm/s", normal: "—" },
  eeSeptal: { label: "E/e' septal", unit: "", normal: "<15 aprox." },
  eeLateral: { label: "E/e' lateral", unit: "", normal: "<13 aprox." },
  eePromedioManual: { label: "E/e' promedio informado", unit: "", normal: "<14" },
  eSobreEprima: { label: "E/e' promedio", unit: "", normal: "<14" },

  phtMitral: { label: "PHT mitral", unit: "ms", normal: "—" },
  areaMitralPHT: { label: "Área mitral por PHT", unit: "cm²", normal: ">4 aprox." },

  vmaxAo: { label: "V máx aórtica", unit: "m/s", normal: "<2" },
  gradAo: { label: "Gradiente medio Ao", unit: "mmHg", normal: "<10" },
  gradAoPico: { label: "Gradiente pico Ao", unit: "mmHg", normal: "variable" },
  vtiAo: { label: "VTI aórtico", unit: "cm", normal: "18–40" },
  aoArea: { label: "Área valvular aórtica", unit: "cm²", normal: ">2,0" },

  diamTsvi: { label: "Diámetro TSVI", unit: "mm", normal: "18–22" },
  areaTsvi: { label: "Área TSVI", unit: "cm²", normal: "—" },
  vmaxTsvi: { label: "V máx TSVI", unit: "m/s", normal: "0,7–1,1" },
  vtiTsvi: { label: "VTI TSVI", unit: "cm", normal: "18–24" },
  avaContinuidad: { label: "AVA continuidad", unit: "cm²", normal: ">2,0" },

  volumenSistolico: { label: "Volumen sistólico", unit: "ml", normal: "según contexto" },
  volumenSistolicoIndexado: { label: "Volumen sistólico indexado", unit: "ml/m²", normal: "35–65" },
  gastoCardiaco: { label: "Gasto cardíaco", unit: "l/min", normal: "4–8 aprox." },

  vmaxPulm: { label: "V máx pulmonar", unit: "m/s", normal: "<2" },
  gradPulm: { label: "Gradiente medio pulmonar", unit: "mmHg", normal: "<10" },
  gradPulmPico: { label: "Gradiente pico pulmonar", unit: "mmHg", normal: "variable" },

  trVmax: { label: "TR Vmax", unit: "m/s", normal: "<2,8" },
  prADmanual: { label: "PAD / RAP informada", unit: "mmHg", normal: "3–8" },
  psapManual: { label: "PSVD / PSAP informada", unit: "mmHg", normal: "<35" },
  gradVDAD: { label: "Gradiente VD-AD", unit: "mmHg", normal: "≤28" },
  prADestimada: { label: "Pr AD estimada", unit: "mmHg", normal: "3–8" },
  psap: { label: "PSAP", unit: "mmHg", normal: "<35" },

  vmaxTric: { label: "V máx tricúspide", unit: "m/s", normal: "—" },
  tvPg: { label: "Gradiente tricuspídeo", unit: "mmHg", normal: "variable" },
  gls: { label: "GLS", unit: "%", normal: "normal aprox. ≤ -18%" },

  imc: { label: "IMC", unit: "kg/m²", normal: "18,5–24,9" },
  bsa: { label: "BSA", unit: "m²", normal: "según talla y peso" },
  fc: { label: "FC", unit: "lpm", normal: "60–100" }
};

const INPUT_FIELDS = {
  eco: [
    "ddvi",
    "dsvi",
    "sivd",
    "ppd",
    "aiDiam",
    "volAI",
    "raizAo",
    "dvao",
    "vdBasal",
    "tapse",
    "ad",
    "volAD",
    "volADi",
    "vci",
    "vciColapso",
    "vtdSimpson",
    "vtsSimpson",
    "gls"
  ],
  doppler: [
    "ondaE",
    "ondaA",
    "eSeptal",
    "eLateral",
    "eeSeptal",
    "eeLateral",
    "eePromedioManual",
    "phtMitral",
    "vmaxAo",
    "gradAo",
    "gradAoPico",
    "vtiAo",
    "aoArea",
    "diamTsvi",
    "vtiTsvi",
    "vmaxTsvi",
    "vmaxPulm",
    "gradPulm",
    "gradPulmPico",
    "trVmax",
    "prADmanual",
    "psapManual",
    "vmaxTric",
    "tvPg"
  ]
};

const SELECT_OPTIONS = {
  aoMorf: [
    "Tricúspide, de características normales, apertura y cierre conservados",
    "Bicúspide",
    "Esclerocalcificada",
    "Engrosada",
    "Prótesis biológica",
    "Prótesis mecánica"
  ],
  aoIns: ["No", "Leve", "Moderada", "Severa"],
  aoEst: ["No", "Leve", "Moderada", "Severa"],

  miMorf: [
    "Características normales, apertura y cierre conservados",
    "Engrosada",
    "Mixomatosa",
    "Prolapso",
    "Calcificación anular",
    "Restricción de velos",
    "Prótesis biológica",
    "Prótesis mecánica"
  ],
  miIns: ["No", "Leve", "Moderada", "Severa"],
  miEst: ["No", "Leve", "Moderada", "Severa"],

  puMorf: [
    "Características normales, apertura y cierre conservados",
    "Engrosada",
    "Displásica",
    "Postquirúrgica",
    "Prótesis biológica"
  ],
  puIns: ["No", "Leve", "Moderada", "Severa"],
  puEst: ["No", "Leve", "Moderada", "Severa"],

  trMorf: [
    "Características normales, apertura y cierre conservados",
    "Engrosada",
    "Prolapso",
    "Restricción de velos",
    "Anomalía de Ebstein",
    "Prótesis biológica",
    "Prótesis mecánica"
  ],
  trIns: [
    "No",
    "Fisiológica o trivial",
    "Leve",
    "Moderada",
    "Severa"
  ],
  trEst: [
    "No",
    "Leve",
    "Moderada",
    "Severa"
  ],
  pericardio: [
    "Libre",
    "Efusión mínima",
    "Derrame leve",
    "Derrame moderado",
    "Derrame severo",
    "Engrosado",
    "Taponamiento cardíaco"
  ]
};

const SEGMENT_NAMES = {
  1: "Anterior basal",
  2: "Anteroseptal basal",
  3: "Inferoseptal basal",
  4: "Inferior basal",
  5: "Inferolateral basal",
  6: "Anterolateral basal",
  7: "Anterior medio",
  8: "Anteroseptal medio",
  9: "Inferoseptal medio",
  10: "Inferior medio",
  11: "Inferolateral medio",
  12: "Anterolateral medio",
  13: "Anterior apical",
  14: "Septal apical",
  15: "Inferior apical",
  16: "Lateral apical",
  17: "Ápex"
};

const SEGMENT_VIEW_MAPS = {
  a4c: { title: "A4C", segments: [3, 9, 14, 6, 12, 16, 17] },
  a2c: { title: "A2C", segments: [4, 10, 15, 1, 7, 13, 17] },
  plax: { title: "PLAX", segments: [2, 8, 14, 5, 11, 16, 17] },
  saxBasal: { title: "Short axis basal", segments: [1, 2, 3, 4, 5, 6] },
  saxMid: { title: "Short axis medio", segments: [7, 8, 9, 10, 11, 12] },
  saxApical: { title: "Short axis apical", segments: [13, 14, 15, 16] },
  apicalCap: { title: "Apical cap", segments: [17] }
};

const SEGMENT_FACES = {
  anterior: [1, 7, 13],
  anteroseptal: [2, 8, 14],
  inferoseptal: [3, 9],
  inferior: [4, 10, 15],
  inferolateral: [5, 11, 16],
  anterolateral: [6, 12],
  apex: [17]
};

const TEXTS = {
  fey: {
    normal: "Función sistólica global conservada.",
    leve: "Deterioro leve de la función sistólica global.",
    moderada: "Deterioro moderado de la función sistólica global.",
    severa: "Deterioro severo de la función sistólica global."
  },
  masaVI: {
    normal: "Masa ventricular izquierda dentro de límites normales.",
    leve: "Hipertrofia ventricular izquierda leve.",
    moderada: "Hipertrofia ventricular izquierda moderada.",
    severa: "Hipertrofia ventricular izquierda severa."
  },
  ai: {
    normal: "Aurícula izquierda de tamaño normal.",
    leve: "Dilatación leve de aurícula izquierda.",
    moderada: "Dilatación moderada de aurícula izquierda.",
    severa: "Dilatación severa de aurícula izquierda."
  },
  vd: {
    normal: "Función sistólica del ventrículo derecho conservada.",
    alterada: "Función sistólica del ventrículo derecho disminuida."
  },
  psap: {
    normal: "Presión sistólica pulmonar estimada dentro de límites normales.",
    leve: "Presión sistólica pulmonar levemente aumentada.",
    moderada: "Hipertensión pulmonar al menos moderada.",
    severa: "Hipertensión pulmonar severa."
  }
};