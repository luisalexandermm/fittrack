// ============================================================
//  landing.js — página de inicio
//   0. Servidor y sesión      6. Contadores animados
//   1. Foto del hero          7. Linterna e imán en tarjetas/botones
//   2. Letras y parallax      8. Scroll: pasos, franja, barra de avance
//   3. Menú completo          9. Demo: rutina en vivo
//   4. Barra fija            10. Vitrina de la app (pestañas automáticas)
//   5. Aparición al scroll   11. Objetivos → demo
//  Al final: registro, login y recuperar contraseña.
// ============================================================

document.documentElement.classList.add('js-listo'); // activa las animaciones de aparición
const movimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const punteroFino = window.matchMedia('(pointer: fine)').matches;

// Si Supabase mandó el enlace del correo a la página de inicio (y no a /verificar),
// pasamos los datos del enlace a /verificar para confirmar la cuenta o cambiar la contraseña.
if (/(access_token|error_code)=/.test(location.hash) || new URLSearchParams(location.search).has('code')) {
  window.location.replace('/verificar' + location.search + location.hash);
}

// ---------- 0. ¿Hay servidor? ¿Ya tiene sesión? ----------
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
  .then(() => { foto.hidden = false; document.getElementById('hero-marcador').hidden = true; })
  .catch(() => { /* todavía no hay foto */ });

// ---------- 2. Letras de FITTRACK y parallax ----------
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

// ---------- 3. Menú a pantalla completa (celular y tablet) ----------
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

// ---------- 4. Barra fija: aparece cuando el hero sale de la pantalla ----------
const navFija = document.getElementById('nav-fija');
new IntersectionObserver(([entrada]) => {
  const visible = !entrada.isIntersecting;
  navFija.classList.toggle('visible', visible);
  navFija.setAttribute('aria-hidden', String(!visible));
  navFija.querySelectorAll('a, button').forEach(el => { el.tabIndex = visible ? 0 : -1; });
}, { threshold: 0.05 }).observe(document.getElementById('arriba'));

// El enlace de la sección visible queda marcado
const enlacesFija = navFija.querySelectorAll('.nav-fija-enlaces a');
new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (!e.isIntersecting) return;
    enlacesFija.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' }).observe(document.getElementById('como'));
['demo', 'app', 'objetivos', 'acceso'].forEach(id => {
  const s = document.getElementById(id);
  if (s) new IntersectionObserver(entradas => entradas.forEach(e => {
    if (e.isIntersecting) enlacesFija.forEach(a => a.classList.toggle('activo', a.getAttribute('href') === '#' + id));
  }), { rootMargin: '-45% 0px -50% 0px' }).observe(s);
});

// ---------- 5. Aparición suave al hacer scroll ----------
const observadorRevelar = new IntersectionObserver(entradas => {
  entradas.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visto'); observadorRevelar.unobserve(e.target); }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.revelar').forEach(el => observadorRevelar.observe(el));

// ---------- 6. Contadores: cuentan desde 0 cuando aparecen ----------
function contar(el) {
  const final = Number(el.dataset.contar);
  if (movimientoReducido) { el.textContent = final; return; }
  const inicio = performance.now(), duracion = 1400;
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

// ---------- 7. Linterna (brillo que sigue al mouse) e imán en botones ----------
if (punteroFino && !movimientoReducido) {
  document.querySelectorAll('.foco').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
  // El botón se acerca un poquito al cursor
  document.querySelectorAll('.iman').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      el.style.transform = `translate(${x}px, ${y}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
}

// ---------- 8. Efectos ligados al scroll ----------
const barraNav = document.getElementById('nav-progreso');
const listaPasos = document.getElementById('pasos-linea');
const rellenoPasos = document.getElementById('pasos-relleno');
const lineasFranja = document.querySelectorAll('[data-mover]');
let esperandoCuadro = false;

function alHacerScroll() {
  esperandoCuadro = false;
  const alto = window.innerHeight;
  // Barra de avance de toda la página
  const total = document.documentElement.scrollHeight - alto;
  barraNav.style.setProperty('--avance', total > 0 ? (window.scrollY / total).toFixed(3) : 0);

  // Línea de los 3 pasos: se llena mientras la sección pasa por la pantalla
  const r = listaPasos.getBoundingClientRect();
  const avance = Math.min(Math.max((alto * 0.8 - r.top) / (r.height + alto * 0.2), 0), 1);
  rellenoPasos.parentElement.style.setProperty('--avance', avance.toFixed(3));

  // Franja: las dos líneas se mueven en sentidos contrarios
  if (!movimientoReducido) {
    lineasFranja.forEach(linea => {
      const rr = linea.getBoundingClientRect();
      const desplazamiento = (rr.top - alto / 2) * 0.35 * Number(linea.dataset.mover);
      linea.style.setProperty('--x', desplazamiento.toFixed(1) + 'px');
    });
  }
}
window.addEventListener('scroll', () => {
  if (!esperandoCuadro) { esperandoCuadro = true; requestAnimationFrame(alHacerScroll); }
}, { passive: true });
alHacerScroll();

// ---------- 9. Demo: arma una rutina en vivo (sin registrarse) ----------
// Mismas reglas que el generador del servidor (rutas/rutinas.js), en versión corta.
// [nombre, grupo, nivel mínimo, objetivos: g=grasa m=músculo r=resistencia v=movilidad]
const EJERCICIOS_DEMO = [["Sentadilla","piernas",1,"gmr"],["Zancada alterna","piernas",1,"gmr"],["Puente de glúteo","piernas",1,"mrv"],["Sentadilla sumo con pausa","piernas",2,"mr"],["Sentadilla con salto","piernas",2,"gr"],["Zancada búlgara (en silla)","piernas",2,"m"],["Sentadilla a una pierna (pistol asistida)","piernas",3,"m"],["Zancada con salto","piernas",3,"gr"],["Sentadilla isométrica en pared","piernas",1,"mr"],["Flexiones con rodillas","empuje",1,"gmr"],["Flexiones inclinadas (en mesa)","empuje",1,"mr"],["Flexiones","empuje",2,"gmr"],["Fondos en silla","empuje",2,"m"],["Flexiones pica (hombro)","empuje",2,"m"],["Flexiones diamante","empuje",3,"m"],["Flexiones explosivas","empuje",3,"gm"],["Superman","tiron",1,"mrv"],["Remo con toalla en puerta","tiron",1,"m"],["Nadador (brazos Y-T-W)","tiron",2,"mv"],["Remo invertido bajo mesa","tiron",3,"m"],["Plancha","core",1,"mrv"],["Bicho muerto (dead bug)","core",1,"mv"],["Crunch abdominal","core",1,"gm"],["Escaladores","core",2,"gr"],["Plancha lateral","core",2,"mr"],["Bicicleta abdominal","core",2,"gm"],["Hollow hold","core",3,"mr"],["Plancha con toque de hombro","core",2,"mr"],["Jumping jacks","cardio",1,"gr"],["Rodillas arriba","cardio",1,"gr"],["Boxeo de sombra","cardio",1,"gr"],["Skater (patinador)","cardio",2,"gr"],["Burpees","cardio",2,"gr"],["Burpee con flexión","cardio",3,"gr"],["Saltos de tijera rápidos","cardio",3,"gr"],["Saludo al sol","movilidad",1,"v"],["Estocada con rotación","movilidad",1,"v"],["Perro boca abajo a cobra","movilidad",1,"v"],["Sentadilla profunda sostenida","movilidad",2,"v"],["Rotación torácica en 4 apoyos","movilidad",1,"v"],["Puente con extensión de pierna","movilidad",2,"vm"]];
const CONFIG_DEMO = {
  grasa: { t: 40, d: 20, nombre: 'Quema total', letra: 'g' },
  musculo: { t: 45, d: 30, nombre: 'Fuerza en casa', letra: 'm' },
  resistencia: { t: 50, d: 15, nombre: 'Circuito resistencia', letra: 'r' },
  movilidad: { t: 45, d: 10, nombre: 'Flow de movilidad', letra: 'v' }
};
const PICTO_DEMO = { piernas: 'p-piernas', empuje: 'p-empuje', tiron: 'p-tiron', core: 'p-core', cardio: 'p-cardio', movilidad: 'p-movilidad' };
const GRUPO_DEMO = { piernas: 'Piernas', empuje: 'Empuje', tiron: 'Espalda', core: 'Core', cardio: 'Cardio', movilidad: 'Movilidad' };
const demo = { objetivo: 'grasa', nivel: 1, minutos: 25, lista: [] };

function mezclar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Elige ejercicios de grupos distintos (uno de cada grupo por turnos)
function elegirDemo(cantidad) {
  const conf = CONFIG_DEMO[demo.objetivo];
  const sirven = EJERCICIOS_DEMO.filter(e => e[2] <= demo.nivel && e[3].includes(conf.letra));
  const grupos = {};
  // Primero los del nivel exacto (más reto), luego los más fáciles
  mezclar(sirven).sort((a, b) => (b[2] === demo.nivel) - (a[2] === demo.nivel)).forEach(e => { (grupos[e[1]] ||= []).push(e); });
  const elegidos = [];
  const nombres = mezclar(Object.keys(grupos));
  while (elegidos.length < cantidad && nombres.some(g => grupos[g].length)) {
    for (const g of nombres) if (grupos[g].length && elegidos.length < cantidad) elegidos.push(grupos[g].shift());
  }
  return elegidos;
}

function animarNumero(id, valor) {
  const el = document.getElementById(id);
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

function calcularDemo(nuevaLista = true) {
  const conf = CONFIG_DEMO[demo.objetivo];
  let t = conf.t, d = conf.d;
  if (demo.nivel === 1) { t -= 10; d += 10; }
  if (demo.nivel === 3) { t += 10; d = Math.max(10, d - 5); }

  let porRonda = demo.nivel + 3;
  if (demo.minutos <= 15) porRonda = Math.min(porRonda, 4);
  if (nuevaLista || demo.lista.length !== porRonda) demo.lista = elegirDemo(porRonda);

  const suaves = ((demo.minutos >= 30 ? 4 : 3) + 3) * 40;
  const ronda = demo.lista.length * (t + d);
  const rondas = Math.max(1, Math.floor((demo.minutos * 60 - suaves + 60) / (ronda + 60)));
  const total = suaves + rondas * ronda + (rondas - 1) * 60;

  document.getElementById('d-titulo').textContent = conf.nombre;
  animarNumero('d-trabajo', t);
  animarNumero('d-descanso', d);
  animarNumero('d-rondas', rondas);
  animarNumero('d-duracion', Math.round(total / 60));
  document.getElementById('d-barra-on').style.flexBasis = (t / (t + d)) * 100 + '%';
  document.getElementById('d-barra-off').style.flexBasis = (d / (t + d)) * 100 + '%';

  document.getElementById('d-lista').innerHTML = demo.lista.map((e, i) => `
    <li style="animation-delay:${i * 60}ms">
      <span class="n">${i + 1}</span>
      <svg class="t" aria-hidden="true"><use href="img/iconos.svg#${PICTO_DEMO[e[1]]}"/></svg>
      <span><strong>${e[0]}</strong><small>${GRUPO_DEMO[e[1]]}</small></span>
      <span class="seg">${t}s</span>
    </li>`).join('');
}

function prepararChips(id, alCambiar) {
  const caja = document.getElementById(id);
  caja.addEventListener('click', e => {
    const chip = e.target.closest('[data-valor]');
    if (!chip) return;
    caja.querySelectorAll('.chip-demo').forEach(c => c.classList.toggle('activo', c === chip));
    alCambiar(chip.dataset.valor);
  });
}
function elegirObjetivoDemo(valor) {
  demo.objetivo = valor;
  document.querySelectorAll('#d-objetivo .chip-demo').forEach(c => c.classList.toggle('activo', c.dataset.valor === valor));
  calcularDemo();
}
prepararChips('d-objetivo', elegirObjetivoDemo);
prepararChips('d-nivel', v => { demo.nivel = Number(v); calcularDemo(); });
const rangoDemo = document.getElementById('d-minutos');
rangoDemo.addEventListener('input', () => {
  demo.minutos = Number(rangoDemo.value);
  document.getElementById('d-minutos-valor').textContent = rangoDemo.value;
  calcularDemo(false);
});
document.getElementById('d-mezclar').addEventListener('click', () => calcularDemo());
calcularDemo();

// Mini temporizador de 10 segundos con el primer ejercicio
let relojDemo = null;
document.getElementById('d-probar').addEventListener('click', () => {
  const caja = document.getElementById('d-reloj');
  const trazo = document.getElementById('d-trazo');
  const CIRC = 2 * Math.PI * 52;
  let quedan = 10;
  clearInterval(relojDemo);
  caja.hidden = false;
  document.getElementById('d-ejercicio').textContent = demo.lista[0] ? demo.lista[0][0] : 'Sentadilla';
  document.getElementById('d-cuenta').textContent = quedan;
  trazo.style.transition = 'none'; trazo.style.strokeDashoffset = 0; trazo.getBoundingClientRect(); trazo.style.transition = '';
  trazo.style.strokeDashoffset = CIRC / 10;
  relojDemo = setInterval(() => {
    quedan--;
    document.getElementById('d-cuenta').textContent = quedan;
    trazo.style.strokeDashoffset = CIRC * Math.min((10 - quedan + 1) / 10, 1);
    if (quedan <= 0) {
      clearInterval(relojDemo);
      document.getElementById('d-ejercicio').textContent = '¡Así se siente! Crea tu cuenta para la rutina completa.';
      setTimeout(() => { caja.hidden = true; }, 2200);
    }
  }, 1000);
});
document.getElementById('d-reloj').addEventListener('click', () => { clearInterval(relojDemo); document.getElementById('d-reloj').hidden = true; });

// ---------- 10. Vitrina de la app: cambia sola cada 5 segundos ----------
const vitrina = document.querySelector('.vitrina');
const tabs = document.querySelectorAll('.vitrina-tab');
const pantallas = document.querySelectorAll('.tel-pantalla');
const telefono = document.getElementById('telefono');
let pantallaActual = 0, temporizadorVitrina = null;

function mostrarPantalla(n) {
  pantallaActual = n;
  tabs.forEach((t, i) => { t.classList.toggle('activo', i === n); t.setAttribute('aria-selected', i === n); });
  pantallas.forEach((p, i) => p.classList.toggle('activa', i === n));
  // reinicia la barrita de tiempo
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
// Solo corre cuando la sección está a la vista
new IntersectionObserver(([e]) => { if (e.isIntersecting) reiniciarVitrina(); else clearTimeout(temporizadorVitrina); }, { threshold: 0.3 }).observe(vitrina);

// El teléfono se inclina siguiendo el mouse
if (punteroFino && !movimientoReducido) {
  const escena = document.getElementById('telefono-escena');
  escena.addEventListener('mousemove', e => {
    const r = escena.getBoundingClientRect();
    telefono.style.setProperty('--ry', ((e.clientX - r.left) / r.width - 0.5) * 24 + 'deg');
    telefono.style.setProperty('--rx', (0.5 - (e.clientY - r.top) / r.height) * 14 + 'deg');
  });
  escena.addEventListener('mouseleave', () => { telefono.style.removeProperty('--ry'); telefono.style.removeProperty('--rx'); });
}

// ---------- 11. Objetivos: al tocar uno, la demo lo carga ----------
document.querySelectorAll('[data-objetivo]').forEach(boton => {
  boton.addEventListener('click', () => {
    elegirObjetivoDemo(boton.dataset.objetivo);
    document.getElementById('demo').scrollIntoView({ behavior: movimientoReducido ? 'auto' : 'smooth' });
  });
});

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
