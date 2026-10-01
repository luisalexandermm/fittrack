// Sesiones de entrenamiento completadas (el historial).
// Al guardar una sesión se estiman sus calorías (ver rutas/calorias.js).

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy, fechaValida } = require('./utilidades');
const { esColumnaFaltante } = require('./plan');
const { pesoParaCalculo, metMinutosSesion, metMinutosAproximados, kcalDe } = require('./calorias');

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
// segundos (opcional) = { calentamiento, descanso, enfriamiento, piernas, cardio, … }
// lo manda el reproductor con lo que de verdad hiciste; con eso se calculan las calorías.
router.post('/', async (req, res) => {
  const { rutina_id, nombre, objetivo, minutos, sensacion, notas, fecha, segundos } = req.body;
  if (!nombre || !minutos) return res.status(400).json({ error: 'Faltan datos de la sesión' });

  const fila = {
    rutina_id: Number(rutina_id) || null,
    nombre: String(nombre).slice(0, 80),
    objetivo: ['grasa', 'musculo', 'resistencia', 'movilidad'].includes(objetivo) ? objetivo : 'grasa',
    minutos: Math.min(Math.max(1, Math.round(Number(minutos))), 600),
    sensacion: sensacion ? Math.min(Math.max(Number(sensacion), 1), 5) : null,
    notas: notas ? String(notas).slice(0, 500) : null,
    fecha: fechaValida(fecha) ? fecha : hoy()
  };

  // Calorías: MET × peso × tiempo, con el peso que tenías ese día
  // (el último registro de ese día o antes; si no hay, el primero que registraste)
  const pesosOrdenados = req.sb.from('medidas').select('fecha, peso').not('peso', 'is', null).order('fecha').order('id');
  const [perfil, pesos] = await Promise.all([
    req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single().then(ok),
    pesosOrdenados.then(ok)
  ]);
  const antes = pesos.filter(p => p.fecha <= fila.fecha);
  const pesoDelDia = antes.length ? antes[antes.length - 1].peso : (pesos[0] ? pesos[0].peso : null);
  const peso = pesoParaCalculo(pesoDelDia, perfil.sexo);
  let metMin = segundos && typeof segundos === 'object' ? metMinutosSesion(segundos, perfil.nivel) : 0;
  if (!metMin) metMin = metMinutosAproximados(fila.minutos, fila.objetivo, perfil.nivel);
  // Límite de seguridad: ~12 MET de media es ya un esfuerzo máximo sostenido
  metMin = Math.min(metMin, fila.minutos * 12);
  const kcal = kcalDe(metMin, peso.kg);

  // Si la base todavía no tiene la columna "kcal", se guarda sin ella
  let resultado = await req.sb.from('sesiones').insert({ ...fila, kcal }).select('id').single();
  if (resultado.error && esColumnaFaltante(resultado.error)) {
    resultado = await req.sb.from('sesiones').insert(fila).select('id').single();
  }
  const guardada = ok(resultado);
  res.status(201).json({ id: guardada.id, kcal, peso_estimado: peso.estimado });
});

// DELETE /api/sesiones/:id  (RLS solo deja borrar las propias)
router.delete('/:id', async (req, res) => {
  ok(await req.sb.from('sesiones').delete().eq('id', Number(req.params.id)));
  res.json({ ok: true });
});

module.exports = router;
