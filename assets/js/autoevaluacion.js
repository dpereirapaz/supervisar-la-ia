(function () {
  "use strict";

  var CLAVE = "autoevaluacion-respuestas";
  var GRUPOS = 6;
  var POR_GRUPO = 3;
  var form = document.getElementById("autoevaluacion");
  if (!form) return;

  var total = document.getElementById("total");
  var ceros = document.getElementById("ceros");
  var borrar = document.getElementById("borrar");
  var estado = document.getElementById("estado-envio");
  var boton = form.querySelector("button[type=submit]");

  function leerAlmacen() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) || "{}");
    } catch (e) {
      return {};
    }
  }

  function guardarAlmacen(datos) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(datos));
    } catch (e) { /* almacenamiento no disponible */ }
  }

  function vaciarAlmacen() {
    try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
  }

  function respuestas() {
    var r = {};
    for (var i = 1; i <= GRUPOS * POR_GRUPO; i++) {
      var marcado = form.querySelector('input[name="r' + i + '"]:checked');
      if (marcado) r["r" + i] = Number(marcado.value);
    }
    return r;
  }

  function calcular() {
    var r = respuestas();
    var suma = 0;
    var titulosCero = [];

    for (var g = 0; g < GRUPOS; g++) {
      var s = 0;
      for (var k = 1; k <= POR_GRUPO; k++) {
        s += r["r" + (g * POR_GRUPO + k)] || 0;
      }
      suma += s;

      var barra = document.getElementById("barra-" + (g + 1));
      if (barra) {
        barra.querySelector(".bar__fill").style.width = (s / 9) * 100 + "%";
        barra.querySelector(".bar__score").textContent = s + " / 9";
        if (s === 0) titulosCero.push(barra.querySelector(".bar__label").textContent);
      }
    }

    if (total) total.textContent = suma;
    if (ceros) ceros.textContent = titulosCero.length ? titulosCero.join(", ") : "ninguna";
    return r;
  }

  function restaurar() {
    var guardado = leerAlmacen();
    Object.keys(guardado).forEach(function (nombre) {
      var campo = nombre.replace(/^a(\d+)$/, "r$1");
      var radio = form.querySelector('input[name="' + campo + '"][value="' + guardado[nombre] + '"]');
      if (radio) radio.checked = true;
    });
  }

  function avisar(texto) {
    if (estado) estado.textContent = texto;
  }

  form.addEventListener("change", function (ev) {
    if (ev.target && ev.target.type === "radio") {
      guardarAlmacen(calcular());
    }
  });

  form.addEventListener("submit", function (ev) {
    if (!window.fetch || !window.FormData) return;
    ev.preventDefault();
    if (boton) boton.disabled = true;
    avisar(form.getAttribute("data-enviando"));

    fetch(form.getAttribute("action"), {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" }
    })
      .then(function (r) {
        return r.json().catch(function () { return { ok: false }; });
      })
      .then(function (datos) {
        if (datos && datos.ok) {
          vaciarAlmacen();
          window.location.href = form.getAttribute("data-gracias");
          return;
        }
        throw datos;
      })
      .catch(function (datos) {
        if (boton) boton.disabled = false;
        avisar((datos && datos.mensaje) || form.getAttribute("data-error"));
      });
  });

  if (borrar) {
    borrar.addEventListener("click", function (ev) {
      ev.preventDefault();
      vaciarAlmacen();
      Array.prototype.forEach.call(form.querySelectorAll('input[type="radio"]'), function (radio) {
        radio.checked = false;
      });
      calcular();
      var primero = form.querySelector('input[type="radio"]');
      if (primero) primero.focus();
    });
  }

  restaurar();
  calcular();
})();
