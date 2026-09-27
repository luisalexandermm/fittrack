// ============================================================
//  app.js — arranque de la app, navegación y ventana modal
// ============================================================

let perfil = null; // datos del usuario, los usan todas las secciones

// Qué función carga cada vista cuando se abre
const CARGAR_VISTA = {
  inicio: cargarInicio,
  rutinas: cargarRutinas,
  progreso: cargarProgreso,
  nutricion: cargarNutricion,
  calendario: cargarCalendario,
  perfil: cargarPerfil
};

// Muestra la vista según el # de la URL (ej: /app#progreso)
function navegar() {
  const nombre = location.hash.replace('#', '') || 'inicio';
  const vista = CARGAR_VISTA[nombre] ? nombre : 'inicio';
  if (modal.classList.contains('abierto')) cerrarModal(); // no dejar ventanas abiertas al cambiar de sección

  document.querySelectorAll('.vista').forEach(v => v.classList.toggle('activa', v.id === 'vista-' + vista));
  document.querySelectorAll('[data-vista]').forEach(a => {
    const activo = a.dataset.vista === vista;
    a.classList.toggle('activo', activo);
    if (activo) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
  CARGAR_VISTA[vista]();
}

// ---------- Selección única (opciones, filtros) ----------
function seleccionUnica(idContenedor, alCambiar) {
  document.getElementById(idContenedor).addEventListener('click', e => {
    const opcion = e.target.closest('[data-valor]');
    if (!opcion) return;
    marcarOpcion(idContenedor, opcion.dataset.valor);
    if (alCambiar) alCambiar(opcion.dataset.valor);
  });
}
function marcarOpcion(idContenedor, valor) {
  document.querySelectorAll(`#${idContenedor} [data-valor]`).forEach(o => o.classList.toggle('activo', o.dataset.valor === String(valor)));
}
function valorSeleccionado(idContenedor) {
  const activo = document.querySelector(`#${idContenedor} .activo`);
  return activo ? activo.dataset.valor : null;
}

// ---------- Pestañas (Peso/Medidas/Fotos, Plan/Recetas/Consejos) ----------
function prepararPestanas(idPestanas, alCambiar) {
  const pestanas = document.getElementById(idPestanas);
  const vista = pestanas.closest('.vista');
  pestanas.addEventListener('click', e => {
    const boton = e.target.closest('[data-panel]');
    if (!boton) return;
    pestanas.querySelectorAll('.pestana').forEach(p => {
      p.classList.toggle('activo', p === boton);
      p.setAttribute('aria-selected', p === boton);
    });
    vista.querySelectorAll('.panel').forEach(p => { p.hidden = p.dataset.panel !== boton.dataset.panel; });
    if (alCambiar) alCambiar(boton.dataset.panel);
  });
}

// ---------- Ventana modal ----------
const modal = document.getElementById('modal');
let elementoAntesDelModal = null;

function abrirModal(html) {
  elementoAntesDelModal = document.activeElement;
  document.getElementById('modal-contenido').innerHTML = html;
  modal.classList.add('abierto');
  document.body.style.overflow = 'hidden';
  const primero = modal.querySelector('input, select, button:not([data-cerrar-modal])');
  if (primero) primero.focus();
}
function cerrarModal() {
  modal.classList.remove('abierto');
  document.body.style.overflow = '';
  if (elementoAntesDelModal) elementoAntesDelModal.focus();
}
modal.addEventListener('click', e => {
  if (e.target === modal || e.target.closest('[data-cerrar-modal]')) cerrarModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('abierto')) cerrarModal();
});

// ---------- Datos del usuario en la interfaz ----------
function pintarUsuario() {
  const inicial = perfil.nombre.trim().charAt(0).toUpperCase();
  document.querySelectorAll('[data-avatar]').forEach(el => { el.textContent = inicial; });
  document.querySelectorAll('[data-nombre]').forEach(el => { el.textContent = perfil.nombre; });
  document.querySelectorAll('[data-nombre-corto]').forEach(el => { el.textContent = perfil.nombre.split(' ')[0]; });
  document.querySelectorAll('[data-nivel]').forEach(el => { el.textContent = 'Nivel ' + NOMBRES_NIVEL[perfil.nivel].toLowerCase(); });
  document.querySelectorAll('[data-nivel-largo]').forEach(el => { el.textContent = `Nivel ${NOMBRES_NIVEL[perfil.nivel].toLowerCase()} · ${NOMBRES_CORTOS[perfil.objetivo]}`; });
}

async function recargarPerfil() {
  perfil = await api('/perfil');
  pintarUsuario();
}

// ---------- Arranque ----------
async function iniciarApp() {
  try {
    await recargarPerfil();
  } catch (err) {
    return; // api() ya redirige al inicio si no hay sesión
  }
  prepararRutinas();
  prepararProgreso();
  prepararFotos();
  prepararNutricion();
  prepararCalendario();
  prepararPerfil();

  window.addEventListener('hashchange', navegar);
  navegar();
}

iniciarApp();
