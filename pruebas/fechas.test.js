const test = require('node:test');
const assert = require('node:assert/strict');
const { sumarDias, lunesDe } = require('../rutas/fechas');

test('lunesDe devuelve el lunes de esa semana', () => {
  assert.equal(lunesDe('2026-10-12'), '2026-10-12'); // lunes
  assert.equal(lunesDe('2026-10-18'), '2026-10-12'); // domingo
  assert.equal(lunesDe('2026-11-01'), '2026-10-26'); // domingo, cambio de mes
});

test('sumarDias cruza meses y años', () => {
  assert.equal(sumarDias('2026-10-31', 1), '2026-11-01');
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
});
