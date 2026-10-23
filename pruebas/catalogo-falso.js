// Reemplaza db/supabase.js durante las pruebas: así el generador de rutinas
// funciona sin conectarse a Supabase, usando el mismo catálogo de db/ejercicios.js.
// Los ids siguen el orden del archivo, igual que en supabase/datos.sql (empiezan en 1).
const path = require('path');
const lista = require('../db/ejercicios');

const ejercicios = lista.map((e, i) => ({ id: i + 1, ...e }));
const ruta = path.join(__dirname, '..', 'db', 'supabase.js');

require.cache[ruta] = {
  id: ruta,
  filename: ruta,
  loaded: true,
  exports: {
    cargarCatalogos: async () => ({ ejercicios, recetas: [], consejos: [] }),
    ok: ({ data, error }) => { if (error) throw new Error(error.message); return data; }
  }
};

module.exports = { ejercicios };
