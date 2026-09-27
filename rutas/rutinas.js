// Generador de rutinas + rutinas guardadas.
//
// ¿Cómo se arma una rutina?
//   1. Calentamiento: 3–4 ejercicios suaves de 40 s.
//   2. Bloque principal: un circuito de 4–6 ejercicios que se repite varias rondas.
//      - El tiempo de trabajo y descanso depende del OBJETIVO y del NIVEL.
//      - Se eligen ejercicios de grupos distintos (piernas, core, cardio…) para equilibrar.
//      - El número de rondas se calcula para llenar el tiempo disponible.
//   3. Enfriamiento: 3 estiramientos de 40 s.

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');

const router = express.Router();

// Trabajo / descanso base (en segundos) para cada objetivo
const CONFIG = {
  grasa:       { trabajo: 40, descanso: 20, nombre: 'Quema total' },
  musculo:     { trabajo: 45, descanso: 30, nombre: 'Fuerza en casa' },
  resistencia: { trabajo: 50, descanso: 15, nombre: 'Circuito resistencia' },
  movilidad:   { trabajo: 45, descanso: 10, nombre: 'Flow de movilidad' }
};

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

// Busca ejercicios de una fase que sirvan para el objetivo y el nivel
function buscarEjercicios(fase, objetivo, nivel) {
  return EJERCICIOS.filter(e => e.fase === fase && e.nivel <= nivel && e.objetivos.split(',').includes(objetivo));
}

// Elige "cantidad" ejercicios intentando que sean de grupos distintos
function elegirEquilibrado(ejercicios, cantidad, nivel) {
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
    descripcion: ejercicio.descripcion,
    segundos
  };
}

function generarRutina(objetivo, nivel, minutos) {
  const base = CONFIG[objetivo];

  // Ajuste por nivel: principiante trabaja menos y descansa más; avanzado al revés
  let trabajo = base.trabajo;
  let descanso = base.descanso;
  if (nivel === 1) { trabajo -= 10; descanso += 10; }
  if (nivel === 3) { trabajo += 10; descanso = Math.max(10, descanso - 5); }

  // 1. Calentamiento
  const cantCalentamiento = minutos >= 30 ? 4 : 3;
  const calentamiento = mezclar(buscarEjercicios('calentamiento', objetivo, nivel))
    .slice(0, cantCalentamiento)
    .map(e => formatear(e, SEGUNDOS_SUAVES));

  // 3. Enfriamiento
  const enfriamiento = mezclar(buscarEjercicios('enfriamiento', objetivo, nivel))
    .slice(0, 3)
    .map(e => formatear(e, SEGUNDOS_SUAVES));

  // 2. Bloque principal
  let porRonda = nivel + 3;              // 4, 5 o 6 ejercicios
  if (minutos <= 15) porRonda = Math.min(porRonda, 4);

  const principal = elegirEquilibrado(buscarEjercicios('principal', objetivo, nivel), porRonda, nivel)
    .map(e => formatear(e, trabajo));

  const segundosSuaves = (calentamiento.length + enfriamiento.length) * SEGUNDOS_SUAVES;
  const segundosPrincipal = minutos * 60 - segundosSuaves;
  const duracionRonda = principal.length * (trabajo + descanso);
  const rondas = Math.max(1, Math.floor((segundosPrincipal + DESCANSO_ENTRE_RONDAS) / (duracionRonda + DESCANSO_ENTRE_RONDAS)));

  const duracionTotal = segundosSuaves + rondas * duracionRonda + (rondas - 1) * DESCANSO_ENTRE_RONDAS;

  return {
    nombre: `${base.nombre} · ${Math.round(duracionTotal / 60)} min`,
    objetivo,
    nivel,
    minutos,
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
  const perfil = ok(await req.sb.from('perfiles').select('objetivo, nivel, minutos').eq('id', req.usuarioId).single());

  const objetivo = CONFIG[req.body.objetivo] ? req.body.objetivo : perfil.objetivo;
  const nivel = [1, 2, 3].includes(Number(req.body.nivel)) ? Number(req.body.nivel) : perfil.nivel;
  const minutos = Math.min(Math.max(Number(req.body.minutos) || perfil.minutos, 10), 60);

  res.json(generarRutina(objetivo, nivel, minutos));
});

// GET /api/rutinas/alternativa?grupo=core&objetivo=grasa&nivel=2&excluir=3,5
// Devuelve otro ejercicio del mismo grupo para cambiar uno que no te guste
router.get('/alternativa', async (req, res) => {
  EJERCICIOS = (await cargarCatalogos()).ejercicios;
  const { grupo, objetivo } = req.query;
  const nivel = Number(req.query.nivel) || 1;
  const excluir = String(req.query.excluir || '').split(',').map(Number);

  let opciones = buscarEjercicios('principal', objetivo, nivel)
    .filter(e => e.grupo === grupo && !excluir.includes(e.id));

  // Si no hay del mismo grupo, cualquier otro que sirva para el objetivo
  if (opciones.length === 0) {
    opciones = buscarEjercicios('principal', objetivo, nivel).filter(e => !excluir.includes(e.id));
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

module.exports = router;
