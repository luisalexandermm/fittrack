const test = require('node:test');
const assert = require('node:assert/strict');
const cal = require('../rutas/calorias');

test('kcal = MET-min × 3,5 × kg / 200', () => {
  // 30 min a MET 5 con 70 kg: 5 × 30 × 3,5 × 70 / 200 = 183,75 → 184
  assert.equal(cal.kcalDe(5 * 30, 70), 184);
  assert.equal(cal.kcalDe(0, 70), 0);
});

test('7.700 kcal equivalen a 1 kg', () => {
  assert.equal(cal.kgDe(7700), 1);
});

test('sin peso registrado se usa un peso de referencia y se avisa', () => {
  assert.deepEqual(cal.pesoParaCalculo(null, 'hombre'), { kg: 75, estimado: true });
  assert.deepEqual(cal.pesoParaCalculo(null, 'mujer'), { kg: 62, estimado: true });
  assert.deepEqual(cal.pesoParaCalculo(null, null), { kg: 70, estimado: true });
  assert.deepEqual(cal.pesoParaCalculo(80, 'mujer'), { kg: 80, estimado: false });
  assert.equal(cal.pesoParaCalculo(5, 'hombre').estimado, true, 'un peso imposible no se usa');
});

test('una sesión no puede sumar más de 4 horas por tipo de ejercicio', () => {
  const normal = cal.metMinutosSesion({ cardio: 600 }, 2);
  const exagerado = cal.metMinutosSesion({ cardio: 10 * 3600 }, 2);
  assert.equal(normal, 8 * 10);
  assert.equal(exagerado, 8 * 240);
});

test('% de grasa estimado (RFM) solo con altura, cintura y sexo', () => {
  assert.equal(cal.grasaEstimada(175, 85, 'hombre'), 22.8);
  assert.equal(cal.grasaEstimada(162, 75, 'mujer'), 32.8);
  assert.equal(cal.grasaEstimada(175, 85, 'otro'), null);
  assert.equal(cal.grasaEstimada(null, 85, 'hombre'), null);
});
