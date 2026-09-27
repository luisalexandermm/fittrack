// ============================================================
//  cookies.js — aviso de cookies (se muestra una sola vez)
//  FitTrack solo usa una cookie ESENCIAL (la sesión) y guarda el
//  tema claro/oscuro en el navegador. No hay publicidad ni rastreo,
//  por eso el aviso es informativo y no necesita "rechazar".
// ============================================================

(function () {
  const CLAVE = 'fittrack-aviso-cookies';
  let yaVisto = false;
  try { yaVisto = localStorage.getItem(CLAVE) === 'visto'; } catch (e) {}
  if (yaVisto) return;

  function mostrar() {
    const banner = document.createElement('aside');
    banner.className = 'banner-cookies';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Aviso de cookies');
    banner.innerHTML = `
      <span class="rotulo" style="color:var(--sobre-noche-2)">Cookies</span>
      <p>Usamos solo cookies <strong style="color:var(--sobre-noche)">esenciales</strong> para mantener tu sesión iniciada
      y guardamos tu preferencia de tema en tu navegador. No usamos cookies de publicidad ni de rastreo.
      <a href="/cookies">Leer la política</a>.</p>
      <div class="fila">
        <button class="btn btn-lima btn-sm" type="button" data-cerrar>Entendido</button>
        <a class="btn btn-linea btn-sm" href="/privacidad">Privacidad</a>
      </div>`;
    banner.querySelector('[data-cerrar]').addEventListener('click', () => {
      try { localStorage.setItem(CLAVE, 'visto'); } catch (e) {}
      banner.remove();
    });
    document.body.appendChild(banner);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mostrar);
  else mostrar();
})();
