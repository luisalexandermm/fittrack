// Ver y editar el perfil del usuario (tabla "perfiles" en Supabase).

const express = require('express');
const { ok } = require('../db/supabase');
const { numeroONull } = require('./utilidades');
const { limpiarDias, esColumnaFaltante } = require('./plan');

// Campos que llegaron con la migración del onboarding
const CAMPOS_NUEVOS = ['lugar', 'dias_entreno', 'edad', 'sexo'];

const router = express.Router();

// GET /api/perfil
router.get('/', async (req, res) => {
  const perfil = ok(await req.sb.from('perfiles').select('*').eq('id', req.usuarioId).maybeSingle());
  if (!perfil) return res.status(404).json({ error: 'No se encontró tu perfil. Revisa que ejecutaste supabase/esquema.sql antes de registrarte.' });
  // Último peso registrado: la app lo usa para estimar las calorías de cada rutina
  const ultimo = ok(await req.sb.from('medidas').select('peso').not('peso', 'is', null).order('fecha', { ascending: false }).order('id', { ascending: false }).limit(1));
  res.json({ ...perfil, email: req.usuario.email, peso_actual: ultimo[0] ? ultimo[0].peso : null });
});

// PUT /api/perfil  → solo se cambian los campos que llegan
router.put('/', async (req, res) => {
  const { nombre, objetivo, nivel, minutos, meta_semanal, altura_cm, meta_peso, lugar, dias_entreno, edad, sexo } = req.body;
  const actual = ok(await req.sb.from('perfiles').select('sensibles_ok').eq('id', req.usuarioId).single());
  const cambios = {};

  if (nombre) cambios.nombre = String(nombre).trim().slice(0, 60);
  if (['grasa', 'musculo', 'resistencia', 'movilidad'].includes(objetivo)) cambios.objetivo = objetivo;
  if ([1, 2, 3].includes(Number(nivel))) cambios.nivel = Number(nivel);
  if (minutos) cambios.minutos = Math.min(Math.max(Number(minutos), 10), 60);
  if (meta_semanal) cambios.meta_semanal = Math.min(Math.max(Number(meta_semanal), 1), 7);
  if (altura_cm !== undefined) {
    const a = numeroONull(altura_cm);
    cambios.altura_cm = a && a >= 50 && a <= 260 ? a : null;
  }
  // La meta de peso es un dato sensible: solo se guarda si hay autorización
  if (meta_peso !== undefined && actual.sensibles_ok) {
    const m = numeroONull(meta_peso);
    cambios.meta_peso = m && m >= 20 && m <= 400 ? m : null;
  }

  // Preferencias del onboarding
  if (['casa', 'gimnasio', 'ambos'].includes(lugar)) cambios.lugar = lugar;
  if (dias_entreno !== undefined) {
    const dias = limpiarDias(dias_entreno);
    if (!dias) return res.status(400).json({ error: 'Elige al menos un día para entrenar' });
    cambios.dias_entreno = dias;
    cambios.meta_semanal = dias.length; // la meta semanal sigue funcionando igual que antes
  }
  if (sexo !== undefined) cambios.sexo = ['hombre', 'mujer', 'otro'].includes(sexo) ? sexo : null;
  if (edad !== undefined) {
    const e = numeroONull(edad);
    cambios.edad = e && e >= 14 && e <= 100 ? Math.round(e) : null;
  }

  if (!Object.keys(cambios).length) return res.json({ ok: true });

  const { error } = await req.sb.from('perfiles').update(cambios).eq('id', req.usuarioId);
  if (!error) return res.json({ ok: true });

  // Si la base todavía no tiene las columnas nuevas, se guarda lo demás y se avisa
  if (esColumnaFaltante(error)) {
    CAMPOS_NUEVOS.forEach(c => delete cambios[c]);
    if (Object.keys(cambios).length) ok(await req.sb.from('perfiles').update(cambios).eq('id', req.usuarioId));
    return res.json({ ok: true, falta_migracion: true });
  }
  ok({ error });
});

module.exports = router;
