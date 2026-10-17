/*
 * Capa de sincronización.
 * - Si hay config de Supabase, sincroniza datos entre teléfono y PC.
 * - Si no la hay (o no hay señal), guarda todo en el dispositivo (localStorage)
 *   y lo deja listo para subir cuando se pueda.
 * Diseñada para no romper nunca la app offline.
 */
window.Sync = (function () {
  const cfg = window.APP_CONFIG || {};
  const hasCloud = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  let client = null;

  async function init() {
    if (!hasCloud) return { mode: "local" };
    try {
      // supabase-js se carga de forma diferida solo si hay nube configurada.
      if (!window.supabase) {
        await loadScript("vendor/supabase.min.js");
      }
      client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
      return { mode: "cloud" };
    } catch (e) {
      console.warn("[Sync] No se pudo iniciar la nube, se usa modo local:", e);
      return { mode: "local" };
    }
  }

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // Almacenamiento local (siempre disponible, base del offline-first).
  const Local = {
    get(key, fallback) {
      try { const v = localStorage.getItem("ae:" + key); return v ? JSON.parse(v) : fallback; }
      catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("ae:" + key, JSON.stringify(value)); return true; }
      catch { return false; }
    }
  };

  return {
    init,
    hasCloud,
    get client() { return client; },
    Local
  };
})();
