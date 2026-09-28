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
// La semana (rutas/plan.js) usa este mismo generador una vez por cada día de entreno.

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');

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
  const delEnfoque = opciones.grupos ? disponibles.filter(e => opciones.grupos.includes(e.grupo)) : disponibles;
  let principal = elegirEquilibrado(delEnfoque, porRonda, nivel, lugar);
  // Si el enfoque deja muy pocos ejercicios, se completa con los demás grupos
  if (opciones.grupos && principal.length < porRonda) {
    const faltan = elegirEquilibrado(disponibles.filter(e => !principal.includes(e)), porRonda - principal.length, nivel, lugar);
    principal = [...principal, ...faltan];
  }
  principal = principal.map(e => formatear(e, trabajo));

  const segundosSuaves = (calentamiento.length + enfriamiento.length) * SEGUNDOS_SUAVES;
  const segundosPrincipal = minutos * 60 - segundosSuaves;
  const duracionRonda = principal.length * (trabajo + descanso);
  // Rondas que caben en el tiempo. Se redondea al número más cercano, pero sin
  // pasarse más de 3 minutos del tiempo que eligió el usuario.
  const rondasExactas = (segundosPrincipal + DESCANSO_ENTRE_RONDAS) / (duracionRonda + DESCANSO_ENTRE_RONDAS);
  let rondas = Math.max(1, Math.round(rondasExactas));
  const duracionCon = r => segundosSuaves + r * duracionRonda + (r - 1) * DESCANSO_ENTRE_RONDAS;
  if (rondas > 1 && duracionCon(rondas) > minutos * 60 + 180) rondas = Math.max(1, Math.floor(rondasExactas));

  const duracionTotal = segundosSuaves + rondas * duracionRonda + (rondas - 1) * DESCANSO_ENTRE_RONDAS;

  return {
    nombre: `${opciones.titulo || base.nombre} · ${Math.round(duracionTotal / 60)} min`,
    objetivo,
    nivel,
    minutos,
    lugar,
    trabajo,
    descanso,
    rondas,
    descanso_ronda: DESCANSO_ENTRE_RONDAS,
    duracion_seg: duracionTotal,
    bloques: [
      { tipo: 'calentamiento', titulo: 'Calentamiento', rondas: 1, ejercicios: calentamiento },
      { tipo: 'principal', titulo: 'Circuito principal', rondas, ejercicios: principal },
      { tipo: 'enfriamiento', titulo: 'Enfriamiento', rondas: 1, ejercicios: enfriamiento }
    ]
  };
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
