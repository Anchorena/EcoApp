# Revisión del PDF del equipo (workspace)

Issue: Anchorena/EcoApp#7. Código: `device-profiles.js` (datos) y, en `app.js`,
`parseEchoPdfTextForDevice()`, `buildReviewWorkspaceModel()`, `classifyReviewItem()`,
`renderReviewWorkspace()` y `setDeviceMode()`. Pruebas: `sh tests/run-workspace-tests.sh`.

## Flujo

PDF → detector de equipo (o equipo forzado) → parser específico → modelo común (los inputs de siempre)
→ workspace de revisión → cálculos → ojo de buey → narrativa → conclusión → informe.

El workspace **no tiene estado propio**: cada control escribe en el input original (el mismo que lee
`getFormData()`), y `updateAll()` vuelve a sincronizar el workspace. Cálculos, narrativa, PDF y guardado
siguen leyendo exactamente los mismos campos.

## Selector de equipo

`Auto | Mindray M7 | Mindray M8/M9 | Sonoscape S6 | Esaote | Philips | Otro` (`DEVICE_PROFILES`).

- **Auto** (por defecto): usa `parseEchoPdfText()`; el botón del equipo detectado queda resaltado.
- **Forzar** un equipo sólo cambia qué parser corre; el texto del PDF no se toca.
  - Si el PDF declara otro equipo (`Equipo usado: …`), se avisa y **no** se importa automáticamente.
  - Si no declara equipo (Auto no lo reconoce), forzar un equipo validado sí importa los campos vacíos.
- Estados: `validated` (M7, S6: importación automática de campos vacíos), `unvalidated` (M8/M9, Esaote:
  parser inicial, "No validado / soporte futuro", sin importación automática) y `future` (Philips, Otro:
  sin parser, el PDF sólo se adjunta).
- La importación automática nunca pisa un campo con datos. La fecha de hoy que el formulario pone por
  defecto cuenta como vacía, para que se use la fecha del examen del PDF.

## Workspace M7

Secciones en el orden del reporte del equipo (`M7_REVIEW_SECTIONS`): Paciente / estudio, 2D / Dimensions,
VI / función sistólica, Simpson BP, Aurículas, Mitral / TDI, Aórtica / TSVI, Pulmonar, Tricúspide / PSAP y
Otros / revisión. Sonoscape S6 y los equipos no validados conservan la lectura genérica del anexo.

### Estados de cada dato

| Estado | Significado |
|---|---|
| `PDF` | El valor del formulario es el que importó el parser. |
| `MANUAL` | El valor del formulario difiere del PDF o lo cargó el médico. |
| `CALC` | Calculado por EcoApp (`calculateDerived()`): AI/Ao, BSA, FEVI Simpson, Teichholz (secundaria), masa, E/A, E/e′, volumen AI/AD indexado, PSAP. |
| `REVISAR` | Conflicto entre valores, baja confiabilidad (p. ej. TR Vmax < 1 m/s), unidad inesperada, bloque no reconocido o semántica no validada. |
| `PDF · secundario` | El PDF lo trae pero no alimenta el modelo principal (monoplanos, menor prioridad, sin campo en el modelo, TSVD…). |
| `No informado` | El campo está vacío y el PDF no lo trae (o sólo trae un dato secundario relacionado, que se explica en la nota). |

- `volADi`: si el input está vacío y hay volumen AD + BSA, se muestra el valor calculado (`CALC`); escribir un
  valor lo reemplaza.
- Los ángulos de insonación (`… θ`) no se listan: son datos técnicos y quedan en `report.rawEntries`.
- FEVI: se mantiene la política vigente (Simpson BP principal; Teichholz secundaria, nunca promovida).

## Pendientes (no se mapean todavía)

Ver `docs/parser-mindray-m7.md` → "Pendientes detectados en PDFs reales".
