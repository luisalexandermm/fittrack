// ============================================================
//  plan-semanal.js — qué toca cada día de la semana
//  Se arma con la meta semanal (días de entreno) y el objetivo.
//  R = rutina del objetivo · M = movilidad · A = descanso activo · D = descanso
// ============================================================

// Patrón de lunes a domingo según los días de entreno por semana
const PATRONES = {
  1: 'RDADDAD',
  2: 'RDADRAD',
  3: 'RARDRAD',
  4: 'RARMRDA',
  5: 'RRARMRD',
  6: 'RRMRRRD',
  7: 'RRMRRRM'
};

// Devuelve lo que toca en una fecha "YYYY-MM-DD"
function actividadDelDia(fecha, perfilUsuario) {
  const d = new Date(fecha + 'T12:00:00');
  const indice = (d.getDay() + 6) % 7; // 0 = lunes
  const patron = PATRONES[perfilUsuario.meta_semanal] || PATRONES[3];
  const tipo = patron[indice];

  const objetivo = perfilUsuario.objetivo;
  const pictoObjetivo = { grasa: 'p-cardio', musculo: 'p-empuje', resistencia: 'p-piernas', movilidad: 'p-movilidad' }[objetivo];

  if (tipo === 'R') return {
    tipo, entrena: true, objetivo, picto: pictoObjetivo,
    titulo: `Rutina de ${NOMBRES_CORTOS[objetivo].toLowerCase()}`,
    detalle: `${perfilUsuario.minutos} min · En casa`, minutos: perfilUsuario.minutos
  };
  if (tipo === 'M') return {
    tipo, entrena: true, objetivo: 'movilidad', picto: 'p-movilidad',
    titulo: 'Yoga / Movilidad', detalle: '20 min · En casa', minutos: 20
  };
  if (tipo === 'A') return {
    tipo, entrena: false, picto: 'p-caminata',
    titulo: 'Descanso activo', detalle: '20 min · Caminata suave'
  };
  return { tipo, entrena: false, picto: 'p-descanso', titulo: 'Descanso', detalle: 'Recupera tu energía' };
}
