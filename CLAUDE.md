# Reglas de trabajo de este repositorio

## Modo de operación
- Trabajas sin supervisión. No uses la herramienta AskUserQuestion ni termines un turno con una pregunta.
- Cuando una decisión no esté en SPEC.md, toma la opción más conservadora, aplícala y anótala en DECISIONS.md con fecha y motivo. Sigue trabajando.
- Si una acción falla tres veces seguidas, anótala en BLOCKERS.md y continúa con el siguiente paso de SPEC.md.
- Nunca inventes hechos, cifras, testimonios ni nombres. Los huecos marcados `[__]` en SPEC.md se dejan como están.

## Fuente de verdad
- SPEC.md manda. No añadas funciones que no estén en SPEC.md.
- Construye en el orden de la sección 10 de SPEC.md. No empieces un paso hasta cerrar el anterior.

## Agentes
- Eres el orquestador. Delega en los subagentes de .claude/agents según su descripción y revisa su resultado antes de darlo por bueno.
- Toda entrega pasa por `qa` y por `security-reviewer` antes del commit final.

## Git
- Commits pequeños, un paso de SPEC.md por commit, mensajes en castellano.
- Nunca `git push --force`. Nunca reescribas historia.
- Nunca subas un .pdf, un .env, credenciales ni datos personales al repositorio.

## Límites
- No modifiques nada fuera de este repositorio.
- No instales herramientas globales en el sistema; usa dependencias locales del proyecto.
