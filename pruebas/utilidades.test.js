const test = require('node:test');
const assert = require('node:assert/strict');
const { traducirErrorAuth, correoNoEnviado, passwordValida } = require('../rutas/utilidades');

test('errores de Supabase Auth en español', () => {
  assert.match(traducirErrorAuth({ code: 'email_not_confirmed', message: 'Email not confirmed' }), /Confirma tu correo/);
  assert.match(traducirErrorAuth({ code: 'invalid_credentials', message: 'Invalid login credentials' }), /incorrectos/);
  assert.match(traducirErrorAuth({ code: 'over_email_send_rate_limit', message: 'email rate limit exceeded' }), /Ya te enviamos/);
});

test('detecta cuando Supabase no pudo mandar el correo (SMTP)', () => {
  assert.equal(correoNoEnviado({ message: 'Error sending confirmation email' }), true);
  assert.equal(correoNoEnviado({ message: 'Email address not authorized' }), true);
  assert.equal(correoNoEnviado({ message: 'Invalid login credentials' }), false);
  assert.match(traducirErrorAuth({ message: 'Error sending confirmation email' }), /No pudimos enviar el correo/);
});

test('contraseñas: mínimo de seguridad', () => {
  assert.ok(passwordValida('corta'));
  assert.equal(passwordValida('clave1234'), null);
});
