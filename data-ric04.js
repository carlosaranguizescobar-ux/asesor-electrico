/*
 * Datos del Pliego Técnico Normativo RIC N°04 (SEC, DS N°8/2019).
 * Transcritos y verificados contra el PDF oficial (págs. 18-23).
 * Capacidad de transporte de corriente de conductores de cobre aislados (Tabla 4.4),
 * factor por agrupamiento (Tabla 4.6) y por temperatura ambiente (Tabla 4.7).
 * Valores en amperes. NO modificar sin re-verificar contra el pliego.
 */
window.RIC04 = (function () {
  // [sección nominal mm², designación AWG/kcmil]
  const SECCIONES = [
    [1.5, "—"], [2.08, "14"], [2.5, "—"], [3.31, "12"], [4, "—"], [5.26, "10"],
    [6, "—"], [8.37, "8"], [10, "—"], [13.3, "6"], [16, "—"], [21.1, "4"],
    [25, "—"], [26.7, "3"], [33.6, "2"], [35, "—"], [42.4, "1"], [50, "—"],
    [53.5, "1/0"], [67.4, "2/0"], [70, "—"], [85, "3/0"], [95, "—"], [107.2, "4/0"],
    [120, "—"], [126.7, "250"], [150, "—"], [152, "300"], [177.3, "350"], [185, "—"],
    [202.7, "400"], [240, "—"], [253.3, "500"], [300, "—"]
  ];

  // Tabla 4.4 — Servicio 70°C (pág. 18). Métodos A1, B1, E.
  const T70 = {
    A1: [14,16,18,21,24,28,31,38,42,50,56,66,73,76,87,89,100,108,116,133,136,153,164,176,188,195,216,217,239,245,259,286,296,328],
    B1: [16,19,21,25,28,34,36,45,50,60,68,80,89,93,108,110,125,134,144,167,171,193,207,223,239,248,262,264,289,296,315,346,356,394],
    E:  [19,22,24,30,31,38,43,53,60,71,80,91,101,106,122,126,142,153,165,191,196,222,238,257,276,286,319,321,355,364,386,430,446,497]
  };

  // Tabla 4.4 — Servicio 90°C (págs. 19-20). Métodos A1,A2,B1,B2,D1,D2,E,F.
  const T90 = {
    A1: [17,21,23,28,31,37,40,49,54,65,73,86,95,99,114,117,132,141,152,175,179,201,216,232,249,257,285,287,316,324,342,380,392,435],
    A2: [17,20,22,26,30,35,38,46,51,61,68,80,89,92,106,109,122,130,140,161,164,185,197,212,227,234,259,261,287,295,312,346,357,396],
    B1: [18,24,24,31,37,39,48,59,66,79,88,105,117,122,141,144,163,175,188,217,222,251,269,290,312,322,342,344,374,384,405,450,464,514],
    B2: [19,24,24,31,35,38,44,54,60,72,80,95,105,109,125,128,144,154,165,190,194,218,233,251,268,277,300,302,331,340,358,398,410,455],
    D1: [19,30,33,38,42,48,52,63,68,80,89,103,113,117,132,136,150,159,170,192,197,218,232,248,263,270,296,299,325,332,349,382,393,431],
    D2: [23,31,38,39,59,69,74,89,98,114,126,147,161,167,189,194,216,230,245,278,282,315,339,362,396,396,431,437,474,486,510,563,576,629],
    E:  [19,28,32,38,42,50,54,67,75,89,100,114,127,133,154,158,178,192,207,240,246,278,298,322,346,358,399,402,444,456,483,538,557,621],
    F:  [null,null,null,null,42,50,55,68,77,93,105,126,141,147,172,176,200,216,234,273,279,318,342,371,400,415,464,468,518,533,567,634,657,736]
  };
  // Nota: D2 fila 126,7(250) = 396 según pliego pág. 20.

  // Tabla 4.6 — Factor fn por cantidad de conductores activos en el ducto.
  function fn(nConductores) {
    const n = nConductores;
    if (n <= 3) return 1.0;
    if (n <= 6) return 0.8;
    if (n <= 24) return 0.7;
    if (n <= 42) return 0.6;
    return 0.5;
  }

  // Tabla 4.7 — Factor ft por temperatura ambiente.
  const FT_RANGOS = [[5,10],[11,15],[16,20],[21,25],[26,30],[31,35],[36,40],[41,45],[46,50],[51,55],[56,60]];
  const FT = {
    // 70°C, métodos A1,B1,E
    c70:      [1.22,1.17,1.12,1.06,1.00,0.94,0.87,0.79,0.71,0.61,0.50],
    // 90°C, métodos A1,A2,B1,B2,E
    c90_aire: [1.15,1.12,1.08,1.04,1.00,0.96,0.91,0.87,0.82,0.76,0.71],
    // 90°C, métodos D1,D2 (enterrados; se usa temp. del suelo)
    c90_ent:  [1.07,1.04,1.00,0.96,0.93,0.89,0.85,0.80,0.76,0.71,0.65]
  };
  function ftIndex(tamb) {
    for (let i = 0; i < FT_RANGOS.length; i++) {
      if (tamb >= FT_RANGOS[i][0] && tamb <= FT_RANGOS[i][1]) return i;
    }
    return -1; // fuera de 5-60
  }

  // Tipos de cable por temperatura de servicio (tendido fijo, Tabla 4.4).
  const TIPOS_CABLE = {
    "70": { label: "70°C — H07V, H07Z1, THWN, NYIFY, ACOMETIDA", tabla: T70, metodos: ["A1","B1","E"] },
    "90": { label: "90°C — THHN, RV, RV-K, RZ1, RZ1-K",         tabla: T90, metodos: ["A1","A2","B1","B2","D1","D2","E","F"] }
  };

  const METODOS = {
    A1: "A1 · monopolares en ductos embutidos en pared",
    A2: "A2 · multiconductor en ductos embutidos en pared",
    B1: "B1 · monopolares en ductos/bandejas adosadas a pared",
    B2: "B2 · multiconductor en ductos/bandejas adosadas",
    D1: "D1 · en ductos enterrados",
    D2: "D2 · directamente enterrados",
    E:  "E · multiconductor al aire (escalerilla/bandeja)",
    F:  "F · monoconductores al aire, disposición plana"
  };

  // Columna de ft según tipo de cable + método.
  function ftColumna(tempServicio, metodo) {
    if (tempServicio === "70") return FT.c70;
    if (metodo === "D1" || metodo === "D2") return FT.c90_ent;
    return FT.c90_aire;
  }

  return { SECCIONES, TIPOS_CABLE, METODOS, fn, ftIndex, ftColumna, FT_RANGOS };
})();
