// ============================================================
//  plan-semanal.js — la semana del usuario (qué toca cada día)
//  La arma el servidor (GET /api/plan) con el generador de rutinas
//  y se guarda en el perfil. Aquí solo se lee y se consulta.
// ============================================================

let planSemana = null; // { dias: [7 días], preferencias, guardado, migrado, pendientes }

const DIAS_LARGOS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const NOMBRES_LUGAR = { casa: 'En casa', gimnasio: 'En el gimnasio', ambos: 'Casa o gimnasio' };

// Pide la semana al servidor (solo la primera vez, o si "forzar" es true)
async function cargarPlan(forzar = false) {
  if (!planSemana || forzar) planSemana = await api('/plan');
  return planSemana;
}

// Vuelve a armar la semana (o solo un día) con las preferencias actuales
async function regenerarPlan(dia = null) {
  planSemana = await api('/plan/regenerar', { method: 'POST', body: dia === null ? {} : { dia } });
  return planSemana;
}

// 0 = lunes … 6 = domingo
function indiceDia(fecha) {
  return (new Date(fecha + 'T12:00:00').getDay() + 6) % 7;
}

// Lo que toca en una fecha "YYYY-MM-DD" (la semana se repite cada lunes)
function actividadDelDia(fecha) {
  return planSemana.dias[indiceDia(fecha)];
}

// Estado de cada día de una semana, para Inicio y Calendario:
//   hecho      ✓ ya entrenó ese día
//   hoy        → toca hoy y aún no lo hace
//   proximo    → el siguiente día de entreno
//   programado ○ un día de entreno que viene después
//   perdido    ○ era día de entreno y ya pasó sin sesión
//   descanso   — día libre
function estadosSemana(lunes, fechasConSesion) {
  const hoy = hoyTexto();
  let yaHayProximo = lunes !== lunesDe(hoy); // en otras semanas no se marca "próximo"
  return [...Array(7)].map((_, i) => {
    const fecha = sumarDias(lunes, i);
    const dia = planSemana.dias[i];
    let estado;
    if (fechasConSesion.has(fecha)) estado = 'hecho';
    else if (!dia.entrena) estado = 'descanso';
    else if (fecha < hoy) estado = 'perdido';
    else if (fecha === hoy) { estado = 'hoy'; yaHayProximo = true; }
    else if (!yaHayProximo) { estado = 'proximo'; yaHayProximo = true; }
    else estado = 'programado';
    return { fecha, dia, estado, esHoy: fecha === hoy };
  });
}

const SIMBOLO_ESTADO = { hecho: '✓', hoy: '→', proximo: '→', programado: '○', perdido: '○', descanso: '—' };
const TEXTO_ESTADO = { hecho: 'Hecho', hoy: 'Hoy', proximo: 'Próximo', programado: 'Programado', perdido: 'No se hizo', descanso: 'Descanso' };

// Resumen corto de una rutina: "25 min · 5 ejercicios"
function resumenRutina(rutina) {
  const principal = rutina.bloques.find(b => b.tipo === 'principal');
  return `${minutosActividad(rutina)} min · ${principal.ejercicios.length} ejercicios`;
}

// ---------- Calorías (estimación) ----------
// La rutina trae "met_min" (esfuerzo, sin depender del peso). Con tu peso:
//   kcal = met_min × 3,5 × peso / 200
// Si no has registrado tu peso, se usa uno de referencia (75 kg hombre, 62 kg mujer, 70 kg sin dato).
function pesoParaCalorias() {
  if (perfil.peso_actual) return perfil.peso_actual;
  return { hombre: 75, mujer: 62 }[perfil.sexo] || 70;
}
function kcalRutina(rutina) {
  return rutina && rutina.met_min ? Math.round(rutina.met_min * 3.5 * pesoParaCalorias() / 200) : null;
}

// Minutos de actividad (lo que eligió el usuario) y de calentamiento + enfriamiento
function minutosActividad(rutina) {
  return Math.round((rutina.actividad_seg || rutina.duracion_seg) / 60);
}
function minutosSuaves(rutina) {
  return rutina.suaves_seg ? Math.round(rutina.suaves_seg / 60) : 0;
}
