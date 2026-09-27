// ============================================================
//  Conexión con Supabase
//  - La base de datos (PostgreSQL), el inicio de sesión (Auth) y las
//    fotos (Storage) viven en tu proyecto de Supabase.
//  - Las llaves van en el archivo .env (nunca en el navegador).
// ============================================================

const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const LLAVE_PUBLICA = process.env.SUPABASE_ANON_KEY;            // "anon" o "publishable"
const LLAVE_SERVICIO = process.env.SUPABASE_SERVICE_ROLE_KEY;   // "service_role" o "secret" (solo servidor)

if (!URL || !LLAVE_PUBLICA) {
  console.error(`
  ✖ Faltan datos de Supabase.
    1. Copia .env.example como .env
    2. Pon SUPABASE_URL y SUPABASE_ANON_KEY (Supabase → Project Settings → API)
    3. Vuelve a ejecutar: npm start
  `);
  process.exit(1);
}

// Opciones para que el cliente NO guarde sesiones en memoria.
// (Es un servidor con muchos usuarios: cada petición usa su propio token.)
const sinSesion = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

// Cliente nuevo para operaciones de login/registro.
// Se crea uno por operación para que la sesión de un usuario nunca se mezcle con la de otro.
function clienteAuth() {
  return createClient(URL, LLAVE_PUBLICA, sinSesion);
}

// Cliente que actúa COMO el usuario conectado: la base aplica las reglas RLS
// y solo le deja ver/cambiar sus propios datos.
function clienteDeUsuario(tokenAcceso) {
  return createClient(URL, LLAVE_PUBLICA, {
    ...sinSesion,
    global: { headers: { Authorization: `Bearer ${tokenAcceso}` } }
  });
}

// Cliente administrador (se salta las reglas RLS). Solo se usa para borrar cuentas.
const admin = LLAVE_SERVICIO ? createClient(URL, LLAVE_SERVICIO, sinSesion) : null;

// Cliente para leer los catálogos públicos (ejercicios, recetas, consejos)
const publico = createClient(URL, LLAVE_PUBLICA, sinSesion);

// ---------- Catálogos en memoria ----------
// Se leen de Supabase una vez y se guardan 10 minutos (casi nunca cambian).
const catalogo = { ejercicios: [], recetas: [], consejos: [], cargado: 0 };

async function cargarCatalogos() {
  if (Date.now() - catalogo.cargado < 10 * 60 * 1000 && catalogo.ejercicios.length) return catalogo;
  const [e, r, c] = await Promise.all([
    publico.from('ejercicios').select('*').order('id'),
    publico.from('recetas').select('*').order('id'),
    publico.from('consejos').select('*').order('id')
  ]);
  const error = e.error || r.error || c.error;
  if (error) throw new Error('No se pudieron leer los catálogos de Supabase: ' + error.message);
  if (!e.data.length) throw new Error('La tabla "ejercicios" está vacía. Ejecuta supabase/datos.sql en el SQL Editor.');
  Object.assign(catalogo, { ejercicios: e.data, recetas: r.data, consejos: c.data, cargado: Date.now() });
  return catalogo;
}

// Revisa el resultado de una consulta: si hubo error, lo lanza; si no, devuelve los datos.
function ok({ data, error, count }) {
  if (error) {
    const e = new Error(error.message);
    e.codigoBD = error.code;
    throw e;
  }
  return count !== undefined && count !== null && data === null ? count : data;
}

module.exports = { clienteAuth, clienteDeUsuario, admin, cargarCatalogos, ok, URL };
