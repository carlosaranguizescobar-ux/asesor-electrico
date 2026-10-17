// Configuración de la app.
// La sincronización en la nube (Supabase) se activa cuando estos valores estén completos.
// Mientras estén vacíos, la app funciona 100% offline con almacenamiento local.
window.APP_CONFIG = {
  // Versión de la app (sirve para refrescar la caché al actualizar).
  version: "0.4.0",

  // --- Supabase (sincronización teléfono <-> PC) ---
  // Proyecto creado: asesor-electrico (ref kgbwyvppyowncnrfuwjs, región sa-east-1).
  // URL del proyecto: https://kgbwyvppyowncnrfuwjs.supabase.co
  // La conexión se ACTIVA con la primera función que guarde datos: ahí se
  // rellenan estos campos con la URL + la llave publishable, se crea la tabla
  // con su RLS y un login simple de usuario único. Mientras tanto: todo offline/local.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // Identificador del usuario único (eres tú). No requiere login de otros.
  USER_ID: "carlos"
};
