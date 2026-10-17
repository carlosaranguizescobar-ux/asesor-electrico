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
        ${res.formula ? `<div class="formula">${esc(res.formula)}</div>` : ""}
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
          <div class="kv"><span>Caída de tensión (RIC N°03 y N°14)</span><span>✅ Lista</span></div>
          <div class="kv"><span>Consulta normativa con IA</span><span>⏳ Próxima</span></div>
        </div>`;
    },

    calculos() {
      return `
        <h1>Cálculos</h1>
        <p class="lead">Resultado exacto y repetible, con fórmula y referencia normativa. Funcionan sin señal.</p>
        <button class="tile" data-route="calc-d">
          <span class="ico">📐</span>
          <span class="body"><strong>Dimensionar sección (completo)</strong><span>Capacidad + caída de tensión → la que manda</span></span>
          <span class="chev">›</span>
        </button>
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
        <button class="tile" data-route="calc-c">
          <span class="ico">📉</span>
          <span class="body"><strong>Caída de tensión</strong><span>RIC N°03 y N°14</span></span>
          <span class="chev">›</span>
        </button>`;
    },

    "calc-d"() {
      const R = window.RIC04;
      const tipoOpts = Object.entries(R.TIPOS_CABLE).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join("");
      const prefill = corrienteGuardada != null ? corrienteGuardada.toFixed(2) : "";
      const aviso = corrienteGuardada != null
        ? `<p class="note">Corriente traída del cálculo de corriente nominal: <strong>${prefill} A</strong>. Puedes cambiarla.</p>` : "";
      return `
        <button class="back" data-route="calculos">‹ Cálculos</button>
        <h1>Dimensionar sección</h1>
        <p class="lead">Calcula por los dos criterios y entrega la sección que sirve: la mayor entre capacidad de corriente y caída de tensión.</p>
        ${aviso}
        <form id="form-d" class="form">
          <label>Sistema
            <select name="sistema" id="d-sistema">
              <option value="monofasico">Monofásico</option>
              <option value="trifasico">Trifásico</option>
            </select>
          </label>
          <label>Corriente de diseño Id [A]
            <input name="corrienteDiseno_A" type="number" inputmode="decimal" step="any" min="0" value="${prefill}" placeholder="ej. 16" required>
          </label>
          <h2>Capacidad de corriente (RIC N°04)</h2>
          <label>Tipo de cable (temp. de servicio)
            <select name="tempServicio" id="d-tipo">${tipoOpts}</select>
          </label>
          <label>Método de instalación
            <select name="metodo" id="d-metodo"></select>
          </label>
          <label>Temperatura ambiente [°C]
            <input name="tempAmbiente_C" type="number" inputmode="decimal" step="any" value="30">
          </label>
          <label>N° de conductores activos con carga
            <input name="nConductores" type="number" inputmode="numeric" step="1" min="1" value="2">
          </label>
          <h2>Caída de tensión (RIC N°03 / N°14)</h2>
          <label>Largo del tramo L [m]
            <input name="longitud_m" type="number" inputmode="decimal" step="any" min="0" placeholder="ej. 25" required>
          </label>
          <label>Factor de potencia cosφ
            <input name="cosphi" type="number" inputmode="decimal" step="any" min="0" max="1" value="1">
          </label>
          <label>Tensión nominal [V]
            <input name="tension_V" id="d-tension" type="number" inputmode="decimal" step="any" min="0" value="230">
          </label>
          <label>Conductividad del cobre γ [m/(Ω·mm²)]
            <input name="gamma" type="number" inputmode="decimal" step="any" min="0" value="56">
          </label>
          <label>Normativa aplicable
            <select name="normativa">
              <option value="ric03">RIC N°03 (general)</option>
              <option value="ric14">RIC N°14 (edificio nuevo / eficiencia energética)</option>
            </select>
          </label>
          <label>Tipo de tramo
            <select name="tipoTramo">
              <option value="alimentador">Alimentador</option>
              <option value="subalimentador">Subalimentador</option>
              <option value="derivacion">Derivación / circuito</option>
            </select>
          </label>
          <label>Caída acumulada aguas arriba [%] (opcional)
            <input name="acumulada_pct" type="number" inputmode="decimal" step="any" min="0" value="0">
          </label>
          <button type="submit" class="btn">Dimensionar</button>
        </form>
        <div id="out-d"></div>`;
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

    "calc-c"() {
      const R = window.RIC04;
      const secOpts = R.SECCIONES.map(s => `<option value="${s[0]}">${s[0]} mm²${s[1] !== "—" ? " (AWG " + s[1] + ")" : ""}</option>`).join("");
      const prefill = corrienteGuardada != null ? corrienteGuardada.toFixed(2) : "";
      const aviso = corrienteGuardada != null
        ? `<p class="note">Corriente traída del cálculo de corriente nominal: <strong>${prefill} A</strong>. Puedes cambiarla.</p>` : "";
      return `
        <button class="back" data-route="calculos">‹ Cálculos</button>
        <h1>Caída de tensión</h1>
        ${aviso}
        <form id="form-c" class="form">
          <label>Sistema
            <select name="sistema" id="c-sistema">
              <option value="monofasico">Monofásico</option>
              <option value="trifasico">Trifásico</option>
            </select>
          </label>
          <label>Corriente I [A]
            <input name="corriente_A" type="number" inputmode="decimal" step="any" min="0" value="${prefill}" placeholder="ej. 16" required>
          </label>
          <label>Largo del tramo L [m]
            <input name="longitud_m" type="number" inputmode="decimal" step="any" min="0" placeholder="ej. 25" required>
          </label>
          <label>Sección del conductor
            <select name="seccion_mm2">
              <option value="">— Calcular la sección mínima —</option>
              ${secOpts}
            </select>
          </label>
          <label>Factor de potencia cosφ
            <input name="cosphi" type="number" inputmode="decimal" step="any" min="0" max="1" value="1">
          </label>
          <label>Tensión nominal [V]
            <input name="tension_V" id="c-tension" type="number" inputmode="decimal" step="any" min="0" value="230">
          </label>
          <label>Conductividad del cobre γ [m/(Ω·mm²)]
            <input name="gamma" type="number" inputmode="decimal" step="any" min="0" value="56">
          </label>
          <label>Normativa aplicable
            <select name="normativa">
              <option value="ric03">RIC N°03 (general)</option>
              <option value="ric14">RIC N°14 (edificio nuevo / eficiencia energética)</option>
            </select>
          </label>
          <label>Tipo de tramo
            <select name="tipoTramo">
              <option value="alimentador">Alimentador</option>
              <option value="subalimentador">Subalimentador</option>
              <option value="derivacion">Derivación / circuito</option>
            </select>
          </label>
          <label>Caída acumulada aguas arriba [%] (opcional)
            <input name="acumulada_pct" type="number" inputmode="decimal" step="any" min="0" value="0">
          </label>
          <button type="submit" class="btn">Calcular caída</button>
        </form>
        <p class="note">Fórmula de ΔV: literatura técnica (reactancia despreciada, adecuado para viviendas y pequeños locales). Los límites son exigencia normativa.</p>
        <div id="out-c"></div>`;
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

  function setupCalcC() {
    const form = document.getElementById("form-c");
    if (!form) return;
    const sistema = document.getElementById("c-sistema");
    const tension = document.getElementById("c-tension");
    sistema.addEventListener("change", () => {
      // sugiere tensión nominal por defecto al cambiar sistema
      if (tension.value === "230" || tension.value === "400" || tension.value === "")
        tension.value = sistema.value === "trifasico" ? "400" : "230";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = window.Calc.caidaTension(leerForm(form));
      if (res.ok && res.dimensionar) {
        if (res.seccionMin) {
          const sm = res.seccionMin;
          res.headline = "Sección requerida: " + sm.seccion + " mm²" + (sm.awg !== "—" ? " (AWG " + sm.awg + ")" : "");
          res.extraHtml = `<div class="verdict ok">✓ Con ${sm.seccion} mm² la caída es ${sm.pct.toFixed(2)}% (límite ${res.limObjetivo.toFixed(2)}%).</div>`;
        } else {
          res.headline = "Sin sección que cumpla";
          res.extraHtml = `<div class="verdict fail">Ninguna sección tabulada (hasta 300 mm²) cumple el límite con estos datos; revisa largo, corriente, tensión o el tramo.</div>`;
        }
        document.getElementById("out-c").innerHTML = bloqueResultado(res);
        return;
      }
      if (res.ok) {
        const vt = res.okTramo ? "verdict ok" : "verdict fail";
        const vtTxt = res.okTramo ? "✓ cumple" : "✗ no cumple";
        res.headline = "Caída del tramo: " + res.pct_tramo.toFixed(2) + " %";
        let extra = `<div class="${vt}">Tramo ${vtTxt} el límite de ${res.limTramo}% · <small>${esc(res.refTramo)}</small></div>`;
        const showTotal = res.pct_total > res.pct_tramo + 1e-9 || res.limTotal !== res.limTramo;
        if (showTotal) {
          const vtot = res.okTotal ? "verdict ok" : "verdict fail";
          const vtotTxt = res.okTotal ? "✓ cumple" : "✗ no cumple";
          extra += `<div class="${vtot}">Total (${res.pct_total.toFixed(2)}%) ${vtotTxt} el límite de ${res.limTotal}% · <small>${esc(res.refTotal)}</small></div>`;
        }
        if (res.seccionMin) {
          const sm = res.seccionMin;
          extra += `<div class="seccion-min">Sección mínima para cumplir ${res.limTramo}%: <strong>${sm.seccion} mm²</strong>${sm.awg !== "—" ? " (AWG " + sm.awg + ")" : ""} <small>(ΔV ${sm.pct.toFixed(2)}%)</small></div>`;
        } else {
          extra += `<div class="verdict fail">Ninguna sección tabulada cumple el límite con estos datos; revisa largo, corriente o tensión.</div>`;
        }
        res.extraHtml = extra;
      }
      document.getElementById("out-c").innerHTML = bloqueResultado(res);
    });
  }

  function setupCalcD() {
    const form = document.getElementById("form-d");
    if (!form) return;
    const R = window.RIC04;
    const selTipo = document.getElementById("d-tipo");
    const selMet = document.getElementById("d-metodo");
    const sistema = document.getElementById("d-sistema");
    const tension = document.getElementById("d-tension");
    function poblar() {
      selMet.innerHTML = R.TIPOS_CABLE[selTipo.value].metodos
        .map(m => `<option value="${m}">${esc(R.METODOS[m])}</option>`).join("");
    }
    poblar();
    selTipo.addEventListener("change", poblar);
    sistema.addEventListener("change", () => {
      if (tension.value === "230" || tension.value === "400" || tension.value === "")
        tension.value = sistema.value === "trifasico" ? "400" : "230";
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const res = window.Calc.dimensionarSeccion(leerForm(form));
      if (res.ok) {
        res.headline = "Sección a usar: " + res.seccionFinal_mm2 + " mm²" + (res.awgFinal !== "—" ? " (AWG " + res.awgFinal + ")" : "");
        const gtxt = res.gobierna === "capacidad" ? "Manda la capacidad de corriente (RIC N°04)"
          : res.gobierna === "caida" ? "Manda la caída de tensión"
          : "Ambos criterios coinciden en la misma sección";
        res.extraHtml = `<div class="verdict ok">${esc(gtxt)}</div>`;
      }
      document.getElementById("out-d").innerHTML = bloqueResultado(res);
    });
  }

  // ---------- Router ----------
  const topTabs = { inicio: "inicio", calculos: "calculos", normativa: "normativa", acerca: "acerca" };
  function go(route) {
    const r = views[route] ? route : "inicio";
    view.innerHTML = views[r]();
    window.scrollTo(0, 0);
    // pestaña activa (sub-vistas de cálculo marcan "calculos")
    const tabRoute = (r === "calc-a" || r === "calc-b" || r === "calc-c" || r === "calc-d") ? "calculos" : r;
    tabs.forEach(t => t.setAttribute("aria-current", t.dataset.route === tabRoute ? "page" : "false"));
    if (r === "calc-a") setupCalcA();
    if (r === "calc-b") setupCalcB();
    if (r === "calc-c") setupCalcC();
    if (r === "calc-d") setupCalcD();
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
