# Parser Mindray M7

Implementación: `isMindrayM7Text()`, `tokenizeMindrayM7Text()` y `parseMindrayM7PdfText()` en `app.js`.
Pruebas: `sh tests/run-parser-tests.sh` (fixtures sintéticos en `tests/fixtures/mindray-m7/`).

## Detección

- `Equipo usado: MINDRAY M7`, o bien la estructura propia del M7
  (`Cardiology Ultrasound Report - n / m` + `Fecha Exa:`), en cuyo caso se avisa que hay que confirmar el equipo.
- Se evalúa antes que la rama Mindray general (M8/M9), que no cambió.

## Cómo se lee el PDF

El M7 imprime pares `Etiqueta: valorunidad` dentro de bloques (`2D / M-Mode / Doppler / TDI Measurements`)
y sub-bloques (`Teichholz(M)`, `Simpson BP`, `AI/Ao(2D)`, `TR`, `PSVD`…). La misma etiqueta puede repetirse
en distintos bloques con valores distintos (HR, `Diám AI`, `Diám ao`), por eso **no hay búsqueda global**:
cada par se tokeniza con su bloque y se asigna por contexto. Los encabezados repetidos de cada página se
ignoran. Un sub-bloque desconocido no hereda el contexto anterior: sus valores quedan para revisión.
Los sub-bloques `AI/Ao(2D)`, `Ao/AI(2D)`, `AI/Ao(M)` y `Ao/AI(M)` terminan en su línea de cociente (`AI/Ao:` / `Ao/AI:`); lo que
sigue vuelve a ser `Dimensions` general (por ejemplo `Diám ao`, `Diám VA`, `ACS`).

## Prioridades y conflictos

1. Se toma el **nivel de prioridad más alto que tenga candidatos**.
2. Si dentro de ese nivel hay candidatos equivalentes con valores distintos → **no se importa**, warning,
   y **no** se cae al nivel inferior.
3. Los candidatos de niveles inferiores quedan en revisión; si difieren del valor elegido, warning.
4. Cocientes informados por el equipo (E/e′): si hay valores distintos, no se importa ninguno y cada
   candidato queda en revisión con su sección.

| Campo | Prioridad |
|---|---|
| `fc` | HR del encabezado > HR del bloque `Simpson BP` (con aviso). Nunca HR de Teichholz u otros bloques. |
| `ddvi`, `dsvi`, `sivd`, `ppd` | `Teichholz(2D)` > `Teichholz(M)` (regla general: 2D explícito antes que M-Mode). |
| `raizAo` | `2D › Dimensions` general > `AI/Ao(2D)` · `Ao/AI(2D)` > M-Mode (con aviso). |
| `aiDiam` | `AI/Ao(2D)` · `Ao/AI(2D)` > `AI/Ao(M)` · `Ao/AI(M)` (con aviso). Un `Diám AI` de cualquier otro bloque sólo se usaría si su semántica estuviera validada; hoy ninguno lo está (queda en revisión). **Nunca** `AI Vol(A-L)`. |
| `vtdSimpson`, `vtsSimpson` | Sólo `VFD/VFS(Simp BP)`. `A4C`/`A2C` son monoplano: nunca se cargan como biplano. |
| `volAI` | Sólo `AI Vol(BP)` / `AI Vol(Simp BP)`. `A4C`/`A2C` solos quedan en revisión (sin `Math.max`, sin promedio). |

### `Diám AI` del bloque `AI Vol(A-L)` no es `aiDiam`

Dentro de `Atria Volume › AI Vol(A-L)` el M7 imprime un `Diám AI` que forma parte del **método
área-longitud para el volumen auricular**. No está demostrado que sea el diámetro lineal estándar de AI
que usa EcoApp (`aiDiam`, medido en `AI/Ao`), así que **no se mapea** ni se usa como respaldo: queda en
revisión con el motivo "Medición asociada al método area-length de volumen AI; no se mapea a aiDiam
automáticamente". Si sólo existe además una medición M-Mode `AI/Ao(M)`, `aiDiam` sale de M-Mode con aviso.

## Mapeos confirmados

| Etiqueta M7 | Bloque | Campo | Conversión |
|---|---|---|---|
| `DIVId`, `DIVIs`, `SIVd`, `PPVId` | Teichholz | `ddvi`, `dsvi`, `sivd`, `ppd` | cm → mm |
| `VFD(Simp BP)`, `VFS(Simp BP)` | Simpson BP | `vtdSimpson`, `vtsSimpson` | ml |
| `AD Vol(A4C)` | AD Vol(Simp) | `volAD` | ml |
| `Diám AI` | `AI/Ao(2D)` · `Ao/AI(2D)` (respaldo: `AI/Ao(M)` · `Ao/AI(M)`) | `aiDiam` | cm → mm |
| `Diám ao` | `2D › Dimensions` (respaldo: `AI/Ao(2D)`, luego M-Mode) | `raizAo` | cm → mm |
| `Diám TSVI`, `VTI TSVI`, `Vmáx TSVI` | Aortic / VMA / VAA | `diamTsvi`, `vtiTsvi`, `vmaxTsvi` | cm → mm, cm, cm/s → m/s |
| `Vmáx VA`, `PGmáx VA`, `PGmed VA`, `VTI VA`, `VAA(VTI)` | Aortic / VAA(VTI) | `vmaxAo`, `gradAoPico`, `gradAo`, `vtiAo`, `aoArea` | cm/s → m/s |
| `E Vel VM`, `VM A Vel` | Mitral Valve | `ondaE`, `ondaA` | cm/s → m/s |
| `TV Vmax` | **Tricuspid Valve** (flujo anterógrado) | `vmaxTric` | cm/s → m/s. Separado de `TR Vmax`. |
| `TR Vmax`, `TR PGmax` | TR / PSVD / PISA RT (jet de IT) | `trVmax`, `tvPg` | cm/s → m/s (ver salvaguarda) |
| `PSVD` | PSVD | `psapManual` | sólo si el TR Vmax es utilizable |
| `RAP`, `Pres RA` | PSVD / PAEDP / encabezado | `prADmanual` | mmHg |
| `Vmáx VP`, `PGmáx VP`, `PGmed VP` | **Pulmonic Valve** (válvula) | `vmaxPulm`, `gradPulmPico`, `gradPulm` | cm/s → m/s |

No verificadas en un M7 real (mismas etiquetas que el parser M8/M9; se usan sólo si aparecen):
`Vel. septal/lateral E' VM`, `MV E/E' Septal`, `E/E' lateral VM`, `MV E/E'`, `EROA RM`.

## Salvaguarda de TR Vmax (no es criterio diagnóstico)

- `TR Vmax = 0` → el M7 lo usa para "no medido": no utilizable.
- `TR Vmax < 1 m/s` → **salvaguarda técnica del parser**, no un criterio diagnóstico ni una afirmación sobre
  la ausencia de insuficiencia tricuspídea. Se trata como medición de **baja confiabilidad para estimar la PSAP**:
  el valor original queda en la lista de revisión con warning, pero no se carga automáticamente en `trVmax`
  (porque `calculateDerived()` lo usaría para calcular la PSAP), ni `TR PGmax` en `tvPg`, ni la `PSVD` que el
  equipo derivó de ese TR en `psapManual`. El médico puede cargarlo manualmente si lo considera válido.
- Constante: `TR_VMAX_MIN_AUTO_PSAP` en `parseMindrayM7PdfText()`.
- En los 6 PDFs M7 reales analizados el TR Vmax fue 0–0,61 m/s; en uno, la PSVD del equipo daba 3,37 mmHg.

## Sin mapear (quedan visibles en "Datos del PDF no importados / a revisar")

- `ID`: identificador interno del equipo; **no se usa como DNI**.
- `Diám VA`, `ACS`, `VD Mayor`, `VD Menor`, `Diám Asc Aórt`, `Diám Des Aórt`, `SIVs`, `PPVIs`.
- `Vmáx TSVD`, `Vmed TSVD`, `TSVD VTI` — tracto de salida del VD: sin campo en el modelo, no se mapea.
- `Vmed TSVI`, `Vmed VA`, `Vmed VP`, `VTI VP`, `TV E Vel`, `TV A Vel`, `TV Vmean`, `VTI VT`.
- `MR Rad`, `MR Als.Vel`, `Fluj RM` (ml/s = caudal, **no** volumen regurgitante), `E Dur VM`, `VM A Dur`.
- Simpson monoplano (`VFD/VFS(A4C|A2C)`, `Simp PS(...)`), AI Vol monoplano.
- `AI Vol(A-L)` (volumen AI por área-longitud): no es Simpson biplano; no se carga en `volAI`.
  Su `Diám AI` tampoco se carga en `aiDiam` (ver arriba).

Se omiten de la lista sólo derivados calculados por el propio equipo (SV/SI/CO/CI/FE/FS, cocientes,
gradientes derivados de velocidades, ángulos θ, longitudes de Simpson). Todos los pares leídos quedan en
`report.rawEntries` para trazabilidad.

## Deuda técnica crítica (fuera de este cambio)

- **`feyTeichholz` usa la fórmula cúbica simple** `(DDVI³ − DSVI³) / DDVI³` en `calculateDerived()`, no la
  corrección de Teichholz. Cuando no hay Simpson BP, la FEVI del informe automático sale de esa fórmula.
  **Requiere un hotfix separado antes de considerar confiable el informe automático sin Simpson BP.**
- ESAOTE: `parseEsaotePdfText()` sigue usando `Math.max(BP, A4C, A2C)` para `volAI` (el snapshot de regresión
  fija el comportamiento actual).
- `interpretDiastolic()` clasifica sólo con E/A y E/e′.
