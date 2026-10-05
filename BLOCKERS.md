# Bloqueos y textos que el autor debe revisar

Entradas que el constructor no puede resolver sin cambiar texto del autor (anexo, sección 0) o sin una persona.

- **2026-10-05 · Anexo B o anexo D (resuelto).** La entrada anterior era un error del constructor: en el borrador v0.95 el anexo D es la autoevaluación (A: veinte preguntas; B: frases de alarma; C: calendario del Reglamento). El JSON era correcto. A petición del autor, el pie de la portada aclara ahora que es el anexo D del whitebook.
- **2026-10-05 · Contacto en mensajes de la página.** La página de error (C-12) y el mensaje de error del formulario usan el texto literal `[correo de contacto]`, porque las páginas estáticas no pueden leer `CONTACT_EMAIL`. Hay que sustituirlo a mano en `error/index.html` y en el atributo `data-error` de `autoevaluacion/index.html` cuando exista la dirección.
- **2026-10-05 · AR-13 y A-05.** Solo se pueden comprobar en producción, con el dominio, Netlify y Brevo configurados. Los hace el autor.
