// Configuración de la app.
window.APP_CONFIG = {
  // Versión de la app (sirve para refrescar la caché al actualizar).
  version: "0.5.0",

  // --- Supabase ---
  // Proyecto: asesor-electrico (ref kgbwyvppyowncnrfuwjs, región sa-east-1).
  // La llave anónima es pública por diseño (protegida por RLS; las tablas no son
  // accesibles directo, solo a través de Edge Functions con rol de servicio).
  SUPABASE_URL: "https://kgbwyvppyowncnrfuwjs.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnYnd5dnBweW93bmNucmZ1d2pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMTk5NDIsImV4cCI6MjEwNzc5NTk0Mn0.hhV03Wx_MGoccvyFN1S0tOVeply6UFf_cxJkXKDH3dE",

  // Usuario único (eres tú).
  USER_ID: "carlos"
};
