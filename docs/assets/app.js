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

  // Exportar / importar progreso entre dispositivos (solo en la portada).
  // Formato del código: "cc1:" + números de lección completadas en rangos, p. ej. "cc1:1-5,7,10-12".
  if (window.INDICE_BUSQUEDA && document.getElementById("sync")) {
    var numASlug = {}, slugANum = {};
    window.INDICE_BUSQUEDA.forEach(function (l) { numASlug[l.n] = l.s; slugANum[l.s] = l.n; });

    function codificar() {
      var nums = Object.keys(hechas).filter(function (s) { return hechas[s] && slugANum[s]; })
        .map(function (s) { return slugANum[s]; }).sort(function (a, b) { return a - b; });
      var partes = [], i = 0;
      while (i < nums.length) {
        var ini = nums[i], fin = ini;
        while (i + 1 < nums.length && nums[i + 1] === fin + 1) { fin = nums[++i]; }
        partes.push(ini === fin ? String(ini) : ini + "-" + fin);
        i++;
      }
      return "cc1:" + partes.join(",");
    }
    function decodificar(codigo) {
      var m = String(codigo || "").trim().match(/^cc1:([0-9,\-\s]*)$/i);
      if (!m) return null;
      var nums = [];
      m[1].split(",").forEach(function (p) {
        p = p.trim(); if (!p) return;
        var r = p.split("-").map(Number);
        var a = r[0], b = r.length > 1 ? r[1] : r[0];
        if (isNaN(a) || isNaN(b)) return;
        for (var k = Math.min(a, b); k <= Math.max(a, b) && k - a < 500; k++) nums.push(k);
      });
      return nums;
    }
    function importar(codigo) {
      var nums = decodificar(codigo);
      if (nums === null) return "El código no es válido. Debe empezar por «cc1:».";
      var nuevas = 0;
      nums.forEach(function (n) {
        var s = numASlug[n];
        if (s && !hechas[s]) { hechas[s] = true; nuevas++; }
      });
      guardar("cc-hechas", hechas); pintarProgreso(); refrescarCodigo();
      return nuevas ? "Importado: " + nuevas + " lecciones nuevas marcadas como completadas." : "No había lecciones nuevas que importar.";
    }
    var campo = document.getElementById("codigo-progreso");
    var aviso = document.getElementById("sync-mensaje");
    function enlace() { return location.href.split("#")[0] + "#progreso=" + encodeURIComponent(codificar()); }
    function refrescarCodigo() { campo.value = codificar(); }
    function copiar(texto, msg) {
      var hecho = function () { aviso.textContent = msg; };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto).then(hecho, function () { campo.value = texto; campo.select(); aviso.textContent = "Selecciona y copia el texto del campo."; });
      } else { campo.value = texto; campo.select(); aviso.textContent = "Selecciona y copia el texto del campo."; }
    }
    refrescarCodigo();
    document.getElementById("copiar-codigo").addEventListener("click", function () { copiar(codificar(), "Código copiado."); });
    document.getElementById("copiar-enlace").addEventListener("click", function () { copiar(enlace(), "Enlace copiado. Ábrelo en el otro dispositivo."); });
    document.getElementById("importar").addEventListener("click", function () {
      aviso.textContent = importar(document.getElementById("importar-codigo").value);
    });
    // Enlace con #progreso=...: importar al abrir
    var hash = location.hash.match(/^#progreso=(.+)$/);
    if (hash) {
      var codigoHash = decodeURIComponent(hash[1]);
      document.getElementById("sync").open = true;
      if (window.confirm("¿Importar el progreso de este enlace? Se sumará al que ya tienes en este navegador.")) {
        aviso.textContent = importar(codigoHash);
      }
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
    }
  }

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
