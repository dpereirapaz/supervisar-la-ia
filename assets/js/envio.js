(function () {
  "use strict";

  var forms = document.querySelectorAll("form[data-envio]");
  Array.prototype.forEach.call(forms, function (form) {
    form.addEventListener("submit", function (ev) {
      if (!window.fetch || !window.FormData) return;
      ev.preventDefault();

      var boton = form.querySelector("button[type=submit]");
      if (boton) boton.disabled = true;

      var datos = new FormData(form);
      var extra = form.__extra ? form.__extra() : null;
      if (extra) {
        for (var i = 1; i <= 18; i++) datos.delete("a" + i);
        Object.keys(extra).forEach(function (k) { datos.set(k, extra[k]); });
      }
      datos.delete("_next");

      fetch(form.action, { method: "POST", body: datos, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          window.location.href = form.getAttribute("data-envio");
        })
        .catch(function () {
          if (boton) boton.disabled = false;
          HTMLFormElement.prototype.submit.call(form);
        });
    });
  });
})();
