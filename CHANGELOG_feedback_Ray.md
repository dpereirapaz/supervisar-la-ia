# Cambios del feedback de Ray en el whitebook (v1.0 → v1.1)

Fecha: 2026-10-06. Encargo: `CAMBIOS_whitebook_feedback_Ray.md`.

- Archivo de partida: `Supervision_de_la_IA_v1.0.docx` (sin cambios).
- Resultado: `Supervision_de_la_IA_v1.1.docx`, con control de cambios (autor «Claude (feedback Ray)»), y `Supervision_de_la_IA_v1.1_revision.pdf`, que muestra los cambios marcados. Ninguno de los dos entra en git (F-07).
- Si se rechazan todos los cambios, el texto vuelve a ser idéntico al de la v1.0 (comprobado con un script).

## Cambios

| # | Ubicación (capítulo y primera frase) | Qué se hace | Motivo |
|---|---|---|---|
| 1a | «Antes de empezar», párrafo nuevo tras «Este documento está escrito para que un consejero…» | Párrafo sobre el alcance: IA generativa; el aprendizaje automático clásico sigue siendo a menudo más barato y más fácil de explicar para predecir con datos propios | El texto no decía que se centra en IA generativa |
| 1b | Cap. 3, «Otras familias de modelos», párrafo nuevo tras la tabla: «Hay una cuarta familia, más antigua y ya madura…» | Dos frases: el aprendizaje automático clásico como familia madura que en muchos problemas sustituye al modelo de lenguaje | Que aparezca como alternativa y no solo como etapa histórica |
| 1c | Cap. 7, tabla «Del problema a resolver al tipo de sistema adecuado» | Fila nueva: predicción con datos estructurados propios → aprendizaje automático clásico → métricas sobre datos históricos y vigilancia de la degradación | Encargo, texto literal |
| 2a | Caja nueva tras «Si solo se hace una pregunta», antes de «Primera parte» | Caja «Qué ya sabía y qué es nuevo», con dos listas de tres elementos y una frase de cierre | Que se vea qué es específico de la IA y qué vale para cualquier tecnología |
| 2b | Cap. 5, párrafo nuevo tras «Un modelo de referencia ayuda a no olvidar nada…»: «Con la IA, la estrategia acaba a menudo convertida en una lista de proyectos…» | Rumelt (2011) distingue una estrategia de una lista de objetivos o deseos; el documento no añade proyectos, añade la prueba | Encargo |
| 2b | Fuentes | «Rumelt, R. *Good Strategy Bad Strategy* (2011).», en orden alfabético | Cita nueva |
| 3a | Cap. 1, párrafo nuevo tras «Antes cada modelo servía para una cosa…»: «Cambia también lo que merece la pena intentar…» | Problemas que no compensaba resolver; el ejemplo del comercial, en condicional; crear es barato y comprobar no; la decisión pasa a qué crear y quién verifica | Encargo. Sin «casi infinita» ni «ilimitado» |
| 3b | Cap. 4, «¿Qué parte de nuestra ventaja sobrevive?», al final del párrafo | «A esa lista puede sumarse lo que antes no compensaba hacer y ahora sí (capítulo 1), mientras la competencia no lo haga también.» | Remite al cambio 3a sin repetirlo |
| 3c | Cap. 5, primera decisión | Segunda pregunta: «¿Qué límite que hoy dais por inevitable estáis poniendo a prueba, y con qué dato sabremos si ha caído?». «Está tomada cuando…» pasa a «…qué no hará este año y por qué, y qué límite está poniendo a prueba.» (sigue siendo una frase) | Encargo |
| 3d | Anexo A, «Estrategia» | Sin cambios: ninguna de las cuatro preguntas es redundante | Ver DECISIONS.md |
| 3e | `report/content/informe.es.json`, decisión 1 | `pregunta`, `plan.pedir`, `plan.decidir` y `tomada_cuando` recogen la segunda pregunta | Encargo; `tomada_cuando` copia literalmente el whitebook |
| 4 | Cap. 7, título | «Qué modelos usar y cómo evitar dependencia excesiva» → «Qué tipo de sistema y cómo no depender de un proveedor», también en el índice y en la cabecera de página | Encargo |
| 4 | Cap. 7, entradilla «Cuatro preguntas que parecen técnicas…» | «Cuatro» → «Dos», que son las que tiene ahora el capítulo (tipo de sistema y dependencia del proveedor) | El número anunciado no coincidía |
| 4 | Cap. 7, «Dos criterios, no uno»: «Casi todas las empresas eligen modelos…» | Pasa de cinco frases a tres; el reparto por precio remite al capítulo 6 | Encargo |
| 4 | Cap. 7: «Buena parte de los proyectos fallidos eligen primero el modelo…» | Eliminada | No hay fuente en «Fuentes» |

## Linter (`lint_estilo.py --solo-resumen`, texto completo con los cambios aceptados)

| | Palabras | Hallazgos | Por 1.000 palabras | Gravedad 3 |
|---|---|---|---|---|
| v1.0 | 8.405 | 16 | 1,9 | 1 (E02, ya existente) |
| v1.1 | 8.846 | 16 | 1,8 | 1 (el mismo) |
| Solo el texto nuevo | 705 | 0 | 0 | 0 |

En el primer pase, el texto nuevo tenía dos hallazgos C03 («El mismo dato… la misma respuesta»). Se reformuló como «Una pregunta idéntica puede recibir dos respuestas distintas».

El informe (`informe.es.json`) tiene 2 hallazgos antes y después (0,4 por 1.000 palabras).

## Maquetación

- PDF exportado con Microsoft Word: 55 páginas antes y después, y todos los capítulos empiezan en la misma página, así que los números del índice siguen siendo válidos.
- Revisadas como imagen las páginas 2, 5, 7, 15, 18, 22, 23, 28, 29, 30 y 54. Cajas y tablas sin roturas. La caja nueva cabe en la página 5, detrás de «Si solo se hace una pregunta».
- El título del capítulo 7 ocupa ahora dos líneas. La primera celda de la fila nueva ocupa seis líneas porque la columna es estrecha y el texto del encargo es largo.
- Informe: `npm test` pasa (9 + 17). `scripts/ar-informe.mjs` pasa todo. Las cinco muestras tienen las mismas páginas que antes; las páginas de la pregunta y del plan crecen una línea.
