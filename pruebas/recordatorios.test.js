const test = require('node:test');
const assert = require('node:assert/strict');
require('./catalogo-falso');
const { construirPlan, preferencias } = require('../rutas/plan');
const { lunesDe, sumarDias } = require('../rutas/fechas');
const { mensajeDeHoy, suscripcionValida } = require('../rutas/recordatorios');
const adaptar = require('../rutas/adaptar');

const perfilBase = { objetivo: 'grasa', nivel: 2, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4] };

async function perfilConPlan(lunes) {
  const plan = await construirPlan(preferencias(perfilBase));
  plan.semana = lunes;
  return { ...perfilBase, plan_semanal: plan };
}

test('avisa los días de entreno y calla en descanso o si ya entrenó', async () => {
  const lunes = lunesDe('2026-10-22');
  const perfil = await perfilConPlan(lunes);
  assert.match(mensajeDeHoy(perfil, lunes, false), /^Hoy toca Full Body · \d+ min/);
  assert.equal(mensajeDeHoy(perfil, sumarDias(lunes, 1), false), null, 'martes es descanso');
  assert.equal(mensajeDeHoy(perfil, lunes, true), null, 'ya entrenó');
});

test('menciona la rutina recuperada de la mañana y calla el día que se pasó', async () => {
  const lunes = lunesDe('2026-10-22');
  const perfil = await perfilConPlan(lunes);
  adaptar.aplicarMovida(perfil.plan_semanal, adaptar.proponerMovida(perfil.plan_semanal, 0, 0, 2));
  assert.equal(mensajeDeHoy(perfil, lunes, false), null, 'el lunes se pasó al martes');
  assert.match(mensajeDeHoy(perfil, sumarDias(lunes, 1), false), /^Esta mañana: Full Body/);
});

test('si el plan guardado es de otra semana, usa la estructura de la semana', async () => {
  const perfil = await perfilConPlan('2026-01-05');
  assert.match(mensajeDeHoy(perfil, lunesDe('2026-10-22'), false), /^Hoy toca Full Body · 30 min/);
});

test('solo acepta suscripciones https con llaves de tamaño normal', () => {
  const buena = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys: { p256dh: 'x'.repeat(87), auth: 'y'.repeat(22) } };
  assert.ok(suscripcionValida(buena));
  assert.equal(suscripcionValida({ ...buena, endpoint: 'http://inseguro.com/x' }), null);
  assert.equal(suscripcionValida({ ...buena, keys: { p256dh: 'x'.repeat(500), auth: 'y' } }), null);
  assert.equal(suscripcionValida({ endpoint: 'nada' }), null);
});
