// ============================================================
//  Zurick, el asistente de FitTrack (POST /api/asistente)
//
//  Responde dudas sobre tu plan, tus rutinas y alternativas de ejercicios.
//  - Usa tu perfil y tu semana para responder con TUS datos.
//  - Nunca se envían a la IA tu peso, medidas, fotos ni tu correo.
//  - FitTrack no guarda el texto de las preguntas: solo cuenta cuántas
//    haces al día (para el límite de uso).
//  - Si la IA no está disponible, responde con reglas sencillas (respaldo)
//    y lo dice claramente.
//  - No da diagnósticos médicos: ante dolor o síntomas, recomienda parar
//    y consultar a un profesional.
// ============================================================

const express = require('express');
const { ok, cargarCatalogos } = require('../db/supabase');
const { hoy } = require('./utilidades');
const { lunesDe } = require('./fechas');
const { estructuraSemana, preferencias } = require('./plan');
const { preguntarIA, iaConfigurada } = require('../servicios/ia');

const router = express.Router();

const LIMITE_DIARIO = Math.max(1, Number(process.env.IA_LIMITE_DIARIO) || 20);
const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const OBJETIVOS = { grasa: 'reducir grasa', musculo: 'ganar fuerza y músculo', resistencia: 'mejorar la resistencia', movilidad: 'ganar movilidad' };
const NIVELES = { 1: 'principiante', 2: 'intermedio', 3: 'avanzado' };
const LUGARES = { casa: 'en casa (sin equipo o con muebles)', gimnasio: 'en el gimnasio', ambos: 'en casa o en el gimnasio' };

const indiceDia = fecha => (new Date(fecha + 'T12:00:00Z').getUTCDay() + 6) % 7;
const minutosDe = rutina => Math.round(rutina.actividad_seg / 60);
const principalDe = rutina => rutina.bloques.find(b => b.tipo === 'principal');

// Señales de alerta: se responde SIEMPRE con la recomendación de parar y consultar
const ALERTA = /dolor|me duele|duele (el|la|los|las|mucho)|me desmay|desmayo|mare[oa]|falta de aire|no puedo respirar|palpitaci|lesi[oó]n|me lesion|esguince|fractura|embaraz|operaci[oó]n|cirug/i;
const AVISO_SALUD = 'Si sientes dolor en el pecho, mareo, falta de aire o un dolor que no se va, para de entrenar y consulta a un profesional de salud (si es fuerte o repentino, busca atención de urgencias). FitTrack no reemplaza a un médico ni a un fisioterapeuta.';

// ---------- Límite de preguntas por día ----------
// Se cuenta en la base (función contar_pregunta_asistente, ver migracion-v9.sql).
// Si la migración aún no se ejecutó, se cuenta en la memoria del servidor (menos exacto).
const contadorEnMemoria = new Map();
async function contarPregunta(req) {
  const { data, error } = await req.sb.rpc('contar_pregunta_asistente');
  if (!error && Number.isFinite(data)) return data;
  const clave = `${req.usuarioId}:${hoy()}`;
  contadorEnMemoria.set(clave, (contadorEnMemoria.get(clave) || 0) + 1);
  return contadorEnMemoria.get(clave);
}

// ---------- Contexto: lo que el asistente sabe de ti ----------
async function armarContexto(req) {
  const [perfil, sesiones, catalogo] = await Promise.all([
    req.sb.from('perfiles').select('*').eq('id', req.usuarioId).single().then(ok),
    req.sb.from('sesiones').select('fecha, nombre, minutos').order('fecha', { ascending: false }).limit(5).then(ok),
    cargarCatalogos()
  ]);
  const fecha = hoy();
  const plan = perfil.plan_semanal && perfil.plan_semanal.semana === lunesDe(fecha) && Array.isArray(perfil.plan_semanal.dias)
    ? perfil.plan_semanal
    : { dias: estructuraSemana(preferencias(perfil)) };
  const lugar = perfil.lugar || 'casa';
  const ejercicios = catalogo.ejercicios.filter(e =>
    e.fase === 'principal' && e.nivel <= (perfil.nivel || 1) && (lugar !== 'casa' || e.equipo !== 'gimnasio'));
  return { perfil, sesiones, plan, hoyIdx: indiceDia(fecha), fecha, ejercicios };
}

// Una línea por día de la semana, en texto simple
function describirSemana({ plan, hoyIdx }) {
  return plan.dias.map((d, i) => {
    const marca = i === hoyIdx ? ' (HOY)' : '';
    let texto;
    if (d.movido_a != null) texto = `su rutina (${d.titulo}) se pasó a la mañana del ${NOMBRES_DIA[d.movido_a]}`;
    else if (d.entrena && d.rutina) texto = `${d.titulo}, ${minutosDe(d.rutina)} min: ${principalDe(d.rutina).ejercicios.map(e => e.nombre).join(', ')}`;
    else if (d.entrena) texto = `${d.titulo}, ${d.minutos} min`;
    else texto = d.titulo;
    if (d.extra) texto += ` + en la mañana, recuperada: ${d.extra.rutina.nombre.split(' · ')[0]} (${minutosDe(d.extra.rutina)} min)`;
    return `- ${NOMBRES_DIA[i]}${marca}: ${texto}`;
  }).join('\n');
}

function instrucciones(ctx) {
  const p = ctx.perfil;
  const sesiones = ctx.sesiones.length
    ? ctx.sesiones.map(s => `- ${s.fecha}: ${s.nombre} (${s.minutos} min)`).join('\n')
    : '- Todavía no tiene sesiones registradas.';
  const catalogo = ctx.ejercicios.map(e => `${e.nombre} [${e.grupo}${e.equipo !== 'ninguno' ? ', ' + e.equipo : ''}]`).join('; ');
  return `Eres Zurick, el asistente de FitTrack, una app de entrenamiento en casa y en el gimnasio. Si te preguntan quién eres, di que eres Zurick, el asistente de FitTrack.
Respondes en español de Colombia, claro y cercano, en máximo 120 palabras. Usa viñetas cortas cuando ayuden.

Reglas:
- Usa SOLO los datos del usuario que aparecen abajo. Si no sabes algo de su progreso, dilo; nunca inventes cifras, resultados ni historial.
- No das diagnósticos médicos ni tratamientos. Ante dolor, lesión, mareo, dolor en el pecho, falta de aire, embarazo o una condición médica, recomienda parar y consultar a un profesional de salud.
- No recomiendes dietas extremas, ayunos largos, deshidratarse, entrenar con dolor ni duplicar sesiones. Descansar es parte del plan: nunca culpes al usuario por descansar.
- Para cambiar el plan, indica los botones de la app: "Tengo poco tiempo" (versión corta de hoy), "Hoy no puedo" (pasa la rutina a la mañana siguiente, una sola vez), "Otra versión de este día" y "Cambiar ejercicio" (en Rutinas, tocando el ejercicio).
- Cuando sugieras ejercicios, elige solo del catálogo de abajo.
- Si te preguntan algo que no tiene que ver con entrenamiento, hábitos o el uso de FitTrack, di amablemente que solo puedes ayudar con eso.

Usuario: ${p.nombre}. Objetivo: ${OBJETIVOS[p.objetivo] || p.objetivo}. Nivel: ${NIVELES[p.nivel] || 'principiante'}. Entrena ${LUGARES[p.lugar || 'casa']}. Tiempo de actividad por sesión: ${p.minutos} min (más 4–5 min de calentamiento y enfriamiento).
Hoy es ${NOMBRES_DIA[ctx.hoyIdx]} ${ctx.fecha}.

Su semana:
${describirSemana(ctx)}

Últimas sesiones:
${sesiones}

Catálogo de ejercicios que puede hacer: ${catalogo}`;
}

// ---------- Respaldo: respuestas con reglas cuando la IA no está disponible ----------
function respaldo(pregunta, ctx) {
  const t = pregunta.toLowerCase();
  const dia = ctx.plan.dias[ctx.hoyIdx];
  const hoyTexto = dia.extra
    ? `Hoy tienes en la mañana ${dia.extra.rutina.nombre.split(' · ')[0]}${dia.entrena && dia.movido_a == null ? ` y luego ${dia.titulo}` : ''}.`
    : dia.entrena && dia.movido_a == null ? `Hoy te toca ${dia.titulo}${dia.rutina ? ` (${minutosDe(dia.rutina)} min de actividad)` : ''}.` : `Hoy es ${dia.titulo.toLowerCase()}.`;
  const nombres = (filtro, n = 4) => ctx.ejercicios.filter(filtro).slice(0, n).map(e => e.nombre).join(', ');

  if (ALERTA.test(t)) return AVISO_SALUD;
  if (/minut|tiempo|r[aá]pid|poco|corto|prisa/.test(t)) {
    return `${hoyTexto} Si hoy tienes menos tiempo, en Inicio toca "Tengo poco tiempo": armamos una versión de 10 a 20 minutos que conserva el enfoque del día y no quita el calentamiento.`;
  }
  if (/mancuern|pesa|equipo|m[aá]quina|banda|barra|no tengo/.test(t)) {
    return `Las rutinas en casa usan solo tu cuerpo o muebles (silla, pared, mesa). Si te falta algo para un ejercicio, en Rutinas tócalo y usa "Cambiar ejercicio". Opciones sin equipo: ${nombres(e => e.equipo === 'ninguno')}.`;
  }
  if (/movilidad|flexib|estir|rigid/.test(t)) {
    return `Para movilidad puedes hacer: ${nombres(e => e.grupo === 'movilidad', 5)}. También puedes cambiar tu objetivo a "Movilidad" en Perfil → Preferencias de entreno.`;
  }
  if (/descans/.test(t)) {
    return `${hoyTexto} Los días de descanso son parte del plan: el músculo se recupera y se hace más fuerte cuando descansas. En los de "descanso activo" basta con caminar 20 minutos a ritmo suave.`;
  }
  if (/no puedo|no alcanc|perd[ií]|ma[ñn]ana/.test(t)) {
    return `Si hoy no puedes, toca "Hoy no puedo" en Inicio: te proponemos pasar la rutina a la mañana siguiente sin pasarte del tope de minutos de tu nivel. Solo se pasa una vez, así no se acumula.`;
  }
  if (/hoy|toca|rutina|plan/.test(t)) return `${hoyTexto} En Rutinas ves cada ejercicio con su animación y cómo hacerlo.`;
  return `${hoyTexto} Puedo ayudarte con tu plan, alternativas de ejercicios y cómo usar FitTrack. Prueba preguntar: "Solo tengo 15 minutos" o "No tengo mancuernas, ¿qué hago?".`;
}

// ---------- Ruta ----------
// POST /api/asistente  { pregunta, historial?: [{ rol: 'usuario' | 'asistente', texto }] }
router.post('/', async (req, res) => {
  const pregunta = String(req.body.pregunta || '').trim();
  if (pregunta.length < 2) return res.status(400).json({ error: 'Escribe tu pregunta' });
  if (pregunta.length > 500) return res.status(400).json({ error: 'La pregunta es muy larga (máximo 500 caracteres)' });

  const usadas = await contarPregunta(req);
  if (usadas > LIMITE_DIARIO) {
    return res.status(429).json({ error: `Llegaste al límite de ${LIMITE_DIARIO} preguntas por hoy. Mañana puedes seguir preguntando.` });
  }
  const restantes = Math.max(0, LIMITE_DIARIO - usadas);
  const ctx = await armarContexto(req);
  const alerta = ALERTA.test(pregunta);

  // Últimos turnos de la conversación (solo texto, máximo 6)
  const historial = (Array.isArray(req.body.historial) ? req.body.historial : [])
    .slice(-6)
    .filter(m => m && ['usuario', 'asistente'].includes(m.rol) && typeof m.texto === 'string' && m.texto.trim())
    .map(m => ({ role: m.rol === 'usuario' ? 'user' : 'assistant', content: m.texto.slice(0, 1200) }));
  while (historial.length && historial[0].role !== 'user') historial.shift(); // la IA pide empezar por el usuario

  if (iaConfigurada()) {
    try {
      let respuesta = await preguntarIA({ sistema: instrucciones(ctx), mensajes: [...historial, { role: 'user', content: pregunta }] });
      if (alerta && !/profesional|m[eé]dic/i.test(respuesta)) respuesta = `${AVISO_SALUD}\n\n${respuesta}`;
      return res.json({ respuesta, fuente: 'ia', restantes });
    } catch (error) {
      // No se registra la pregunta, solo el tipo de error
      console.error('[asistente] la IA falló, se usa el respaldo:', error.message);
    }
  }
  res.json({ respuesta: respaldo(pregunta, ctx), fuente: 'respaldo', restantes });
});

module.exports = router;
module.exports.respaldo = respaldo;
module.exports.instrucciones = instrucciones;
module.exports.AVISO_SALUD = AVISO_SALUD;
