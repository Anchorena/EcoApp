# Seguridad de EcoApp

## Punto clave

En una app HTML/JS local, si alguien puede abrir la carpeta, puede ver el código. No se puede impedir de forma real desde JavaScript.

## Qué se puede proteger

- El acceso operativo: con usuarios/contraseñas si se pasa a servidor local.
- Los datos de pacientes: base de datos local protegida y permisos del sistema.
- La distribución: app empaquetada con Electron/Tauri.
- La lectura casual del código: minificación/ofuscación, solo como disuasivo.

## Recomendación para V38

Crear dos modos:

1. **Modo desarrollo**
   - Código editable.
   - config.js claro.
   - Para Matías/admin.

2. **Modo distribución**
   - App empaquetada o servida desde Node local.
   - Usuarios: administrador / médico / secretaria.
   - Código no expuesto como carpeta simple.
   - Base de datos local.
   - Auditoría mínima de estudios generados.
