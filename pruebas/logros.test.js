const test = require('node:test');
const assert = require('node:assert/strict');
require('./catalogo-falso'); // reemplaza la conexión a Supabase
const { calcularLogros, logrosNuevos } = require('../rutas/logros');

const sesion = (fecha, nombre = 'Full Body · 30 min', minutos = 30) => ({ fecha, nombre, minutos });
const logrados = lista => calcularLogros(lista, 3).filter(l => l.logrado).map(l => l.id);

test('sin sesiones no hay logros y el progreso empieza en 0', () => {
  const logros = calcularLogros([], 3);
  assert.equal(logros.filter(l => l.logrado).length, 0);
  assert.ok(logros.every(l => l.actual === 0));
});

test('primera sesión, semana activa y semana completa', () => {
  assert.deepEqual(logrados([sesion('2026-10-19')]), ['primera']);
  const semana = [sesion('2026-10-19'), sesion('2026-10-21'), sesion('2026-10-23')];
  assert.ok(logrados(semana).includes('semana-activa'));
  assert.ok(logrados(semana).includes('semana-completa'));
  // 3 sesiones repartidas en semanas distintas NO son "semana activa"
  assert.ok(!logrados([sesion('2026-10-05'), sesion('2026-10-12'), sesion('2026-10-19')]).includes('semana-activa'));
});

test('semanas seguidas: cuentan solo si son consecutivas', () => {
  const dos = [sesion('2026-10-05'), sesion('2026-10-07'), sesion('2026-10-12'), sesion('2026-10-14')];
  assert.ok(logrados(dos).includes('dos-semanas'));
  const salteadas = [sesion('2026-10-05'), sesion('2026-10-07'), sesion('2026-10-19'), sesion('2026-10-21')];
  assert.ok(!logrados(salteadas).includes('dos-semanas'));
});

test('días seguidos cruzan el cambio de mes', () => {
  assert.ok(logrados([sesion('2026-09-30'), sesion('2026-10-01'), sesion('2026-10-02')]).includes('tres-dias'));
});

test('versión corta y rutina recuperada también son logros', () => {
  assert.ok(logrados([sesion('2026-10-19', 'Full Body · 15 min · versión corta', 15)]).includes('plan-b'));
  assert.ok(logrados([sesion('2026-10-19', 'Cardio intenso · 30 min · recuperada')]).includes('recuperada'));
});

test('logrosNuevos devuelve solo los que se desbloquearon con la última sesión', () => {
  const antes = [sesion('2026-10-19'), sesion('2026-10-21')];
  const despues = [...antes, sesion('2026-10-23')];
  const nuevos = logrosNuevos(antes, despues, 3).map(l => l.id);
  assert.ok(nuevos.includes('semana-activa'));
  assert.ok(!nuevos.includes('primera'));
});
