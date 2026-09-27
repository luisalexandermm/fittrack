// ============================================================
//  Sesión con Supabase Auth
//  Supabase entrega dos tokens al iniciar sesión:
//    - acceso   (dura ~1 hora)  → prueba quién eres en cada petición
//    - refresco (dura semanas)  → sirve para pedir un acceso nuevo
//  Los guardamos en cookies httpOnly: el JavaScript del navegador no los puede leer.
// ============================================================

const { clienteAuth, clienteDeUsuario } = require('../db/supabase');

const produccion = process.env.NODE_ENV === 'production';
const baseCookie = { httpOnly: true, sameSite: 'lax', secure: produccion, path: '/' };

function guardarSesion(res, sesion) {
  res.cookie('sb_acceso', sesion.access_token, { ...baseCookie, maxAge: (sesion.expires_in || 3600) * 1000 });
  res.cookie('sb_refresco', sesion.refresh_token, { ...baseCookie, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

function borrarSesion(res) {
  res.clearCookie('sb_acceso', { path: '/' });
  res.clearCookie('sb_refresco', { path: '/' });
}

// Pequeña memoria para no preguntarle a Supabase por el mismo token en cada petición
const tokensValidados = new Map(); // token → { usuario, hasta }

async function usuarioDelToken(token) {
  if (!token) return null;
  const guardado = tokensValidados.get(token);
  if (guardado && guardado.hasta > Date.now()) return guardado.usuario;

  const { data, error } = await clienteAuth().auth.getUser(token);
  if (error || !data.user) return null;

  tokensValidados.set(token, { usuario: data.user, hasta: Date.now() + 60 * 1000 });
  if (tokensValidados.size > 5000) tokensValidados.clear(); // que no crezca sin límite
  return data.user;
}

// Busca al usuario por el token de acceso; si venció, lo renueva con el de refresco.
async function obtenerSesion(req, res) {
  let token = req.cookies.sb_acceso;
  let usuario = await usuarioDelToken(token);

  if (!usuario && req.cookies.sb_refresco) {
    const { data, error } = await clienteAuth().auth.refreshSession({ refresh_token: req.cookies.sb_refresco });
    if (!error && data.session) {
      guardarSesion(res, data.session);
      token = data.session.access_token;
      usuario = data.user;
    }
  }
  return usuario ? { usuario, token } : null;
}

// Middleware: exige sesión. Deja en req:
//   req.usuarioId → id del usuario (uuid)
//   req.usuario   → datos de Supabase Auth (email, etc.)
//   req.sb        → cliente de Supabase que actúa como ese usuario (aplica RLS)
async function requiereLogin(req, res, next) {
  const sesion = await obtenerSesion(req, res);
  if (!sesion) {
    borrarSesion(res);
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  req.usuario = sesion.usuario;
  req.usuarioId = sesion.usuario.id;
  req.token = sesion.token;
  req.sb = clienteDeUsuario(sesion.token);
  next();
}

// Peso, medidas y fotos son datos sensibles (Ley 1581 de 2012).
// Solo se pueden GUARDAR si el usuario lo autorizó. (La base de datos también lo exige con RLS.)
async function requiereAutorizacionSensibles(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE') return next();
  const { data } = await req.sb.from('perfiles').select('sensibles_ok').eq('id', req.usuarioId).single();
  if (!data || !data.sensibles_ok) {
    return res.status(403).json({ error: 'Para guardar peso, medidas o fotos debes autorizarlo en Perfil → Privacidad y datos', codigo: 'SIN_AUTORIZACION' });
  }
  next();
}

module.exports = { requiereLogin, requiereAutorizacionSensibles, guardarSesion, borrarSesion, obtenerSesion };
