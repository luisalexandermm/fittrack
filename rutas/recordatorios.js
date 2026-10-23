// ============================================================
//  Recordatorios de entreno (notificaciones push)
//
//  Cómo funciona:
//  1. En Perfil, el usuario activa los recordatorios. El navegador da una
//     "suscripción" (dirección + llaves) y se guarda en suscripciones_push.
//  2. Todos los días a las 7:00 a. m. (hora Colombia) Vercel llama a
//     GET /api/recordatorios/enviar (ver "crons" en vercel.json).
//  3. A quien le toca entrenar hoy y todavía no ha entrenado, le llega:
//     "Hoy toca Cardio intenso · 30 min".
//
//  Variables de entorno (ver README):
//    VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY → se crean con: npm run vapid
//    VAPID_CONTACTO                      → mailto:tu-correo (lo pide el estándar)
//    CRON_SECRET                         → clave para que solo Vercel pueda disparar el envío
// ============================================================

const express = require('express');
const webpush = require('web-push');
const { ok, admin } = require('../db/supabase');
const { hoy } = require('./utilidades');
const { lunesDe } = require('./fechas');
const { estructuraSemana, preferencias } = require('./plan');

const router = express.Router();        // con sesión
const routerPublico = express.Router(); // sin sesión (lo llama Vercel con CRON_SECRET)

const PUBLICA = process.env.VAPID_PUBLIC_KEY;
const PRIVADA = process.env.VAPID_PRIVATE_KEY;
const configurado = Boolean(PUBLICA && PRIVADA);
if (configurado) {
  webpush.setVapidDetails(process.env.VAPID_CONTACTO || 'mailto:soporte@fittrack.app', PUBLICA, PRIVADA);
}

const NOMBRES_DIA = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const indiceDia = fecha => (new Date(fecha + 'T12:00:00Z').getUTCDay() + 6) % 7;
const minutosDe = rutina => Math.round(rutina.actividad_seg / 60);
const tituloDe = rutina => rutina.nombre.split(' · ')[0];

// Texto del recordatorio de hoy, o null si no hay que avisar (descanso o ya entrenó).
// Función pura: recibe el perfil, la fecha de hoy y si ya hay sesión hoy.
function mensajeDeHoy(perfil, fecha, yaEntreno) {
  if (yaEntreno) return null;
  const idx = indiceDia(fecha);
  const plan = perfil.plan_semanal;
  const planDeLaSemana = plan && Array.isArray(plan.dias) && plan.dias.length === 7 && plan.semana === lunesDe(fecha);

  if (planDeLaSemana) {
    const dia = plan.dias[idx];
    if (dia.extra) {
      const luego = dia.entrena && dia.movido_a == null ? ` Después, a tu hora de siempre: ${dia.titulo}.` : '';
      return `Esta mañana: ${tituloDe(dia.extra.rutina)} (${minutosDe(dia.extra.rutina)} min), la que pasaste del ${NOMBRES_DIA[dia.extra.origen]}.${luego}`;
    }
    if (!dia.entrena || dia.movido_a != null) return null;
    return `Hoy toca ${dia.titulo} · ${minutosDe(dia.rutina)} min de actividad. ¿Tienes menos tiempo? Abre la app y usa "Tengo poco tiempo".`;
  }

  // Sin plan de esta semana (la app lo arma al abrirla): se usa la estructura de la semana
  const dia = estructuraSemana(preferencias(perfil))[idx];
  if (!dia.entrena) return null;
  return `Hoy toca ${dia.titulo} · ${dia.minutos} min de actividad. Abre FitTrack para ver tu rutina.`;
}

// Valida lo que manda el navegador al suscribirse
function suscripcionValida(s) {
  if (!s || typeof s.endpoint !== 'string' || !s.keys) return null;
  let url;
  try { url = new URL(s.endpoint); } catch (e) { return null; }
  if (url.protocol !== 'https:' || s.endpoint.length > 1000) return null;
  const { p256dh, auth } = s.keys;
  if (typeof p256dh !== 'string' || typeof auth !== 'string' || p256dh.length > 200 || auth.length > 100) return null;
  return { endpoint: s.endpoint, p256dh, auth };
}

const tablaFaltante = error => error && (['PGRST205', '42P01'].includes(error.code) || /schema cache|does not exist/i.test(error.message || ''));
const SIN_MIGRAR = 'Falta ejecutar supabase/migracion-v9.sql para guardar recordatorios.';

async function enviar(suscripcion, cuerpo) {
  const carga = JSON.stringify({ titulo: 'FitTrack', cuerpo, url: '/app#inicio' });
  return webpush.sendNotification(
    { endpoint: suscripcion.endpoint, keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth } },
    carga,
    { TTL: 6 * 3600, urgency: 'normal' }
  );
}

// ---------- Rutas del usuario ----------

// GET /api/recordatorios/clave → la llave pública para suscribirse
router.get('/clave', (req, res) => {
  res.json({ activo: configurado, clave: configurado ? PUBLICA : null });
});

// POST /api/recordatorios  { endpoint, keys: { p256dh, auth } } → activar en este dispositivo
router.post('/', async (req, res) => {
  if (!configurado) return res.status(503).json({ error: 'Los recordatorios aún no están configurados en el servidor.' });
  const fila = suscripcionValida(req.body);
  if (!fila) return res.status(400).json({ error: 'La suscripción del navegador no es válida.' });

  // Si este navegador ya estaba suscrito (aunque sea con otra cuenta), se reemplaza
  if (admin) await admin.from('suscripciones_push').delete().eq('endpoint', fila.endpoint);
  else await req.sb.from('suscripciones_push').delete().eq('endpoint', fila.endpoint);

  const { error } = await req.sb.from('suscripciones_push').insert(fila);
  if (tablaFaltante(error)) return res.status(503).json({ error: SIN_MIGRAR });
  if (error) return res.status(400).json({ error: 'No se pudo activar en este dispositivo.' });
  res.status(201).json({ ok: true });
});

// DELETE /api/recordatorios  { endpoint } → desactivar en este dispositivo
router.delete('/', async (req, res) => {
  const endpoint = String(req.body.endpoint || '');
  const { error } = await req.sb.from('suscripciones_push').delete().eq('endpoint', endpoint);
  if (tablaFaltante(error)) return res.status(503).json({ error: SIN_MIGRAR });
  res.json({ ok: true });
});

// POST /api/recordatorios/prueba → manda una notificación de prueba a tus dispositivos
router.post('/prueba', async (req, res) => {
  if (!configurado) return res.status(503).json({ error: 'Los recordatorios aún no están configurados en el servidor.' });
  const { data, error } = await req.sb.from('suscripciones_push').select('*');
  if (tablaFaltante(error)) return res.status(503).json({ error: SIN_MIGRAR });
  if (error || !data.length) return res.status(404).json({ error: 'Activa los recordatorios en este dispositivo primero.' });
  const resultados = await Promise.allSettled(data.map(s => enviar(s, '¡Listo! Así te llegarán los recordatorios de entreno.')));
  const enviadas = resultados.filter(r => r.status === 'fulfilled').length;
  if (!enviadas) return res.status(502).json({ error: 'No se pudo enviar la notificación. Desactiva y vuelve a activar los recordatorios.' });
  res.json({ ok: true, enviadas });
});

// ---------- Envío diario (Vercel Cron) ----------
// GET /api/recordatorios/enviar   Authorization: Bearer CRON_SECRET
routerPublico.get('/enviar', async (req, res) => {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || req.get('authorization') !== `Bearer ${secreto}`) return res.status(401).json({ error: 'No autorizado' });
  if (!configurado || !admin) return res.status(503).json({ error: 'Faltan VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o SUPABASE_SERVICE_ROLE_KEY' });

  const fecha = hoy();
  const suscripciones = ok(await admin.from('suscripciones_push').select('*'));
  if (!suscripciones.length) return res.json({ enviadas: 0, omitidas: 0, borradas: 0 });

  const ids = [...new Set(suscripciones.map(s => s.usuario_id))];
  const [perfiles, sesionesHoy] = await Promise.all([
    admin.from('perfiles').select('*').in('id', ids).then(ok),
    admin.from('sesiones').select('usuario_id').eq('fecha', fecha).in('usuario_id', ids).then(ok)
  ]);
  const entrenaron = new Set(sesionesHoy.map(s => s.usuario_id));
  const perfilDe = new Map(perfiles.map(p => [p.id, p]));

  let enviadas = 0, omitidas = 0, borradas = 0;
  for (const s of suscripciones) {
    const perfil = perfilDe.get(s.usuario_id);
    const cuerpo = perfil ? mensajeDeHoy(perfil, fecha, entrenaron.has(s.usuario_id)) : null;
    if (!cuerpo) { omitidas++; continue; }
    try {
      await enviar(s, cuerpo);
      enviadas++;
    } catch (error) {
      // 404/410: el navegador ya no acepta esta suscripción → se borra
      if ([404, 410].includes(error.statusCode)) {
        await admin.from('suscripciones_push').delete().eq('id', s.id);
        borradas++;
      } else {
        console.error('[recordatorios] no se pudo enviar:', error.statusCode || '', error.message);
        omitidas++;
      }
    }
  }
  res.json({ enviadas, omitidas, borradas });
});

module.exports = router;
module.exports.publico = routerPublico;
module.exports.mensajeDeHoy = mensajeDeHoy;
module.exports.suscripcionValida = suscripcionValida;
