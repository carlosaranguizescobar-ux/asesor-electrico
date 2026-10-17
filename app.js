/* Router + vistas de la base (Etapa 1 - Fase 1). */
(function () {
  const view = document.getElementById("view");
  const tabs = document.querySelectorAll(".tab");
  const netDot = document.getElementById("net-dot");
  const statusText = document.getElementById("status-text");
  const cfg = window.APP_CONFIG || {};

  let syncMode = "local";

  // ---------- Estado de conexión / sincronización ----------
  function renderStatus() {
    const online = navigator.onLine;
    netDot.classList.toggle("online", online);
    netDot.classList.toggle("offline", !online);
    if (!online) {
      statusText.textContent = "Sin señal · offline";
    } else if (syncMode === "cloud") {
      statusText.textContent = "En línea · sincroniza";
    } else {
      statusText.textContent = "En línea · local";
    }
  }
  window.addEventListener("online", renderStatus);
  window.addEventListener("offline", renderStatus);

  // ---------- Vistas ----------
  const views = {
    inicio() {
      return `
        <h1>Hola, Carlos</h1>
        <p class="lead">Tu asistente para mantención y reparación eléctrica en viviendas y pequeños locales, conforme a la normativa chilena.</p>

        <button class="tile" data-route="calculos">
          <span class="ico">🧮</span>
          <span class="body"><strong>Cálculos</strong><span>Corriente nominal, sección y caída de tensión</span></span>
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
          <div class="kv"><span>Sincronización teléfono ↔ PC</span><span>${cfg.SUPABASE_URL ? "✅ Activa" : "⏳ Por activar"}</span></div>
          <div class="kv"><span>Cálculos (Bloque 2)</span><span>⏳ Fase 2</span></div>
          <div class="kv"><span>Consulta normativa (Bloque 2)</span><span>⏳ Fase 3</span></div>
        </div>
        <p class="note">Desarrollo incremental: esta es la base. Los cálculos y la consulta a la normativa se incorporan en las fases siguientes, en el orden que tú apruebes.</p>
      `;
    },

    calculos() {
      return `
        <h1>Cálculos</h1>
        <p class="lead">Cada cálculo mostrará fórmula, datos usados, resultado y referencia normativa. Funcionarán sin señal.</p>
        <button class="tile" disabled>
          <span class="ico">⚡</span>
          <span class="body"><strong>Corriente nominal <span class="badge soon">Fase 2</span></strong><span>Monofásica y trifásica</span></span>
        </button>
        <button class="tile" disabled>
          <span class="ico">🔌</span>
          <span class="body"><strong>Sección por capacidad de corriente <span class="badge soon">Fase 2</span></strong><span>RIC N°04</span></span>
        </button>
        <button class="tile" disabled>
          <span class="ico">📉</span>
          <span class="body"><strong>Caída de tensión <span class="badge soon">Fase 2</span></strong><span>RIC N°03 (y N°14 cuando aplique)</span></span>
        </button>
        <p class="note">Antes de programar cada cálculo te mostraré las tablas transcritas del RIC para que las valides contra el pliego oficial.</p>
      `;
    },

    normativa() {
      return `
        <h1>Consulta a la normativa</h1>
        <p class="lead">Pregunta en lenguaje normal; la app responderá citando el pliego, punto o tabla exacta, solo desde las fuentes cargadas.</p>
        <div class="card">
          <h3>Fase 3 <span class="badge soon">próxima</span></h3>
          <p>Cada respuesta indicará si es exigencia normativa, literatura técnica, dato de fabricante o buena práctica, y dirá cuándo algo no está en las fuentes. Requiere conexión a internet y tiene costo por uso.</p>
        </div>
        <p class="note">Fuentes cargadas en el proyecto: Decreto 8, RIC N°03, N°04, N°10, N°14, N°17, guía Bticino y ABC de Enríquez Harper (literatura).</p>
      `;
    },

    acerca() {
      return `
        <h1>Acerca</h1>
        <div class="card">
          <div class="kv"><span>App</span><span>Asesor Eléctrico</span></div>
          <div class="kv"><span>Versión</span><span>${cfg.version || "0.1.0"}</span></div>
          <div class="kv"><span>Ámbito</span><span>Mantención y reparación · viviendas y pequeños locales</span></div>
          <div class="kv"><span>Usuario</span><span>Uso personal (Carlos)</span></div>
          <div class="kv"><span>Modo de datos</span><span>${syncMode === "cloud" ? "Nube + local" : "Local (offline)"}</span></div>
        </div>
        <h2>Cómo instalar</h2>
        <div class="card">
          <p><strong>Android (Chrome):</strong> menú ⋮ → "Instalar app" / "Agregar a pantalla de inicio".<br><br>
          <strong>PC (Chrome/Edge):</strong> ícono de instalar en la barra de direcciones, o menú → "Instalar".</p>
        </div>
        <p class="note">La app guarda tus datos en el dispositivo y, cuando la sincronización esté activa, también en la nube para abrirla desde el teléfono y el PC.</p>
      `;
    }
  };

  function go(route) {
    const r = views[route] ? route : "inicio";
    view.innerHTML = views[r]();
    window.scrollTo(0, 0);
    tabs.forEach(t => t.setAttribute("aria-current", t.dataset.route === r ? "page" : "false"));
    try { Sync.Local.set("lastRoute", r); } catch {}
  }

  // Navegación: tabbar + tiles con data-route
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-route]");
    if (el && !el.disabled) go(el.dataset.route);
  });

  // ---------- Arranque ----------
  async function boot() {
    try {
      const res = await Sync.init();
      syncMode = res.mode;
    } catch { syncMode = "local"; }
    renderStatus();
    go(Sync.Local.get("lastRoute", "inicio"));
  }

  // Service worker (offline / instalable)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(err => console.warn("SW:", err));
    });
  }

  boot();
})();
