// ============================================================
//  Logros por constancia
//  Se calculan con las sesiones que de verdad hiciste (nada se inventa
//  ni se guarda aparte). Premian la constancia y adaptarse, nunca
//  entrenar de más: no hay logros por entrenar todos los días seguidos.
// ============================================================

const express = require('express');
const { ok } = require('../db/supabase');
const { lunesDe, sumarDias } = require('./fechas');

const router = express.Router();

// Semanas seguidas (lunes a domingo) con al menos "minimo" sesiones. Devuelve la mejor racha.
function mejorRachaSemanas(sesiones, minimo) {
  const porSemana = new Map();
  for (const s of sesiones) {
    const lunes = lunesDe(s.fecha);
    porSemana.set(lunes, (porSemana.get(lunes) || 0) + 1);
  }
  const buenas = [...porSemana].filter(([, n]) => n >= minimo).map(([lunes]) => lunes).sort();
  let mejor = 0, actual = 0, anterior = null;
  for (const lunes of buenas) {
    actual = anterior && sumarDias(anterior, 7) === lunes ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = lunes;
  }
  return mejor;
}

// Días seguidos con al menos una sesión. Devuelve la mejor racha.
function mejorRachaDias(sesiones) {
  const dias = [...new Set(sesiones.map(s => s.fecha))].sort();
  let mejor = 0, actual = 0, anterior = null;
  for (const dia of dias) {
    actual = anterior && sumarDias(anterior, 1) === dia ? actual + 1 : 1;
    mejor = Math.max(mejor, actual);
    anterior = dia;
  }
  return mejor;
}

// Máximo de sesiones en una misma semana
function maximoEnUnaSemana(sesiones) {
  const porSemana = new Map();
  for (const s of sesiones) porSemana.set(lunesDe(s.fecha), (porSemana.get(lunesDe(s.fecha)) || 0) + 1);
  return Math.max(0, ...porSemana.values());
}

// sesiones: [{ fecha, minutos, nombre }] · metaSemanal: días de entreno por semana del plan
function calcularLogros(sesiones, metaSemanal = 3) {
  const total = sesiones.length;
  const minutos = sesiones.reduce((suma, s) => suma + (s.minutos || 0), 0);
  const cortas = sesiones.filter(s => /· versión corta$/.test(s.nombre || '')).length;
  const recuperadas = sesiones.filter(s => /· recuperada$/.test(s.nombre || '')).length;
  const meta = Math.min(Math.max(Number(metaSemanal) || 3, 1), 7);

  const lista = [
    { id: 'primera', icono: 'play', titulo: 'Primer paso', descripcion: 'Completa tu primer entrenamiento.', actual: total, meta: 1 },
    { id: 'semana-activa', icono: 'calendario', titulo: 'Semana activa', descripcion: 'Entrena 3 veces en una misma semana.', actual: maximoEnUnaSemana(sesiones), meta: 3 },
    { id: 'semana-completa', icono: 'check', titulo: 'Semana completa', descripcion: `Cumple tus ${meta} ${meta === 1 ? 'día' : 'días'} de entreno en una semana.`, actual: maximoEnUnaSemana(sesiones), meta },
    { id: 'tres-dias', icono: 'fuego', titulo: 'Tres al hilo', descripcion: 'Entrena 3 días seguidos.', actual: mejorRachaDias(sesiones), meta: 3 },
    { id: 'dos-semanas', icono: 'progreso', titulo: 'Hábito en marcha', descripcion: '2 semanas seguidas con al menos 2 entrenamientos.', actual: mejorRachaSemanas(sesiones, 2), meta: 2 },
    { id: 'cuatro-semanas', icono: 'progreso', titulo: 'Un mes constante', descripcion: '4 semanas seguidas con al menos 2 entrenamientos.', actual: mejorRachaSemanas(sesiones, 2), meta: 4 },
    { id: 'diez', icono: 'pesa', titulo: '10 entrenamientos', descripcion: 'Suma 10 sesiones.', actual: total, meta: 10 },
    { id: 'veinticinco', icono: 'pesa', titulo: '25 entrenamientos', descripcion: 'Suma 25 sesiones.', actual: total, meta: 25 },
    { id: 'cincuenta', icono: 'pesa', titulo: '50 entrenamientos', descripcion: 'Suma 50 sesiones.', actual: total, meta: 50 },
    { id: 'cinco-horas', icono: 'reloj', titulo: '5 horas en movimiento', descripcion: 'Suma 300 minutos entrenando.', actual: minutos, meta: 300 },
    { id: 'plan-b', icono: 'reloj', titulo: 'Plan B', descripcion: 'Haz una versión corta cuando tengas poco tiempo.', actual: cortas, meta: 1 },
    { id: 'recuperada', icono: 'calendario', titulo: 'Me puse al día', descripcion: 'Completa una rutina que pasaste a otro día.', actual: recuperadas, meta: 1 }
  ];

  return lista.map(l => ({ ...l, actual: Math.min(l.actual, l.meta), logrado: l.actual >= l.meta }));
}

// Logros que se desbloquearon con la última sesión (para el aviso al guardarla)
function logrosNuevos(sesionesAntes, sesionesDespues, metaSemanal) {
  const antes = new Set(calcularLogros(sesionesAntes, metaSemanal).filter(l => l.logrado).map(l => l.id));
  return calcularLogros(sesionesDespues, metaSemanal).filter(l => l.logrado && !antes.has(l.id));
}

// GET /api/logros
router.get('/', async (req, res) => {
  const [sesiones, perfil] = await Promise.all([
    req.sb.from('sesiones').select('fecha, minutos, nombre').then(ok),
    req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single().then(ok)
  ]);
  const meta = Array.isArray(perfil.dias_entreno) && perfil.dias_entreno.length ? perfil.dias_entreno.length : perfil.meta_semanal;
  const logros = calcularLogros(sesiones, meta);
  res.json({ logros, conseguidos: logros.filter(l => l.logrado).length, total: logros.length });
});

module.exports = router;
module.exports.calcularLogros = calcularLogros;
module.exports.logrosNuevos = logrosNuevos;
