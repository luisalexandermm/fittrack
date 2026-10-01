// Resumen para el panel de inicio y progreso:
// racha, semana actual, minutos y calorías, peso medido y peso ESTIMADO por tus entrenamientos.

const express = require('express');
const { ok } = require('../db/supabase');
const { hoy } = require('./utilidades');
const { sumarDias, lunesDe } = require('./fechas');
const cal = require('./calorias');

const router = express.Router();

// Peso que tenía el usuario en una fecha: el último registro de ese día o antes.
// Si la sesión es anterior al primer registro, se usa el primero.
function pesoEnFecha(pesos, fecha) {
  let elegido = null;
  for (const p of pesos) {
    if (p.fecha <= fecha) elegido = p.peso;
    else break;
  }
  return elegido ?? (pesos[0] ? pesos[0].peso : null);
}

router.get('/', async (req, res) => {
  const sb = req.sb;
  // Todas las consultas a la vez (más rápido). RLS garantiza que solo llegan datos del usuario.
  const [rUsuario, rSesiones, rPesos, rFotos, rGrasa, rCintura] = await Promise.all([
    sb.from('perfiles').select('*').eq('id', req.usuarioId).single(),
    sb.from('sesiones').select('*').order('fecha', { ascending: false }).limit(1000),
    sb.from('medidas').select('fecha, peso').not('peso', 'is', null).order('fecha').order('id'),
    sb.from('fotos').select('id', { count: 'exact', head: true }),
    sb.from('medidas').select('grasa').not('grasa', 'is', null).order('fecha', { ascending: false }).order('id', { ascending: false }).limit(1),
    sb.from('medidas').select('cintura').not('cintura', 'is', null).order('fecha', { ascending: false }).order('id', { ascending: false }).limit(1)
  ]);
  const perfil = ok(rUsuario);
  const sesiones = ok(rSesiones);
  const pesos = ok(rPesos);
  const totalFotos = rFotos.count || 0;
  const ultimaGrasa = ok(rGrasa)[0];
  const ultimaCintura = ok(rCintura)[0];

  // Lo que ya mandaba antes el resumen (sin el plan guardado, que es grande)
  const usuario = {
    nombre: perfil.nombre, objetivo: perfil.objetivo, nivel: perfil.nivel, minutos: perfil.minutos,
    meta_semanal: perfil.meta_semanal, altura_cm: perfil.altura_cm, meta_peso: perfil.meta_peso,
    sensibles_ok: perfil.sensibles_ok, sexo: perfil.sexo ?? null
  };

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

  // ---------- Calorías de cada sesión ----------
  // Las sesiones nuevas ya traen "kcal"; las viejas se estiman con su duración y objetivo.
  const pesoActualMedido = pesos.length ? pesos[pesos.length - 1].peso : null;
  const pesoReferencia = cal.pesoParaCalculo(pesoActualMedido, perfil.sexo);
  const kcalDe = s => {
    if (s.kcal !== undefined && s.kcal !== null) return s.kcal;
    const kg = pesoEnFecha(pesos, s.fecha) || pesoReferencia.kg;
    return cal.kcalDe(cal.metMinutosAproximados(s.minutos, s.objetivo, perfil.nivel), kg);
  };
  sesiones.forEach(s => { s.kcal_calc = kcalDe(s); });

  // Minutos y calorías por semana en las últimas 8 semanas
  const semanas = [];
  for (let i = 7; i >= 0; i--) {
    const inicio = sumarDias(lunes, -7 * i);
    const fin = sumarDias(inicio, 6);
    const deLaSemana = sesiones.filter(s => s.fecha >= inicio && s.fecha <= fin);
    semanas.push({
      inicio,
      minutos: deLaSemana.reduce((suma, s) => suma + s.minutos, 0),
      kcal: deLaSemana.reduce((suma, s) => suma + s.kcal_calc, 0)
    });
  }
  const kcalSemana = semanas[semanas.length - 1].kcal;

  // Calorías que tiene planeadas la semana (si hay plan guardado): para la barra "de esta semana"
  let kcalPlanSemana = null;
  const plan = perfil.plan_semanal;
  if (plan && Array.isArray(plan.dias)) {
    const metMin = plan.dias.reduce((suma, d) => suma + (d.entrena && d.rutina ? (d.rutina.met_min || 0) : 0), 0);
    if (metMin) kcalPlanSemana = cal.kcalDe(metMin, pesoReferencia.kg);
  }

  // ---------- Peso: medido y estimado ----------
  // El estimado empieza en el primer peso registrado y le resta lo que quemaste
  // entrenando desde ese día (7.700 kcal ≈ 1 kg).
  let peso = null;
  const fechaInicio = pesos.length ? pesos[0].fecha : (sesiones.length ? sesiones[sesiones.length - 1].fecha : hoyTexto);
  const desdeInicio = sesiones.filter(s => s.fecha >= fechaInicio);
  const kcalTotal = desdeInicio.reduce((suma, s) => suma + s.kcal_calc, 0);
  const kgEstimadosTotal = cal.kgDe(kcalTotal);

  if (pesos.length > 0) {
    const inicial = pesos[0].peso;
    const actual = pesoActualMedido;
    const imc = perfil.altura_cm ? actual / Math.pow(perfil.altura_cm / 100, 2) : null;
    const estimado = +(inicial - kgEstimadosTotal).toFixed(1);

    // Progreso hacia la meta: 0% al empezar, 100% al llegar
    // (solo si la meta es BAJAR de peso; si es subir, las calorías no aplican)
    const baja = perfil.meta_peso && perfil.meta_peso < inicial;
    const porcentaje = valor => Math.min(Math.max(Math.round(valor), 0), 100);
    let progreso = null, progresoEstimado = null;
    if (perfil.meta_peso && inicial !== perfil.meta_peso) {
      progreso = porcentaje(((inicial - actual) / (inicial - perfil.meta_peso)) * 100);
    }
    if (baja) progresoEstimado = porcentaje((kgEstimadosTotal / (inicial - perfil.meta_peso)) * 100);

    // Línea estimada semana a semana (desde el primer registro hasta hoy)
    // Arranca en el primer peso y suma un punto al final de cada semana (el último es hoy)
    const historialEstimado = [{ fecha: fechaInicio, peso: inicial }];
    for (let fin = sumarDias(lunesDe(fechaInicio), 6); ; fin = sumarDias(fin, 7)) {
      const corte = fin < hoyTexto ? fin : hoyTexto;
      if (corte > fechaInicio) {
        const acumulado = desdeInicio.filter(s => s.fecha <= corte).reduce((suma, s) => suma + s.kcal_calc, 0);
        historialEstimado.push({ fecha: corte, peso: +(inicial - cal.kgDe(acumulado)).toFixed(2) });
      }
      if (corte === hoyTexto) break;
    }

    peso = {
      progreso,
      progreso_estimado: progresoEstimado,
      inicial,
      actual,
      estimado,
      cambio: +(actual - inicial).toFixed(1),
      imc: imc ? +imc.toFixed(1) : null,
      historial: pesos.slice(-12),
      historial_estimado: historialEstimado.slice(-12)
    };
  }

  // % de grasa: el medido si existe; si no, estimado con cintura + altura + sexo
  const grasaMedida = ultimaGrasa ? ultimaGrasa.grasa : null;
  const grasaRFM = cal.grasaEstimada(perfil.altura_cm, ultimaCintura && ultimaCintura.cintura, perfil.sexo);

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
    calorias: {
      semana: kcalSemana,
      semana_plan: kcalPlanSemana,
      kg_semana: +cal.kgDe(kcalSemana).toFixed(2),
      total: kcalTotal,
      kg_total: +kgEstimadosTotal.toFixed(2),
      desde: fechaInicio,
      peso_usado: pesoReferencia.kg,
      peso_es_referencia: pesoReferencia.estimado
    },
    grasa: grasaMedida,
    grasa_estimada: grasaMedida == null ? grasaRFM : null,
    cintura: ultimaCintura ? ultimaCintura.cintura : null,
    total_fotos: totalFotos
  });
});

module.exports = router;
