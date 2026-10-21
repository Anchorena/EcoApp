#!/bin/sh
# Corre las pruebas del workspace de revisión con Node si está instalado; si no, con el
# JavaScriptCore incluido en macOS.
cd "$(dirname "$0")/.." || exit 1
if command -v node >/dev/null 2>&1; then
  exec node tests/run-workspace-tests.js . "$@"
fi
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc
if [ -x "$JSC" ]; then
  exec "$JSC" tests/run-workspace-tests.js -- . "$@"
fi
echo "No se encontró node ni jsc para correr las pruebas." >&2
exit 1
