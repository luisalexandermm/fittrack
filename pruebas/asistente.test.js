const test = require('node:test');
const assert = require('node:assert/strict');
const { ejercicios } = require('./catalogo-falso');
const { construirPlan, preferencias } = require('../rutas/plan');
const { respaldo, instrucciones, AVISO_SALUD } = require('../rutas/asistente');

async function contexto() {
  const perfil = { nombre: 'Ana', objetivo: 'grasa', nivel: 1, minutos: 30, lugar: 'casa', dias_entreno: [0, 2, 4], meta_peso: 63.5, altura_cm: 168, sexo: 'mujer', edad: 27 };
  const plan = await construirPlan(preferencias(perfil));
  return { perfil, plan, hoyIdx: 0, fecha: '2026-10-19', sesiones: [{ fecha: '2026-10-17', nombre: 'Full Body · 30 min', minutos: 30 }],
    ejercicios: ejercicios.filter(e => e.fase === 'principal' && e.nivel <= 1 && e.equipo !== 'gimnasio') };
}

test('las instrucciones llevan el plan pero nunca peso, meta, edad, altura ni sexo', async () => {
  const ctx = await contexto();
  const texto = instrucciones(ctx);
  assert.match(texto, /lunes \(HOY\): Full Body/);
  assert.match(texto, /No das diagnósticos médicos/);
  for (const dato of ['63.5', '63,5', '168', '27', 'mujer']) assert.ok(!texto.includes(dato), `no debe incluir ${dato}`);
});

test('las alternativas sugeridas son del catálogo y respetan el lugar', async () => {
  const ctx = await contexto();
  const texto = instrucciones(ctx);
  assert.ok(!/Prensa de piernas|polea/.test(texto), 'en casa no aparecen máquinas');
});

test('respaldo: responde según la pregunta y con el plan de hoy', async () => {
  const ctx = await contexto();
  assert.match(respaldo('Solo tengo 15 minutos', ctx), /Tengo poco tiempo/);
  assert.match(respaldo('No tengo mancuernas, ¿qué hago?', ctx), /Cambiar ejercicio/);
  assert.match(respaldo('Quiero mejorar mi movilidad', ctx), /Saludo al sol|Estocada|Gato-camello|Rotación/);
  assert.match(respaldo('¿Por qué me recomiendas descansar hoy?', ctx), /descanso/i);
  assert.match(respaldo('qué me toca', ctx), /Hoy te toca Full Body/);
});

test('respaldo: ante síntomas siempre recomienda parar y consultar', async () => {
  const ctx = await contexto();
  for (const p of ['me duele la rodilla', 'tengo dolor en el pecho al correr', 'me mareo en los burpees']) {
    assert.equal(respaldo(p, ctx), AVISO_SALUD, p);
  }
});

test('el asistente se presenta como Zurick', async () => {
  const ctx = await contexto();
  assert.match(instrucciones(ctx), /^Eres Zurick, el asistente de FitTrack/);
});
