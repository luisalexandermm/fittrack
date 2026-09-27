// Resumen para el panel de inicio: racha, semana actual, minutos, peso y últimas 8 semanas.

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy } = require('./utilidades');

const router = express.Router();

// Suma (o resta) días a una fecha YYYY-MM-DD
function sumarDias(fecha, dias) {
  const d = new Date(fecha + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// Lunes de la semana de una fecha
function lunesDe(fecha) {
  const d = new Date(fecha + 'T12:00:00Z');
  const diaSemana = (d.getUTCDay() + 6) % 7; // 0 = lunes … 6 = domingo
  return sumarDias(fecha, -diaSemana);
}

router.get('/', async (req, res) => {
  const sb = req.sb;
  // Todas las consultas a la vez (más rápido). RLS garantiza que solo llegan datos del usuario.
  const [rUsuario, rSesiones, rPesos, rFotos, rGrasa, rCintura] = await Promise.all([
    sb.from('perfiles').select('nombre, objetivo, nivel, minutos, meta_semanal, altura_cm, meta_peso, sensibles_ok').eq('id', req.usuarioId).single(),
    sb.from('sesiones').select('fecha, minutos').order('fecha', { ascending: false }).limit(1000),
    sb.from('medidas').select('fecha, peso').not('peso', 'is', null).order('fecha').order('id'),
    sb.from('fotos').select('id', { count: 'exact', head: true }),
    sb.from('medidas').select('grasa').not('grasa', 'is', null).order('fecha', { ascending: false }).order('id', { ascending: false }).limit(1),
    sb.from('medidas').select('cintura').not('cintura', 'is', null).order('fecha', { ascending: false }).order('id', { ascending: false }).limit(1)
  ]);
  const usuario = ok(rUsuario);
  const sesiones = ok(rSesiones);
  const pesos = ok(rPesos);
  const totalFotos = rFotos.count || 0;
  const ultimaGrasa = ok(rGrasa)[0];
  const ultimaCintura = ok(rCintura)[0];

  const hoyTexto = hoy();
  const diasConSesion = new Set(sesiones.map(s => s.fecha));

  // Racha: días seguidos entrenando, contando desde hoy (o desde ayer si hoy aún no entrenó)
  let racha = 0;
  let dia = diasConSesion.has(hoyTexto) ? hoyTexto : sumarDias(hoyTexto, -1);
  while (diasConSesion.has(dia)) {
    racha++;
    dia = sumarDias(dia, -1);
  }

  // Semana actual (lunes a domingo): qué días entrenó
  const lunes = lunesDe(hoyTexto);
  const semana = [];
  for (let i = 0; i < 7; i++) {
    const f = sumarDias(lunes, i);
    semana.push({ fecha: f, entreno: diasConSesion.has(f), esHoy: f === hoyTexto });
  }
  const diasEstaSemana = semana.filter(d => d.entreno).length;

  // Minutos por semana en las últimas 8 semanas
  const semanas = [];
  for (let i = 7; i >= 0; i--) {
    const inicio = sumarDias(lunes, -7 * i);
    const fin = sumarDias(inicio, 6);
    const minutos = sesiones
      .filter(s => s.fecha >= inicio && s.fecha <= fin)
      .reduce((suma, s) => suma + s.minutos, 0);
    semanas.push({ inicio, minutos });
  }


  // Peso: primero, último y cambio
  let peso = null;
  if (pesos.length > 0) {
    const inicial = pesos[0].peso;
    const actual = pesos[pesos.length - 1].peso;
    const imc = usuario.altura_cm ? actual / Math.pow(usuario.altura_cm / 100, 2) : null;
    // Progreso hacia la meta: 0% al empezar, 100% al llegar
    let progreso = null;
    if (usuario.meta_peso && inicial !== usuario.meta_peso) {
      progreso = Math.round(((inicial - actual) / (inicial - usuario.meta_peso)) * 100);
      progreso = Math.min(Math.max(progreso, 0), 100);
    }
    peso = {
      progreso,
      inicial,
      actual,
      cambio: +(actual - inicial).toFixed(1),
      imc: imc ? +imc.toFixed(1) : null,
      historial: pesos.slice(-12)
    };
  }

  res.json({
    usuario,
    racha,
    semana,
    dias_esta_semana: diasEstaSemana,
    total_sesiones: sesiones.length,
    minutos_totales: sesiones.reduce((suma, s) => suma + s.minutos, 0),
    ultima_sesion: sesiones[0] ? sesiones[0].fecha : null,
    semanas,
    peso,
    grasa: ultimaGrasa ? ultimaGrasa.grasa : null,
    cintura: ultimaCintura ? ultimaCintura.cintura : null,
    total_fotos: totalFotos
  });
});

module.exports = router;
