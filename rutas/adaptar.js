// ============================================================
//  FitTrack Adaptive: el plan se acomoda a tu día
//
//  1. "Hoy tengo poco tiempo" → versión corta de la rutina de hoy.
//  2. "Hoy no puedo"          → la rutina pasa a la mañana del día siguiente.
//
//  Reglas para cuidarte (nunca se castiga descansar):
//  - Una rutina se puede pasar UNA sola vez: la recuperada no se vuelve a mover,
//    así nunca se acumulan entrenamientos.
//  - Un día no puede pasar del tope de minutos de actividad de tu nivel
//    (sumando su rutina y la recuperada). Si no cabe completa, se recorta.
//  - Si al día siguiente ya no cabe ni una versión de 10 min, se recomienda dejarla pasar.
//  - Nada cambia en tu semana hasta que aceptas la propuesta.
//
//  Aquí solo están las reglas (funciones puras, fáciles de probar).
//  Las rutas que leen y guardan el plan están en rutas/plan.js.
// ============================================================

const { acortarRutina } = require('./rutinas');

const MINUTOS_MINIMOS = 10;
const TOPE_DIA = { 1: 45, 2: 60, 3: 75 };         // minutos de actividad máximos en un día
const NOMBRES_NIVEL = { 1: 'principiante', 2: 'intermedio', 3: 'avanzado' };
const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// Error con un mensaje para mostrarle al usuario tal cual
class NoSePuede extends Error {
  constructor(mensaje, estado = 409) {
    super(mensaje);
    this.estado = estado;
  }
}

const minutosDe = rutina => Math.round(rutina.actividad_seg / 60);
const tituloDe = rutina => rutina.nombre.split(' · ')[0];
const principalDe = rutina => rutina.bloques.find(b => b.tipo === 'principal');
const rondas = n => `${n} ${n === 1 ? 'ronda' : 'rondas'}`;

// ---------- 1. Versión corta ----------
function versionCorta(dia, minutosPedidos) {
  if (!dia || !dia.entrena || !dia.rutina) throw new NoSePuede('Ese día es de descanso.', 400);
  const minutos = Math.round(Number(minutosPedidos));
  if (!Number.isFinite(minutos) || minutos < MINUTOS_MINIMOS || minutos > 60) {
    throw new NoSePuede(`Elige entre ${MINUTOS_MINIMOS} y 60 minutos.`, 400);
  }
  const antes = minutosDe(dia.rutina);
  if (minutos >= antes) throw new NoSePuede(`Tu rutina de hoy ya dura ${antes} min. Haz la normal.`, 400);

  const corta = acortarRutina(dia.rutina, minutos);
  corta.nombre = `${tituloDe(dia.rutina)} · ${minutosDe(corta)} min · versión corta`;

  const original = principalDe(dia.rutina);
  const nueva = principalDe(corta);
  const quedan = new Set(nueva.ejercicios.map(e => e.id));
  const quitados = original.ejercicios.filter(e => !quedan.has(e.id)).map(e => e.nombre);

  const explicacion = [
    `Mantiene el enfoque de hoy (${dia.titulo})${quitados.length ? '' : ' y tus mismos ejercicios'}.`,
    `${nueva.ejercicios.length} ejercicios × ${rondas(nueva.rondas)}, en vez de ${original.ejercicios.length} × ${rondas(original.rondas)}.`,
    quitados.length ? `Para que te alcance el tiempo sale: ${quitados.join(', ')}. Queda al menos un ejercicio de cada grupo.` : null,
    'El calentamiento y el enfriamiento son más cortos, pero no se quitan: preparan el cuerpo y evitan molestias.'
  ].filter(Boolean);

  return { rutina: corta, explicacion, minutos_antes: antes, minutos_ahora: minutosDe(corta) };
}

// ---------- 2. Pasar una rutina a la mañana siguiente ----------
// dia: el día que no pudiste (0 = lunes … 6 = domingo), hoy: el índice de hoy
function proponerMovida(plan, dia, hoy, nivel) {
  const origen = plan.dias[dia];
  if (!origen || !origen.entrena || !origen.rutina) throw new NoSePuede('Ese día no tiene entrenamiento.', 400);
  if (origen.movido_a != null) throw new NoSePuede(`Esa rutina ya la pasaste al ${NOMBRES_DIA[origen.movido_a]}.`);
  if (dia > hoy) throw new NoSePuede('Solo puedes pasar la rutina de hoy o la de un día que ya pasó.', 400);

  // Al día siguiente; si el día ya pasó hace rato, a hoy
  const destino = Math.max(dia + 1, hoy);
  if (destino > 6) {
    throw new NoSePuede('Es el último día de la semana. El lunes empieza tu semana nueva: descansa y retoma con ella.');
  }
  const llegada = plan.dias[destino];
  const nombreDestino = destino === hoy ? 'hoy' : `mañana (${NOMBRES_DIA[destino]})`;
  if (llegada.extra) {
    throw new NoSePuede(`El ${NOMBRES_DIA[destino]} ya tiene una rutina recuperada. No sumamos otra para cuidar tu recuperación.`);
  }

  const tope = TOPE_DIA[nivel] || TOPE_DIA[2];
  const ocupados = llegada.entrena && llegada.rutina ? minutosDe(llegada.rutina) : 0;
  const disponibles = tope - ocupados;
  if (disponibles < MINUTOS_MINIMOS) {
    throw new NoSePuede(`El ${NOMBRES_DIA[destino]} ya tienes ${ocupados} min de entreno y sumar más sería demasiado para un día. Déjala pasar: una sesión perdida no borra lo que ya avanzaste.`);
  }

  const completa = minutosDe(origen.rutina);
  const acortada = completa > disponibles;
  const base = acortada ? acortarRutina(origen.rutina, disponibles) : origen.rutina;
  const rutina = { ...base, nombre: `${tituloDe(origen.rutina)} · ${minutosDe(base)} min · recuperada` };
  const minutos = minutosDe(rutina);

  const explicacion = [
    `${origen.titulo} pasa a ${nombreDestino} en la mañana (${minutos} min).`,
    llegada.entrena
      ? `Ese día ya tenías ${llegada.titulo} (${ocupados} min): serán dos sesiones, una en la mañana y otra a tu hora de siempre.`
      : 'Ese día era de descanso: entrenas en la mañana y listo.',
    acortada
      ? `La recortamos de ${completa} a ${minutos} min para que el día no pase de ${tope} min de actividad (tu tope como ${NOMBRES_NIVEL[nivel] || 'intermedio'}).`
      : `En total serán ${ocupados + minutos} min ese día, dentro de tu tope de ${tope} min.`,
    llegada.entrena && llegada.enfoque === origen.enfoque && origen.enfoque !== 'full'
      ? `Ojo: las dos trabajan lo mismo (${origen.titulo}). Si sientes mucho cansancio, haz solo una.`
      : null,
    'Se puede pasar una sola vez: si ese día tampoco puedes, no se acumula.'
  ].filter(Boolean);

  return { origen: dia, destino, rutina, explicacion, acortada, total_minutos: ocupados + minutos };
}

// Guarda la propuesta en el plan (el que llama se encarga de guardar el plan)
function aplicarMovida(plan, propuesta) {
  plan.dias[propuesta.destino].extra = { rutina: propuesta.rutina, origen: propuesta.origen, momento: 'manana' };
  plan.dias[propuesta.origen].movido_a = propuesta.destino;
  return plan;
}

// Vuelve a dejar la rutina en su día original
function deshacerMovida(plan, dia) {
  const origen = plan.dias[dia];
  if (!origen || origen.movido_a == null) throw new NoSePuede('Esa rutina no se había pasado a otro día.', 400);
  delete plan.dias[origen.movido_a].extra;
  delete origen.movido_a;
  return plan;
}

module.exports = { versionCorta, proponerMovida, aplicarMovida, deshacerMovida, NoSePuede, TOPE_DIA, MINUTOS_MINIMOS };
