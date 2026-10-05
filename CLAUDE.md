# Reglas de trabajo de este repositorio

## Modo de operación
- Trabajas sin supervisión. No uses la herramienta AskUserQuestion ni termines un turno con una pregunta.
- Cuando una decisión no esté en la especificación, toma la opción más conservadora, aplícala y anótala en DECISIONS.md con fecha y motivo. Sigue trabajando.
- Si una acción falla tres veces seguidas, anótala en BLOCKERS.md y continúa con el siguiente paso.
- Nunca inventes hechos, cifras, testimonios ni nombres. Los huecos marcados `[__]` se dejan como están.

## Fuente de verdad
- La especificación son dos archivos: `SPEC_supervisar-la-ia_web.md` (base, v1.2) y `SPEC_informe-personalizado.md` (anexo del informe en PDF). Si discrepan, manda el anexo.
- No añadas funciones que no estén en la especificación.
- Construye en el orden de la sección 10 de la base, con los pasos 6a a 6f del anexo (sección 13) intercalados tras el paso 6. No empieces un paso hasta cerrar el anterior.
- La carpeta `report/` es una implementación de referencia ya probada. Cópiala y adáptala; no la reescribas desde cero. No cambies los umbrales del motor ni los textos de `report/content/informe.es.json`: si un texto te parece mal, anótalo en BLOCKERS.md.

## Datos personales y secretos
- En pruebas usa solo datos ficticios (por ejemplo `Zzyzx Qwerty`, `prueba@example.com`).
- No envíes correos reales ni llames a la API de Brevo con claves reales. Las pruebas del envío usan `fetch` simulado. El modo `DELIVERY_MODE=download` es solo para pruebas locales.
- Nunca escribas en un log, en un fichero de prueba ni en un commit un correo, un nombre o unas respuestas reales (R-25).
- Nunca leas, imprimas ni subas el valor de una variable de entorno que contenga un secreto. `.env.example` lleva solo los nombres.

## Agentes
- Eres el orquestador. Delega en los subagentes de .claude/agents según su descripción y revisa su resultado antes de darlo por bueno.
- Toda entrega pasa por `qa` y por `security-reviewer` antes del commit final.

## Git
- Commits pequeños, un paso por commit, mensajes en castellano.
- Nunca `git push --force`. Nunca reescribas historia.
- Nunca subas un .pdf, un .env, credenciales ni datos personales al repositorio. `report/out/` va en .gitignore.

## Límites
- No modifiques nada fuera de este repositorio.
- No instales herramientas globales en el sistema; usa dependencias locales del proyecto.
- No despliegues: Netlify publica solo cuando el autor conecte el repositorio. Tu entrega termina en `git push` a GitHub.
