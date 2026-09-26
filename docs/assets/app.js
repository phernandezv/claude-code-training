// Tema claro/oscuro, progreso local, búsqueda y utilidades de las lecciones.
(function () {
  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v === null ? porDefecto : JSON.parse(v); } catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* almacenamiento bloqueado */ }
  }

  var tema = leer("cc-tema", null);
  if (tema) document.documentElement.setAttribute("data-theme", tema);
  window.alternarTema = function () {
    var actual = document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    var nuevo = actual === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nuevo);
    guardar("cc-tema", nuevo);
  };

  var hechas = leer("cc-hechas", {});
  function pintarProgreso() {
    document.querySelectorAll("[data-slug]").forEach(function (el) {
      if (el.tagName === "BODY") return;
      el.classList.toggle("hecha", !!hechas[el.getAttribute("data-slug")]);
    });
    var barra = document.getElementById("barra-progreso");
    if (barra) {
      var total = document.querySelectorAll(".tarjeta").length;
      var n = Object.keys(hechas).filter(function (k) { return hechas[k]; }).length;
      barra.style.width = (total ? (100 * n / total) : 0) + "%";
      document.getElementById("texto-progreso").textContent = n + " de " + total + " lecciones completadas";
    }
  }

  var slug = document.body.getAttribute("data-slug");
  if (slug) {
    var activa = document.querySelector('.sidebar li[data-slug="' + slug + '"]');
    if (activa) { activa.classList.add("activa"); activa.scrollIntoView({ block: "center" }); }
    var check = document.getElementById("completada");
    if (check) {
      check.checked = !!hechas[slug];
      check.addEventListener("change", function () {
        hechas[slug] = check.checked; guardar("cc-hechas", hechas); pintarProgreso();
      });
    }
    // Resaltado de sintaxis y botón de copiar
    document.querySelectorAll(".leccion pre code").forEach(function (bloque) {
      if (window.hljs) { try { hljs.highlightElement(bloque); } catch (e) {} }
      var btn = document.createElement("button");
      btn.className = "copiar"; btn.textContent = "Copiar";
      btn.addEventListener("click", function () {
        navigator.clipboard.writeText(bloque.innerText).then(function () {
          btn.textContent = "¡Copiado!"; setTimeout(function () { btn.textContent = "Copiar"; }, 1500);
        });
      });
      bloque.parentElement.appendChild(btn);
    });
    // Enlace activo en la tabla de contenidos
    var enlaces = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
    if ("IntersectionObserver" in window && enlaces.length) {
      var obs = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (!e.isIntersecting) return;
          enlaces.forEach(function (a) { a.classList.toggle("visible", a.getAttribute("href") === "#" + e.target.id); });
        });
      }, { rootMargin: "-60px 0px -70% 0px" });
      document.querySelectorAll(".leccion h2[id], .leccion h3[id]").forEach(function (h) { obs.observe(h); });
    }
  }
  document.querySelectorAll(".sidebar a").forEach(function (a) {
    a.addEventListener("click", function () { document.body.classList.remove("nav-abierta"); });
  });
  pintarProgreso();

  // Búsqueda en la portada
  var caja = document.getElementById("buscar");
  if (caja && window.INDICE_BUSQUEDA) {
    var lista = document.getElementById("resultados");
    function normalizar(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
    var indice = window.INDICE_BUSQUEDA.map(function (l) {
      return { l: l, t: normalizar(l.t + " " + l.r), c: normalizar(l.c) };
    });
    caja.addEventListener("input", function () {
      var q = normalizar(caja.value.trim());
      lista.innerHTML = "";
      if (q.length < 2) return;
      var terminos = q.split(/\s+/);
      var res = indice.map(function (x) {
        var puntos = 0;
        for (var i = 0; i < terminos.length; i++) {
          var t = terminos[i];
          if (x.t.indexOf(t) >= 0) puntos += 10;
          else if (x.c.indexOf(t) >= 0) puntos += 1;
          else return null;
        }
        return { x: x, p: puntos };
      }).filter(Boolean).sort(function (a, b) { return b.p - a.p; }).slice(0, 8);
      res.forEach(function (r) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "lecciones/" + r.x.l.s + ".html";
        a.textContent = r.x.l.n + ". " + r.x.l.t;
        var small = document.createElement("small");
        small.textContent = r.x.l.r;
        a.appendChild(small); li.appendChild(a); lista.appendChild(li);
      });
      if (!res.length) { var li = document.createElement("li"); li.textContent = "Sin resultados."; lista.appendChild(li); }
    });
  }
})();
