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

  // ---------- C) Caída de tensión ----------
  // ΔV = k · L · I · cosφ / (γ · S)   (k = 2 monofásico, √3 trifásico)
  // %ΔV = ΔV / Vnom · 100.  Reactancia despreciada (ámbito viviendas/pequeños locales).
  // Límites: RIC N°03 5.1.3 (tramo 3%, total 5%) o RIC N°14 5.1 (alimentador 2%, derivación 3%).
  function limitesCDT(normativa, tipoTramo) {
    if (normativa === "ric14") {
      const limTramo = (tipoTramo === "derivacion") ? 3 : 2; // alimentador/subalim 2% (5.1.1), derivación 3% (5.1.2)
      return {
        limTramo, limTotal: 3,
        refTramo: (tipoTramo === "derivacion")
          ? "RIC N°14 5.1.2 — derivaciones ≤ 3% (punto más desfavorable). Exigencia normativa."
          : "RIC N°14 5.1.1 — alimentadores ≤ 2% a la carga nominal. Exigencia normativa.",
        refTotal: "RIC N°14 5.1.2 — ≤ 3% en el punto más desfavorable."
      };
    }
    return {
      limTramo: 3, limTotal: 5,
      refTramo: "RIC N°03 5.1.3 — caída del tramo ≤ 3% de la tensión nominal. Exigencia normativa.",
      refTotal: "RIC N°03 5.1.3 — caída total en el punto más desfavorable ≤ 5%."
    };
  }
  // Sección mínima permisible por tipo de tramo (RIC N°03 5.1.2).
  const PISO_SECCION = { alimentador: 4, subalimentador: 2.5, derivacion: 0 };

  // seccion_mm2 vacío/0  ->  modo "dimensionar": la sección es el resultado.
  function caidaTension({ sistema, corriente_A, longitud_m, seccion_mm2, cosphi, tension_V, gamma, normativa, tipoTramo, acumulada_pct }) {
    const errs = [];
    const I = Number(corriente_A), L = Number(longitud_m);
    const fp = Number(cosphi), V = Number(tension_V), g = Number(gamma);
    const acum = Number(acumulada_pct || 0);
    const S = Number(seccion_mm2);
    const dimensionar = !(S > 0); // sin sección elegida -> calcular la mínima
    if (!(I > 0)) errs.push("La corriente debe ser mayor que 0.");
    if (!(L > 0)) errs.push("El largo del tramo debe ser mayor que 0.");
    if (!(fp > 0 && fp <= 1)) errs.push("El factor de potencia debe estar entre 0 y 1.");
    if (!(V > 0)) errs.push("La tensión nominal debe ser mayor que 0.");
    if (!(g > 0)) errs.push("La conductividad γ debe ser mayor que 0.");
    if (!(acum >= 0)) errs.push("La caída acumulada aguas arriba no puede ser negativa.");
    if (errs.length) return { ok: false, errores: errs };

    const trifasico = sistema === "trifasico";
    const k = trifasico ? Math.sqrt(3) : 2;
    const lim = limitesCDT(normativa, tipoTramo);
    const piso = PISO_SECCION[tipoTramo] || 0;
    const formula = trifasico ? "ΔV = √3 · L · I · cosφ / (γ · S)" : "ΔV = 2 · L · I · cosφ / (γ · S)";
    const pctDe = (Sx) => (k * L * I * fp) / (g * Sx) / V * 100;

    // Límite efectivo para dimensionar: el más estricto entre tramo y lo que deja el total.
    const margenTotal = lim.limTotal - acum;       // lo que puede caer este tramo sin pasar el total
    const limObjetivo = Math.min(lim.limTramo, margenTotal);

    // Sección mínima que cumple (y respeta el piso normativo).
    let secMin = null;
    for (let i = 0; i < R.SECCIONES.length; i++) {
      const Sx = R.SECCIONES[i][0];
      if (Sx < piso) continue;
      if (pctDe(Sx) <= limObjetivo) { secMin = { seccion: Sx, awg: R.SECCIONES[i][1], pct: pctDe(Sx) }; break; }
    }

    if (dimensionar) {
      const base = {
        ok: true, dimensionar: true, seccionMin: secMin,
        limTramo: lim.limTramo, limTotal: lim.limTotal, limObjetivo,
        formula,
        datos: {
          "Sistema": trifasico ? "Trifásico" : "Monofásico",
          "Corriente I": I + " A",
          "Largo del tramo L": L + " m",
          "Factor de potencia cosφ": fp.toFixed(2),
          "Tensión nominal": V + " V",
          "Conductividad γ": g + " m/(Ω·mm²)",
          "Límite de caída aplicable": limObjetivo.toFixed(2) + " %" + (acum > 0 ? " (tramo " + lim.limTramo + "% y total " + lim.limTotal + "% con " + acum.toFixed(2) + "% aguas arriba)" : "")
        },
        refTramo: lim.refTramo, refTotal: lim.refTotal,
        referencia: "Límite: " + lim.refTramo + " Fórmula de ΔV: literatura técnica estándar (reactancia despreciada)."
      };
      if (secMin) {
        base.datos["Sección mínima"] = secMin.seccion + " mm²" + (secMin.awg !== "—" ? " (AWG " + secMin.awg + ")" : "");
        base.datos["Caída con esa sección"] = secMin.pct.toFixed(2) + " %";
      }
      return base;
    }

    // Modo verificar una sección elegida.
    const dV = (k * L * I * fp) / (g * S);
    const pct = (dV / V) * 100;
    const pctTotal = acum + pct;
    const okTramo = pct <= lim.limTramo;
    const okTotal = pctTotal <= lim.limTotal;
    return {
      ok: true,
      deltaV_V: dV, pct_tramo: pct, pct_total: pctTotal,
      limTramo: lim.limTramo, limTotal: lim.limTotal,
      okTramo, okTotal, seccionMin: secMin,
      formula,
      datos: {
        "Sistema": trifasico ? "Trifásico" : "Monofásico",
        "Corriente I": I + " A",
        "Largo del tramo L": L + " m",
        "Sección S": S + " mm²",
        "Factor de potencia cosφ": fp.toFixed(2),
        "Tensión nominal": V + " V",
        "Conductividad γ": g + " m/(Ω·mm²)",
        "Caída ΔV": dV.toFixed(2) + " V",
        "Caída del tramo": pct.toFixed(2) + " %",
        ...(acum > 0 ? { "Acumulada aguas arriba": acum.toFixed(2) + " %", "Caída total": pctTotal.toFixed(2) + " %" } : {})
      },
      refTramo: lim.refTramo, refTotal: lim.refTotal,
      referencia: "Límite: " + lim.refTramo + " Fórmula de ΔV: literatura técnica estándar (reactancia despreciada)."
    };
  }

  // ---------- D) Dimensionar sección (combina capacidad + caída de tensión) ----------
  // La sección a usar es la MAYOR entre la exigida por capacidad (RIC N°04)
  // y la exigida por caída de tensión (RIC N°03/N°14). Gana el criterio más exigente.
  function dimensionarSeccion(p) {
    const resB = seccionPorCapacidad({
      corrienteDiseno_A: p.corrienteDiseno_A, tempServicio: p.tempServicio,
      metodo: p.metodo, tempAmbiente_C: p.tempAmbiente_C, nConductores: p.nConductores
    });
    const resC = caidaTension({
      sistema: p.sistema, corriente_A: p.corrienteDiseno_A, longitud_m: p.longitud_m,
      seccion_mm2: "", cosphi: p.cosphi, tension_V: p.tension_V, gamma: p.gamma,
      normativa: p.normativa, tipoTramo: p.tipoTramo, acumulada_pct: p.acumulada_pct
    });

    const errs = [];
    if (!resB.ok) errs.push(...(resB.errores || ["No se pudo calcular la sección por capacidad."]));
    if (!resC.ok) errs.push(...(resC.errores || ["No se pudo calcular la sección por caída de tensión."]));
    if (resC.ok && !resC.seccionMin) errs.push("Ninguna sección tabulada cumple la caída de tensión con estos datos.");
    if (errs.length) return { ok: false, errores: errs };

    const sCap = resB.seccion_mm2, sCdt = resC.seccionMin.seccion;
    let gobierna, seccionFinal, awgFinal;
    if (sCap > sCdt) { gobierna = "capacidad"; seccionFinal = sCap; awgFinal = resB.awg; }
    else if (sCdt > sCap) { gobierna = "caida"; seccionFinal = sCdt; awgFinal = resC.seccionMin.awg; }
    else { gobierna = "ambos"; seccionFinal = sCap; awgFinal = resB.awg; }

    const awgCap = resB.awg !== "—" ? " (AWG " + resB.awg + ")" : "";
    const awgCdt = resC.seccionMin.awg !== "—" ? " (AWG " + resC.seccionMin.awg + ")" : "";
    const keyCaida = "Por caída de tensión (RIC N°" + (p.normativa === "ric14" ? "14" : "03") + ")";
    const datos = {
      "Corriente de diseño Id": Number(p.corrienteDiseno_A).toFixed(2) + " A",
      "Por capacidad de corriente (RIC N°04)": sCap + " mm²" + awgCap + " · Ic " + resB.Ic_A.toFixed(1) + " A"
    };
    datos[keyCaida] = sCdt + " mm²" + awgCdt + " · ΔV " + resC.seccionMin.pct.toFixed(2) + "%";

    return {
      ok: true,
      seccionFinal_mm2: seccionFinal, awgFinal,
      gobierna,
      porCapacidad: { seccion: sCap, awg: resB.awg, It: resB.It_A, Ic: resB.Ic_A },
      porCaida: { seccion: sCdt, awg: resC.seccionMin.awg, pct: resC.seccionMin.pct, limObjetivo: resC.limObjetivo },
      datos,
      referencia: "Combina RIC N°04 (capacidad, Tablas 4.4/4.6/4.7) y RIC N°03/N°14 (caída de tensión). Exigencia normativa; fórmula de ΔV: literatura técnica."
    };
  }

  // ---------- E) Demanda de alumbrado (RIC N°03, Tabla 3.1 / punto 6.3) ----------
  // Factores por tramos acumulativos sobre la potencia instalada de alumbrado.
  // Solo para alimentadores de alumbrado; NO aplica a subalimentadores ni circuitos finales.
  const DEMANDA_TIPOS = {
    casa:       { label: "Casa habitación",                brackets: [[0, 3, 1.0], [3, 120, 0.35], [120, Infinity, 0.25]] },
    hospital:   { label: "Hospitales",                     brackets: [[0, 50, 0.4], [50, Infinity, 0.2]] },
    hotel:      { label: "Hoteles y moteles",              brackets: [[0, 20, 0.5], [20, 100, 0.4], [100, Infinity, 0.3]] },
    bodega:     { label: "Bodegas",                        brackets: [[0, 12.5, 1.0], [12.5, Infinity, 0.5]] },
    servicios:  { label: "Servicios comunes",              brackets: [[0, Infinity, 1.0]] },
    comercial:  { label: "Locales comerciales y oficinas", brackets: [[0, 50, 1.0], [50, Infinity, 0.8]] },
    otro:       { label: "Todo otro tipo",                 brackets: [[0, Infinity, 1.0]] }
  };

  function demandaAlumbrado({ tipo, potencia_kW }) {
    const P = Number(potencia_kW);
    const t = DEMANDA_TIPOS[tipo];
    const errs = [];
    if (!(P > 0)) errs.push("La potencia instalada debe ser mayor que 0.");
    if (!t) errs.push("Tipo de consumidor no válido.");
    if (errs.length) return { ok: false, errores: errs };

    let demanda = 0;
    const tramos = [];
    for (const [lo, hi, f] of t.brackets) {
      if (P > lo) {
        const w = Math.min(P, hi) - lo;
        const aporte = w * f;
        demanda += aporte;
        const rango = hi === Infinity ? ("sobre " + lo) : (lo === 0 ? ("primeros " + hi) : (lo + " a " + hi));
        tramos.push({ rango, potencia: w, factor: f, aporte });
      }
    }

    const datos = {
      "Tipo de consumidor": t.label,
      "Potencia instalada (alumbrado)": P + " kW"
    };
    tramos.forEach((tr) => {
      datos["Tramo " + tr.rango + " [kW]"] = tr.potencia.toFixed(2) + " × " + tr.factor + " = " + tr.aporte.toFixed(2) + " kW";
    });

    return {
      ok: true,
      demanda_kW: demanda,
      formula: "Demanda = Σ (potencia de cada tramo × su factor)",
      datos,
      referencia: "RIC N°03, Tabla 3.1 y punto 6.3 (alimentadores de alumbrado). Exigencia normativa. No aplica a subalimentadores ni a circuitos finales."
    };
  }

  // ---------- F) Resistencia de puesta a tierra (RIC N°06, Tablas 6.3 y 6.4) ----------
  // Estimación orientativa de R según el tipo de electrodo:
  //   Pica vertical:                   R = ρ / L
  //   Placa enterrada:                 R = 0,8 · ρ / P
  //   Conductor enterrado horizontal:  R = 2 · ρ / L
  // ρ en Ω·m (Tabla 6.3 u otro valor ingresado); L o P en metros.
  const RESISTIVIDAD = {
    cultivable:  { label: "Terrenos cultivables y fértiles; terraplenes compactos y húmedos", rho: 50 },
    poco_fertil: { label: "Terraplenes cultivables poco fértiles y otros terraplenes",         rho: 500 },
    pedregoso:   { label: "Suelos pedregosos desnudos; arenas secas permeables",               rho: 3000 }
  };
  const ELECTRODOS = {
    pica:      { label: "Pica vertical",                     dimLabel: "Longitud de la pica L",     formula: "R = ρ / L",       calc: (rho, x) => rho / x },
    placa:     { label: "Placa enterrada",                   dimLabel: "Perímetro de la placa P",   formula: "R = 0,8 · ρ / P", calc: (rho, x) => 0.8 * rho / x },
    conductor: { label: "Conductor enterrado horizontalmente", dimLabel: "Longitud del conductor L", formula: "R = 2 · ρ / L",   calc: (rho, x) => 2 * rho / x }
  };

  function resistenciaTierra({ electrodo, dimension_m, resistividad, rho_manual }) {
    const e = ELECTRODOS[electrodo];
    const x = Number(dimension_m);
    let rho = null, rhoLabel = "";
    if (resistividad === "otro") {
      rho = Number(rho_manual); rhoLabel = "ingresada manualmente";
    } else if (RESISTIVIDAD[resistividad]) {
      rho = RESISTIVIDAD[resistividad].rho; rhoLabel = RESISTIVIDAD[resistividad].label + " (Tabla 6.3)";
    }

    const errs = [];
    if (!e) errs.push("Tipo de electrodo no válido.");
    if (!(x > 0)) errs.push("El largo/perímetro debe ser mayor que 0.");
    if (!(rho > 0)) errs.push("La resistividad ρ debe ser mayor que 0.");
    if (errs.length) return { ok: false, errores: errs };

    const Rt = e.calc(rho, x);
    const LIM_SERVICIO = 20; // RIC N°06, punto 6.1
    const datos = { "Tipo de electrodo": e.label, "Resistividad ρ": rho + " Ω·m (" + rhoLabel + ")" };
    datos[e.dimLabel] = x + " m";
    datos["Resistencia estimada R"] = Rt.toFixed(2) + " Ω";

    return {
      ok: true,
      resistencia_ohm: Rt,
      limServicio: LIM_SERVICIO,
      cumpleServicio: Rt <= LIM_SERVICIO,
      formula: e.formula,
      datos,
      referencia: "RIC N°06 — Tabla 6.4 (fórmulas) y Tabla 6.3 (resistividad). Exigencia normativa. Los valores de resistividad son orientativos (punto 8.13) y todo SPT debe medirse y comprobarse en terreno al momento de la puesta en servicio (punto 9.2). Límite de referencia: tierra de servicio ≤ 20 Ω (punto 6.1)."
    };
  }

  return { corrienteNominal, seccionPorCapacidad, caidaTension, dimensionarSeccion, demandaAlumbrado, resistenciaTierra, DEMANDA_TIPOS, RESISTIVIDAD, ELECTRODOS };
})();
