/* Router + vistas (Etapa 1 - Fase 1 base + Fase 2 cálculos A y B). */
(function () {
  const view = document.getElementById("view");
  const tabs = document.querySelectorAll(".tab");
  const netDot = document.getElementById("net-dot");
  const statusText = document.getElementById("status-text");
  const cfg = window.APP_CONFIG || {};

  let syncMode = "local";
  let corrienteGuardada = null; // Id a traspasar de A -> B

  // ---------- Estado de conexión ----------
  function renderStatus() {
    const online = navigator.onLine;
    netDot.classList.toggle("online", online);
    netDot.classList.toggle("offline", !online);
    if (!online) statusText.textContent = "Sin señal · offline";
    else if (syncMode === "cloud") statusText.textContent = "En línea · nube conectada";
    else statusText.textContent = "En línea · local";
  }
  window.addEventListener("online", renderStatus);
  window.addEventListener("offline", renderStatus);

  // ---------- Utilidades de render ----------
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c])); }

  function bloqueResultado(res) {
    if (!res.ok) {
      return `<div class="card err"><strong>Revisa los datos:</strong><ul>${
        res.errores.map(e => `<li>${esc(e)}</li>`).join("")}</ul></div>`;
    }
    const datos = Object.entries(res.datos)
      .map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><span>${esc(v)}</span></div>`).join("");
    return `
      <div class="card result">
        <div class="result-head">${res.headline}</div>
        <div class="formula">${esc(res.formula)}</div>
        <h4>Datos usados</h4>
        ${datos}
        <p class="ref">📘 ${esc(res.referencia)}</p>
        ${res.extraHtml || ""}
      </div>`;
  }

  // ---------- Vistas ----------
  const views = {
    inicio() {
      return `
        <h1>Hola, Carlos</h1>
        <p class="lead">Tu asistente para mantención y reparación eléctrica en viviendas y pequeños locales, conforme a la normativa chilena.</p>
        <button class="tile" data-route="calculos">
          <span class="ico">🧮</span>
          <span class="body"><strong>Cálculos</strong><span>Corriente nominal · sección por capacidad</span></span>
          <span class="chev">›</span>
        </button>
        <button class="tile" data-route="normativa">
          <span class="ico">📖</span>
          <span class="body"><strong>Consulta a la normativa</strong><span>Pregunta y recibe la cita del pliego exacto</span></span>
          <span class="chev">›</span>
        </button>
        <h2>Estado de esta versión</h2>
        <div class="card">
          <div class="kv"><span>Base de la app (Bloque 1)</span><span>✅ Lista</span></div>
          <div class="kv"><span>Instalable y offline</span><span>✅ Sí</span></div>
          <div class="kv"><span>Corriente nominal</span><span>✅ Lista</span></div>
          <div class="kv"><span>Sección por capacidad (RIC N°04)</span><span>✅ Lista</span></div>
          <div class="kv"><span>Caída de tensión (RIC N°03)</span><span>⏳ Próxima</span></div>
          <div class="kv"><span>Consulta normativa con IA</span><span>⏳ Próxima</span></div>
        </div>`;
    },

    calculos() {
      return `
        <h1>Cálculos</h1>
        <p class="lead">Resultado exacto y repetible, con fórmula y referencia normativa. Funcionan sin señal.</p>
        <button class="tile" data-route="calc-a">
          <span class="ico">⚡</span>
          <span class="body"><strong>Corriente nominal</strong><span>Monofásica y trifásica</span></span>
          <span class="chev">›</span>
        </button>
        <button class="tile" data-route="calc-b">
          <span class="ico">🔌</span>
          <span class="body"><strong>Sección por capacidad de corriente</strong><span>RIC N°04</span></span>
          <span class="chev">›</span>
        </button>
        <button class="tile" disabled>
          <span class="ico">📉</span>
          <span class="body"><strong>Caída de tensión <span class="badge soon">Próxima</span></strong><span>RIC N°03</span></span>
        </button>`;
    },

    "calc-a"() {
      return `
        <button class="back" data-route="calculos">‹ Cálculos</button>
        <h1>Corriente nominal</h1>
        <form id="form-a" class="form">
          <label>Sistema
            <select name="sistema">
              <option value="monofasico">Monofásico</option>
              <option value="trifasico">Trifásico</option>
            </select>
          </label>
          <label>Potencia [W]
            <input name="potencia_W" type="number" inputmode="decimal" step="any" min="0" placeholder="ej. 2200" required>
          </label>
          <label>Tensión [V]
            <input name="tension_V" type="number" inputmode="decimal" step="any" min="0" value="230">
          </label>
          <label>Factor de potencia (cosφ)
            <input name="cosphi" type="number" inputmode="decimal" step="any" min="0" max="1" value="1">
          </label>
          <button type="submit" class="btn">Calcular</button>
        </form>
        <div id="out-a"></div>`;
    },

    "calc-b"() {
      const R = window.RIC04;
      const tipoOpts = Object.entries(R.TIPOS_CABLE)
        .map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");
      const prefill = corrienteGuardada != null ? corrienteGuardada.toFixed(2) : "";
      const aviso = corrienteGuardada != null
        ? `<p class="note">Corriente de diseño traída del cálculo de corriente nominal: <strong>${prefill} A</strong>. Puedes cambiarla.</p>` : "";
      return `
        <button class="back" data-route="calculos">‹ Cálculos</button>
        <h1>Sección por capacidad</h1>
        ${aviso}
        <form id="form-b" class="form">
          <label>Corriente de diseño Id [A]
            <input name="corrienteDiseno_A" type="number" inputmode="decimal" step="any" min="0" value="${prefill}" placeholder="ej. 16" required>
          </label>
          <label>Tipo de cable (temp. de servicio)
            <select name="tempServicio" id="sel-tipo">${tipoOpts}</select>
          </label>
          <label>Método de instalación
            <select name="metodo" id="sel-metodo"></select>
          </label>
          <label>Temperatura ambiente [°C]
            <input name="tempAmbiente_C" type="number" inputmode="decimal" step="any" value="30">
          </label>
          <label>N° de conductores activos con carga
            <input name="nConductores" type="number" inputmode="numeric" step="1" min="1" value="2">
          </label>
          <button type="submit" class="btn">Calcular sección</button>
        </form>
        <p class="note">En trifásico el neutro no cuenta como 4° conductor; la tierra de protección nunca cuenta como activo.</p>
        <div id="out-b"></div>`;
    },

    normativa() {
      return `
        <button class="back" data-route="inicio">‹ Inicio</button>
        <h1>Consulta a la normativa</h1>
        <p class="lead">Pregunta en lenguaje normal; la app responderá citando el pliego, punto o tabla exacta, solo desde las fuentes cargadas.</p>
        <div class="card"><h3>Próxima fase <span class="badge soon">IA</span></h3>
          <p>Clasificará cada respuesta (exigencia normativa / literatura / fabricante / buena práctica) y dirá cuándo algo no está en las fuentes. Requiere internet y tiene costo por uso.</p></div>`;
    },

    acerca() {
      return `
        <h1>Acerca</h1>
        <div class="card">
          <div class="kv"><span>App</span><span>Asesor Eléctrico</span></div>
          <div class="kv"><span>Versión</span><span>${esc(cfg.version || "0.2.0")}</span></div>
          <div class="kv"><span>Ámbito</span><span>Mantención y reparación · viviendas y pequeños locales</span></div>
          <div class="kv"><span>Datos de cálculo</span><span>RIC N°04 (verificado)</span></div>
          <div class="kv"><span>Modo de datos</span><span>${syncMode === "cloud" ? "Nube + local" : "Local (offline)"}</span></div>
        </div>
        <h2>Cómo instalar</h2>
        <div class="card"><p><strong>Android (Chrome):</strong> menú ⋮ → "Instalar app".<br><br><strong>PC:</strong> ícono de instalar en la barra de direcciones.</p></div>`;
    }
  };

  // ---------- Lógica de formularios ----------
  function leerForm(form) {
    const d = {};
    new FormData(form).forEach((v, k) => d[k] = v);
    return d;
  }

  function setupCalcA() {
    const form = document.getElementById("form-a");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = window.Calc.corrienteNominal(leerForm(form));
      if (res.ok) {
        res.headline = "I = " + res.corriente_A.toFixed(2) + " A";
        res.extraHtml = `<button class="btn ghost" id="usar-en-b">Usar este valor en «Sección por capacidad» ›</button>`;
      }
      document.getElementById("out-a").innerHTML = bloqueResultado(res);
      const usar = document.getElementById("usar-en-b");
      if (usar) usar.addEventListener("click", () => { corrienteGuardada = res.corriente_A; go("calc-b"); });
    });
  }

  function poblarMetodos() {
    const R = window.RIC04;
    const selTipo = document.getElementById("sel-tipo");
    const selMet = document.getElementById("sel-metodo");
    if (!selTipo || !selMet) return;
    const metodos = R.TIPOS_CABLE[selTipo.value].metodos;
    selMet.innerHTML = metodos.map(m => `<option value="${m}">${esc(R.METODOS[m])}</option>`).join("");
  }

  function setupCalcB() {
    const form = document.getElementById("form-b");
    if (!form) return;
    poblarMetodos();
    document.getElementById("sel-tipo").addEventListener("change", poblarMetodos);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = window.Calc.seccionPorCapacidad(leerForm(form));
      if (res.ok) res.headline = "Sección recomendada: " + res.seccion_mm2 + " mm²" + (res.awg !== "—" ? " (AWG " + res.awg + ")" : "");
      document.getElementById("out-b").innerHTML = bloqueResultado(res);
    });
  }

  // ---------- Router ----------
  const topTabs = { inicio: "inicio", calculos: "calculos", normativa: "normativa", acerca: "acerca" };
  function go(route) {
    const r = views[route] ? route : "inicio";
    view.innerHTML = views[r]();
    window.scrollTo(0, 0);
    // pestaña activa (sub-vistas de cálculo marcan "calculos")
    const tabRoute = (r === "calc-a" || r === "calc-b") ? "calculos" : r;
    tabs.forEach(t => t.setAttribute("aria-current", t.dataset.route === tabRoute ? "page" : "false"));
    if (r === "calc-a") setupCalcA();
    if (r === "calc-b") setupCalcB();
    if (topTabs[r]) { try { Sync.Local.set("lastRoute", r); } catch {} }
  }

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-route]");
    if (el && !el.disabled) go(el.dataset.route);
  });

  // ---------- Arranque ----------
  async function boot() {
    try { const res = await Sync.init(); syncMode = res.mode; } catch { syncMode = "local"; }
    renderStatus();
    go(Sync.Local.get("lastRoute", "inicio"));
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }
  boot();
})();
