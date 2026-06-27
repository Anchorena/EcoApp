# Supabase - siguiente etapa

Objetivo: permitir guardar online el informe largo y el PDF/anexo con imágenes.

## Módulos a agregar

1. Supabase Auth
   - Usuario por médico/secretaría.
   - Acceso protegido.

2. Base de datos
   - `patients`
   - `echo_studies`
   - `study_files`

3. Storage
   - Bucket privado: `ecoapp-studies`
   - Rutas sugeridas:
     - `dni/aaaa/mm/fecha_informe_largo.pdf`
     - `dni/aaaa/mm/fecha_anexo.pdf`

4. Botones futuros
   - Guardar en Supabase
   - Buscar paciente online
   - Descargar informe histórico
   - Reimprimir informe

## Orden recomendado

Primero probar GitHub Pages. Luego agregar Supabase sin romper el modo local.
