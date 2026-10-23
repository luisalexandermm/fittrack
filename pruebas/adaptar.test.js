const test = require('node:test');
const assert = require('node:assert/strict');
require('./catalogo-falso');
const { construirPlan, preferencias } = require('../rutas/plan');
const adaptar = require('../rutas/adaptar');

const principal = r => r.bloques.find(b => b.tipo === 'principal');
const minutos = r => Math.round(r.actividad_seg / 60);
const semana = (extra = {}) => construirPlan(preferencias({ objetivo: 'grasa', nivel: 2, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4], ...extra }));

// ---------- Versión corta ----------
test('versión corta: dura lo pedido y conserva el enfoque y los grupos del día', async () => {
  const plan = await semana();
  for (const pedido of [10, 15, 20]) {
    const dia = plan.dias[0];
    const { rutina, explicacion } = adaptar.versionCorta(dia, pedido);
    assert.ok(Math.abs(rutina.actividad_seg - pedido * 60) <= 120, `${pedido} min → ${rutina.actividad_seg} s`);
    const antes = principal(dia.rutina).ejercicios;
    const ahora = principal(rutina).ejercicios;
    assert.ok(ahora.every(e => antes.some(a => a.id === e.id)), 'solo usa ejercicios de la rutina del día');
    const gruposAntes = new Set(antes.map(e => e.grupo));
    const gruposAhora = new Set(ahora.map(e => e.grupo));
    assert.equal(gruposAhora.size, Math.min(gruposAntes.size, ahora.length), 'mantiene un ejercicio por grupo');
    assert.ok(rutina.bloques[0].ejercicios.length >= 2, 'el calentamiento no se quita');
    assert.equal(rutina.nivel, dia.rutina.nivel);
    assert.ok(explicacion.length >= 3);
  }
});

test('versión corta: no aplica en descanso ni si pides más tiempo del que dura', async () => {
  const plan = await semana();
  assert.throws(() => adaptar.versionCorta(plan.dias[1], 15), adaptar.NoSePuede);
  assert.throws(() => adaptar.versionCorta(plan.dias[0], 45), /ya dura/);
  assert.throws(() => adaptar.versionCorta(plan.dias[0], 5), /Elige entre/);
});

// ---------- Pasar a la mañana siguiente ----------
test('si el día siguiente es de descanso, la rutina pasa completa', async () => {
  const plan = await semana();
  const p = adaptar.proponerMovida(plan, 0, 0, 2);
  assert.equal(p.destino, 1);
  assert.equal(p.acortada, false);
  assert.equal(minutos(p.rutina), minutos(plan.dias[0].rutina));
  assert.match(p.rutina.nombre, /recuperada$/);
});

test('si el día siguiente ya entrena, se suma sin pasar el tope de tu nivel', async () => {
  for (const [nivel, tope] of Object.entries(adaptar.TOPE_DIA)) {
    const plan = await semana({ nivel: Number(nivel), dias_entreno: [0, 1, 3] });
    const p = adaptar.proponerMovida(plan, 0, 0, Number(nivel));
    const delDia = minutos(plan.dias[1].rutina);
    assert.ok(delDia + minutos(p.rutina) <= tope + 2, `nivel ${nivel}: ${delDia} + ${minutos(p.rutina)} > ${tope}`);
    assert.equal(p.acortada, Number(nivel) === 1, `nivel ${nivel}`);
  }
});

test('si el día siguiente ya está lleno, recomienda dejarla pasar', async () => {
  const plan = await semana({ minutos: 60, dias_entreno: [0, 1] });
  assert.throws(() => adaptar.proponerMovida(plan, 0, 0, 2), /Déjala pasar/);
});

test('no se acumula: se pasa una sola vez y un día recibe máximo una', async () => {
  const plan = await semana({ dias_entreno: [0, 1, 2] });
  adaptar.aplicarMovida(plan, adaptar.proponerMovida(plan, 0, 0, 3));
  assert.ok(plan.dias[1].extra);
  assert.equal(plan.dias[0].movido_a, 1);
  assert.throws(() => adaptar.proponerMovida(plan, 0, 0, 3), /ya la pasaste/);
  // El martes ya recibió una; si tampoco puede, se pasa SU rutina al miércoles (la recuperada no se mueve)
  const p = adaptar.proponerMovida(plan, 1, 1, 3);
  assert.equal(p.destino, 2);
  adaptar.aplicarMovida(plan, p);
  assert.equal(plan.dias[2].extra.origen, 1, 'la que se mueve es la rutina propia del día, no la recuperada');
});

test('un día que ya pasó va a hoy; el futuro y el domingo no se pueden pasar', async () => {
  const plan = await semana({ dias_entreno: [0, 2, 4, 6] });
  assert.equal(adaptar.proponerMovida(plan, 0, 3, 2).destino, 3);
  assert.throws(() => adaptar.proponerMovida(plan, 4, 2, 2), /hoy o la de un día que ya pasó/);
  assert.throws(() => adaptar.proponerMovida(plan, 6, 6, 2), /último día de la semana/);
  assert.throws(() => adaptar.proponerMovida(plan, 1, 1, 2), /no tiene entrenamiento/);
});

test('deshacer deja la semana como estaba', async () => {
  const plan = await semana();
  const antes = JSON.stringify(plan);
  adaptar.aplicarMovida(plan, adaptar.proponerMovida(plan, 0, 0, 2));
  adaptar.deshacerMovida(plan, 0);
  assert.equal(JSON.stringify(plan), antes);
});
