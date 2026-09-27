// Sesiones de entrenamiento completadas (el historial).

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy, fechaValida } = require('./utilidades');

const router = express.Router();

// GET /api/sesiones
// Opcional: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD para el calendario
router.get('/', async (req, res) => {
  const { desde, hasta } = req.query;
  let consulta = req.sb.from('sesiones').select('*').order('fecha', { ascending: false }).order('id', { ascending: false });
  if (fechaValida(desde) && fechaValida(hasta)) consulta = consulta.gte('fecha', desde).lte('fecha', hasta);
  else consulta = consulta.limit(200);
  res.json(ok(await consulta));
});

// POST /api/sesiones
router.post('/', async (req, res) => {
  const { rutina_id, nombre, objetivo, minutos, sensacion, notas, fecha } = req.body;
  if (!nombre || !minutos) return res.status(400).json({ error: 'Faltan datos de la sesión' });

  const fila = ok(await req.sb.from('sesiones').insert({
    rutina_id: Number(rutina_id) || null,
    nombre: String(nombre).slice(0, 80),
    objetivo: ['grasa', 'musculo', 'resistencia', 'movilidad'].includes(objetivo) ? objetivo : 'grasa',
    minutos: Math.min(Math.max(1, Math.round(Number(minutos))), 600),
    sensacion: sensacion ? Math.min(Math.max(Number(sensacion), 1), 5) : null,
    notas: notas ? String(notas).slice(0, 500) : null,
    fecha: fechaValida(fecha) ? fecha : hoy()
  }).select('id').single());

  res.status(201).json({ id: fila.id });
});

// DELETE /api/sesiones/:id  (RLS solo deja borrar las propias)
router.delete('/:id', async (req, res) => {
  ok(await req.sb.from('sesiones').delete().eq('id', Number(req.params.id)));
  res.json({ ok: true });
});

module.exports = router;
