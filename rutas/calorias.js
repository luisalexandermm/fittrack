// ============================================================
//  Calorías: cuánto gasta cada entrenamiento (estimación)
//
//  Fórmula estándar con MET (equivalente metabólico):
//      kcal por minuto = MET × 3,5 × peso (kg) / 200
//  - El MET depende de lo que haces: cardio gasta más que estirar.
//  - El nivel lo ajusta: avanzado trabaja más fuerte que principiante.
//  - 7.700 kcal ≈ 1 kg de grasa (aproximación usada en nutrición).
//
//  Es una ESTIMACIÓN: no cuenta lo que comes ni tu metabolismo.
//  Por eso en la app siempre se muestra junto a lo que marca la báscula.
// ============================================================

// MET de cada tipo de ejercicio (valores del Compendio de Actividades Físicas, redondeados)
// Referencias del Compendio: calistenia vigorosa (burpees, jumping jacks) 8,0 · moderada 3,8 ·
// entrenamiento de fuerza con varios ejercicios 5,0 · yoga / estiramientos 2,5
const MET_GRUPO = {
  cardio: 8.0,      // burpees, jumping jacks, skater…
  piernas: 6.0,     // sentadillas, zancadas, saltos
  empuje: 5.0,      // flexiones, fondos
  tiron: 5.0,       // remos, superman
  core: 4.0,        // planchas, crunch
  movilidad: 2.5,   // yoga, estiramientos dinámicos
  gimnasio: 5.0     // máquinas y pesas (si el grupo no tiene otro valor)
};
const MET_CALENTAMIENTO = 3.5;
const MET_ENFRIAMIENTO = 2.3;
const MET_DESCANSO = 2.0;          // descanso activo entre ejercicios (de pie, respirando)
const FACTOR_NIVEL = { 1: 0.85, 2: 1, 3: 1.15 };
const KCAL_POR_KG = 7700;

// Si el usuario no ha registrado su peso, se usa uno de referencia
const PESO_REFERENCIA = { hombre: 75, mujer: 62 };
const PESO_SIN_DATO = 70;

function pesoParaCalculo(pesoMedido, sexo) {
  if (pesoMedido && pesoMedido > 20 && pesoMedido < 400) return { kg: pesoMedido, estimado: false };
  return { kg: PESO_REFERENCIA[sexo] || PESO_SIN_DATO, estimado: true };
}

// "MET-minutos" de una rutina: no dependen del peso, así se pueden guardar en la rutina.
// Cuenta el calentamiento, el circuito con sus descansos y el enfriamiento.
function metMinutosRutina(rutina) {
  const factor = FACTOR_NIVEL[rutina.nivel] || 1;
  let total = 0;
  for (const bloque of rutina.bloques) {
    for (const ej of bloque.ejercicios) {
      const minutos = (ej.segundos * bloque.rondas) / 60;
      if (bloque.tipo === 'calentamiento') total += MET_CALENTAMIENTO * minutos;
      else if (bloque.tipo === 'enfriamiento') total += MET_ENFRIAMIENTO * minutos;
      else total += metDe(ej) * factor * minutos;
    }
    if (bloque.tipo === 'principal') {
      const descansos = bloque.ejercicios.length * bloque.rondas - 1;
      const segundos = descansos * rutina.descanso + (bloque.rondas - 1) * (rutina.descanso_ronda - rutina.descanso);
      total += MET_DESCANSO * Math.max(segundos, 0) / 60;
    }
  }
  return Math.round(total);
}

function metDe(ejercicio) {
  return MET_GRUPO[ejercicio.grupo] || (ejercicio.equipo === 'gimnasio' ? MET_GRUPO.gimnasio : 4);
}

// MET-minutos de una sesión a partir de los segundos que hizo de cada cosa.
// segundos = { calentamiento, enfriamiento, descanso, piernas, empuje, cardio, … }
function metMinutosSesion(segundos, nivel) {
  const factor = FACTOR_NIVEL[nivel] || 1;
  let total = 0;
  for (const [tipo, seg] of Object.entries(segundos || {})) {
    const s = Math.min(Math.max(Number(seg) || 0, 0), 4 * 3600);
    if (tipo === 'calentamiento') total += MET_CALENTAMIENTO * s / 60;
    else if (tipo === 'enfriamiento') total += MET_ENFRIAMIENTO * s / 60;
    else if (tipo === 'descanso') total += MET_DESCANSO * s / 60;
    else if (MET_GRUPO[tipo]) total += MET_GRUPO[tipo] * factor * s / 60;
  }
  return total;
}

// Para sesiones viejas que no guardaron el detalle: MET promedio según el objetivo
// (promedios reales de las rutinas que arma el generador, contando descansos,
//  calentamiento y enfriamiento: así las sesiones viejas y las nuevas son comparables)
const MET_OBJETIVO = { grasa: 3.8, musculo: 3.2, resistencia: 4.1, movilidad: 3.0 };
function metMinutosAproximados(minutos, objetivo, nivel) {
  return (MET_OBJETIVO[objetivo] || 5) * (FACTOR_NIVEL[nivel] || 1) * minutos;
}

function kcalDe(metMinutos, kg) {
  return Math.round(metMinutos * 3.5 * kg / 200);
}

function kgDe(kcal) {
  return kcal / KCAL_POR_KG;
}

// % de grasa estimado con la cintura (RFM, Woolcott y Lemaitre 2018):
//   hombres: 64 − 20 × (altura / cintura)   ·   mujeres: 76 − 20 × (altura / cintura)
// Solo se calcula si hay altura, cintura y sexo (hombre o mujer).
function grasaEstimada(alturaCm, cinturaCm, sexo) {
  if (!alturaCm || !cinturaCm || !['hombre', 'mujer'].includes(sexo)) return null;
  const base = sexo === 'hombre' ? 64 : 76;
  const valor = base - 20 * (alturaCm / cinturaCm);
  return valor > 3 && valor < 70 ? +valor.toFixed(1) : null;
}

module.exports = {
  MET_GRUPO, KCAL_POR_KG, pesoParaCalculo, metMinutosRutina, metMinutosSesion,
  metMinutosAproximados, kcalDe, kgDe, grasaEstimada
};
