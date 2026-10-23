const test = require('node:test');
const assert = require('node:assert/strict');
require('./catalogo-falso');
const { construirPlan, preferencias, idsDelPlan } = require('../rutas/plan');

// Se comparan los ejercicios del circuito principal (calentamiento y enfriamiento
// salen de una lista corta de movimientos suaves y sí pueden repetirse)
const ids = dia => new Set(dia.rutina.bloques.find(b => b.tipo === 'principal').ejercicios.map(e => e.id));
const comunes = (a, b) => [...a].filter(x => b.has(x)).length;

const perfiles = [];
for (const objetivo of ['grasa', 'musculo', 'resistencia', 'movilidad']) {
  for (const nivel of [1, 2, 3]) {
    for (const dias of [[0, 2, 4], [0, 1, 3, 5], [0, 1, 2, 3, 4]]) {
      perfiles.push({ objetivo, nivel, minutos: 30, lugar: 'casa', dias_entreno: dias, meta_semanal: dias.length });
    }
  }
}

test('la semana tiene 7 días y entrena solo los días elegidos', async () => {
  const plan = await construirPlan(preferencias(perfiles[0]));
  assert.equal(plan.dias.length, 7);
  assert.deepEqual(plan.dias.filter(d => d.entrena).map(d => d.dia), [0, 2, 4]);
});

test('un día de entreno no repite ejercicios del circuito del día de entreno anterior', async () => {
  for (const perfil of perfiles) {
    const plan = await construirPlan(preferencias(perfil));
    const entrenos = plan.dias.filter(d => d.entrena);
    for (let i = 1; i < entrenos.length; i++) {
      assert.equal(comunes(ids(entrenos[i - 1]), ids(entrenos[i])), 0,
        `${perfil.objetivo} N${perfil.nivel} ${perfil.dias_entreno}: ${entrenos[i - 1].nombre} → ${entrenos[i].nombre}`);
    }
  }
});

// Cuenta cuántos ejercicios del circuito se repiten de una semana a la siguiente
async function repetidosEntreSemanas(perfil) {
  const pref = preferencias(perfil);
  const semana1 = await construirPlan(pref);
  const semana2 = await construirPlan(pref, idsDelPlan(semana1));
  const antes = idsDelPlan(semana1);
  return [...idsDelPlan(semana2)].filter(id => antes.has(id)).length;
}

test('la semana siguiente evita los ejercicios de la anterior (nivel 2 y 3, 3 días)', async () => {
  for (const objetivo of ['grasa', 'musculo', 'resistencia']) {
    for (const nivel of [2, 3]) {
      const perfil = { objetivo, nivel, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4] };
      assert.ok(await repetidosEntreSemanas(perfil) <= 1, `${objetivo} N${nivel}`);
    }
  }
});

test('principiantes (y movilidad nivel 1) también cambian de ejercicios cada semana', async () => {
  for (const objetivo of ['grasa', 'musculo', 'resistencia', 'movilidad']) {
    const perfil = { objetivo, nivel: 1, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4] };
    assert.ok(await repetidosEntreSemanas(perfil) <= 3, objetivo);
  }
});

// PENDIENTE (limitación conocida del catálogo): para movilidad en nivel 2 y 3 los circuitos
// son más largos (5–6 ejercicios) y todavía no hay suficientes, así que se repiten varios.
test('movilidad nivel 2 y 3 cambia de ejercicios cada semana', {
  todo: 'faltan ejercicios de movilidad de nivel 2 y 3 en el catálogo'
}, async () => {
  for (const nivel of [2, 3]) {
    const perfil = { objetivo: 'movilidad', nivel, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4] };
    assert.ok(await repetidosEntreSemanas(perfil) <= 3, `N${nivel}`);
  }
});
