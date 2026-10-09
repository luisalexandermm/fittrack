// ============================================================
//  landing.js — página de inicio
//   0. Servidor y sesión          6. Demo (usa el generador real)
//   1. Hero, barra fija y scroll  7. Vitrina de la app
//   2. Menú de celular            8. Objetivos → demo
//   3. Aparición y contadores     9. Modal de acceso (abrir / cerrar)
//   5. Pasos (figura animada)    10. Onboarding: 7 pasos + tu semana
//                                11. Login y recuperar contraseña
// ============================================================

document.documentElement.classList.add('js-listo'); // activa las animaciones de aparición
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const punteroFino = window.matchMedia('(pointer: fine)').matches;
const $ = id => document.getElementById(id);

// Si Supabase mandó el enlace del correo a la página de inicio (y no a /verificar),
// pasamos los datos del enlace a /verificar para confirmar la cuenta o cambiar la contraseña.
if (/(access_token|error_code)=/.test(location.hash) || new URLSearchParams(location.search).has('code')) {
  window.location.replace('/verificar' + location.search + location.hash);
}

// ---------- 0. ¿Hay servidor? ¿Ya tiene sesión? ----------
function avisarSinServidor() {
  const aviso = $('aviso-servidor');
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

// ---------- 1. Hero (el diseño original): foto, letras y parallax ----------
// Si existe public/img/hero-atleta.png se muestra; si no, queda el marcador.
const foto = $('hero-foto');
foto.decode()
  .then(() => { foto.hidden = false; $('hero-marcador').hidden = true; })
  .catch(() => { /* todavía no hay foto */ });

document.querySelectorAll('.hero-palabra i').forEach((letra, i) => letra.style.setProperty('--i', i));

const capas = document.querySelectorAll('.capa');
if (!movimientoReducido && punteroFino) {
  window.addEventListener('mousemove', e => {
    if (window.scrollY > window.innerHeight) return; // solo con el hero a la vista
    const dx = e.clientX / window.innerWidth - 0.5;
    const dy = e.clientY / window.innerHeight - 0.5;
    capas.forEach(capa => {
      const prof = Number(capa.dataset.prof);
      capa.style.setProperty('--px', (dx * prof).toFixed(1) + 'px');
      capa.style.setProperty('--py', (dy * prof).toFixed(1) + 'px');
    });
  });
}

// Barra fija: aparece cuando el hero sale de la pantalla
const navFija = $('nav-fija');
new IntersectionObserver(([entrada]) => {
  const visible = !entrada.isIntersecting;
  navFija.classList.toggle('visible', visible);
  navFija.setAttribute('aria-hidden', String(!visible));
  navFija.querySelectorAll('a, button').forEach(el => { el.tabIndex = visible ? 0 : -1; });
}, { threshold: 0.05 }).observe($('arriba'));

// Barra de avance de la página y línea de los pasos
const barraNav = $('nav-progreso');
const listaPasos = $('pasos-linea');
const rellenoPasos = $('pasos-relleno');
let esperandoCuadro = false;

function alHacerScroll() {
  esperandoCuadro = false;
  const alto = window.innerHeight;
  const total = document.documentElement.scrollHeight - alto;
  barraNav.style.setProperty('--avance', total > 0 ? (window.scrollY / total).toFixed(3) : 0);
  const r = listaPasos.getBoundingClientRect();
  const avance = Math.min(Math.max((alto * 0.85 - r.top) / (r.height + alto * 0.2), 0), 1);
  rellenoPasos.parentElement.style.setProperty('--avance', avance.toFixed(3));
}
window.addEventListener('scroll', () => {
  if (!esperandoCuadro) { esperandoCuadro = true; requestAnimationFrame(alHacerScroll); }
}, { passive: true });
alHacerScroll();

// El enlace de la sección visible queda marcado en la barra fija
const enlacesNav = navFija.querySelectorAll('.nav-fija-enlaces a');
['como', 'demo', 'app', 'objetivos'].forEach(id => {
  new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) enlacesNav.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + id));
  }), { rootMargin: '-45% 0px -50% 0px' }).observe($(id));
});

// ---------- 2. Menú a pantalla completa (celular) ----------
const menu = $('menu-completo');
const btnMenu = $('abrir-menu');
function abrirMenu() {
  menu.hidden = false;
  btnMenu.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
  $('cerrar-menu').focus();
}
function cerrarMenu() {
  menu.hidden = true;
  btnMenu.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}
btnMenu.addEventListener('click', abrirMenu);
document.querySelectorAll('[data-abrir-menu]').forEach(b => b.addEventListener('click', abrirMenu));
$('cerrar-menu').addEventListener('click', cerrarMenu);
menu.querySelectorAll('a').forEach(a => a.addEventListener('click', cerrarMenu));

// ---------- 3. Aparición suave y contadores ----------
const observadorRevelar = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visto'); observadorRevelar.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
document.querySelectorAll('.revelar').forEach(el => observadorRevelar.observe(el));

function contar(el) {
  const final = Number(el.dataset.contar);
  if (movimientoReducido) { el.textContent = final; return; }
  const inicio = performance.now(), duracion = 1300;
  const paso = ahora => {
    const t = Math.min((ahora - inicio) / duracion, 1);
    el.textContent = Math.round(final * (1 - Math.pow(1 - t, 4)));
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
const observadorContar = new IntersectionObserver(entradas => {
  entradas.forEach(e => { if (e.isIntersecting) { contar(e.target); observadorContar.unobserve(e.target); } });
}, { threshold: 0.6 });
document.querySelectorAll('[data-contar]').forEach(el => observadorContar.observe(el));

// El botón principal se acerca un poquito al cursor
if (punteroFino && !movimientoReducido) {
  document.querySelectorAll('.iman').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

// ---------- 5. Paso 4 de "cómo funciona": figura animada ----------
montarAnimacion($('paso-figura'), 'Burpees', 'cardio');

// ---------- 6. Demo: arma una rutina con el generador real del servidor ----------
const PICTO = { piernas: 'p-piernas', empuje: 'p-empuje', tiron: 'p-tiron', core: 'p-core', cardio: 'p-cardio', movilidad: 'p-movilidad' };
const demo = { objetivo: 'grasa', lugar: 'casa', nivel: 1, minutos: 25, rutina: null, elegido: 0 };
let esperaDemo = null;

async function calcularDemo() {
  try {
    demo.rutina = await api('/plan/demo', { method: 'POST', body: { objetivo: demo.objetivo, lugar: demo.lugar, nivel: demo.nivel, minutos: demo.minutos } });
  } catch (err) {
    $('d-lista').innerHTML = `<li class="tenue">${escapar(err.message)}</li>`;
    return;
  }
  const r = demo.rutina;
  const principal = r.bloques.find(b => b.tipo === 'principal');
  $('d-titulo').textContent = r.nombre.split(' · ')[0];
  animarNumero('d-trabajo', r.trabajo);
  animarNumero('d-descanso', r.descanso);
  animarNumero('d-rondas', r.rondas);
  animarNumero('d-duracion', Math.round((r.actividad_seg || r.duracion_seg) / 60));
  $('d-lista').innerHTML = principal.ejercicios.map((e, i) => `
    <li><button type="button" data-i="${i}" style="animation-delay:${i * 50}ms">
      <span class="n">${i + 1}</span>
      <svg class="t" aria-hidden="true"><use href="img/iconos.svg#${PICTO[e.grupo] || 'p-movilidad'}"/></svg>
      <span><strong>${escapar(e.nombre)}</strong><small>${NOMBRES_GRUPO[e.grupo] || ''}${e.equipo === 'gimnasio' ? ' · Gimnasio' : ''}</small></span>
      <span class="seg">${e.segundos}s</span>
    </button></li>`).join('');
  elegirEjercicioDemo(0);
}

function elegirEjercicioDemo(i) {
  const principal = demo.rutina.bloques.find(b => b.tipo === 'principal');
  const e = principal.ejercicios[i];
  if (!e) return;
  demo.elegido = i;
  document.querySelectorAll('#d-lista button').forEach(b => b.classList.toggle('activo', Number(b.dataset.i) === i));
  montarAnimacion($('d-figura'), e.nombre, e.grupo);
  $('d-grupo').textContent = NOMBRES_GRUPO[e.grupo] || '';
  $('d-nombre').textContent = e.nombre;
  $('d-musculos').textContent = e.musculos || e.descripcion;
}

function animarNumero(id, valor) {
  const el = $(id);
  const desde = Number(el.textContent) || 0;
  if (movimientoReducido || desde === valor) { el.textContent = valor; return; }
  const inicio = performance.now();
  const paso = ahora => {
    const t = Math.min((ahora - inicio) / 450, 1);
    el.textContent = Math.round(desde + (valor - desde) * t);
    if (t < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

function prepararChips(id, alCambiar) {
  $(id).addEventListener('click', e => {
    const chip = e.target.closest('[data-valor]');
    if (!chip) return;
    $(id).querySelectorAll('.chip-demo').forEach(c => c.classList.toggle('activo', c === chip));
    alCambiar(chip.dataset.valor);
  });
}
function elegirObjetivoDemo(valor) {
  demo.objetivo = valor;
  document.querySelectorAll('#d-objetivo .chip-demo').forEach(c => c.classList.toggle('activo', c.dataset.valor === valor));
  calcularDemo();
}
prepararChips('d-objetivo', elegirObjetivoDemo);
prepararChips('d-lugar', v => { demo.lugar = v; calcularDemo(); });
prepararChips('d-nivel', v => { demo.nivel = Number(v); calcularDemo(); });
$('d-minutos').addEventListener('input', e => {
  demo.minutos = Number(e.target.value);
  $('d-minutos-valor').textContent = e.target.value;
  clearTimeout(esperaDemo);
  esperaDemo = setTimeout(calcularDemo, 250); // espera a que suelte el control
});
$('d-mezclar').addEventListener('click', calcularDemo);
$('d-lista').addEventListener('click', e => {
  const boton = e.target.closest('[data-i]');
  if (boton) elegirEjercicioDemo(Number(boton.dataset.i));
});
// La demo se pide al servidor solo cuando la sección se acerca a la pantalla
new IntersectionObserver(([e], obs) => { if (e.isIntersecting) { calcularDemo(); obs.disconnect(); } }, { rootMargin: '300px' }).observe($('demo'));

// Probar 10 segundos del ejercicio elegido
let relojDemo = null;
$('d-probar').addEventListener('click', () => {
  let quedan = 10;
  clearInterval(relojDemo);
  $('d-reloj').hidden = false;
  $('d-cuenta').textContent = quedan;
  $('d-barra').style.width = '0%';
  relojDemo = setInterval(() => {
    quedan--;
    $('d-cuenta').textContent = quedan;
    $('d-barra').style.width = ((10 - quedan) / 10) * 100 + '%';
    if (quedan <= 0) {
      clearInterval(relojDemo);
      $('d-cuenta').textContent = '✓';
      setTimeout(() => { $('d-reloj').hidden = true; }, 1600);
    }
  }, 1000);
});

// ---------- 7. Vitrina de la app: cambia sola cada 5 segundos ----------
const vitrina = document.querySelector('.vitrina');
const tabs = document.querySelectorAll('.vitrina-tab');
const pantallas = document.querySelectorAll('.tel-pantalla');
const telefono = $('telefono');
let pantallaActual = 0, temporizadorVitrina = null;
montarAnimacion($('tel-figura'), 'Flexiones', 'empuje');

function mostrarPantalla(n) {
  pantallaActual = n;
  tabs.forEach((t, i) => { t.classList.toggle('activo', i === n); t.setAttribute('aria-selected', i === n); });
  pantallas.forEach((p, i) => p.classList.toggle('activa', i === n));
  const barra = tabs[n].querySelector('.tiempo');
  barra.style.animation = 'none'; barra.getBoundingClientRect(); barra.style.animation = '';
  reiniciarVitrina();
}
function reiniciarVitrina() {
  clearTimeout(temporizadorVitrina);
  if (movimientoReducido) return;
  temporizadorVitrina = setTimeout(() => {
    if (!vitrina.classList.contains('pausada')) mostrarPantalla((pantallaActual + 1) % tabs.length);
    else reiniciarVitrina();
  }, 5000);
}
tabs.forEach((t, i) => t.addEventListener('click', () => mostrarPantalla(i)));
vitrina.addEventListener('mouseenter', () => vitrina.classList.add('pausada'));
vitrina.addEventListener('mouseleave', () => { vitrina.classList.remove('pausada'); reiniciarVitrina(); });
new IntersectionObserver(([e]) => { if (e.isIntersecting) reiniciarVitrina(); else clearTimeout(temporizadorVitrina); }, { threshold: 0.3 }).observe(vitrina);

if (punteroFino && !movimientoReducido) {
  const escena = $('telefono-escena');
  escena.addEventListener('mousemove', e => {
    const r = escena.getBoundingClientRect();
    telefono.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 18 + 'deg');
    telefono.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 10 + 'deg');
  });
  escena.addEventListener('mouseleave', () => { telefono.style.removeProperty('--ry'); telefono.style.removeProperty('--rx'); });
}

// ---------- 8. Objetivos: al tocar uno, la demo lo carga ----------
document.querySelectorAll('[data-objetivo]').forEach(boton => {
  boton.addEventListener('click', () => {
    elegirObjetivoDemo(boton.dataset.objetivo);
    $('demo').scrollIntoView({ behavior: movimientoReducido ? 'auto' : 'smooth' });
  });
});

// ============================================================
//  9. MODAL DE ACCESO: registro con onboarding, login y recuperar
// ============================================================
const modal = $('acceso-modal');
const cuerpoModal = $('acceso-cuerpo');
const VISTAS = ['form-registro', 'ob-generando', 'ob-semana', 'form-login', 'form-recuperar', 'revisa-correo'];
let elementoAntesDelModal = null;
let generandoSemana = false;

function abrirAcceso(vista = 'registro') {
  if (modal.hidden) {
    elementoAntesDelModal = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  mostrarVista(vista);
}

function cerrarAcceso() {
  if (generandoSemana) return; // no cerrar a mitad de crear la cuenta
  modal.hidden = true;
  document.body.style.overflow = '';
  if (location.hash === '#acceso') history.replaceState(null, '', location.pathname);
  if (elementoAntesDelModal) elementoAntesDelModal.focus();
}

// Muestra una de las vistas del modal (registro, login, recuperar…)
function mostrarVista(nombre) {
  const id = { registro: 'form-registro', login: 'form-login', recuperar: 'form-recuperar' }[nombre] || nombre;
  VISTAS.forEach(v => { $(v).hidden = v !== id; });
  const enOnboarding = id === 'form-registro';
  $('ob-progreso').hidden = !enOnboarding && id !== 'ob-generando' && id !== 'ob-semana';
  $('ob-contador').hidden = !enOnboarding;
  if (enOnboarding) irAPaso(pasoActual, false);
  else {
    $('ob-atras').hidden = true;
    if (id === 'ob-generando') marcarProgreso(TOTAL_PASOS + 0.5);
    if (id === 'ob-semana') marcarProgreso(TOTAL_PASOS + 1);
  }
  cuerpoModal.scrollTop = 0;
  enfocarPrimero();
}

function enfocarPrimero() {
  const visible = VISTAS.map($).find(v => !v.hidden);
  const campo = visible && visible.querySelector('input:not([type=checkbox]), .ob-opcion.activo, .ob-dia, .ob-tiempo.activo, a.btn, button.btn');
  if (campo) setTimeout(() => campo.focus({ preventScroll: true }), 60);
}

// Todos los botones "Crear cuenta", "Crear mi plan", "Entrar"… abren el modal
document.querySelectorAll('[data-ir]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  cerrarMenu();
  abrirAcceso(a.dataset.ir);
}));
document.querySelectorAll('[data-vista-ir]').forEach(b => b.addEventListener('click', () => mostrarVista(b.dataset.vistaIr)));
$('acceso-cerrar').addEventListener('click', cerrarAcceso);
modal.addEventListener('mousedown', e => { if (e.target === modal) cerrarAcceso(); });

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!modal.hidden) cerrarAcceso();
    else if (!menu.hidden) cerrarMenu();
  }
  // Mantener el foco del teclado dentro del modal (accesibilidad)
  if (e.key === 'Tab' && !modal.hidden) {
    const enfocables = [...modal.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"]), summary')]
      .filter(el => !el.disabled && el.offsetParent !== null);
    if (!enfocables.length) return;
    const primero = enfocables[0], ultimo = enfocables[enfocables.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
});

// Enlaces directos: /#acceso abre "Entrar" (lo usa /verificar), /#registro abre el registro
function abrirSegunHash() {
  if (location.hash === '#acceso') abrirAcceso('login');
  if (location.hash === '#registro') abrirAcceso('registro');
}
abrirSegunHash();
window.addEventListener('hashchange', abrirSegunHash);

// ============================================================
//  10. ONBOARDING: 7 pasos → FitTrack genera tu semana
// ============================================================
const TOTAL_PASOS = 7;
const formRegistro = $('form-registro');
const errorRegistro = $('r-error');
const btnSiguiente = $('r-siguiente');
const ob = { objetivo: 'grasa', objetivos_dias: { grasa: [0, 2, 4] }, dias: [0, 2, 4], lugar: 'casa', nivel: 1, minutos: 20 };
let pasoActual = 1;

function marcarProgreso(n) {
  $('ob-progreso').querySelector('i').style.setProperty('--p', Math.min(100, (n / (TOTAL_PASOS + 1)) * 100) + '%');
}

function irAPaso(n, animar = true) {
  const haciaAtras = n < pasoActual;
  pasoActual = n;
  formRegistro.querySelectorAll('.ob-paso').forEach(p => {
    const visible = Number(p.dataset.paso) === n;
    p.hidden = !visible;
    if (visible && animar) {
      p.classList.toggle('atras', haciaAtras);
      p.style.animation = 'none'; p.getBoundingClientRect(); p.style.animation = '';
    }
  });
  $('ob-atras').hidden = n === 1;
  $('ob-contador').textContent = `Paso ${n} de ${TOTAL_PASOS}`;
  btnSiguiente.firstChild.textContent = n === TOTAL_PASOS ? 'Crear mi cuenta y mi semana ' : 'Continuar ';
  errorRegistro.textContent = '';
  marcarProgreso(n);
  cuerpoModal.scrollTop = 0;
  if (n === 5) pintarDiasObjetivos();
  if (animar) enfocarPrimero();
}
$('ob-atras').addEventListener('click', () => { if (pasoActual > 1) irAPaso(pasoActual - 1); });

// Objetivos: hasta cuatro, con días asignados por separado
const nombresDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const inicialesDias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
$('r-objetivo').addEventListener('click', e => {
  const opcion = e.target.closest('[data-objetivo]');
  if (!opcion) return;
  const objetivo = opcion.dataset.objetivo;
  if (ob.objetivos_dias[objetivo]) {
    if (Object.keys(ob.objetivos_dias).length === 1) {
      errorRegistro.textContent = 'Elige al menos un objetivo';
      return;
    }
    delete ob.objetivos_dias[objetivo];
  } else {
    if (Object.keys(ob.objetivos_dias).length === 4) {
      errorRegistro.textContent = 'Puedes elegir hasta 4 objetivos';
      return;
    }
    ob.objetivos_dias[objetivo] = [];
  }
  $('r-objetivo').querySelectorAll('[data-objetivo]').forEach(b => {
    const activo = Boolean(ob.objetivos_dias[b.dataset.objetivo]);
    b.classList.toggle('activo', activo);
    b.setAttribute('aria-pressed', String(activo));
  });
  errorRegistro.textContent = '';
  actualizarDiasObjetivos();
});

function actualizarDiasObjetivos() {
  ob.objetivo = Object.keys(ob.objetivos_dias)[0];
  ob.dias = [...new Set(Object.values(ob.objetivos_dias).flat())].sort((a, b) => a - b);
}

function pintarDiasObjetivos(foco = null) {
  actualizarDiasObjetivos();
  const asignados = new Set(ob.dias);
  $('r-dias-objetivo').innerHTML = Object.entries(ob.objetivos_dias).map(([objetivo, dias]) => `
    <section class="ob-asignacion">
      <h3>${NOMBRES_CORTOS[objetivo]}</h3>
      <div class="ob-dias" role="group" aria-label="Días para ${NOMBRES_CORTOS[objetivo]}">
        ${nombresDias.map((nombre, dia) => {
          const seleccionado = dias.includes(dia);
          const ocupado = asignados.has(dia) && !seleccionado;
          return `<button type="button" class="ob-dia ${seleccionado ? 'activo' : ''}" data-objetivo="${objetivo}" data-dia="${dia}" aria-pressed="${seleccionado}" aria-label="${nombre}" ${ocupado ? 'disabled title="Este día ya está asignado a otro objetivo"' : ''}><b>${inicialesDias[dia]}</b><span>${nombre}</span></button>`;
        }).join('')}
      </div>
    </section>`).join('');
  const total = ob.dias.length;
  $('r-dias-pista').textContent = `${total} ${total === 1 ? 'día' : 'días'} asignados · ${Object.keys(ob.objetivos_dias).length} ${Object.keys(ob.objetivos_dias).length === 1 ? 'objetivo' : 'objetivos'}`;
  if (foco) {
    const boton = $('r-dias-objetivo').querySelector(`[data-objetivo="${foco.objetivo}"][data-dia="${foco.dia}"]`);
    if (boton) boton.focus();
  }
}

// Opciones de una sola elección (lugar, nivel, tiempo)
function eleccionUnica(idContenedor, campo, convertir = v => v) {
  $(idContenedor).addEventListener('click', e => {
    const opcion = e.target.closest('[data-valor]');
    if (!opcion) return;
    $(idContenedor).querySelectorAll('[data-valor]').forEach(o => o.classList.toggle('activo', o === opcion));
    ob[campo] = convertir(opcion.dataset.valor);
  });
}
eleccionUnica('r-lugar', 'lugar');
eleccionUnica('r-nivel', 'nivel', Number);
eleccionUnica('r-minutos', 'minutos', Number);
// Sexo (opcional): solo marca la opción elegida; se lee al crear la cuenta
$('r-sexo').addEventListener('click', e => {
  const b = e.target.closest('[data-valor]');
  if (b) $('r-sexo').querySelectorAll('[data-valor]').forEach(o => o.classList.toggle('activo', o === b));
});

// Días: cada uno se asigna a un solo objetivo
$('r-dias-objetivo').addEventListener('click', e => {
  const boton = e.target.closest('[data-objetivo][data-dia]');
  if (!boton) return;
  const objetivo = boton.dataset.objetivo;
  const dia = Number(boton.dataset.dia);
  const dias = ob.objetivos_dias[objetivo];
  ob.objetivos_dias[objetivo] = dias.includes(dia) ? dias.filter(d => d !== dia) : [...dias, dia].sort((a, b) => a - b);
  errorRegistro.textContent = '';
  pintarDiasObjetivos({ objetivo, dia });
});

// Mostrar peso, meta y medidas solo si autoriza datos sensibles
const casillaSensibles = $('r-sensibles');
casillaSensibles.addEventListener('change', () => { $('r-datos-cuerpo').hidden = !casillaSensibles.checked; });

// Misma regla que el servidor: 8+ caracteres con letras y números
function revisarPassword(p) {
  if (p.length < 8) return 'La contraseña necesita mínimo 8 caracteres';
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) return 'La contraseña debe tener letras y números';
  return '';
}

// Revisa el paso actual. Devuelve un mensaje de error o '' si está bien.
function revisarPaso(n) {
  if (n === 1) {
    const nombre = $('r-nombre').value.trim(), email = $('r-email').value.trim(), pass = $('r-pass').value;
    if (!nombre || !email || !pass) return 'Completa nombre, correo y contraseña';
    if (!/^\S+@\S+\.\S+$/.test(email)) return 'Revisa el correo';
    const errorPass = revisarPassword(pass);
    if (errorPass) return errorPass;
    if (pass !== $('r-pass2').value) return 'Las contraseñas no coinciden';
  }
  if (n === 2 && !Object.keys(ob.objetivos_dias).length) return 'Elige al menos un objetivo';
  if (n === 5 && Object.values(ob.objetivos_dias).some(dias => !dias.length)) return 'Elige al menos un día para cada objetivo';
  if (n === 7) {
    const edad = $('r-edad').value;
    if (edad && (edad < 14 || edad > 100)) return 'Revisa la edad';
    if (!$('r-terminos').checked) return 'Debes aceptar los términos y la política de datos';
  }
  return '';
}

formRegistro.addEventListener('submit', async e => {
  e.preventDefault();
  const error = revisarPaso(pasoActual);
  if (error) { errorRegistro.textContent = error; return; }
  if (pasoActual < TOTAL_PASOS) return irAPaso(pasoActual + 1);
  await crearCuenta();
});

// Último paso: se crea la cuenta y FitTrack arma la semana
async function crearCuenta() {
  const valor = id => $(id).value;
  const sensibles = casillaSensibles.checked;
  const datos = {
    nombre: valor('r-nombre').trim(),
    email: valor('r-email').trim(),
    password: valor('r-pass'),
    ...ob,
    edad: valor('r-edad'),
    sexo: ($('r-sexo').querySelector('.activo') || {}).dataset?.valor || null,
    altura: valor('r-altura'),
    acepta_terminos: true,
    acepta_sensibles: sensibles
  };
  if (sensibles) ['peso', 'meta', 'cintura', 'cadera', 'pecho', 'brazo', 'muslo'].forEach(k => { datos[k === 'meta' ? 'meta_peso' : k] = valor('r-' + k); });

  btnSiguiente.disabled = true;
  let respuesta;
  try {
    respuesta = await api('/auth/registro', { method: 'POST', body: datos });
  } catch (err) {
    btnSiguiente.disabled = false;
    if (/correo|contraseña|cuenta/i.test(err.message)) irAPaso(1);
    errorRegistro.textContent = err.message;
    return;
  }
  btnSiguiente.disabled = false;
  await mostrarGenerando(respuesta);
}

// Animación "Armando tu semana…" mientras se pide la estructura al servidor
async function mostrarGenerando(respuesta) {
  generandoSemana = true;
  mostrarVista('ob-generando');
  montarAnimacion($('generando-figura'), 'Sentadilla', 'piernas', { velocidad: 1.4 });
  const pasos = [...$('generando-lista').children];
  pasos.forEach(li => li.classList.remove('listo'));

  const pedido = api('/plan/estructura', { method: 'POST', body: ob }).catch(() => null);
  for (const li of pasos) {
    await esperar(movimientoReducido ? 80 : 520);
    li.classList.add('listo');
  }
  const semana = await pedido;
  await esperar(300);
  generandoSemana = false;
  mostrarSemana(semana, respuesta);
}
const esperar = ms => new Promise(r => setTimeout(r, ms));

// Texto pequeño bajo cada día de entreno
function detalleEnfoque(dia, pref) {
  if (dia.enfoque === 'movilidad' && (dia.objetivo || pref.objetivo) !== 'movilidad') return 'Recuperación activa';
  const lugar = { casa: 'En casa', gimnasio: 'En el gimnasio', ambos: 'Casa o gimnasio' }[pref.lugar];
  return `${NOMBRES_CORTOS[dia.objetivo || pref.objetivo]} · ${lugar}`;
}

function mostrarSemana(semana, respuesta) {
  mostrarVista('ob-semana');
  const nombre = $('r-nombre').value.trim().split(' ')[0];
  $('ob-semana-titulo').textContent = `${nombre}, así queda tu semana`;
  $('ob-semana-lista').innerHTML = semana ? semana.dias.map((d, i) => `
    <li class="${d.entrena ? '' : 'libre'}" style="animation-delay:${i * 60}ms">
      <span class="dia">${d.nombre}</span>
      ${picto(d.picto)}
      <span><strong>${d.titulo}</strong><small>${d.entrena ? detalleEnfoque(d, semana.preferencias) : d.detalle}</small></span>
      <span class="min">${d.entrena ? d.minutos + '′' : '—'}</span>
    </li>`).join('') : '<li class="libre"><span></span><span></span><span><strong>Tu semana se arma al entrar a la app.</strong></span></li>';

  // Con confirmación de correo todavía no hay sesión
  const confirmar = respuesta && respuesta.confirmar;
  $('ob-confirmar').hidden = !confirmar;
  $('ob-ir-app').hidden = confirmar;
  $('ob-ir-login').hidden = !confirmar;
  if (confirmar) {
    $('ob-confirmar-texto').textContent = `Te enviamos un enlace a ${respuesta.email}. Tócalo para activar tu cuenta: tu semana te estará esperando.`;
    $('l-email').value = respuesta.email;
  }
  enfocarPrimero();
}

// ============================================================
//  11. LOGIN Y RECUPERAR CONTRASEÑA
// ============================================================
$('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const error = $('l-error');
  error.textContent = '';
  try {
    await api('/auth/login', { method: 'POST', body: { email: $('l-email').value, password: $('l-pass').value } });
    window.location.href = '/app';
  } catch (err) {
    error.textContent = err.message;
  }
});

$('ir-recuperar').addEventListener('click', () => {
  $('rc-email').value = $('l-email').value;
  mostrarVista('recuperar');
});

$('form-recuperar').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('rc-email').value.trim();
  const error = $('rc-error');
  error.textContent = '';
  if (!/^\S+@\S+\.\S+$/.test(email)) return (error.textContent = 'Revisa el correo');
  try {
    await api('/auth/recuperar', { method: 'POST', body: { email } });
    $('rv-titulo').textContent = 'Revisa tu correo';
    $('rv-texto').textContent = `Si ${email} tiene una cuenta, te llegará un enlace para crear una contraseña nueva.`;
    mostrarVista('revisa-correo');
  } catch (err) {
    error.textContent = err.message;
  }
});
