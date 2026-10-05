# report/ — implementación de referencia del informe PDF

Copiar y adaptar (ver `SPEC_informe-personalizado.md`, sección 16).

    npm install
    npm test            # motor, reglas y generación de PDF para cinco perfiles
    npm run muestras    # escribe PDF de prueba en report/out/ (no se sube a git)
    node scripts/bench.mjs
    node scripts/export-review.mjs   # regenera CONTENIDO_informe_revision.md desde el JSON

Los textos están en `content/informe.es.json`. Las reglas están en `src/engine.mjs`.
