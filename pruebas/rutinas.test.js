const test = require('node:test');
const assert = require('node:assert/strict');
const { ejercicios } = require('./catalogo-falso');
const { generarRutina, prepararCatalogo } = require('../rutas/rutinas');

const OBJETIVOS = ['grasa', 'musculo', 'resistencia', 'movilidad'];
const porId = new Map(ejercicios.map(e => [e.id, e]));
const principal = r => r.bloques.find(b => b.tipo === 'principal');

test.before(prepararCatalogo);

test('el tiempo elegido es tiempo de actividad (sin calentamiento ni enfriamiento)', () => {
  for (const objetivo of OBJETIVOS) {
    for (const nivel of [1, 2, 3]) {
      for (let minutos = 10; minutos <= 60; minutos += 5) {
        const r = generarRutina(objetivo, nivel, minutos, { lugar: 'casa' });
        const pedido = minutos * 60;
        // Al redondear las rondas puede quedar hasta 2 min por debajo o por encima
        assert.ok(Math.abs(r.actividad_seg - pedido) <= 120,
          `${objetivo} N${nivel} ${minutos} min → ${r.actividad_seg} s`);
        assert.equal(r.duracion_seg, r.actividad_seg + r.suaves_seg);
      }
    }
  }
});

test('respeta el nivel y el lugar del usuario', () => {
  for (const objetivo of OBJETIVOS) {
    for (const nivel of [1, 2, 3]) {
      const r = generarRutina(objetivo, nivel, 30, { lugar: 'casa' });
      for (const bloque of r.bloques) {
        for (const ej of bloque.ejercicios) {
          const dato = porId.get(ej.id);
          assert.ok(dato.nivel <= nivel, `${dato.nombre} es de nivel ${dato.nivel} y el usuario es ${nivel}`);
          assert.notEqual(dato.equipo, 'gimnasio', `${dato.nombre} necesita gimnasio y el usuario entrena en casa`);
        }
      }
    }
  }
});

test('el circuito no repite ejercicios', () => {
  for (let i = 0; i < 50; i++) {
    const r = generarRutina(OBJETIVOS[i % 4], (i % 3) + 1, 30, { lugar: 'ambos' });
    const ids = principal(r).ejercicios.map(e => e.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('un principiante trabaja menos y descansa más que un avanzado', () => {
  for (const objetivo of OBJETIVOS) {
    const facil = generarRutina(objetivo, 1, 30, { lugar: 'casa' });
    const dificil = generarRutina(objetivo, 3, 30, { lugar: 'casa' });
    assert.ok(principal(facil).ejercicios[0].segundos < principal(dificil).ejercicios[0].segundos, objetivo);
    assert.ok(facil.descanso >= dificil.descanso, objetivo);
  }
});
