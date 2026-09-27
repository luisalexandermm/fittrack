// ============================================================
//  verificar.js — página a la que llegan los enlaces de los correos de Supabase
//  Supabase agrega los datos al final de la dirección, después del "#":
//    /verificar#access_token=...&refresh_token=...&type=signup     → confirmar cuenta
//    /verificar#access_token=...&refresh_token=...&type=recovery   → nueva contraseña
//    /verificar#error=...&error_description=...                    → enlace vencido
// ============================================================

const datos = new URLSearchParams(location.hash.slice(1));
const consulta = new URLSearchParams(location.search);

// Borramos los tokens de la barra de direcciones (que no queden en el historial)
history.replaceState(null, '', location.pathname);

function mostrar(id) {
  ['v-cargando', 'v-listo', 'v-nueva', 'v-fallo'].forEach(x => { document.getElementById(x).hidden = x !== id; });
}

function fallo(texto) {
  if (texto) document.getElementById('v-fallo-texto').textContent = texto;
  mostrar('v-fallo');
}

const tokens = { access_token: datos.get('access_token'), refresh_token: datos.get('refresh_token') };
const tipo = datos.get('type');

(async () => {
  // 1. Supabase avisó un error (enlace vencido, ya usado, etc.)
  if (datos.get('error') || consulta.get('error')) {
    const detalle = datos.get('error_code') || consulta.get('error_code') || '';
    return fallo(detalle.includes('expired')
      ? 'El enlace venció. Pide uno nuevo desde "¿Olvidaste tu contraseña?" o vuelve a registrarte.'
      : 'El enlace no es válido o ya fue usado.');
  }

  // 2. Enlace con "?code=" (proyectos con PKCE): la cuenta ya quedó confirmada
  if (!tokens.access_token && consulta.get('code')) {
    document.getElementById('v-listo-texto').textContent = 'Tu correo quedó confirmado. Inicia sesión para continuar.';
    document.querySelector('#v-listo a').href = '/#acceso';
    document.querySelector('#v-listo a').textContent = 'Iniciar sesión';
    return mostrar('v-listo');
  }

  if (!tokens.access_token || !tokens.refresh_token) return fallo();

  // 3. Recuperación de contraseña: pedir la nueva
  if (tipo === 'recovery') {
    mostrar('v-nueva');
    document.getElementById('v-pass').focus();
    return;
  }

  // 4. Confirmación de cuenta (u otro enlace de acceso): abrir sesión y entrar
  try {
    await api('/auth/sesion', { method: 'POST', body: tokens });
    mostrar('v-listo');
    setTimeout(() => { window.location.href = '/app'; }, 1200);
  } catch (err) {
    fallo(err.message);
  }
})();

// Guardar la nueva contraseña
document.getElementById('v-nueva').addEventListener('submit', async e => {
  e.preventDefault();
  const error = document.getElementById('v-error');
  const password = document.getElementById('v-pass').value;
  error.textContent = '';
  if (password !== document.getElementById('v-pass2').value) return (error.textContent = 'Las contraseñas no coinciden');
  if (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return (error.textContent = 'Usa mínimo 8 caracteres, con letras y números');
  }
  try {
    await api('/auth/restablecer', { method: 'POST', body: { ...tokens, password } });
    avisar('Contraseña actualizada');
    window.location.href = '/app';
  } catch (err) {
    error.textContent = err.message;
  }
});
