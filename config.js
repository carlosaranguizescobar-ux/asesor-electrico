// Configuración de la app.
// La sincronización en la nube (Supabase) se activa cuando estos valores estén completos.
// Mientras estén vacíos, la app funciona 100% offline con almacenamiento local.
window.APP_CONFIG = {
  // Versión de la app (sirve para refrescar la caché al actualizar).
  version: "0.1.0",

  // --- Supabase (sincronización teléfono <-> PC) ---
  // Se rellenan cuando el proyecto Supabase esté creado.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Identificador del usuario único (eres tú). No requiere login de otros.
  USER_ID: "carlos"
};
