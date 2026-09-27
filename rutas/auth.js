// ============================================================
//  Registro, inicio de sesión y recuperación con Supabase Auth
// ============================================================

const express = require('express');
const { clienteAuth } = require('../db/supabase');
const { guardarSesion, borrarSesion, obtenerSesion } = require('../middleware/auth');
const { hoy, numeroONull, passwordValida, traducirErrorAuth } = require('./utilidades');

const router = express.Router();
const OBJETIVOS = ['grasa', 'musculo', 'resistencia', 'movilidad'];

// Dirección pública de la app (para los enlaces que llegan por correo)
function urlSitio(req) {
  return (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  const { nombre, email, password, objetivo, nivel, minutos, acepta_terminos, acepta_sensibles, peso, meta_peso } = req.body;

  if (!nombre || !email || !password) return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios' });
  const correo = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || correo.length > 120) return res.status(400).json({ error: 'Revisa el correo' });
  const errorPass = passwordValida(password);
  if (errorPass) return res.status(400).json({ error: errorPass });
  if (acepta_terminos !== true) return res.status(400).json({ error: 'Debes aceptar los términos y la política de tratamiento de datos' });

  const sensibles = acepta_sensibles === true;

  // Estos datos viajan a Supabase y el trigger "crear_perfil" arma el perfil con ellos
  const datosPerfil = {
    nombre: String(nombre).trim().slice(0, 60),
    objetivo: OBJETIVOS.includes(objetivo) ? objetivo : 'grasa',
    nivel: [1, 2, 3].includes(Number(nivel)) ? Number(nivel) : 1,
    minutos: Math.min(Math.max(Number(minutos) || 20, 10), 60),
    acepta_terminos: true,
    acepta_sensibles: sensibles,
    peso: sensibles ? numeroONull(peso) : null,
    meta_peso: sensibles ? numeroONull(meta_peso) : null,
    fecha: hoy()
  };

  const { data, error } = await clienteAuth().auth.signUp({
    email: correo,
    password,
    options: { data: datosPerfil, emailRedirectTo: `${urlSitio(req)}/verificar` }
  });
  if (error) return res.status(400).json({ error: traducirErrorAuth(error) });

  // Si en Supabase está activa la confirmación por correo, todavía no hay sesión
  if (!data.session) {
    // Supabase no avisa si el correo ya existía (por privacidad): devuelve un usuario sin identidades
    const yaExistia = data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0;
    if (yaExistia) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.' });
    return res.status(201).json({ ok: true, confirmar: true, email: correo });
  }

  guardarSesion(res, data.session);
  res.status(201).json({ ok: true });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const correo = String(req.body.email || '').trim().toLowerCase();
  const { data, error } = await clienteAuth().auth.signInWithPassword({ email: correo, password: String(req.body.password || '') });
  if (error) return res.status(401).json({ error: traducirErrorAuth(error) });

  guardarSesion(res, data.session);
  res.json({ ok: true });
});

// GET /api/auth/estado → { activa: true/false }
router.get('/estado', async (req, res) => {
  const sesion = await obtenerSesion(req, res);
  res.json({ activa: Boolean(sesion) });
});

// POST /api/auth/sesion  { access_token, refresh_token }
// Lo usa /verificar cuando el usuario llega desde el enlace del correo de confirmación.
router.post('/sesion', async (req, res) => {
  const { access_token, refresh_token } = req.body;
  if (!access_token || !refresh_token) return res.status(400).json({ error: 'Enlace incompleto' });

  const { data, error } = await clienteAuth().auth.getUser(access_token);
  if (error || !data.user) return res.status(401).json({ error: 'El enlace venció. Inicia sesión o pide uno nuevo.' });

  guardarSesion(res, { access_token, refresh_token, expires_in: 3600 });
  res.json({ ok: true });
});

// POST /api/auth/recuperar  { email } → Supabase envía un correo para cambiar la contraseña
router.post('/recuperar', async (req, res) => {
  const correo = String(req.body.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return res.status(400).json({ error: 'Revisa el correo' });

  const { error } = await clienteAuth().auth.resetPasswordForEmail(correo, { redirectTo: `${urlSitio(req)}/verificar` });
  if (error && error.status === 429) return res.status(429).json({ error: traducirErrorAuth(error) });
  // Siempre respondemos lo mismo, exista o no el correo (así nadie averigua quién está registrado)
  res.json({ ok: true });
});

// POST /api/auth/restablecer  { access_token, refresh_token, password }
// Llega desde el enlace del correo de recuperación.
router.post('/restablecer', async (req, res) => {
  const { access_token, refresh_token, password } = req.body;
  const errorPass = passwordValida(password);
  if (errorPass) return res.status(400).json({ error: errorPass });
  if (!access_token || !refresh_token) return res.status(400).json({ error: 'Enlace incompleto. Pide uno nuevo.' });

  const cliente = clienteAuth();
  const { error: errorSesion } = await cliente.auth.setSession({ access_token, refresh_token });
  if (errorSesion) return res.status(401).json({ error: 'El enlace venció. Pide uno nuevo.' });

  const { error } = await cliente.auth.updateUser({ password });
  if (error) return res.status(400).json({ error: traducirErrorAuth(error) });

  const { data } = await cliente.auth.getSession();
  if (data.session) guardarSesion(res, data.session);
  res.json({ ok: true });
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  // Cierra la sesión también en Supabase (invalida el token de refresco)
  if (req.cookies.sb_acceso && req.cookies.sb_refresco) {
    const cliente = clienteAuth();
    const { error } = await cliente.auth.setSession({ access_token: req.cookies.sb_acceso, refresh_token: req.cookies.sb_refresco });
    if (!error) await cliente.auth.signOut();
  }
  borrarSesion(res);
  res.json({ ok: true });
});

module.exports = router;
