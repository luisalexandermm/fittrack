// Funciones pequeñas que usan varias rutas.

// Fecha de hoy en formato YYYY-MM-DD (hora de Colombia, o la de TZ si la defines)
function hoy() {
  const zonaHoraria = (process.env.TZ || 'America/Bogota').replace(/^:/, '');
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: zonaHoraria });
  } catch {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' });
  }
}

// ¿El texto tiene forma de fecha YYYY-MM-DD?
function fechaValida(texto) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(texto || ''));
}

// Convierte a número positivo o devuelve null si viene vacío o raro
function numeroONull(valor) {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(String(valor).replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n < 1000 ? n : null;
}

// Reglas de contraseña. Devuelve el error o null si está bien.
function passwordValida(password) {
  const p = String(password || '');
  if (p.length < 8) return 'La contraseña debe tener al menos 8 caracteres';
  if (p.length > 72) return 'La contraseña es demasiado larga (máximo 72)';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'La contraseña debe tener letras y números';
  return null;
}

// Pasa los mensajes de Supabase Auth (en inglés) a español claro
function traducirErrorAuth(error) {
  const m = String(error.message || '').toLowerCase();
  const codigo = String(error.code || '');
  if (codigo === 'email_not_confirmed' || m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar. Revisa tu bandeja de entrada (y spam).';
  if (codigo === 'invalid_credentials' || m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese correo';
  if (codigo === 'over_email_send_rate_limit' || m.includes('email rate limit')) return 'Ya te enviamos un correo hace poco. Revisa tu bandeja de entrada (y spam) o espera un rato antes de pedir otro.';
  if (m.includes('rate limit') || error.status === 429) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (m.includes('password') && (m.includes('weak') || m.includes('at least') || m.includes('should'))) return 'La contraseña no cumple los requisitos de seguridad';
  if (m.includes('same') && m.includes('password')) return 'La nueva contraseña debe ser distinta a la anterior';
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) return 'Los registros están desactivados en este momento';
  if (m.includes('invalid email')) return 'Revisa el correo';
  if (m.includes('database error saving new user')) return 'No se pudo crear el perfil. Revisa que ejecutaste supabase/esquema.sql';
  if (m.includes('fetch failed') || m.includes('network')) return 'No se pudo conectar con Supabase. Revisa SUPABASE_URL y tu internet.';
  return 'No se pudo completar la operación. Intenta de nuevo.';
}

module.exports = { hoy, fechaValida, numeroONull, passwordValida, traducirErrorAuth };
