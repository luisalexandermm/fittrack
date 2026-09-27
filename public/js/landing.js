// ============================================================
//  landing.js — página de inicio
//  1. Foto del hero   2. Animación de letras   3. Parallax
//  4. Menú completo   5. Puntos de sección     6. Registro   7. Login
// ============================================================

document.documentElement.classList.add('js-listo'); // activa las animaciones de aparición

// ---------- 0. ¿Hay servidor? ¿Ya tiene sesión? ----------
// Si la página se abrió sin el servidor (doble clic o Live Server), se avisa de una vez.
function avisarSinServidor() {
  const aviso = document.getElementById('aviso-servidor');
  aviso.hidden = false;
  aviso.querySelector('p').textContent = MENSAJE_SIN_SERVIDOR;
}
if (location.protocol === 'file:') {
  avisarSinServidor();
} else {
  fetch('/api/auth/estado')
    .then(r => {
      if (!(r.headers.get('content-type') || '').includes('application/json')) throw new Error();
      return r.json();
    })
    .then(d => { if (d.activa) window.location.href = '/app'; })
    .catch(avisarSinServidor);
}

// ---------- 1. Foto del hero ----------
// Si existe public/img/hero-atleta.png se muestra; si no, queda el marcador.
const foto = document.getElementById('hero-foto');
foto.decode()
  .then(() => {
    foto.hidden = false;
    document.getElementById('hero-marcador').hidden = true;
  })
  .catch(() => { /* no hay foto todavía: se queda el marcador */ });

// ---------- 2. Cada letra de FITTRACK entra con un pequeño retraso ----------
document.querySelectorAll('.hero-palabra i').forEach((letra, i) => letra.style.setProperty('--i', i));

// ---------- 3. Parallax: las capas se mueven distinto con el mouse ----------
const capas = document.querySelectorAll('.capa');
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!movimientoReducido && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', e => {
    if (window.scrollY > window.innerHeight) return; // solo cuando el hero está a la vista
    const dx = e.clientX / window.innerWidth - 0.5;
    const dy = e.clientY / window.innerHeight - 0.5;
    capas.forEach(capa => {
      const prof = Number(capa.dataset.prof);
      capa.style.setProperty('--px', (dx * prof).toFixed(1) + 'px');
      capa.style.setProperty('--py', (dy * prof).toFixed(1) + 'px');
    });
  });
}

// ---------- 4. Menú a pantalla completa ----------
const menu = document.getElementById('menu-completo');
const btnAbrir = document.getElementById('abrir-menu');

function abrirMenu() {
  menu.hidden = false;
  btnAbrir.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  document.getElementById('cerrar-menu').focus();
}
function cerrarMenu() {
  menu.hidden = true;
  btnAbrir.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
btnAbrir.addEventListener('click', abrirMenu);
document.querySelectorAll('[data-abrir-menu]').forEach(b => b.addEventListener('click', abrirMenu));
document.getElementById('cerrar-menu').addEventListener('click', cerrarMenu);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });

// ---------- 5. El punto activo sigue a la sección visible ----------
const puntos = document.querySelectorAll('.hero-puntos a');
const secciones = ['arriba', 'como', 'app'].map(id => document.getElementById(id));
const observador = new IntersectionObserver(entradas => {
  entradas.forEach(entrada => {
    if (!entrada.isIntersecting) return;
    const indice = secciones.indexOf(entrada.target);
    puntos.forEach((p, i) => p.classList.toggle('activo', i === indice));
  });
}, { threshold: 0.4 });
secciones.forEach(s => observador.observe(s));

// ---------- Barra fija: aparece cuando el hero sale de la pantalla ----------
const navFija = document.getElementById('nav-fija');
new IntersectionObserver(([entrada]) => {
  const visible = !entrada.isIntersecting;
  navFija.classList.toggle('visible', visible);
  navFija.setAttribute('aria-hidden', String(!visible));
  navFija.querySelectorAll('a, button').forEach(el => { el.tabIndex = visible ? 0 : -1; });
}, { threshold: 0.08 }).observe(document.getElementById('arriba'));

// ---------- Aparición suave de las secciones al hacer scroll ----------
const observadorRevelar = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visto'); observadorRevelar.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.revelar').forEach(el => observadorRevelar.observe(el));

// ---------- Pestañas registro / login ----------
const formRegistro = document.getElementById('form-registro');
const formLogin = document.getElementById('form-login');

function mostrarPestana(nombre) {
  document.querySelectorAll('.pestana').forEach(p => p.classList.toggle('activo', p.dataset.pestana === nombre));
  formRegistro.hidden = nombre !== 'registro';
  formLogin.hidden = nombre !== 'login';
  document.getElementById('form-recuperar').hidden = nombre !== 'recuperar';
  document.getElementById('revisa-correo').hidden = true;
}

function mostrarRevisaCorreo(titulo, texto) {
  formRegistro.hidden = true;
  formLogin.hidden = true;
  document.getElementById('form-recuperar').hidden = true;
  document.getElementById('rv-titulo').textContent = titulo;
  document.getElementById('rv-texto').textContent = texto;
  document.getElementById('revisa-correo').hidden = false;
}

document.getElementById('ir-recuperar').addEventListener('click', () => {
  document.getElementById('rc-email').value = document.getElementById('l-email').value;
  mostrarPestana('recuperar');
});
document.querySelectorAll('[data-pestana-ir]').forEach(b => b.addEventListener('click', () => mostrarPestana(b.dataset.pestanaIr)));

// Recuperar contraseña
document.getElementById('form-recuperar').addEventListener('submit', async e => {
  e.preventDefault();
  const email = document.getElementById('rc-email').value.trim();
  const error = document.getElementById('rc-error');
  error.textContent = '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return (error.textContent = 'Revisa el correo');
  try {
    await api('/auth/recuperar', { method: 'POST', body: { email } });
    mostrarRevisaCorreo('Revisa tu correo', `Si ${email} tiene una cuenta, te llegará un enlace para crear una contraseña nueva.`);
  } catch (err) {
    error.textContent = err.message;
  }
});
document.querySelectorAll('.pestana').forEach(p => p.addEventListener('click', () => mostrarPestana(p.dataset.pestana)));
document.querySelectorAll('[data-ir]').forEach(a => a.addEventListener('click', () => mostrarPestana(a.dataset.ir)));

// Opciones de selección única
function seleccionUnica(idContenedor) {
  const contenedor = document.getElementById(idContenedor);
  contenedor.addEventListener('click', e => {
    const opcion = e.target.closest('[data-valor]');
    if (!opcion) return;
    contenedor.querySelectorAll('[data-valor]').forEach(o => o.classList.toggle('activo', o === opcion));
  });
}
seleccionUnica('r-objetivo');
seleccionUnica('r-nivel');

const rango = document.getElementById('r-minutos');
rango.addEventListener('input', () => { document.getElementById('r-minutos-valor').textContent = rango.value; });

// Mostrar peso y meta solo si autoriza datos sensibles
const casillaSensibles = document.getElementById('r-sensibles');
casillaSensibles.addEventListener('change', () => {
  document.getElementById('r-datos-cuerpo').hidden = !casillaSensibles.checked;
});

// ---------- 6. Registro en 4 pasos ----------
let pasoActual = 1;
const TOTAL_PASOS = 4;
const errorRegistro = document.getElementById('r-error');
const btnAtras = document.getElementById('r-atras');
const btnSiguiente = document.getElementById('r-siguiente');

function irAPaso(n) {
  pasoActual = n;
  document.querySelectorAll('.paso').forEach(p => { p.hidden = Number(p.dataset.paso) !== n; });
  document.querySelectorAll('.pasos span').forEach((s, i) => s.classList.toggle('hecho', i < n));
  btnAtras.hidden = n === 1;
  btnSiguiente.firstChild.textContent = n === TOTAL_PASOS ? 'Crear mi cuenta ' : 'Continuar ';
  errorRegistro.textContent = '';
}
btnAtras.addEventListener('click', () => irAPaso(pasoActual - 1));

// Misma regla que el servidor: 8+ caracteres con letras y números
function revisarPassword(p) {
  if (p.length < 8) return 'La contraseña necesita mínimo 8 caracteres';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'La contraseña debe tener letras y números';
  return '';
}

formRegistro.addEventListener('submit', async e => {
  e.preventDefault();
  const nombre = document.getElementById('r-nombre').value.trim();
  const email = document.getElementById('r-email').value.trim();
  const password = document.getElementById('r-pass').value;

  if (pasoActual === 1) {
    if (!nombre || !email || !password) return (errorRegistro.textContent = 'Completa los tres campos');
    if (!/^\S+@\S+\.\S+$/.test(email)) return (errorRegistro.textContent = 'Revisa el correo');
    const errorPass = revisarPassword(password);
    if (errorPass) return (errorRegistro.textContent = errorPass);
    return irAPaso(2);
  }
  if (pasoActual < TOTAL_PASOS) return irAPaso(pasoActual + 1);

  // Paso 4: crear la cuenta
  if (!document.getElementById('r-terminos').checked) {
    return (errorRegistro.textContent = 'Debes aceptar los términos y la política de datos');
  }

  btnSiguiente.disabled = true;
  try {
    const respuesta = await api('/auth/registro', {
      method: 'POST',
      body: {
        nombre, email, password,
        objetivo: document.querySelector('#r-objetivo .activo').dataset.valor,
        nivel: document.querySelector('#r-nivel .activo').dataset.valor,
        minutos: rango.value,
        acepta_terminos: true,
        acepta_sensibles: casillaSensibles.checked,
        peso: casillaSensibles.checked ? document.getElementById('r-peso').value : null,
        meta_peso: casillaSensibles.checked ? document.getElementById('r-meta').value : null
      }
    });
    // Si Supabase pide confirmar el correo, mostramos el aviso; si no, entramos directo
    if (respuesta.confirmar) {
      mostrarRevisaCorreo('Confirma tu cuenta', `Te enviamos un enlace a ${respuesta.email}. Tócalo para activar tu cuenta y empezar a entrenar.`);
    } else {
      window.location.href = '/app';
    }
  } catch (err) {
    if (err.message.includes('correo') || err.message.includes('contraseña')) irAPaso(1);
    errorRegistro.textContent = err.message;
  } finally {
    btnSiguiente.disabled = false;
  }
});

// ---------- 7. Login ----------
formLogin.addEventListener('submit', async e => {
  e.preventDefault();
  const error = document.getElementById('l-error');
  error.textContent = '';
  try {
    await api('/auth/login', {
      method: 'POST',
      body: { email: document.getElementById('l-email').value, password: document.getElementById('l-pass').value }
    });
    window.location.href = '/app';
  } catch (err) {
    error.textContent = err.message;
  }
});
