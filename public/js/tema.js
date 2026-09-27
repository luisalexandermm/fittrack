// ============================================================
//  tema.js — modo claro (por defecto) / modo oscuro
//  Se carga en el <head> para aplicar el tema ANTES de pintar la página
//  (así no hay un "parpadeo" de colores al cargar).
// ============================================================

(function () {
  let tema = 'claro';
  try { tema = localStorage.getItem('fittrack-tema') || 'claro'; } catch (e) {}
  document.documentElement.dataset.tema = tema;
})();

function cambiarTema() {
  const nuevo = document.documentElement.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
  document.documentElement.dataset.tema = nuevo;
  try { localStorage.setItem('fittrack-tema', nuevo); } catch (e) {}
  document.querySelectorAll('[data-tema-texto]').forEach(el => {
    el.textContent = nuevo === 'oscuro' ? 'Oscuro' : 'Claro';
  });
}

// Cualquier elemento con class="btn-tema" cambia el tema
document.addEventListener('click', e => {
  if (e.target.closest('.btn-tema')) cambiarTema();
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-tema-texto]').forEach(el => {
    el.textContent = document.documentElement.dataset.tema === 'oscuro' ? 'Oscuro' : 'Claro';
  });
});
