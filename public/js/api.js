// ============================================================
//  api.js — funciones compartidas por todas las páginas
// ============================================================

const MENSAJE_SIN_SERVIDOR = 'No hay conexión con el servidor de FitTrack. Ejecuta "npm start" y abre http://localhost:3000 (no abras el archivo index.html directamente ni con Live Server).';

// Hace una petición a la API y devuelve el JSON.
// Si hay error, lanza una excepción con el mensaje del servidor.
async function api(ruta, opciones = {}) {
  const config = { method: opciones.method || 'GET', headers: {}, credentials: 'same-origin' };

  if (opciones.body instanceof FormData) {
    config.body = opciones.body; // para subir fotos (el navegador pone el header solo)
  } else if (opciones.body) {
    config.headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(opciones.body);
  }

  // Si la página se abrió como archivo (doble clic en index.html), no hay servidor
  if (location.protocol === 'file:') throw new Error(MENSAJE_SIN_SERVIDOR);

  let respuesta;
  try {
    respuesta = await fetch('/api' + ruta, config);
  } catch (e) {
    // "Failed to fetch": el servidor está apagado o no se puede alcanzar
    throw new Error(MENSAJE_SIN_SERVIDOR);
  }

  // Si la respuesta no es JSON, esta dirección no es el servidor de FitTrack (ej: Live Server)
  const esJSON = (respuesta.headers.get('content-type') || '').includes('application/json');
  if (!esJSON) throw new Error(MENSAJE_SIN_SERVIDOR);

  const datos = await respuesta.json().catch(() => ({}));

  // Si la sesión venció, volver a la página de inicio
  if (respuesta.status === 401 && !ruta.startsWith('/auth')) {
    window.location.href = '/';
    throw new Error('Sesión vencida');
  }
  if (!respuesta.ok) {
    const error = new Error(datos.error || 'Algo salió mal');
    error.codigo = datos.codigo;
    throw error;
  }
  return datos;
}

// Muestra un aviso flotante abajo de la pantalla
function avisar(texto, tipo = 'ok') {
  const caja = document.getElementById('avisos');
  if (!caja) return;
  const aviso = document.createElement('div');
  aviso.className = 'aviso' + (tipo === 'error' ? ' error' : '');
  aviso.textContent = texto;
  caja.appendChild(aviso);
  setTimeout(() => aviso.remove(), 3400);
}

// ---------- Textos que se repiten ----------
const NOMBRES_OBJETIVO = { grasa: 'Reducir grasa corporal', musculo: 'Ganar músculo', resistencia: 'Mejorar resistencia', movilidad: 'Ganar movilidad' };
const NOMBRES_CORTOS = { grasa: 'Quemar grasa', musculo: 'Músculo', resistencia: 'Resistencia', movilidad: 'Movilidad' };
const NOMBRES_NIVEL = { 1: 'Principiante', 2: 'Intermedio', 3: 'Avanzado' };
const NOMBRES_GRUPO = { piernas: 'Piernas', empuje: 'Empuje', tiron: 'Espalda', core: 'Core', cardio: 'Cardio', movilidad: 'Movilidad' };
const NOMBRES_COMIDA = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', cena: 'Cena', snack: 'Snacks' };

// ---------- Fechas ----------
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGO = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// "2026-09-26" → "26 sep 2026"
function fechaCorta(texto) {
  const [a, m, d] = texto.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`;
}
// "2026-09-26" → "26 sep"
function diaMes(texto) {
  const [, m, d] = texto.split('-');
  return `${Number(d)} ${MESES[Number(m) - 1]}`;
}

// Fecha "YYYY-MM-DD" en hora local
function aTexto(fecha) { return fecha.toLocaleDateString('en-CA'); }
function hoyTexto() { return aTexto(new Date()); }
function sumarDias(texto, dias) {
  const d = new Date(texto + 'T12:00:00');
  d.setDate(d.getDate() + dias);
  return aTexto(d);
}
function lunesDe(texto) {
  const d = new Date(texto + 'T12:00:00');
  return sumarDias(texto, -((d.getDay() + 6) % 7));
}

// 90 segundos → "1:30"
function mmss(segundos) {
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`;
}

// Evita que un texto del usuario se interprete como HTML (protección XSS)
function escapar(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

// Formato colombiano: 1234.5 → "1.234,5"
function numero(valor, decimales = 0) {
  return Number(valor).toLocaleString('es-CO', { maximumFractionDigits: decimales });
}

// ---------- Íconos del archivo /img/iconos.svg ----------
function icono(nombre, clase = '') {
  return `<svg class="ic ${clase}" aria-hidden="true"><use href="/img/iconos.svg#i-${nombre}"/></svg>`;
}
// Pictograma de ejercicio (piernas, core…) o de comida (desayuno, cena…)
function picto(id) {
  return `<svg class="picto" aria-hidden="true"><use href="/img/iconos.svg#${id}"/></svg>`;
}
