# Métodos de FEVI en EcoApp

Implementación: `calculateTeichholzVolume()`, `calculateTeichholz()`, `calculateDerived()` e
`interpretFeyFromCalc()` en `app.js`. Pruebas: `sh tests/run-fevi-tests.sh`.

## Simpson biplano — método principal

- `feySimpson = (VTD − VTS) / VTD × 100`, con `vtdSimpson` / `vtsSimpson` en ml.
- Sólo se calcula si ambos volúmenes son mayores que 0 y `VTS < VTD`; si no, queda `null`
  (antes un VTS ≥ VTD producía una FEVI negativa).
- Es la **única** fuente de `feyPrincipal` (`feyMethod = "Simpson"`), que es lo que clasifica la función
  sistólica en la descripción, la conclusión, las insignias y las alertas. Esto sigue las recomendaciones
  actuales de cuantificación de cavidades (ASE/EACVI), que prefieren los volúmenes 2D por el método
  biplano de discos.
- Si hay Simpson, es la FEVI principal aunque también puedan calcularse DDVI/DSVI y Teichholz.

## Teichholz — estimación lineal secundaria (legacy)

Fórmula (Teichholz, 1976), con el diámetro **en cm** y el volumen en ml:

```
V = 7 / (2.4 + D) × D³

Dd = ddvi / 10        (ddvi en mm → cm)
Ds = dsvi / 10        (dsvi en mm → cm)
VTD_Teichholz = 7 / (2.4 + Dd) × Dd³
VTS_Teichholz = 7 / (2.4 + Ds) × Ds³
FEVI_Teichholz = (VTD_Teichholz − VTS_Teichholz) / VTD_Teichholz × 100
```

- Nunca se usan los mm directamente dentro de la ecuación.
- No se calcula (todo `null`) si falta DDVI o DSVI, si alguno es ≤ 0 o si `DSVI ≥ DDVI`.
- Resultados expuestos por `calculateDerived()`: `feyTeichholz`, `vtdTeichholz`, `vtsTeichholz`.
- Se muestra como "FEVI Teichholz (estimación secundaria)" en el panel de cálculos y como "FEVI Teichholz"
  en las tablas de mediciones, siempre separada de "FEVI Simpson".

Hasta este cambio, `feyTeichholz` usaba `(DDVI³ − DSVI³) / DDVI³ × 100` (método cúbico simple, no
Teichholz), que sobrestima la FEVI respecto de Teichholz (por ejemplo, 58,5/44,7 mm daba 55,4 % en lugar
de 46,4 %).

## Por qué Teichholz no se promociona a FEVI principal

- Deriva un volumen de **un solo diámetro lineal** suponiendo una geometría elipsoidal fija del VI.
- Esa suposición falla con trastornos segmentarios de la motilidad (asinergia), aneurismas, remodelado
  o geometría distinta de la esperada, y con cortes oblicuos del diámetro.
- Las guías actuales no recomiendan los métodos derivados de dimensiones lineales (Teichholz, Quinones)
  para el cálculo clínico rutinario de volúmenes y FEVI.

Por eso, **sin Simpson, EcoApp no clasifica automáticamente la función sistólica**:

- `feyPrincipal = null`, `feyMethod = null`; `feyTeichholz` se conserva como dato secundario.
- La descripción dice "Fracción de eyección por Simpson no disponible." y la conclusión no incluye
  ninguna frase de función sistólica (ni conservada ni deterioro leve/moderado/severo).
- El médico puede completar Simpson o redactar la valoración manualmente.

EcoApp no debe interpretar un Teichholz aislado como sustituto automático de Simpson.

## Fuera de alcance

Los puntos de corte de `interpretFey()` (≥ 55, 45–54, 30–44, < 30) no cambiaron; se revisarán junto con la
auditoría de la narrativa clínica.
