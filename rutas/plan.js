// ============================================================
//  Plan semanal: qué rutina toca cada día de la semana.
//
//  Se arma con las preferencias del perfil:
//    objetivo · nivel · minutos · lugar · días de entreno
//  y usa el MISMO generador de rutinas (rutas/rutinas.js) una vez por día.
//
//  Se guarda en perfiles.plan_semanal (jsonb). Las sesiones que ya hiciste
//  viven en la tabla "sesiones", así que cambiar el plan nunca las toca.
//
//  Variedad:
//   - Un día de entreno nunca repite los ejercicios del día de entreno anterior.
//   - Dentro de la semana se evita repetir (solo si no hay más opciones).
//   - Cada lunes se arma una semana nueva que evita los ejercicios de la anterior.
// ============================================================

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy, fechaLocal } = require('./utilidades');
const { lunesDe, sumarDias } = require('./fechas');
const adaptar = require('./adaptar');
const { generarRutina, prepararCatalogo, CONFIG, LUGARES } = require('./rutinas');

const router = express.Router();        // rutas con sesión
const routerPublico = express.Router(); // rutas sin sesión (onboarding)
const VERSION_PLAN = 3; // 3: tiempo = actividad, semana con fecha y variedad semanal

// ---------- Enfoques: qué parte del cuerpo se trabaja cada día ----------
const ENFOQUES = {
  full:      { titulo: 'Full Body',       grupos: null,                          picto: 'p-cardio' },
  superior:  { titulo: 'Tren superior',   grupos: ['empuje', 'tiron', 'core'],   picto: 'p-empuje' },
  inferior:  { titulo: 'Piernas + Core',  grupos: ['piernas', 'core'],           picto: 'p-piernas' },
  cardio:    { titulo: 'Cardio intenso',  grupos: ['cardio', 'piernas', 'core'], picto: 'p-cardio' },
  movilidad: { titulo: 'Movilidad',       grupos: null,                          picto: 'p-movilidad' },
  postura:   { titulo: 'Core y postura',  grupos: ['core', 'tiron', 'piernas'],  picto: 'p-core' }
};

// Orden de enfoques según el objetivo. El día 1 de entreno usa el primero, el día 2 el segundo…
// El 4.º día siempre es movilidad (igual que el plan anterior) para recuperar mejor.
const SECUENCIAS = {
  grasa:       ['full', 'cardio', 'inferior', 'movilidad', 'superior', 'full', 'cardio'],
  musculo:     ['superior', 'inferior', 'full', 'movilidad', 'superior', 'inferior', 'full'],
  resistencia: ['cardio', 'full', 'inferior', 'movilidad', 'cardio', 'superior', 'full'],
  movilidad:   ['movilidad', 'postura', 'movilidad', 'postura', 'movilidad', 'postura', 'movilidad']
};

// Para usuarios que se registraron antes y no eligieron días:
// se usan los mismos patrones de siempre según "meta_semanal" (R = rutina, M = movilidad)
const PATRONES = { 1: 'RDADDAD', 2: 'RDADRAD', 3: 'RARDRAD', 4: 'RARMRDA', 5: 'RRARMRD', 6: 'RRMRRRD', 7: 'RRMRRRM' };

const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Limpia una lista de días: números 0–6, sin repetir y ordenados
function limpiarDias(dias) {
  if (!Array.isArray(dias)) return null;
  const limpios = [...new Set(dias.map(Number).filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort((a, b) => a - b);
  return limpios.length ? limpios : null;
}

// Días de entreno del perfil (o los del patrón viejo si todavía no los eligió)
function diasDelPerfil(perfil) {
  const elegidos = limpiarDias(perfil.dias_entreno);
  if (elegidos) return elegidos;
  const patron = PATRONES[perfil.meta_semanal] || PATRONES[3];
  return [...patron].map((letra, i) => (letra === 'R' || letra === 'M' ? i : -1)).filter(i => i >= 0);
}

// Preferencias "limpias" a partir del perfil o de lo que manda el onboarding
function preferencias(datos) {
  return {
    objetivo: CONFIG[datos.objetivo] ? datos.objetivo : 'grasa',
    nivel: [1, 2, 3].includes(Number(datos.nivel)) ? Number(datos.nivel) : 1,
    minutos: Math.min(Math.max(Number(datos.minutos) || 20, 10), 60),
    lugar: LUGARES.includes(datos.lugar) ? datos.lugar : 'casa',
    dias: diasDelPerfil(datos)
  };
}

// ---------- 1. Estructura de la semana (sin ejercicios) ----------
// Siempre da el mismo resultado para las mismas preferencias.
function estructuraSemana(pref) {
  const secuencia = pref.dias.length <= 2 && pref.objetivo !== 'movilidad'
    ? ['full', 'full']                    // con 1–2 días, cuerpo completo cada vez
    : SECUENCIAS[pref.objetivo];

  let numeroEntreno = 0;
  let descansosSeguidos = 0;
  return NOMBRES_DIA.map((nombre, dia) => {
    if (!pref.dias.includes(dia)) {
      descansosSeguidos++;
      // El primer día libre después de entrenar es "descanso activo" (caminar, estirar)
      const activo = descansosSeguidos === 1 && dia > 0;
      return {
        dia, nombre, entrena: false,
        tipo: activo ? 'activo' : 'descanso',
        titulo: activo ? 'Descanso activo' : 'Descanso',
        detalle: activo ? '20 min · Caminata suave' : 'Recuperación',
        picto: activo ? 'p-caminata' : 'p-descanso'
      };
    }
    descansosSeguidos = 0;
    const enfoque = secuencia[numeroEntreno % secuencia.length];
    numeroEntreno++;
    // Si el objetivo no es movilidad, el día de movilidad es corto (máx. 20 min)
    const minutos = enfoque === 'movilidad' && pref.objetivo !== 'movilidad' ? Math.min(pref.minutos, 20) : pref.minutos;
    return { dia, nombre, entrena: true, tipo: 'entreno', enfoque, titulo: ENFOQUES[enfoque].titulo, minutos, picto: ENFOQUES[enfoque].picto };
  });
}

// ---------- 2. Rutina de un día (usa el generador de siempre) ----------
// evitar = [ids del día anterior, ids de la semana, ids de la semana pasada]
function rutinaDelDia(dia, pref, evitar = []) {
  const enfoque = ENFOQUES[dia.enfoque];
  const objetivo = dia.enfoque === 'movilidad' ? 'movilidad' : pref.objetivo;
  return generarRutina(objetivo, pref.nivel, dia.minutos, {
    lugar: pref.lugar,
    grupos: enfoque.grupos,
    titulo: enfoque.titulo,
    excluir: evitar
  });
}

// Ids de los ejercicios principales de un día del plan
function idsDelDia(dia) {
  if (!dia || !dia.entrena || !dia.rutina) return [];
  const principal = dia.rutina.bloques.find(b => b.tipo === 'principal');
  return principal ? principal.ejercicios.map(e => e.id) : [];
}

// Todos los ids de un plan (para que la semana siguiente sea distinta)
function idsDelPlan(plan) {
  return new Set(plan && Array.isArray(plan.dias) ? plan.dias.flatMap(idsDelDia) : []);
}

// ---------- 3. Semana completa (estructura + rutinas) ----------
// semanaPasada: ids que conviene no repetir porque salieron la semana anterior
async function construirPlan(pref, semanaPasada = new Set()) {
  await prepararCatalogo();
  const usadosSemana = new Set();
  let anterior = new Set();
  const dias = estructuraSemana(pref).map(dia => {
    if (!dia.entrena) return dia;
    const rutina = rutinaDelDia(dia, pref, [anterior, usadosSemana, semanaPasada]);
    const ids = idsDelDia({ entrena: true, rutina });
    ids.forEach(id => usadosSemana.add(id));
    anterior = new Set(ids);
    return { ...dia, rutina };
  });
  return { version: VERSION_PLAN, semana: lunesDe(hoy()), creado: hoy(), preferencias: pref, dias };
}

// ¿El plan guardado sirve todavía? (existe y tiene los 7 días)
function planValido(plan) {
  return plan && plan.version === VERSION_PLAN && Array.isArray(plan.dias) && plan.dias.length === 7;
}

// ¿El plan es de esta semana? Si es de una semana pasada, toca armar uno nuevo
function esDeEstaSemana(plan) {
  return plan.semana === lunesDe(hoy());
}

// Guarda el plan en el perfil. Si la base todavía no tiene la columna
// plan_semanal (falta la migración), no falla: devuelve false.
async function guardarPlan(req, plan) {
  const { error } = await req.sb.from('perfiles').update({ plan_semanal: plan }).eq('id', req.usuarioId);
  if (!error) return true;
  if (esColumnaFaltante(error)) return false;
  const e = new Error(error.message);
  e.codigoBD = error.code;
  throw e;
}

// PostgREST responde PGRST204 cuando una columna no existe (migración sin ejecutar)
function esColumnaFaltante(error) {
  return error && (error.code === 'PGRST204' || error.code === '42703' || /column/i.test(error.message || '') && /(find|exist)/i.test(error.message || ''));
}

// ============================================================
//  RUTAS
// ============================================================

// POST /api/plan/estructura  (pública, la usa el onboarding antes de crear la cuenta)
// { objetivo, nivel, minutos, lugar, dias } → los 7 días con enfoque y minutos
routerPublico.post('/estructura', (req, res) => {
  const pref = preferencias({ ...req.body, dias_entreno: req.body.dias });
  res.json({ preferencias: pref, dias: estructuraSemana(pref) });
});

// POST /api/plan/demo  (pública, la usa la demo de la página de inicio)
// { objetivo, nivel, minutos, lugar } → una rutina real hecha con el generador de siempre
routerPublico.post('/demo', async (req, res) => {
  const pref = preferencias(req.body);
  await prepararCatalogo();
  res.json(generarRutina(pref.objetivo, pref.nivel, pref.minutos, { lugar: pref.lugar }));
});

// GET /api/plan  → la semana del usuario (si no existe, se crea ahora)
router.get('/', async (req, res) => {
  const perfil = ok(await req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single());
  const migrado = 'lugar' in perfil;               // ¿ya se ejecutó migracion-onboarding.sql?
  const pendientes = migrado && !perfil.dias_entreno; // usuario antiguo que no ha elegido sus días

  // "alta": el día en que se creó la cuenta. Los días anteriores no cuentan como "no se hizo".
  const alta = fechaLocal(perfil.creado_en);

  if (planValido(perfil.plan_semanal) && esDeEstaSemana(perfil.plan_semanal)) {
    return res.json({ ...perfil.plan_semanal, guardado: true, migrado, pendientes, alta });
  }
  // Semana nueva (o plan viejo): se arma otra evitando los ejercicios de la anterior
  const plan = await construirPlan(preferencias(perfil), idsDelPlan(perfil.plan_semanal));
  const guardado = await guardarPlan(req, plan);
  res.json({ ...plan, guardado, migrado, pendientes, alta });
});

// POST /api/plan/regenerar  { dia?: 0–6 }
// Sin "dia": vuelve a armar toda la semana con las preferencias actuales.
// Con "dia": solo cambia los ejercicios de ese día.
router.post('/regenerar', async (req, res) => {
  const perfil = ok(await req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single());
  const pref = preferencias(perfil);
  const dia = Number(req.body.dia);

  let plan;
  if (Number.isInteger(dia) && dia >= 0 && dia <= 6 && planValido(perfil.plan_semanal)) {
    plan = perfil.plan_semanal;
    const elegido = plan.dias[dia];
    if (!elegido.entrena) return res.status(400).json({ error: 'Ese día es de descanso' });
    await prepararCatalogo();
    // Evitar: el día de entreno anterior y el siguiente, el resto de la semana y lo que ya tenía este día
    const entrenos = plan.dias.filter(d => d.entrena).map(d => d.dia);
    const pos = entrenos.indexOf(dia);
    const vecinos = new Set([...idsDelDia(plan.dias[entrenos[pos - 1]]), ...idsDelDia(plan.dias[entrenos[pos + 1]])]);
    const restoSemana = new Set(plan.dias.filter(d => d.dia !== dia).flatMap(idsDelDia));
    elegido.rutina = rutinaDelDia(elegido, plan.preferencias || pref, [vecinos, restoSemana, new Set(idsDelDia(elegido))]);
  } else {
    // Rehacer la semana: evitar los ejercicios de la semana que se reemplaza
    plan = await construirPlan(pref, idsDelPlan(perfil.plan_semanal));
  }
  const guardado = await guardarPlan(req, plan);
  res.json({ ...plan, guardado, migrado: 'lugar' in perfil, pendientes: false, alta: fechaLocal(perfil.creado_en) });
});

// ============================================================
//  FitTrack Adaptive (las reglas están en rutas/adaptar.js)
// ============================================================

// 0 = lunes … 6 = domingo, para una fecha YYYY-MM-DD
const indiceDia = fecha => (new Date(fecha + 'T12:00:00Z').getUTCDay() + 6) % 7;

// Lee el plan de ESTA semana. Si no hay (o es de otra semana), la app debe recargarlo.
async function planDeEstaSemana(req) {
  const perfil = ok(await req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single());
  if (!('plan_semanal' in perfil)) throw new adaptar.NoSePuede('Falta ejecutar la migración de la base de datos para guardar cambios en tu semana.', 503);
  if (!planValido(perfil.plan_semanal) || !esDeEstaSemana(perfil.plan_semanal)) {
    throw new adaptar.NoSePuede('Tu semana se actualizó. Recarga la app e inténtalo de nuevo.');
  }
  return { perfil, plan: perfil.plan_semanal };
}

// Responde el error de una regla con su mensaje; los demás siguen al manejador general
function responderError(res, error) {
  if (error instanceof adaptar.NoSePuede) return res.status(error.estado).json({ error: error.message });
  throw error;
}

// ¿Ya hizo la rutina propia de ese día? (no tiene sentido pasar una rutina que ya hizo)
// Las sesiones de rutinas recuperadas ("… · recuperada") no cuentan: son de otro día.
async function entrenoEseDia(req, fecha) {
  const { data, error } = await req.sb.from('sesiones').select('nombre').eq('fecha', fecha);
  if (error) throw new Error(error.message);
  return data.some(s => !/· recuperada$/.test(s.nombre || ''));
}

// POST /api/plan/corta  { minutos, dia? } → versión corta de la rutina (no se guarda nada)
router.post('/corta', async (req, res) => {
  try {
    const { plan } = await planDeEstaSemana(req);
    const dia = Number.isInteger(req.body.dia) ? req.body.dia : indiceDia(hoy());
    res.json(adaptar.versionCorta(plan.dias[dia], req.body.minutos));
  } catch (error) {
    responderError(res, error);
  }
});

// POST /api/plan/mover  { dia, confirmar }
//   confirmar = false → solo la propuesta, con la explicación (nada cambia)
//   confirmar = true  → se guarda en la semana y devuelve el plan nuevo
router.post('/mover', async (req, res) => {
  try {
    const { perfil, plan } = await planDeEstaSemana(req);
    const dia = Number(req.body.dia);
    if (!Number.isInteger(dia) || dia < 0 || dia > 6) return res.status(400).json({ error: 'Día inválido' });
    if (await entrenoEseDia(req, sumarDias(plan.semana, dia))) {
      return res.status(409).json({ error: 'Ese día ya entrenaste: no hay nada que pasar.' });
    }
    const propuesta = adaptar.proponerMovida(plan, dia, indiceDia(hoy()), perfil.nivel);
    if (!req.body.confirmar) return res.json({ propuesta });

    adaptar.aplicarMovida(plan, propuesta);
    const guardado = await guardarPlan(req, plan);
    res.json({ ...plan, guardado, migrado: true, pendientes: false, alta: fechaLocal(perfil.creado_en), propuesta });
  } catch (error) {
    responderError(res, error);
  }
});

// POST /api/plan/mover/deshacer  { dia } → la rutina vuelve a su día
router.post('/mover/deshacer', async (req, res) => {
  try {
    const { perfil, plan } = await planDeEstaSemana(req);
    adaptar.deshacerMovida(plan, Number(req.body.dia));
    const guardado = await guardarPlan(req, plan);
    res.json({ ...plan, guardado, migrado: true, pendientes: false, alta: fechaLocal(perfil.creado_en) });
  } catch (error) {
    responderError(res, error);
  }
});

module.exports = router;
module.exports.publico = routerPublico;
module.exports.estructuraSemana = estructuraSemana;
module.exports.preferencias = preferencias;
module.exports.limpiarDias = limpiarDias;
module.exports.esColumnaFaltante = esColumnaFaltante;
module.exports.construirPlan = construirPlan;
module.exports.idsDelPlan = idsDelPlan;
