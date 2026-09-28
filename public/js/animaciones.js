// ============================================================
//  animaciones.js — figuras animadas para cada ejercicio (SVG)
// ------------------------------------------------------------
//  Cada ejercicio usa un "movimiento": una lista de poses clave.
//  La figura es un esqueleto simple (cadera, torso, cabeza, brazos
//  y piernas) y el navegador interpola entre las poses 60 veces por
//  segundo. No usa imágenes ni videos: pesa casi nada.
//
//  Uso:
//    montarAnimacion(elemento, 'Sentadilla')   → pinta y anima
//    patronDe('Sentadilla')                    → nombre del movimiento
//
//  Coordenadas: SVG de 120 × 120, el suelo está en y = 110.
//  Los ángulos van en grados: 0 = hacia abajo, 90 = hacia adelante
//  (derecha), 180 = hacia arriba, -90 = hacia atrás (izquierda).
// ============================================================

(function () {
  // ---------- Medidas del cuerpo ----------
  const L = { torso: 28, cuello: 4, cabeza: 7, brazo: 15, antebrazo: 14, muslo: 22, pierna: 21, pie: 5 };
  const SUELO = 110;

  // ---------- Pequeñas utilidades de geometría ----------
  const rad = g => (g * Math.PI) / 180;
  const vec = (g, largo) => [Math.sin(rad(g)) * largo, Math.cos(rad(g)) * largo];
  const sumar = (p, v) => [p[0] + v[0], p[1] + v[1]];
  const angulo = (desde, hasta) => (Math.atan2(hasta[0] - desde[0], hasta[1] - desde[1]) * 180) / Math.PI;
  const mezcla = (a, b, t) => a + (b - a) * t;

  // Cinemática inversa de 2 huesos: ¿qué ángulos llevan la mano (o el pie) a "objetivo"?
  // doblez = 1 dobla hacia adelante (rodillas), -1 hacia atrás (codos)
  function resolverIK(raiz, objetivo, l1, l2, doblez) {
    const dx = objetivo[0] - raiz[0], dy = objetivo[1] - raiz[1];
    const d = Math.min(Math.max(Math.hypot(dx, dy), Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
    const base = angulo(raiz, objetivo);
    const alfa = (Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * 180) / Math.PI;
    const arriba = base + doblez * alfa;
    const codo = sumar(raiz, vec(arriba, l1));
    return [arriba, angulo(codo, objetivo)];
  }

  // ---------- Atajos para escribir las poses ----------
  // A(u, l): ángulos directos del hueso de arriba y el de abajo
  // P(x, y, doblez): punto fijo del SVG (manos o pies apoyados)
  // R(dx, dy, doblez): punto relativo al hombro (brazos) o a la cadera (piernas)
  const A = (u, l) => ({ ang: [u, l] });
  const P = (x, y, s) => ({ pos: [x, y], s });
  const R = (dx, dy, s) => ({ rel: [dx, dy], s });

  // Pose de pie base. Cada movimiento cambia solo lo que necesita.
  const DE_PIE = { h: [60, 64], t: 180, b1: A(12, 22), b2: A(-8, 2), m1: P(62, 107), m2: P(57, 107) };
  const pose = cambios => ({ ...DE_PIE, ...cambios });
  // Intercambia lado cercano y lejano (para ejercicios que alternan)
  const espejo = p => ({ ...p, b1: p.b2, b2: p.b1, m1: p.m2, m2: p.m1 });

  // ============================================================
  //  MOVIMIENTOS
  //  cuadros: poses clave · dur: ms entre poses · frente: vista de frente
  //  abierto: al final salta al inicio sin volver (círculos)
  //  activo: partes que se colorean · extras: objetos (banco, pesas…)
  // ============================================================
  const M = {};
  const suelo = 106.5; // altura de manos y pies apoyados

  // ---------- PIERNAS ----------
  const sentadillaAbajo = { h: [44, 86], t: 140, b1: A(96, 96), b2: A(92, 92), m1: P(62, 107), m2: P(57, 107) };
  M.sentadilla = { cuadros: [pose({ b1: A(14, 26) }), sentadillaAbajo], dur: 900, activo: ['piernas'] };

  M.sentadillaSalto = {
    cuadros: [
      pose({ b1: A(14, 26) }),
      { ...sentadillaAbajo, b1: A(-40, -30), b2: A(-45, -35) },
      pose({ h: [60, 52], b1: A(168, 172), b2: A(162, 170), m1: P(63, 94), m2: P(58, 95) }),
      { ...sentadillaAbajo, b1: A(-30, -20), b2: A(-35, -25) }
    ], dur: 420, activo: ['piernas']
  };

  M.sentadillaPared = {
    cuadros: [
      { h: [44, 86], t: 180, b1: A(30, 70), b2: A(25, 65), m1: P(64, 107), m2: P(60, 107) },
      { h: [44, 85], t: 180, b1: A(30, 72), b2: A(25, 67), m1: P(64, 107), m2: P(60, 107) }
    ], dur: 1400, activo: ['piernas'], extras: [{ tipo: 'pared', x: 39 }]
  };

  M.sentadillaBrazosArriba = {
    cuadros: [pose({ b1: A(14, 26) }), { h: [50, 80], t: 160, b1: A(170, 172), b2: A(166, 170), m1: P(62, 107), m2: P(57, 107) }],
    dur: 1300, activo: ['piernas', 'brazos']
  };

  M.sentadillaProfunda = {
    cuadros: [
      { h: [52, 96], t: 155, b1: A(60, 130), b2: A(55, 125), m1: P(64, 107), m2: P(59, 107) },
      { h: [52, 94], t: 160, b1: A(62, 135), b2: A(57, 130), m1: P(64, 107), m2: P(59, 107) }
    ], dur: 1600, activo: ['piernas']
  };

  M.goblet = {
    cuadros: [
      pose({ b1: A(20, 165), b2: A(15, 160) }),
      { h: [45, 87], t: 150, b1: A(55, 175), b2: A(50, 170), m1: P(62, 107), m2: P(57, 107) }
    ], dur: 1000, activo: ['piernas'], extras: [{ tipo: 'pesa', en: 'mano1', grande: true }]
  };

  // De frente: piernas abiertas, rodillas hacia afuera
  M.sumo = {
    frente: true,
    cuadros: [
      { h: [60, 68], t: 180, b1: A(-6, -6), b2: A(6, 6), m1: P(80, 107), m2: P(40, 107) },
      { h: [60, 84], t: 180, b1: A(-6, -6), b2: A(6, 6), m1: P(80, 107, 1), m2: P(40, 107, -1) }
    ], dur: 1300, activo: ['piernas']
  };

  const zancada = { h: [58, 80], t: 180, b1: A(6, 12), b2: A(-4, 2), m1: P(78, 107), m2: P(32, 105, 1) };
  M.zancada = {
    cuadros: [pose({ b1: A(6, 12) }), zancada, pose({ b1: A(6, 12) }), espejo(zancada)],
    dur: 800, activo: ['piernas']
  };

  const zancadaAire = pose({ h: [58, 57], b1: A(150, 160), b2: A(140, 150), m1: P(66, 97), m2: P(50, 98) });
  M.zancadaSalto = { cuadros: [zancada, zancadaAire, espejo(zancada), espejo(zancadaAire)], dur: 420, activo: ['piernas'] };

  M.bulgara = {
    cuadros: [
      { h: [60, 67], t: 180, b1: A(6, 12), b2: A(-4, 2), m1: P(72, 107), m2: P(34, 89, 1) },
      { h: [57, 82], t: 172, b1: A(8, 14), b2: A(-2, 4), m1: P(74, 107), m2: P(34, 89, 1) }
    ], dur: 1000, activo: ['piernas'], extras: [{ tipo: 'caja', x: 20, y: 91, w: 22, h: 19 }]
  };

  M.pistol = {
    cuadros: [
      { h: [58, 64], t: 180, b1: A(90, 90), b2: A(86, 86), m1: P(60, 107), m2: A(40, 40) },
      { h: [44, 91], t: 145, b1: A(100, 100), b2: A(96, 96), m1: P(58, 107), m2: A(92, 92) }
    ], dur: 1200, activo: ['piernas'], extras: [{ tipo: 'pared', x: 94 }]
  };

  // Boca arriba, rodillas dobladas (cabeza a la izquierda)
  const puenteAbajo = { h: [62, 103], t: -90, c: -90, b1: A(90, 90), b2: A(88, 88), m1: P(84, 107, 1), m2: P(81, 107, 1) };
  const puenteArriba = { h: [62, 88], t: -62, c: -85, b1: A(84, 90), b2: A(82, 88), m1: P(84, 107, 1), m2: P(81, 107, 1) };
  M.puente = { cuadros: [puenteAbajo, puenteArriba], dur: 1000, activo: ['piernas'] };
  M.puenteExtension = {
    cuadros: [puenteArriba, { ...puenteArriba, m1: A(118, 118) }, puenteArriba, { ...puenteArriba, m2: A(118, 118) }],
    dur: 900, activo: ['piernas']
  };

  M.prensa = {
    cuadros: [
      { h: [48, 90], t: -130, c: -140, b1: A(20, 60), b2: A(18, 58), m1: P(66, 66, -1), m2: P(63, 68, -1) },
      { h: [48, 90], t: -130, c: -140, b1: A(20, 60), b2: A(18, 58), m1: P(82, 58, -1), m2: P(79, 60, -1) }
    ], dur: 1000, activo: ['piernas'],
    extras: [{ tipo: 'caja', x: 18, y: 93, w: 40, h: 17 }, { tipo: 'linea', desde: [30, 93], hasta: [20, 62] }, { tipo: 'placa', en: 'pie1' }]
  };

  M.pesoMuerto = {
    cuadros: [
      pose({ b1: A(4, 4), b2: A(2, 2) }),
      { h: [50, 68], t: 102, b1: A(2, 2), b2: A(0, 0), m1: P(62, 107), m2: P(57, 107) }
    ], dur: 1100, activo: ['piernas'], extras: [{ tipo: 'pesa', en: 'mano1' }]
  };

  M.extensionCuadriceps = {
    cuadros: [
      { h: [56, 86], t: 172, b1: A(20, 20), b2: A(16, 16), m1: A(90, 0), m2: A(88, -2) },
      { h: [56, 86], t: 172, b1: A(20, 20), b2: A(16, 16), m1: A(90, 86), m2: A(88, 84) }
    ], dur: 1000, activo: ['piernas'], extras: [{ tipo: 'caja', x: 38, y: 90, w: 26, h: 20 }, { tipo: 'rodillo', en: 'pie1' }]
  };

  M.curlFemoral = {
    cuadros: [
      { h: [50, 88], t: 90, c: 100, b1: A(20, 40), b2: A(18, 38), m1: A(-90, -90), m2: A(-90, -92) },
      { h: [50, 88], t: 90, c: 100, b1: A(20, 40), b2: A(18, 38), m1: A(-90, 175), m2: A(-90, 172) }
    ], dur: 1000, activo: ['piernas'], extras: [{ tipo: 'caja', x: 14, y: 92, w: 70, h: 18 }, { tipo: 'rodillo', en: 'pie1' }]
  };

  // ---------- EMPUJE ----------
  // Flexión de lado: cabeza a la derecha, pies a la izquierda, manos fijas en el suelo
  const flexArriba = { h: [46, 88], t: 116, c: 118, b1: P(72, suelo, -1), b2: P(70, suelo, -1), m1: A(-64, -64), m2: A(-65, -65) };
  const flexAbajo = { h: [50, 99], t: 100, c: 104, b1: P(72, suelo, -1), b2: P(70, suelo, -1), m1: A(-80, -80), m2: A(-81, -81) };
  M.flexion = { cuadros: [flexArriba, flexAbajo], dur: 800, activo: ['brazos', 'torso'] };

  M.flexionRodillas = {
    cuadros: [
      { h: [48, 92], t: 128, c: 130, b1: P(71, suelo, -1), b2: P(69, suelo, -1), m1: A(-52, -140), m2: A(-54, -142) },
      { h: [51, 98], t: 110, c: 114, b1: P(71, suelo, -1), b2: P(69, suelo, -1), m1: A(-70, -150), m2: A(-72, -152) }
    ], dur: 850, activo: ['brazos', 'torso']
  };

  M.flexionInclinada = {
    cuadros: [
      { h: [44, 76], t: 128, c: 130, b1: P(80, 86, -1), b2: P(78, 86, -1), m1: P(12, 107), m2: P(14, 107) },
      { h: [47, 80], t: 114, c: 116, b1: P(80, 86, -1), b2: P(78, 86, -1), m1: P(12, 107), m2: P(14, 107) }
    ], dur: 850, activo: ['brazos'], extras: [{ tipo: 'mesa', x: 70, y: 88, w: 30 }]
  };

  M.flexionExplosiva = {
    cuadros: [flexAbajo, flexArriba, { ...flexArriba, h: [46, 82], t: 120, b1: A(2, 6), b2: A(0, 4), m1: A(-60, -60), m2: A(-61, -61) }, flexArriba],
    dur: 380, activo: ['brazos', 'torso']
  };

  M.pica = {
    cuadros: [
      { h: [50, 66], t: 42, c: 30, b1: P(84, suelo, -1), b2: P(82, suelo, -1), m1: P(28, 107), m2: P(30, 107) },
      { h: [50, 68], t: 22, c: 12, b1: P(84, suelo, -1), b2: P(82, suelo, -1), m1: P(28, 107), m2: P(30, 107) }
    ], dur: 900, activo: ['brazos']
  };

  M.fondos = {
    cuadros: [
      { h: [52, 77], t: 176, b1: P(44, 90, -1), b2: P(46, 90, -1), m1: P(86, 107), m2: P(84, 107) },
      { h: [53, 91], t: 172, b1: P(44, 90, -1), b2: P(46, 90, -1), m1: P(86, 107), m2: P(84, 107) }
    ], dur: 900, activo: ['brazos'], extras: [{ tipo: 'caja', x: 26, y: 92, w: 22, h: 18 }]
  };

  M.pressBanca = {
    cuadros: [
      { h: [72, 83], t: -90, c: -92, b1: A(178, 178), b2: A(176, 176), m1: P(92, 107, 1), m2: P(89, 107, 1) },
      { h: [72, 83], t: -90, c: -92, b1: A(120, 210), b2: A(118, 208), m1: P(92, 107, 1), m2: P(89, 107, 1) }
    ], dur: 1000, activo: ['brazos', 'torso'], extras: [{ tipo: 'caja', x: 28, y: 87, w: 50, h: 23 }, { tipo: 'pesa', en: 'mano1' }]
  };

  M.pressMilitar = {
    cuadros: [pose({ b1: A(40, 170), b2: A(36, 166) }), pose({ b1: A(176, 178), b2: A(172, 176) })],
    dur: 1000, activo: ['brazos'], extras: [{ tipo: 'pesa', en: 'mano1' }]
  };

  // ---------- TIRÓN (espalda) ----------
  M.superman = {
    cuadros: [
      { h: [50, 103], t: 90, c: 92, b1: A(90, 90), b2: A(88, 88), m1: A(-90, -90), m2: A(-90, -90) },
      { h: [50, 103], t: 102, c: 106, b1: A(106, 108), b2: A(104, 106), m1: A(-98, -100), m2: A(-97, -99) }
    ], dur: 1000, activo: ['torso']
  };

  M.nadador = {
    cuadros: [
      { h: [50, 103], t: 98, c: 100, b1: A(104, 104), b2: A(102, 102), m1: A(-92, -92), m2: A(-92, -92) },
      { h: [50, 103], t: 98, c: 100, b1: A(165, 165), b2: A(163, 163), m1: A(-92, -92), m2: A(-92, -92) },
      { h: [50, 103], t: 98, c: 100, b1: A(-120, -70), b2: A(-122, -72), m1: A(-92, -92), m2: A(-92, -92) }
    ], dur: 900, activo: ['brazos', 'torso']
  };

  M.remoToalla = {
    cuadros: [
      { h: [48, 70], t: 200, b1: P(80, 50, -1), b2: P(80, 52, -1), m1: P(62, 107), m2: P(60, 107) },
      { h: [52, 67], t: 186, b1: P(80, 50, -1), b2: P(80, 52, -1), m1: P(62, 107), m2: P(60, 107) }
    ], dur: 1000, activo: ['brazos', 'torso'], extras: [{ tipo: 'pared', x: 86 }, { tipo: 'cuerda', desde: [86, 50], en: 'mano1' }]
  };

  // Acostado bajo la mesa: el cuerpo gira sobre los talones
  M.remoInvertido = {
    cuadros: [
      { h: [48, 96], t: 104, c: 106, b1: P(74, 62, -1), b2: P(72, 62, -1), m1: A(-76, -76), m2: A(-77, -77) },
      { h: [45, 88], t: 116, c: 118, b1: P(74, 62, -1), b2: P(72, 62, -1), m1: A(-64, -64), m2: A(-65, -65) }
    ], dur: 1000, activo: ['brazos', 'torso'],
    extras: [{ tipo: 'linea', desde: [58, 60], hasta: [106, 60] }, { tipo: 'linea', desde: [103, 60], hasta: [103, 110] }]
  };

  M.jalon = {
    cuadros: [
      { h: [56, 88], t: 180, b1: A(172, 172), b2: A(168, 168), m1: A(90, 0), m2: A(88, -2) },
      { h: [56, 88], t: 186, b1: A(130, 200), b2: A(128, 198), m1: A(90, 0), m2: A(88, -2) }
    ], dur: 1000, activo: ['brazos', 'torso'],
    extras: [{ tipo: 'caja', x: 42, y: 91, w: 26, h: 19 }, { tipo: 'barra', en: 'mano1', ancho: 22 }, { tipo: 'cuerda', desde: [58, 10], en: 'mano1' }]
  };

  M.remoPolea = {
    cuadros: [
      { h: [46, 92], t: 164, b1: A(92, 92), b2: A(90, 90), m1: P(80, 100, 1), m2: P(78, 101, 1) },
      { h: [46, 92], t: 186, b1: A(-50, 90), b2: A(-52, 88), m1: P(80, 100, 1), m2: P(78, 101, 1) }
    ], dur: 1000, activo: ['brazos', 'torso'],
    extras: [{ tipo: 'caja', x: 32, y: 95, w: 26, h: 15 }, { tipo: 'cuerda', desde: [104, 96], en: 'mano1' }, { tipo: 'pared', x: 104 }]
  };

  M.facePull = {
    cuadros: [pose({ b1: A(100, 95), b2: A(98, 93) }), pose({ b1: A(-80, 150), b2: A(-82, 148) })],
    dur: 1000, activo: ['brazos'], extras: [{ tipo: 'pared', x: 104 }, { tipo: 'cuerda', desde: [104, 28], en: 'mano1' }]
  };

  // ---------- CORE ----------
  // Plancha sobre antebrazos
  const plancha = { h: [46, 97], t: 104, c: 106, b1: A(0, 90), b2: A(-2, 88), m1: A(-76, -76), m2: A(-77, -77) };
  M.plancha = { cuadros: [plancha, { ...plancha, h: [46, 96] }], dur: 1500, activo: ['torso'] };

  M.planchaLateral = {
    cuadros: [
      { h: [53, 89], t: 114, c: 116, b1: P(79, suelo, -1), b2: A(150, 150), m1: A(-66, -66), m2: A(-64, -64) },
      { h: [53, 86], t: 117, c: 119, b1: P(79, suelo, -1), b2: A(180, 180), m1: A(-63, -63), m2: A(-61, -61) }
    ], dur: 1400, activo: ['torso']
  };

  M.toqueHombro = {
    cuadros: [
      flexArriba,
      { ...flexArriba, b1: R(-3, 5, -1) },
      flexArriba,
      { ...flexArriba, b2: R(-3, 5, -1) }
    ], dur: 600, activo: ['torso']
  };

  M.escaladores = {
    cuadros: [
      { ...flexArriba, m1: P(50, 100, 1) },
      { ...flexArriba, m2: P(50, 100, 1) }
    ], dur: 320, activo: ['torso', 'piernas']
  };

  // Boca arriba: cabeza a la izquierda
  const acostado = { h: [66, 103], t: -90, c: -90 };
  M.deadBug = {
    cuadros: [
      { ...acostado, b1: A(-178, -178), b2: A(-176, -176), m1: A(178, 90), m2: A(176, 88) },
      { ...acostado, b1: A(-100, -100), b2: A(-176, -176), m1: A(178, 90), m2: A(96, 96) },
      { ...acostado, b1: A(-178, -178), b2: A(-176, -176), m1: A(178, 90), m2: A(176, 88) },
      { ...acostado, b1: A(-178, -178), b2: A(-100, -100), m1: A(96, 96), m2: A(176, 88) }
    ], dur: 800, activo: ['torso']
  };

  M.crunch = {
    cuadros: [
      { h: [62, 103], t: -90, c: -90, b1: A(-150, -30), b2: A(-148, -28), m1: P(84, 107, 1), m2: P(81, 107, 1) },
      { h: [62, 103], t: -124, c: -140, b1: A(-182, -62), b2: A(-180, -60), m1: P(84, 107, 1), m2: P(81, 107, 1) }
    ], dur: 800, activo: ['torso']
  };

  M.bicicleta = {
    cuadros: [
      { h: [62, 103], t: -116, c: -130, b1: A(-172, -52), b2: A(-168, -48), m1: A(-160, 100), m2: A(96, 96) },
      { h: [62, 103], t: -116, c: -130, b1: A(-168, -48), b2: A(-172, -52), m1: A(96, 96), m2: A(-160, 100) }
    ], dur: 550, activo: ['torso']
  };

  M.hollow = {
    cuadros: [
      { h: [62, 104], t: -106, c: -116, b1: A(-104, -104), b2: A(-102, -102), m1: A(106, 106), m2: A(104, 104) },
      { h: [62, 104], t: -103, c: -113, b1: A(-106, -106), b2: A(-104, -104), m1: A(103, 103), m2: A(101, 101) }
    ], dur: 1400, activo: ['torso']
  };

  // De rodillas frente a la polea
  M.crunchPolea = {
    cuadros: [
      { h: [56, 85], t: 168, c: 155, b1: A(150, -10), b2: A(148, -12), m1: A(0, -90), m2: A(-2, -92) },
      { h: [56, 85], t: 112, c: 100, b1: A(110, -40), b2: A(108, -42), m1: A(0, -90), m2: A(-2, -92) }
    ], dur: 1000, activo: ['torso'], extras: [{ tipo: 'pared', x: 100 }, { tipo: 'cuerda', desde: [100, 18], en: 'mano1' }]
  };

  M.pallof = {
    cuadros: [pose({ b1: A(40, 150), b2: A(38, 148) }), pose({ b1: A(92, 92), b2: A(90, 90) })],
    dur: 1200, activo: ['torso'], extras: [{ tipo: 'pared', x: 104 }, { tipo: 'cuerda', desde: [104, 54], en: 'mano1' }]
  };

  // ---------- CARDIO ----------
  M.jumpingJacks = {
    frente: true,
    cuadros: [
      { h: [60, 64], t: 180, b1: A(10, 6), b2: A(-10, -6), m1: P(64, 107), m2: P(56, 107) },
      { h: [60, 62], t: 180, b1: A(150, 160), b2: A(-150, -160), m1: P(80, 107), m2: P(40, 107) }
    ], dur: 380, activo: ['piernas', 'brazos']
  };

  const rodilla = pose({ m1: A(88, 4), b1: A(-40, 60), b2: A(40, 120) });
  M.rodillas = { cuadros: [rodilla, pose({ h: [60, 63] }), espejo(rodilla), pose({ h: [60, 63] })], dur: 260, activo: ['piernas'] };
  M.marcha = {
    cuadros: [pose({ m1: A(60, 0), b1: A(-25, 20), b2: A(25, 40) }), pose(), pose({ m2: A(60, 0), b2: A(-25, 20), b1: A(25, 40) }), pose()],
    dur: 480, activo: ['piernas']
  };

  const guardia = { h: [58, 66], t: 176, b1: A(40, 165), b2: A(30, 160), m1: P(70, 107), m2: P(47, 107) };
  M.boxeo = {
    cuadros: [guardia, { ...guardia, t: 172, b1: A(94, 94) }, guardia, { ...guardia, t: 168, b2: A(96, 96) }],
    dur: 300, activo: ['brazos']
  };

  M.skater = {
    frente: true,
    cuadros: [
      { h: [46, 72], t: 164, b1: A(-40, -30), b2: A(-60, -50), m1: P(50, 107), m2: P(58, 102, 1) },
      { h: [60, 58], t: 180, b1: A(20, 10), b2: A(-20, -10), m1: P(66, 97), m2: P(54, 97) },
      { h: [74, 72], t: 196, b1: A(60, 50), b2: A(40, 30), m1: P(62, 102, -1), m2: P(70, 107) },
      { h: [60, 58], t: 180, b1: A(20, 10), b2: A(-20, -10), m1: P(66, 97), m2: P(54, 97) }
    ], dur: 360, activo: ['piernas']
  };

  const agachado = { h: [50, 91], t: 128, c: 132, b1: P(74, suelo, -1), b2: P(72, suelo, -1), m1: P(60, 107), m2: P(57, 107) };
  const saltoArriba = pose({ h: [60, 52], b1: A(170, 172), b2: A(166, 170), m1: P(62, 95), m2: P(57, 95) });
  M.burpee = {
    cuadros: [pose({ b1: A(14, 26) }), agachado, { ...flexArriba, b1: P(74, suelo, -1), b2: P(72, suelo, -1) }, agachado, saltoArriba],
    dur: 420, activo: ['piernas', 'brazos', 'torso']
  };
  M.burpeeFlexion = {
    cuadros: [pose({ b1: A(14, 26) }), agachado, flexArriba, flexAbajo, flexArriba, agachado, saltoArriba],
    dur: 420, activo: ['piernas', 'brazos', 'torso']
  };

  M.tijera = {
    cuadros: [
      { h: [58, 68], t: 180, b1: A(-30, 10), b2: A(40, 80), m1: P(74, 107), m2: P(42, 107) },
      pose({ h: [58, 58], b1: A(0, 20), b2: A(0, 20), m1: P(61, 99), m2: P(55, 99) }),
      { h: [58, 68], t: 180, b1: A(40, 80), b2: A(-30, 10), m1: P(42, 107), m2: P(74, 107) },
      pose({ h: [58, 58], b1: A(0, 20), b2: A(0, 20), m1: P(55, 99), m2: P(61, 99) })
    ], dur: 260, activo: ['piernas']
  };

  M.swing = {
    cuadros: [
      { h: [50, 70], t: 112, b1: A(-20, -20), b2: A(-22, -22), m1: P(64, 107), m2: P(58, 107) },
      pose({ b1: A(92, 92), b2: A(90, 90), m1: P(64, 107), m2: P(58, 107) })
    ], dur: 600, activo: ['piernas'], extras: [{ tipo: 'kettlebell', en: 'mano1' }]
  };

  // Bicicleta estática: los pies giran alrededor del pedal
  M.bici = {
    abierto: true,
    cuadros: [0, 90, 180, 270, 360].map(g => ({
      h: [48, 70], t: 150, c: 140, b1: P(84, 58, -1), b2: P(84, 59, -1),
      m1: P(62 + Math.sin(rad(g)) * 9, 94 + Math.cos(rad(g)) * 9, 1),
      m2: P(62 - Math.sin(rad(g)) * 9, 94 - Math.cos(rad(g)) * 9, 1)
    })), dur: 260, activo: ['piernas'],
    extras: [
      { tipo: 'rueda', x: 62, y: 94, r: 9 }, { tipo: 'linea', desde: [48, 74], hasta: [62, 110] },
      { tipo: 'linea', desde: [84, 58], hasta: [74, 110] }, { tipo: 'linea', desde: [42, 74], hasta: [54, 74] }
    ]
  };

  M.remoMaquina = {
    cuadros: [
      { h: [40, 96], t: 150, c: 150, b1: A(96, 96), b2: A(94, 94), m1: P(62, 96, 1), m2: P(60, 97, 1) },
      { h: [62, 96], t: 196, c: 190, b1: A(-40, 88), b2: A(-42, 86), m1: P(84, 100, 1), m2: P(82, 101, 1) }
    ], dur: 700, activo: ['piernas', 'brazos', 'torso'],
    extras: [{ tipo: 'linea', desde: [22, 102], hasta: [104, 102] }, { tipo: 'cuerda', desde: [104, 96], en: 'mano1' }]
  };

  M.caminata = {
    cuadros: [
      pose({ h: [60, 60], t: 174, m1: P(72, 98), m2: P(48, 101), b1: A(-30, -10), b2: A(30, 50) }),
      pose({ h: [60, 60], t: 174, m1: P(48, 101), m2: P(72, 98), b1: A(30, 50), b2: A(-30, -10) })
    ], dur: 600, activo: ['piernas'],
    extras: [{ tipo: 'linea', desde: [24, 104], hasta: [98, 97] }, { tipo: 'linea', desde: [96, 97], hasta: [100, 40] }]
  };

  // ---------- MOVILIDAD ----------
  M.brazosCirculos = {
    abierto: true,
    cuadros: [0, 90, 180, 270, 360].map(g => pose({ b1: A(g, g), b2: A(g + 12, g + 12) })),
    dur: 450, activo: ['brazos']
  };

  M.caderaCirculos = {
    frente: true,
    cuadros: [
      { h: [55, 64], t: 185, b1: R(7, 24, 1), b2: R(-7, 24, -1), m1: P(70, 107), m2: P(50, 107) },
      { h: [60, 66], t: 180, b1: R(7, 24, 1), b2: R(-7, 24, -1), m1: P(70, 107), m2: P(50, 107) },
      { h: [65, 64], t: 175, b1: R(7, 24, 1), b2: R(-7, 24, -1), m1: P(70, 107), m2: P(50, 107) },
      { h: [60, 62], t: 180, b1: R(7, 24, 1), b2: R(-7, 24, -1), m1: P(70, 107), m2: P(50, 107) }
    ], dur: 600, activo: ['piernas']
  };

  // En cuatro apoyos (cabeza a la derecha)
  const cuatro = { h: [42, 84], t: 104, c: 115, b1: A(0, 0), b2: A(-2, -2), m1: A(0, -90), m2: A(-2, -92) };
  M.gatoCamello = {
    cuadros: [{ ...cuatro, t: 98, c: 50 }, { ...cuatro, t: 110, c: 150 }],
    dur: 1300, activo: ['torso']
  };
  M.rotacionToracica = {
    cuadros: [{ ...cuatro, b2: A(-10, -10) }, { ...cuatro, t: 108, b1: A(180, 180), b2: A(0, 0), c: 160 }],
    dur: 1200, activo: ['torso', 'brazos']
  };
  M.nino = {
    cuadros: [
      { h: [40, 95], t: 76, c: 92, b1: A(78, 92), b2: A(77, 91), m1: A(63, -95), m2: A(62, -96) },
      { h: [40, 94], t: 80, c: 96, b1: A(80, 92), b2: A(79, 91), m1: A(63, -95), m2: A(62, -96) }
    ], dur: 1800, activo: ['torso']
  };

  const perro = { h: [48, 69], t: 49, c: 35, b1: P(91, suelo, -1), b2: P(89, suelo, -1), m1: P(28, 107), m2: P(30, 107) };
  const cobra = { h: [50, 103], t: 135, c: 155, b1: P(72, suelo, -1), b2: P(70, suelo, -1), m1: A(-90, -90), m2: A(-91, -91) };
  M.perroCobra = { cuadros: [perro, cobra], dur: 1300, activo: ['torso'] };

  M.saludoSol = {
    cuadros: [
      pose({ b1: A(172, 176), b2: A(168, 172) }),
      { h: [56, 64], t: 15, c: 8, b1: P(68, suelo, -1), b2: P(66, suelo, -1), m1: P(60, 107), m2: P(57, 107) },
      flexArriba,
      { ...cobra, b1: P(74, suelo, -1), b2: P(72, suelo, -1) },
      perro
    ], dur: 1000, activo: ['torso', 'piernas']
  };

  M.estocadaRotacion = {
    cuadros: [
      { h: [58, 86], t: 180, b1: A(20, 20), b2: A(-10, -10), m1: P(80, 107), m2: P(28, 105, 1) },
      { h: [58, 86], t: 176, b1: A(178, 178), b2: A(60, 60), m1: P(80, 107), m2: P(28, 105, 1) }
    ], dur: 1200, activo: ['torso']
  };

  M.cuadriceps = {
    cuadros: [pose({ m2: A(-8, -172), b2: A(-24, -140) }), pose({ m2: A(-12, -174), b2: A(-26, -142), t: 178 })],
    dur: 1600, activo: ['piernas']
  };

  M.isquios = {
    cuadros: [
      { h: [38, 103], t: 170, c: 160, b1: A(120, 110), b2: A(118, 108), m1: A(90, 90), m2: A(88, 88) },
      { h: [38, 103], t: 116, c: 108, b1: A(92, 92), b2: A(90, 90), m1: A(90, 90), m2: A(88, 88) }
    ], dur: 1600, activo: ['piernas']
  };

  M.pechoPared = {
    cuadros: [pose({ b2: A(-92, -92), b1: A(6, 12), t: 182 }), pose({ b2: A(-96, -96), b1: A(6, 12), t: 174 })],
    dur: 1600, activo: ['torso'], extras: [{ tipo: 'pared', x: 26 }]
  };

  M.respiracion = {
    cuadros: [pose({ b1: A(10, 18), b2: A(-8, 2) }), pose({ b1: A(60, 60), b2: A(52, 52), t: 178 })],
    dur: 2000, activo: ['torso']
  };

  M.descanso = {
    cuadros: [pose({ b1: A(8, 14), b2: A(-4, 2) }), pose({ b1: A(8, 16), b2: A(-4, 4), t: 178 })],
    dur: 1800, activo: []
  };

  // ============================================================
  //  EJERCICIO → MOVIMIENTO (y el equipo que se muestra en la ficha)
  // ============================================================
  const EJERCICIOS = {
    'Movilidad de hombros': 'brazosCirculos',
    'Rotación de cadera': 'caderaCirculos',
    'Marcha en el sitio': 'marcha',
    'Sentadilla con brazos arriba': 'sentadillaBrazosArriba',
    'Gato-camello': 'gatoCamello',
    'Sentadilla': 'sentadilla',
    'Zancada alterna': 'zancada',
    'Puente de glúteo': 'puente',
    'Sentadilla sumo con pausa': 'sumo',
    'Sentadilla con salto': 'sentadillaSalto',
    'Zancada búlgara (en silla)': 'bulgara',
    'Sentadilla a una pierna (pistol asistida)': 'pistol',
    'Zancada con salto': 'zancadaSalto',
    'Sentadilla isométrica en pared': 'sentadillaPared',
    'Flexiones con rodillas': 'flexionRodillas',
    'Flexiones inclinadas (en mesa)': 'flexionInclinada',
    'Flexiones': 'flexion',
    'Fondos en silla': 'fondos',
    'Flexiones pica (hombro)': 'pica',
    'Flexiones diamante': 'flexion',
    'Flexiones explosivas': 'flexionExplosiva',
    'Superman': 'superman',
    'Remo con toalla en puerta': 'remoToalla',
    'Nadador (brazos Y-T-W)': 'nadador',
    'Remo invertido bajo mesa': 'remoInvertido',
    'Plancha': 'plancha',
    'Bicho muerto (dead bug)': 'deadBug',
    'Crunch abdominal': 'crunch',
    'Escaladores': 'escaladores',
    'Plancha lateral': 'planchaLateral',
    'Bicicleta abdominal': 'bicicleta',
    'Hollow hold': 'hollow',
    'Plancha con toque de hombro': 'toqueHombro',
    'Jumping jacks': 'jumpingJacks',
    'Rodillas arriba': 'rodillas',
    'Boxeo de sombra': 'boxeo',
    'Skater (patinador)': 'skater',
    'Burpees': 'burpee',
    'Burpee con flexión': 'burpeeFlexion',
    'Saltos de tijera rápidos': 'tijera',
    'Saludo al sol': 'saludoSol',
    'Estocada con rotación': 'estocadaRotacion',
    'Perro boca abajo a cobra': 'perroCobra',
    'Sentadilla profunda sostenida': 'sentadillaProfunda',
    'Rotación torácica en 4 apoyos': 'rotacionToracica',
    'Puente con extensión de pierna': 'puenteExtension',
    'Estiramiento de cuádriceps': 'cuadriceps',
    'Estiramiento de isquios': 'isquios',
    'Postura del niño': 'nino',
    'Estiramiento de pecho en pared': 'pechoPared',
    'Respiración profunda': 'respiracion',
    'Prensa de piernas': 'prensa',
    'Sentadilla goblet con mancuerna': 'goblet',
    'Peso muerto rumano con mancuernas': 'pesoMuerto',
    'Extensión de cuádriceps en máquina': 'extensionCuadriceps',
    'Curl femoral en máquina': 'curlFemoral',
    'Press de banca con mancuernas': 'pressBanca',
    'Press militar con mancuernas': 'pressMilitar',
    'Jalón al pecho en polea': 'jalon',
    'Remo sentado en polea': 'remoPolea',
    'Face pull en polea': 'facePull',
    'Crunch en polea alta': 'crunchPolea',
    'Pallof press en polea': 'pallof',
    'Swing con kettlebell': 'swing',
    'Sprints en bicicleta estática': 'bici',
    'Remo en máquina': 'remoMaquina',
    'Caminata inclinada en cinta': 'caminata'
  };

  // Si aparece un ejercicio nuevo sin movimiento propio, se usa uno de su grupo
  const POR_GRUPO = { piernas: 'sentadilla', empuje: 'flexion', tiron: 'superman', core: 'plancha', cardio: 'jumpingJacks', movilidad: 'brazosCirculos' };

  const EQUIPO_TEXTO = {
    'Zancada búlgara (en silla)': 'Silla firme',
    'Sentadilla a una pierna (pistol asistida)': 'Pared o marco de puerta',
    'Sentadilla isométrica en pared': 'Pared',
    'Flexiones inclinadas (en mesa)': 'Mesa firme',
    'Fondos en silla': 'Silla firme',
    'Remo con toalla en puerta': 'Toalla y puerta',
    'Remo invertido bajo mesa': 'Mesa firme',
    'Estiramiento de pecho en pared': 'Pared',
    'Prensa de piernas': 'Máquina de prensa',
    'Sentadilla goblet con mancuerna': 'Mancuerna',
    'Peso muerto rumano con mancuernas': 'Mancuernas',
    'Extensión de cuádriceps en máquina': 'Máquina de extensión',
    'Curl femoral en máquina': 'Máquina de curl femoral',
    'Press de banca con mancuernas': 'Banco y mancuernas',
    'Press militar con mancuernas': 'Mancuernas',
    'Jalón al pecho en polea': 'Polea alta',
    'Remo sentado en polea': 'Polea baja',
    'Face pull en polea': 'Polea con cuerda',
    'Crunch en polea alta': 'Polea con cuerda',
    'Pallof press en polea': 'Polea',
    'Swing con kettlebell': 'Kettlebell',
    'Sprints en bicicleta estática': 'Bicicleta estática',
    'Remo en máquina': 'Máquina de remo',
    'Caminata inclinada en cinta': 'Cinta de correr'
  };

  function patronDe(nombre, grupo) {
    return EJERCICIOS[nombre] || POR_GRUPO[grupo] || 'descanso';
  }
  function equipoDe(ejercicio) {
    if (EQUIPO_TEXTO[ejercicio.nombre]) return EQUIPO_TEXTO[ejercicio.nombre];
    return ejercicio.equipo === 'gimnasio' ? 'Equipo de gimnasio' : 'Sin equipo';
  }

  // ============================================================
  //  MOTOR: de pose → puntos del cuerpo → SVG
  // ============================================================

  // Convierte una extremidad (ángulos, punto fijo o relativo) en sus dos ángulos
  function resolverExtremidad(spec, raiz, base, l1, l2, doblezDefecto) {
    if (spec.ang) return spec.ang;
    const objetivo = spec.pos ? spec.pos : [base[0] + spec.rel[0], base[1] + spec.rel[1]];
    return resolverIK(raiz, objetivo, l1, l2, spec.s ?? doblezDefecto);
  }

  // Mezcla dos poses (t de 0 a 1). Si una extremidad está escrita distinto
  // en cada pose, se mezclan sus ángulos ya calculados.
  function mezclarPoses(a, b, t, frente) {
    const r = { h: [mezcla(a.h[0], b.h[0], t), mezcla(a.h[1], b.h[1], t)], t: mezcla(a.t, b.t, t), c: mezcla(a.c ?? a.t, b.c ?? b.t, t) };
    for (const k of ['b1', 'b2', 'm1', 'm2']) {
      const x = a[k], y = b[k];
      if (x.pos && y.pos) r[k] = { pos: [mezcla(x.pos[0], y.pos[0], t), mezcla(x.pos[1], y.pos[1], t)], s: t < 0.5 ? x.s : y.s };
      else if (x.rel && y.rel) r[k] = { rel: [mezcla(x.rel[0], y.rel[0], t), mezcla(x.rel[1], y.rel[1], t)], s: t < 0.5 ? x.s : y.s };
      else {
        const ax = angulosDe(a, k, frente), ay = angulosDe(b, k, frente);
        r[k] = { ang: [mezcla(ax[0], ay[0], t), mezcla(ax[1], ay[1], t)] };
      }
    }
    return r;
  }

  function angulosDe(p, k, frente) {
    const cuerpo = esqueleto(p, frente, true);
    return cuerpo.angulos[k];
  }

  // Calcula todos los puntos del cuerpo para una pose
  function esqueleto(p, frente, soloAngulos) {
    const cadera = p.h;
    const hombro = sumar(cadera, vec(p.t, L.torso));
    const cuelloFin = sumar(hombro, vec(p.c ?? p.t, L.cuello));
    const cabeza = sumar(cuelloFin, vec(p.c ?? p.t, L.cabeza));
    // De frente, hombros y caderas se separan un poco a cada lado
    const lado = frente ? 1 : 0;
    const hombro1 = [hombro[0] + 7 * lado, hombro[1]], hombro2 = [hombro[0] - 7 * lado, hombro[1]];
    const cadera1 = [cadera[0] + 5 * lado, cadera[1]], cadera2 = [cadera[0] - 5 * lado, cadera[1]];

    const angulos = {
      b1: resolverExtremidad(p.b1, hombro1, hombro, L.brazo, L.antebrazo, -1),
      b2: resolverExtremidad(p.b2, hombro2, hombro, L.brazo, L.antebrazo, -1),
      m1: resolverExtremidad(p.m1, cadera1, cadera, L.muslo, L.pierna, frente ? 1 : 1),
      m2: resolverExtremidad(p.m2, cadera2, cadera, L.muslo, L.pierna, frente ? -1 : 1)
    };
    if (soloAngulos) return { angulos };

    const extremidad = (raiz, [u, l], l1, l2) => {
      const medio = sumar(raiz, vec(u, l1));
      return [raiz, medio, sumar(medio, vec(l, l2))];
    };
    const b1 = extremidad(hombro1, angulos.b1, L.brazo, L.antebrazo);
    const b2 = extremidad(hombro2, angulos.b2, L.brazo, L.antebrazo);
    const m1 = extremidad(cadera1, angulos.m1, L.muslo, L.pierna);
    const m2 = extremidad(cadera2, angulos.m2, L.muslo, L.pierna);
    // Pies: una rayita en ángulo recto con la pierna, hacia adelante
    const pie1 = sumar(m1[2], vec(angulos.m1[1] + (frente ? 90 : 90), L.pie));
    const pie2 = sumar(m2[2], vec(angulos.m2[1] + (frente ? -90 : 90), L.pie));
    return { cadera, hombro, cuelloFin, cabeza, hombro1, hombro2, b1, b2, m1, m2, pie1, pie2, mano1: b1[2], mano2: b2[2] };
  }

  // ---------- Dibujo ----------
  const NS = 'http://www.w3.org/2000/svg';
  const f = n => n.toFixed(1);
  const linea = pts => pts.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join(' ');

  function crearSVG(mov) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'figura');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `
      <line class="fig-suelo" x1="6" y1="110.5" x2="114" y2="110.5"/>
      <g class="fig-extras"></g>
      <g class="fig-lejos">
        <path data-p="b2" class="${mov.activo.includes('brazos') ? 'activo' : ''}"/>
        <path data-p="m2" class="${mov.activo.includes('piernas') ? 'activo' : ''}"/>
      </g>
      <path data-p="torso" class="fig-torso ${mov.activo.includes('torso') ? 'activo' : ''}"/>
      <circle data-p="cabeza" class="fig-cabeza" r="${L.cabeza}"/>
      <path data-p="m1" class="${mov.activo.includes('piernas') ? 'activo' : ''}"/>
      <path data-p="b1" class="${mov.activo.includes('brazos') ? 'activo' : ''}"/>
      <g class="fig-extras-frente"></g>`;
    if (mov.frente) svg.classList.add('de-frente');
    return svg;
  }

  function pintarExtras(svg, mov, c) {
    if (!mov.extras) return;
    const detras = [], delante = [];
    for (const e of mov.extras) {
      const punto = n => c[n] || (n === 'pie1' ? c.m1[2] : null);
      if (e.tipo === 'pared') detras.push(`<line class="fig-objeto" x1="${e.x}" y1="14" x2="${e.x}" y2="110"/>`);
      if (e.tipo === 'caja') detras.push(`<rect class="fig-objeto relleno" x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="2"/>`);
      if (e.tipo === 'mesa') detras.push(`<path class="fig-objeto" d="M${e.x} ${e.y} h${e.w} M${e.x + 3} ${e.y} V110 M${e.x + e.w - 3} ${e.y} V110"/>`);
      if (e.tipo === 'linea') detras.push(`<line class="fig-objeto" x1="${e.desde[0]}" y1="${e.desde[1]}" x2="${e.hasta[0]}" y2="${e.hasta[1]}"/>`);
      if (e.tipo === 'rueda') detras.push(`<circle class="fig-objeto" cx="${e.x}" cy="${e.y}" r="${e.r + 3}"/>`);
      if (e.tipo === 'cuerda') { const m = punto(e.en); detras.push(`<line class="fig-cable" x1="${e.desde[0]}" y1="${e.desde[1]}" x2="${f(m[0])}" y2="${f(m[1])}"/>`); }
      if (e.tipo === 'pesa') { const m = punto(e.en); const w = e.grande ? 12 : 10; delante.push(`<rect class="fig-pesa" x="${f(m[0] - w / 2)}" y="${f(m[1] - 3)}" width="${w}" height="6" rx="2"/>`); }
      if (e.tipo === 'kettlebell') { const m = punto(e.en); delante.push(`<circle class="fig-pesa" cx="${f(m[0])}" cy="${f(m[1] + 5)}" r="5"/>`); }
      if (e.tipo === 'barra') { const m = punto(e.en); delante.push(`<line class="fig-pesa-linea" x1="${f(m[0] - e.ancho / 2)}" y1="${f(m[1])}" x2="${f(m[0] + e.ancho / 2)}" y2="${f(m[1])}"/>`); }
      if (e.tipo === 'placa') { const m = punto(e.en); delante.push(`<line class="fig-pesa-linea" x1="${f(m[0] + 3)}" y1="${f(m[1] - 9)}" x2="${f(m[0] + 7)}" y2="${f(m[1] + 9)}"/>`); }
      if (e.tipo === 'rodillo') { const m = punto(e.en); delante.push(`<circle class="fig-pesa" cx="${f(m[0])}" cy="${f(m[1])}" r="3.4"/>`); }
    }
    svg.querySelector('.fig-extras').innerHTML = detras.join('');
    svg.querySelector('.fig-extras-frente').innerHTML = delante.join('');
  }

  function pintar(svg, mov, p) {
    const c = esqueleto(p, mov.frente);
    const q = s => svg.querySelector(`[data-p="${s}"]`);
    q('torso').setAttribute('d', linea([c.cadera, c.hombro, c.cuelloFin]));
    q('cabeza').setAttribute('cx', f(c.cabeza[0]));
    q('cabeza').setAttribute('cy', f(c.cabeza[1]));
    q('b1').setAttribute('d', linea(c.b1));
    q('b2').setAttribute('d', linea(c.b2));
    q('m1').setAttribute('d', linea([c.cadera, ...c.m1.slice(1), c.pie1]));
    q('m2').setAttribute('d', linea([c.cadera, ...c.m2.slice(1), c.pie2]));
    pintarExtras(svg, mov, c);
  }

  // Suaviza el inicio y el final de cada tramo
  const suave = t => 0.5 - Math.cos(Math.PI * t) / 2;

  // Pose en un instante (ms) del ciclo
  function poseEn(mov, ms) {
    const n = mov.cuadros.length;
    if (n === 1) return mov.cuadros[0];
    const tramos = mov.abierto ? n - 1 : n;
    const total = tramos * mov.dur;
    const local = ((ms % total) + total) % total;
    const i = Math.floor(local / mov.dur);
    const t = suave((local - i * mov.dur) / mov.dur);
    return mezclarPoses(mov.cuadros[i], mov.cuadros[(i + 1) % n], t, mov.frente);
  }

  // ---------- Ciclo de animación compartido ----------
  const activas = new Set();
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let corriendo = false;

  function cuadro(ahora) {
    for (const a of activas) {
      if (!a.el.isConnected) { activas.delete(a); continue; }
      if (!a.visible || a.pausada) continue;
      a.tiempo += ahora - (a.ultimo || ahora);
      a.ultimo = ahora;
      pintar(a.svg, a.mov, poseEn(a.mov, a.tiempo * a.velocidad));
    }
    for (const a of activas) if (!a.visible || a.pausada) a.ultimo = null;
    if (activas.size) requestAnimationFrame(cuadro);
    else corriendo = false;
  }

  const observador = 'IntersectionObserver' in window
    ? new IntersectionObserver(entradas => entradas.forEach(e => { if (e.target.__anim) e.target.__anim.visible = e.isIntersecting; }))
    : null;

  // Pinta la figura de un ejercicio dentro de "elemento" y la anima.
  // Devuelve un control con pausar(true/false).
  function montarAnimacion(elemento, nombre, grupo, opciones = {}) {
    const clave = M[nombre] ? nombre : patronDe(nombre, grupo);
    const mov = M[clave];
    const svg = crearSVG(mov);
    elemento.innerHTML = '';
    elemento.appendChild(svg);
    elemento.dataset.movimiento = clave;

    const anim = { el: elemento, svg, mov, tiempo: 0, ultimo: null, visible: !observador, pausada: false, velocidad: opciones.velocidad || 1 };
    elemento.__anim = anim;
    // Con "reducir movimiento" se muestra la pose principal, quieta
    pintar(svg, mov, mov.cuadros[Math.min(1, mov.cuadros.length - 1)]);
    if (reducido || opciones.quieta) return { pausar() {} };

    if (observador) observador.observe(elemento);
    activas.add(anim);
    if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); }
    return { pausar(si) { anim.pausada = si; } };
  }

  // Dibuja una pose fija (útil para miniaturas)
  function dibujarPose(elemento, nombre, grupo, cuadroN = 1) {
    const mov = M[M[nombre] ? nombre : patronDe(nombre, grupo)];
    const svg = crearSVG(mov);
    elemento.innerHTML = '';
    elemento.appendChild(svg);
    pintar(svg, mov, mov.cuadros[Math.min(cuadroN, mov.cuadros.length - 1)]);
  }

  window.montarAnimacion = montarAnimacion;
  window.dibujarPose = dibujarPose;
  window.patronDe = patronDe;
  window.equipoDe = equipoDe;
  window.MOVIMIENTOS = M;
  window.EJERCICIO_MOVIMIENTO = EJERCICIOS;
})();
