# Bloqueos y textos que el autor debe revisar

Entradas que el constructor no puede resolver sin cambiar texto del autor (anexo, sección 0) o sin una persona.

- **2026-10-05 · Anexo B o anexo D.** `report/content/informe.es.json` dice «la autoevaluación del anexo D» en `correo.whitebook.cuerpo[1]` y en el pie de la portada del informe (`portada.pie`). En el borrador `Supervision_de_la_IA_borrador_v0.95.docx` la autoevaluación es el **anexo B**, aunque el propio borrador también cita «anexo D» en el capítulo 6. No se ha cambiado el JSON: el autor debe decidir la letra y corregirla en el whitebook y en el JSON.
- **2026-10-05 · Contacto en mensajes de la página.** La página de error (C-12) y el mensaje de error del formulario usan el texto literal `[correo de contacto]`, porque las páginas estáticas no pueden leer `CONTACT_EMAIL`. Hay que sustituirlo a mano en `error/index.html` y en el atributo `data-error` de `autoevaluacion/index.html` cuando exista la dirección.
- **2026-10-05 · AR-13 y A-05.** Solo se pueden comprobar en producción, con el dominio, Netlify y Brevo configurados. Los hace el autor.
