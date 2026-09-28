// Derechos sobre los datos personales (Ley 1581 de 2012 — Habeas Data):
// conocer (exportar), actualizar (contraseña), revocar autorización y suprimir (borrar cuenta).

const express = require('express');
const { ok, admin, clienteAuth } = require('../db/supabase');
const { passwordValida, traducirErrorAuth } = require('./utilidades');
const { borrarSesion } = require('../middleware/auth');

const router = express.Router();

// Comprueba la contraseña actual intentando iniciar sesión con ella
async function passwordCorrecta(email, password) {
  const { error } = await clienteAuth().auth.signInWithPassword({ email, password: String(password || '') });
  return !error;
}

// GET /api/cuenta/exportar → todos los datos del usuario en un archivo JSON
router.get('/exportar', async (req, res) => {
  const sb = req.sb;
  const [perfil, sesiones, medidas, fotos, rutinas] = await Promise.all([
    sb.from('perfiles').select('*').single(), // todo el perfil (incluye preferencias y semana)
    sb.from('sesiones').select('fecha, nombre, objetivo, minutos, sensacion, notas').order('fecha'),
    sb.from('medidas').select('fecha, peso, cintura, cadera, pecho, brazo, muslo, grasa, notas').order('fecha'),
    sb.from('fotos').select('fecha, angulo, nota').order('fecha'),
    sb.from('rutinas').select('nombre, objetivo, nivel, minutos, creado_en')
  ]);
  res.setHeader('Content-Disposition', 'attachment; filename="mis-datos-fittrack.json"');
  res.json({
    exportado_en: new Date().toISOString(),
    email: req.usuario.email,
    perfil: ok(perfil), sesiones: ok(sesiones), medidas: ok(medidas), fotos: ok(fotos), rutinas_guardadas: ok(rutinas)
  });
});

// PUT /api/cuenta/password  { actual, nueva }
router.put('/password', async (req, res) => {
  const { actual, nueva } = req.body;
  if (!(await passwordCorrecta(req.usuario.email, actual))) return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  const error = passwordValida(nueva);
  if (error) return res.status(400).json({ error });

  const cliente = clienteAuth();
  await cliente.auth.setSession({ access_token: req.token, refresh_token: req.cookies.sb_refresco || '' });
  const r = await cliente.auth.updateUser({ password: nueva });
  if (r.error) return res.status(400).json({ error: traducirErrorAuth(r.error) });
  res.json({ ok: true });
});

// PUT /api/cuenta/autorizacion  { sensibles: true | false }
router.put('/autorizacion', async (req, res) => {
  const activa = req.body.sensibles === true;
  ok(await req.sb.from('perfiles').update({ sensibles_ok: activa, sensibles_fecha: new Date().toISOString() }).eq('id', req.usuarioId));
  res.json({ ok: true, sensibles_ok: activa });
});

// DELETE /api/cuenta  { password } → borra la cuenta, todos sus datos y sus fotos
router.delete('/', async (req, res) => {
  if (!admin) return res.status(500).json({ error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor para poder borrar cuentas' });
  if (!(await passwordCorrecta(req.usuario.email, req.body.password))) return res.status(400).json({ error: 'Contraseña incorrecta' });

  // 1. Borrar las fotos de Storage (carpeta del usuario)
  const { data: archivos } = await admin.storage.from('fotos').list(req.usuarioId, { limit: 1000 });
  if (archivos && archivos.length) {
    await admin.storage.from('fotos').remove(archivos.map(a => `${req.usuarioId}/${a.name}`));
  }
  // 2. Borrar el usuario de Supabase Auth → la base borra en cascada perfil, sesiones, medidas, rutinas y fotos
  const { error } = await admin.auth.admin.deleteUser(req.usuarioId);
  if (error) return res.status(500).json({ error: 'No se pudo borrar la cuenta. Intenta de nuevo.' });

  borrarSesion(res);
  res.json({ ok: true });
});

module.exports = router;
