(function () {
  "use strict";

  var CLAVE = "autoevaluacion-respuestas";
  var GRUPOS = 6;
  var POR_GRUPO = 3;
  var form = document.getElementById("autoevaluacion");
  if (!form) return;

  var total = document.getElementById("total");
  var ceros = document.getElementById("ceros");
  var campoTotal = form.elements.puntuacion_total;
  var campoGrupos = form.elements.puntuacion_grupos;
  var campoFecha = form.elements.fecha;
  var borrar = document.getElementById("borrar");

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

  function respuestas() {
    var r = {};
    for (var i = 1; i <= GRUPOS * POR_GRUPO; i++) {
      var marcado = form.querySelector('input[name="a' + i + '"]:checked');
      if (marcado) r["a" + i] = Number(marcado.value);
    }
    return r;
  }

  function calcular() {
    var r = respuestas();
    var porGrupo = [];
    var suma = 0;
    var titulosCero = [];

    for (var g = 0; g < GRUPOS; g++) {
      var s = 0;
      for (var k = 1; k <= POR_GRUPO; k++) {
        s += r["a" + (g * POR_GRUPO + k)] || 0;
      }
      porGrupo.push(s);
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
    if (campoTotal) campoTotal.value = suma;
    if (campoGrupos) campoGrupos.value = porGrupo.join(",");
    return r;
  }

  function restaurar() {
    var guardado = leerAlmacen();
    Object.keys(guardado).forEach(function (nombre) {
      var radio = form.querySelector('input[name="' + nombre + '"][value="' + guardado[nombre] + '"]');
      if (radio) radio.checked = true;
    });
  }

  form.addEventListener("change", function (ev) {
    if (ev.target && ev.target.type === "radio") {
      guardarAlmacen(calcular());
    }
  });

  function resumen() {
    var r = respuestas();
    var lineas = ["Total: " + (total ? total.textContent : "") + " / 54"];
    var grupos = form.querySelectorAll("fieldset.group");
    Array.prototype.forEach.call(grupos, function (g, gi) {
      var s = 0, filas = [];
      for (var k = 1; k <= POR_GRUPO; k++) {
        var n = gi * POR_GRUPO + k, v = r["a" + n];
        s += v || 0;
        var txt = form.querySelectorAll("legend.item__text")[n - 1].textContent.replace(/^\d+/, "").trim();
        filas.push("  " + n + ". [" + (v == null ? "-" : v) + "] " + txt);
      }
      lineas.push("", g.querySelector("legend.group__title").textContent + ": " + s + " / 9");
      lineas = lineas.concat(filas);
    });
    lineas.push("", "Decisiones que puntúan cero: " + (ceros ? ceros.textContent : ""));
    return lineas.join("\n");
  }

  form.addEventListener("submit", function () {
    calcular();
    if (campoFecha) campoFecha.value = new Date().toISOString();
  });

  form.__extra = function () {
    var r = respuestas(), lista = [];
    for (var i = 1; i <= GRUPOS * POR_GRUPO; i++) lista.push(r["a" + i] == null ? "" : r["a" + i]);
    return { respuestas: lista.join(","), resumen: resumen() };
  };

  if (borrar) {
    borrar.addEventListener("click", function (ev) {
      ev.preventDefault();
      try { localStorage.removeItem(CLAVE); } catch (e) { /* nada */ }
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
