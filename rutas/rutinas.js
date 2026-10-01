// Generador de rutinas + rutinas guardadas.
//
// ¿Cómo se arma una rutina?
//   1. Calentamiento: 3–4 ejercicios suaves de 40 s.
//   2. Bloque principal: un circuito de 4–6 ejercicios que se repite varias rondas.
//      - El tiempo de trabajo y descanso depende del OBJETIVO y del NIVEL.
//      - Se eligen ejercicios de grupos distintos (piernas, core, cardio…) para equilibrar.
//      - El LUGAR decide qué equipo se permite: en casa solo cuerpo y muebles;
//        en gimnasio o ambos también máquinas y pesas.
//      - El ENFOQUE del día (opcional) limita los grupos: tren superior, piernas, cardio…
//      - El número de rondas se calcula para llenar el tiempo disponible.
//   3. Enfriamiento: 3 estiramientos de 40 s.
//
// El TIEMPO que elige el usuario es solo de actividad (el circuito principal).
// El calentamiento y el enfriamiento se suman aparte (unos 4–5 minutos).
//
// La semana (rutas/plan.js) usa este mismo generador una vez por cada día de entreno.

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');
const { metMinutosRutina } = require('./calorias');

const router = express.Router();

// Trabajo / descanso base (en segundos) para cada objetivo
const CONFIG = {
  grasa:       { trabajo: 40, descanso: 20, nombre: 'Quema total' },
  musculo:     { trabajo: 45, descanso: 30, nombre: 'Fuerza total' },
  resistencia: { trabajo: 50, descanso: 15, nombre: 'Circuito resistencia' },
  movilidad:   { trabajo: 45, descanso: 10, nombre: 'Flow de movilidad' }
};

const LUGARES = ['casa', 'gimnasio', 'ambos'];
const DESCANSO_ENTRE_RONDAS = 60;
const SEGUNDOS_SUAVES = 40; // calentamiento y enfriamiento

// Mezcla un arreglo al azar (algoritmo Fisher-Yates)
function mezclar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Lista de ejercicios (se carga de Supabase y se guarda en memoria)
let EJERCICIOS = [];

// ¿El ejercicio se puede hacer en ese lugar?
// Si la base todavía no tiene la columna "equipo", todos cuentan como "sin equipo".
function sirveEnLugar(ejercicio, lugar) {
  const equipo = ejercicio.equipo || 'ninguno';
  if (lugar === 'gimnasio' || lugar === 'ambos') return true;
  return equipo !== 'gimnasio'; // en casa: sin equipo o con muebles
}

// Busca ejercicios de una fase que sirvan para el objetivo, el nivel y el lugar
function buscarEjercicios(fase, objetivo, nivel, lugar = 'casa') {
  return EJERCICIOS.filter(e =>
    e.fase === fase && e.nivel <= nivel && e.objetivos.split(',').includes(objetivo) && sirveEnLugar(e, lugar));
}

// Elige "cantidad" ejercicios intentando que sean de grupos distintos
// (si entrena en gimnasio, dentro de cada grupo van primero los de máquina/pesas)
function elegirEquilibrado(ejercicios, cantidad, nivel, lugar = 'casa') {
  // Agrupar por grupo muscular
  const grupos = {};
  for (const e of ejercicios) {
    if (!grupos[e.grupo]) grupos[e.grupo] = [];
    grupos[e.grupo].push(e);
  }

  // Dentro de cada grupo: primero los del nivel exacto del usuario (más reto), luego el resto
  for (const g in grupos) {
    const delNivel = mezclar(grupos[g].filter(e => e.nivel === nivel));
    const otros = mezclar(grupos[g].filter(e => e.nivel !== nivel));
    grupos[g] = [...delNivel, ...otros];
    if (lugar === 'gimnasio') {
      grupos[g] = [...grupos[g].filter(e => e.equipo === 'gimnasio'), ...grupos[g].filter(e => e.equipo !== 'gimnasio')];
    }
  }

  // Tomar uno de cada grupo por turnos hasta completar la cantidad
  const elegidos = [];
  const nombresGrupos = mezclar(Object.keys(grupos));
  while (elegidos.length < cantidad) {
    let seAgregoAlguno = false;
    for (const g of nombresGrupos) {
      if (elegidos.length >= cantidad) break;
      const siguiente = grupos[g].shift();
      if (siguiente) {
        elegidos.push(siguiente);
        seAgregoAlguno = true;
      }
    }
    if (!seAgregoAlguno) break; // ya no quedan ejercicios
  }
  return elegidos;
}

// Convierte una fila de la BD al formato que usa la rutina
function formatear(ejercicio, segundos) {
  return {
    id: ejercicio.id,
    nombre: ejercicio.nombre,
    grupo: ejercicio.grupo,
    nivel: ejercicio.nivel,
    descripcion: ejercicio.descripcion,
    equipo: ejercicio.equipo || 'ninguno',
    musculos: ejercicio.musculos || '',
    segundos
  };
}

// opciones (todas opcionales):
//   lugar   → 'casa' (por defecto) | 'gimnasio' | 'ambos'
//   grupos  → lista de grupos para el circuito, ej: ['empuje', 'tiron', 'core']
//   titulo  → nombre que se muestra (por defecto el del objetivo)
function generarRutina(objetivo, nivel, minutos, opciones = {}) {
  const base = CONFIG[objetivo];
  const lugar = opciones.lugar || 'casa';

  // Ajuste por nivel: principiante trabaja menos y descansa más; avanzado al revés
  let trabajo = base.trabajo;
  let descanso = base.descanso;
  if (nivel === 1) { trabajo -= 10; descanso += 10; }
  if (nivel === 3) { trabajo += 10; descanso = Math.max(10, descanso - 5); }

  // 1. Calentamiento
  const cantCalentamiento = minutos >= 30 ? 4 : 3;
  const calentamiento = mezclar(buscarEjercicios('calentamiento', objetivo, nivel, lugar))
    .slice(0, cantCalentamiento)
    .map(e => formatear(e, SEGUNDOS_SUAVES));

  // 3. Enfriamiento
  const enfriamiento = mezclar(buscarEjercicios('enfriamiento', objetivo, nivel, lugar))
    .slice(0, 3)
    .map(e => formatear(e, SEGUNDOS_SUAVES));

  // 2. Bloque principal
  let porRonda = nivel + 3;              // 4, 5 o 6 ejercicios
  if (minutos <= 15) porRonda = Math.min(porRonda, 4);

  const disponibles = buscarEjercicios('principal', objetivo, nivel, lugar);
  let principal = elegirSinRepetir(disponibles, porRonda, nivel, lugar, opciones);
  principal = principal.map(e => formatear(e, trabajo));

  // El tiempo elegido es SOLO el circuito principal (actividad).
  // Calentamiento y enfriamiento van aparte.
  const segundosSuaves = (calentamiento.length + enfriamiento.length) * SEGUNDOS_SUAVES;
  const segundosActividad = minutos * 60;
  const duracionRonda = principal.length * (trabajo + descanso);
  // Rondas que caben en el tiempo de actividad: se redondea al número más cercano,
  // pero sin pasarse más de 3 minutos de lo que eligió el usuario.
  const rondasExactas = (segundosActividad + DESCANSO_ENTRE_RONDAS) / (duracionRonda + DESCANSO_ENTRE_RONDAS);
  let rondas = Math.max(1, Math.round(rondasExactas));
  const actividadCon = r => r * duracionRonda + (r - 1) * DESCANSO_ENTRE_RONDAS;
  if (rondas > 1 && actividadCon(rondas) > segundosActividad + 180) rondas = Math.max(1, Math.floor(rondasExactas));

  // Ajuste fino: se suben o bajan unos segundos de trabajo (máx. ±10 s) para
  // que la actividad quede lo más cerca posible del tiempo elegido.
  const espacios = principal.length * rondas;
  const sobra = segundosActividad - actividadCon(rondas);
  const ajuste = Math.max(-10, Math.min(10, Math.round(sobra / espacios / 5) * 5));
  if (ajuste) {
    trabajo += ajuste;
    principal.forEach(e => { e.segundos = trabajo; });
  }
  const duracionActividad = rondas * principal.length * (trabajo + descanso) + (rondas - 1) * DESCANSO_ENTRE_RONDAS;
  const duracionTotal = segundosSuaves + duracionActividad;

  const rutina = {
    nombre: `${opciones.titulo || base.nombre} · ${Math.round(duracionActividad / 60)} min`,
    objetivo,
    nivel,
    minutos,
    lugar,
    trabajo,
    descanso,
    rondas,
    descanso_ronda: DESCANSO_ENTRE_RONDAS,
    duracion_seg: duracionTotal,            // todo: calentamiento + actividad + enfriamiento
    actividad_seg: duracionActividad,       // solo el circuito (lo que eligió el usuario)
    suaves_seg: segundosSuaves,             // calentamiento + enfriamiento
    bloques: [
      { tipo: 'calentamiento', titulo: 'Calentamiento', rondas: 1, ejercicios: calentamiento },
      { tipo: 'principal', titulo: 'Circuito principal', rondas, ejercicios: principal },
      { tipo: 'enfriamiento', titulo: 'Enfriamiento', rondas: 1, ejercicios: enfriamiento }
    ]
  };
  // Esfuerzo de la rutina (para estimar calorías con el peso de cada usuario)
  rutina.met_min = metMinutosRutina(rutina);
  return rutina;
}

// Convierte "excluir" (un Set, un arreglo o una lista de ellos) en una lista de Sets,
// del más importante al menos importante.
function capasDeExclusion(excluir) {
  if (!excluir) return [];
  const lista = Array.isArray(excluir) && excluir.some(x => x instanceof Set || Array.isArray(x)) ? excluir : [excluir];
  return lista.map(x => new Set(x instanceof Set ? x : (x || [])));
}

// Elige los ejercicios del circuito evitando repeticiones, en este orden de importancia:
//   1. los del día de entreno anterior (nunca se repiten si hay otros)
//   2. los que ya salieron esta semana
//   3. los de la semana pasada (para que cada semana cambie)
// Si no alcanzan, se va relajando la regla menos importante primero.
function elegirSinRepetir(disponibles, cantidad, nivel, lugar, opciones) {
  const capas = capasDeExclusion(opciones.excluir);
  const total = Math.min(cantidad, disponibles.length);
  let elegidos = [];
  // Se empieza evitando todo; si faltan ejercicios, se completa relajando una regla a la vez
  for (let usar = capas.length; usar >= 0 && elegidos.length < total; usar--) {
    const evitar = capas.slice(0, usar);
    const libres = disponibles.filter(e => !elegidos.includes(e) && !evitar.some(capa => capa.has(e.id)));
    elegidos = [...elegidos, ...elegirConEnfoque(libres, total - elegidos.length, nivel, lugar, opciones.grupos)];
  }
  return elegidos;
}

// Primero los grupos del enfoque del día; si no alcanzan, se completa con otros grupos
function elegirConEnfoque(libres, cantidad, nivel, lugar, grupos) {
  if (!grupos) return elegirEquilibrado(libres, cantidad, nivel, lugar);
  let elegidos = elegirEquilibrado(libres.filter(e => grupos.includes(e.grupo)), cantidad, nivel, lugar);
  if (elegidos.length < cantidad) {
    elegidos = [...elegidos, ...elegirEquilibrado(libres.filter(e => !elegidos.includes(e)), cantidad - elegidos.length, nivel, lugar)];
  }
  return elegidos;
}

// POST /api/rutinas/generar  → crea una rutina nueva (sin guardarla)
router.post('/generar', async (req, res) => {
  EJERCICIOS = (await cargarCatalogos()).ejercicios;
  // select('*'): funciona aunque la base todavía no tenga la columna "lugar"
  const perfil = ok(await req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single());

  const objetivo = CONFIG[req.body.objetivo] ? req.body.objetivo : perfil.objetivo;
  const nivel = [1, 2, 3].includes(Number(req.body.nivel)) ? Number(req.body.nivel) : perfil.nivel;
  const minutos = Math.min(Math.max(Number(req.body.minutos) || perfil.minutos, 10), 60);
  const lugar = LUGARES.includes(req.body.lugar) ? req.body.lugar : (perfil.lugar || 'casa');

  res.json(generarRutina(objetivo, nivel, minutos, { lugar }));
});

// GET /api/rutinas/alternativa?grupo=core&objetivo=grasa&nivel=2&excluir=3,5
// Devuelve otro ejercicio del mismo grupo para cambiar uno que no te guste
router.get('/alternativa', async (req, res) => {
  EJERCICIOS = (await cargarCatalogos()).ejercicios;
  const { grupo, objetivo } = req.query;
  const nivel = Number(req.query.nivel) || 1;
  const excluir = String(req.query.excluir || '').split(',').map(Number);
  const lugar = LUGARES.includes(req.query.lugar) ? req.query.lugar : 'casa';

  let opciones = buscarEjercicios('principal', objetivo, nivel, lugar)
    .filter(e => e.grupo === grupo && !excluir.includes(e.id));

  // Si no hay del mismo grupo, cualquier otro que sirva para el objetivo
  if (opciones.length === 0) {
    opciones = buscarEjercicios('principal', objetivo, nivel, lugar).filter(e => !excluir.includes(e.id));
  }
  if (opciones.length === 0) return res.status(404).json({ error: 'No hay alternativas' });

  const elegido = mezclar(opciones)[0];
  res.json(elegido);
});

// GET /api/rutinas  → rutinas guardadas del usuario
router.get('/', async (req, res) => {
  const filas = ok(await req.sb.from('rutinas').select('id, nombre, objetivo, nivel, minutos, contenido, creado_en').order('id', { ascending: false }));
  res.json(filas); // "contenido" ya llega como objeto (columna jsonb)
});

// POST /api/rutinas  → guardar una rutina generada
router.post('/', async (req, res) => {
  const rutina = req.body;
  if (!rutina || !Array.isArray(rutina.bloques)) {
    return res.status(400).json({ error: 'Rutina inválida' });
  }
  const nombre = String(rutina.nombre_personal || rutina.nombre || 'Mi rutina').slice(0, 80);

  if (JSON.stringify(rutina).length > 20000) return res.status(400).json({ error: 'Rutina demasiado grande' });

  const fila = ok(await req.sb.from('rutinas')
    .insert({ nombre, objetivo: String(rutina.objetivo), nivel: Number(rutina.nivel) || 1, minutos: Number(rutina.minutos) || 20, contenido: rutina })
    .select('id').single());
  res.status(201).json({ id: fila.id });
});

// DELETE /api/rutinas/:id
router.delete('/:id', async (req, res) => {
  ok(await req.sb.from('rutinas').delete().eq('id', Number(req.params.id)));
  res.json({ ok: true });
});

// La semana (rutas/plan.js) reutiliza el mismo generador
async function prepararCatalogo() {
  EJERCICIOS = (await cargarCatalogos()).ejercicios;
}

module.exports = router;
module.exports.generarRutina = generarRutina;
module.exports.prepararCatalogo = prepararCatalogo;
module.exports.CONFIG = CONFIG;
module.exports.LUGARES = LUGARES;
