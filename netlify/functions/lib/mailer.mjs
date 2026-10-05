// Adaptador de correo (anexo, R-19). Es el único fichero que llama a Brevo.
const API = "https://api.brevo.com/v3";

async function llamar(ruta, cuerpo, { apiKey, limiteMs }) {
  let ultimo;
  for (let intento = 0; intento < 2; intento++) {
    const t = Math.min(4000, limiteMs());
    if (t < 500) break;
    try {
      const r = await fetch(API + ruta, {
        method: "POST",
        headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(cuerpo),
        signal: AbortSignal.timeout(t),
      });
      if (r.ok) return;
      ultimo = new Error("brevo_" + r.status);
      if (r.status < 500) break;
    } catch (e) {
      ultimo = new Error(e.name === "TimeoutError" ? "brevo_tiempo" : "brevo_red");
    }
  }
  throw ultimo || new Error("brevo_tiempo");
}

export function crearMailer({ apiKey, remitente, nombreRemitente, limiteMs = () => 4000 }) {
  return {
    async enviarCorreo({ para, asunto, texto, html, adjuntos = [], responderA }) {
      const cuerpo = {
        sender: { email: remitente, name: nombreRemitente },
        to: [{ email: para }],
        subject: asunto,
        textContent: texto,
        htmlContent: html,
      };
      if (responderA) cuerpo.replyTo = { email: responderA };
      if (adjuntos.length) cuerpo.attachment = adjuntos.map((a) => ({ name: a.nombre, content: Buffer.from(a.bytes).toString("base64") }));
      await llamar("/smtp/email", cuerpo, { apiKey, limiteMs });
    },
    async anadirContacto({ correo, nombre, listaId }) {
      await llamar("/contacts", { email: correo, attributes: { FIRSTNAME: nombre }, listIds: [Number(listaId)], updateEnabled: true }, { apiKey, limiteMs });
    },
  };
}
