// Medidas corporales: peso, cintura, cadera, pecho, brazo, muslo y % de grasa.

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy, fechaValida, numeroONull } = require('./utilidades');

const router = express.Router();
const CAMPOS = ['peso', 'cintura', 'cadera', 'pecho', 'brazo', 'muslo', 'grasa'];

// GET /api/medidas  → de la más antigua a la más reciente (así se grafica fácil)
router.get('/', async (req, res) => {
  res.json(ok(await req.sb.from('medidas').select('*').order('fecha').order('id')));
});

// POST /api/medidas
router.post('/', async (req, res) => {
  const fila = {};
  for (const c of CAMPOS) fila[c] = numeroONull(req.body[c]);
  if (CAMPOS.every(c => fila[c] === null)) return res.status(400).json({ error: 'Escribe al menos una medida' });
  if (fila.grasa !== null && fila.grasa >= 100) return res.status(400).json({ error: 'El % de grasa debe ser menor a 100' });

  fila.fecha = fechaValida(req.body.fecha) ? req.body.fecha : hoy();
  fila.notas = req.body.notas ? String(req.body.notas).slice(0, 300) : null;

  const nueva = ok(await req.sb.from('medidas').insert(fila).select('id').single());
  res.status(201).json({ id: nueva.id });
});

// DELETE /api/medidas/:id
router.delete('/:id', async (req, res) => {
  ok(await req.sb.from('medidas').delete().eq('id', Number(req.params.id)));
  res.json({ ok: true });
});

module.exports = router;
