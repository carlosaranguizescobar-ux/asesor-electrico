/*
 * Cálculos eléctricos determinísticos (Etapa 1 - Fase 2).
 * A) Corriente nominal (mono/trifásica).
 * B) Sección por capacidad de corriente (RIC N°04).
 * Toda salida incluye: fórmula, datos usados, resultado y referencia.
 */
window.Calc = (function () {
  const R = window.RIC04;

  // ---------- A) Corriente nominal ----------
  // Monofásica:  I = P / (V · cosφ)
  // Trifásica:   I = P / (√3 · V · cosφ)
  function corrienteNominal({ sistema, potencia_W, tension_V, cosphi }) {
    const errs = [];
    const P = Number(potencia_W), V = Number(tension_V), fp = Number(cosphi);
    if (!(P > 0)) errs.push("La potencia debe ser mayor que 0.");
    if (!(V > 0)) errs.push("La tensión debe ser mayor que 0.");
    if (!(fp > 0 && fp <= 1)) errs.push("El factor de potencia debe estar entre 0 y 1.");
    if (errs.length) return { ok: false, errores: errs };

    const trifasico = sistema === "trifasico";
    const raiz3 = Math.sqrt(3);
    const denom = (trifasico ? raiz3 * V : V) * fp;
    const I = P / denom;

    return {
      ok: true,
      corriente_A: I,
      formula: trifasico ? "I = P / (√3 · V · cosφ)" : "I = P / (V · cosφ)",
      datos: {
        "Sistema": trifasico ? "Trifásico" : "Monofásico",
        "Potencia P": P + " W",
        "Tensión V": V + " V",
        "Factor de potencia cosφ": fp.toFixed(2),
        ...(trifasico ? { "√3": raiz3.toFixed(4) } : {})
      },
      referencia: "Fórmula estándar de electrotecnia (literatura técnica). Tensiones nominales en Chile: 230 V monofásico / 400 V trifásico (RIC)."
    };
  }

  // ---------- B) Sección por capacidad de corriente (RIC N°04) ----------
  // Ic = It · fn · ft  (pliego 6.2.6).  Se busca la menor sección con Ic ≥ Id.
  function seccionPorCapacidad({ corrienteDiseno_A, tempServicio, metodo, tempAmbiente_C, nConductores }) {
    const errs = [];
    const Id = Number(corrienteDiseno_A);
    const tamb = Number(tempAmbiente_C);
    const nC = parseInt(nConductores, 10);
    const tipo = R.TIPOS_CABLE[tempServicio];

    if (!(Id > 0)) errs.push("La corriente de diseño debe ser mayor que 0.");
    if (!tipo) errs.push("Tipo de cable no válido.");
    if (tipo && tipo.metodos.indexOf(metodo) === -1) errs.push("El método " + metodo + " no aplica a ese tipo de cable.");
    if (!(nC >= 1)) errs.push("El número de conductores debe ser 1 o más.");
    const fti = R.ftIndex(tamb);
    if (fti === -1) errs.push("La temperatura ambiente debe estar entre 5 y 60 °C (rango tabulado en RIC N°04).");
    if (errs.length) return { ok: false, errores: errs };

    const fn = R.fn(nC);
    const ft = R.ftColumna(tempServicio, metodo)[fti];
    const columna = tipo.tabla[metodo];
    const ItRequerida = Id / (fn * ft);

    let elegido = null;
    for (let i = 0; i < R.SECCIONES.length; i++) {
      const It = columna[i];
      if (It == null) continue; // método sin valor para esa sección (p. ej. F en secciones chicas)
      if (It >= ItRequerida) {
        elegido = { i, It, seccion: R.SECCIONES[i][0], awg: R.SECCIONES[i][1] };
        break;
      }
    }

    if (!elegido) {
      return {
        ok: false,
        sinSolucion: true,
        errores: ["La corriente de diseño supera la mayor sección tabulada (300 mm²) para esta configuración. Requiere cálculo especial o conductores en paralelo."],
        fn, ft, ItRequerida
      };
    }

    const Ic = elegido.It * fn * ft;
    return {
      ok: true,
      seccion_mm2: elegido.seccion,
      awg: elegido.awg,
      It_A: elegido.It,
      fn, ft,
      Ic_A: Ic,
      formula: "Ic = It · fn · ft   →   se elige la menor sección con Ic ≥ Id",
      datos: {
        "Corriente de diseño Id": Id.toFixed(2) + " A",
        "Tipo de cable": tipo.label,
        "Método de instalación": R.METODOS[metodo],
        "Temperatura ambiente": tamb + " °C",
        "N° de conductores activos": nC,
        "Factor fn (Tabla 4.6)": fn.toFixed(2),
        "Factor ft (Tabla 4.7)": ft.toFixed(2),
        "It requerida (Id/(fn·ft))": ItRequerida.toFixed(2) + " A",
        "It de tabla (sección elegida)": elegido.It + " A",
        "Capacidad corregida Ic": Ic.toFixed(2) + " A"
      },
      referencia: "RIC N°04, Tabla 4.4 (capacidad de corriente), Tabla 4.6 (fn), Tabla 4.7 (ft) y expresión 6.2.6. Exigencia normativa."
    };
  }

  return { corrienteNominal, seccionPorCapacidad };
})();
