// ============================================================
//  perfil.js — perfil, configuración, privacidad y contraseña
// ============================================================

function prepararPerfil() {
  document.querySelector('.menu-perfil').addEventListener('click', e => {
    const boton = e.target.closest('[data-abrir]');
    if (!boton) return;
    ({ configuracion: abrirConfiguracion, privacidad: abrirPrivacidad, seguridad: abrirSeguridad })[boton.dataset.abrir]();
  });
  document.getElementById('btn-salir').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

async function cargarPerfil() {
  const r = await api('/resumen');
  const stat = (valor, unidad, etiqueta) => `
    <div><span class="cifra">${valor ?? '—'}${valor != null ? `<small style="font-size:.9rem;color:var(--piedra)"> ${unidad}</small>` : ''}</span><span class="rotulo">${etiqueta}</span></div>`;

  document.getElementById('perfil-stats').innerHTML =
    stat(r.peso ? numero(r.peso.actual, 1) : null, 'kg', 'Peso actual') +
    stat(r.cintura != null ? numero(r.cintura, 1) : null, 'cm', 'Cintura') +
    stat(r.grasa != null ? numero(r.grasa, 1) : null, '%', 'Grasa corporal');

  document.getElementById('perfil-objetivo').innerHTML = `
    <span class="tile">${icono('objetivo')}</span>
    <div><strong>${NOMBRES_OBJETIVO[perfil.objetivo]}</strong><small>${perfil.meta_peso ? `Meta: ${numero(perfil.meta_peso, 1)} kg` : `${perfil.meta_semanal} días por semana · ${perfil.minutos} min`}</small></div>
    ${icono('chevron', 'chev')}`;
}

// ---------- Configuración ----------
function abrirConfiguracion() {
  const opcion = (valor, texto, actual) => `<button type="button" class="opcion ${String(valor) === String(actual) ? 'activo' : ''}" data-valor="${valor}">${texto}</button>`;
  abrirModal(`
    <form class="form-modal" id="form-config">
      <span class="rotulo">Configuración</span>
      <h2>Tu perfil</h2>
      <div class="fila-2">
        <div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" type="text" maxlength="60" value="${escapar(perfil.nombre)}"></div>
        <div class="campo"><label for="c-altura">Altura (para el IMC)</label><div class="con-unidad" data-u="cm"><input id="c-altura" type="number" inputmode="numeric" value="${perfil.altura_cm || ''}"></div></div>
      </div>
      <div class="campo"><span class="rotulo">Objetivo</span>
        <div class="opciones" id="c-objetivo">${opcion('grasa', 'Quemar grasa', perfil.objetivo)}${opcion('musculo', 'Músculo', perfil.objetivo)}${opcion('resistencia', 'Resistencia', perfil.objetivo)}${opcion('movilidad', 'Movilidad', perfil.objetivo)}</div>
      </div>
      <div class="campo"><span class="rotulo">Nivel</span>
        <div class="opciones" id="c-nivel">${opcion(1, 'Principiante', perfil.nivel)}${opcion(2, 'Intermedio', perfil.nivel)}${opcion(3, 'Avanzado', perfil.nivel)}</div>
      </div>
      <div class="campo"><span class="rotulo">Días de entreno por semana</span>
        <div class="opciones" id="c-meta">${[2, 3, 4, 5, 6].map(n => opcion(n, n, perfil.meta_semanal)).join('')}</div>
      </div>
      <div class="campo"><span class="rotulo">Minutos por sesión: <b class="cifra acento" id="c-minutos-valor">${perfil.minutos}</b></span>
        <input type="range" id="c-minutos" min="10" max="60" step="5" value="${perfil.minutos}" aria-label="Minutos por sesión">
      </div>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Guardar</button>
      </div>
    </form>`);

  ['c-objetivo', 'c-nivel', 'c-meta'].forEach(id => seleccionUnica(id));
  const rango = document.getElementById('c-minutos');
  rango.addEventListener('input', () => { document.getElementById('c-minutos-valor').textContent = rango.value; });

  document.getElementById('form-config').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('/perfil', {
        method: 'PUT',
        body: {
          nombre: document.getElementById('c-nombre').value,
          altura_cm: document.getElementById('c-altura').value,
          objetivo: valorSeleccionado('c-objetivo'),
          nivel: valorSeleccionado('c-nivel'),
          meta_semanal: valorSeleccionado('c-meta'),
          minutos: rango.value
        }
      });
      await recargarPerfil();
      configuradorListo = false; // Rutinas usará los nuevos valores
      cerrarModal();
      avisar('Perfil actualizado');
      cargarPerfil();
    } catch (err) {
      avisar(err.message, 'error');
    }
  });
}

// ---------- Privacidad y datos (Habeas Data) ----------
function abrirPrivacidad() {
  const fecha = f => f ? fechaCorta(aTexto(new Date(f))) : '—'; // convierte de UTC a la hora local
  abrirModal(`
    <div class="form-modal">
      <span class="rotulo">Privacidad y datos</span>
      <h2>Tus datos, tus reglas</h2>

      <div class="bloque-privacidad">
        <strong>Datos sensibles (peso, medidas y fotos)</strong>
        <p>${perfil.sensibles_ok
          ? `Autorizaste guardarlos el ${fecha(perfil.sensibles_fecha)}. Si retiras la autorización, no se podrán guardar nuevos registros; los que ya tienes siguen ahí hasta que los borres.`
          : 'No has autorizado guardar estos datos. Sin autorización no se registran peso, medidas ni fotos.'}</p>
        <button type="button" class="btn ${perfil.sensibles_ok ? 'btn-linea' : 'btn-lima'} btn-sm" id="btn-cambiar-autorizacion">
          ${perfil.sensibles_ok ? 'Retirar autorización' : 'Autorizar'}
        </button>
      </div>

      <div class="bloque-privacidad">
        <strong>Descargar mis datos</strong>
        <p>Un archivo con tu perfil, sesiones, medidas y lista de fotos.</p>
        <a class="btn btn-linea btn-sm" href="/api/cuenta/exportar" download>${icono('descargar', 'ic-sm')}Descargar (JSON)</a>
      </div>

      <div class="bloque-privacidad">
        <strong>Borrar mi cuenta</strong>
        <p>Se eliminan para siempre tu cuenta, sesiones, medidas, rutinas y fotos. No se puede deshacer.</p>
        <form id="form-borrar-cuenta" class="form-modal" style="gap:10px">
          <div class="campo"><label for="borrar-pass">Escribe tu contraseña para confirmar</label><input id="borrar-pass" type="password" autocomplete="current-password"></div>
          <button type="submit" class="btn btn-linea btn-peligro btn-sm">${icono('basura', 'ic-sm')}Borrar mi cuenta</button>
        </form>
      </div>

      <p class="tenue" style="font-size:.85rem">Aceptaste los términos el ${fecha(perfil.terminos_fecha)}. <a href="/privacidad" target="_blank">Política de tratamiento de datos</a></p>
    </div>`);

  document.getElementById('btn-cambiar-autorizacion').addEventListener('click', async () => {
    if (!perfil.sensibles_ok) { cerrarModal(); return abrirAutorizacion(); }
    if (!confirm('¿Retirar la autorización para guardar peso, medidas y fotos?')) return;
    await api('/cuenta/autorizacion', { method: 'PUT', body: { sensibles: false } });
    await recargarPerfil();
    cerrarModal();
    avisar('Autorización retirada');
  });

  document.getElementById('form-borrar-cuenta').addEventListener('submit', async e => {
    e.preventDefault();
    if (!confirm('Última confirmación: ¿borrar tu cuenta y todos tus datos para siempre?')) return;
    try {
      await api('/cuenta', { method: 'DELETE', body: { password: document.getElementById('borrar-pass').value } });
      window.location.href = '/';
    } catch (err) {
      avisar(err.message, 'error');
    }
  });
}

// ---------- Cambiar contraseña ----------
function abrirSeguridad() {
  abrirModal(`
    <form class="form-modal" id="form-password">
      <span class="rotulo">Seguridad</span>
      <h2>Cambiar contraseña</h2>
      <div class="campo"><label for="p-actual">Contraseña actual</label><input id="p-actual" type="password" autocomplete="current-password"></div>
      <div class="campo"><label for="p-nueva">Nueva contraseña</label><input id="p-nueva" type="password" autocomplete="new-password" placeholder="8+ caracteres, letras y números"></div>
      <div class="campo"><label for="p-repetir">Repite la nueva</label><input id="p-repetir" type="password" autocomplete="new-password"></div>
      <p class="error-form" id="p-error" role="alert"></p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Cambiar</button>
      </div>
    </form>`);
  document.getElementById('form-password').addEventListener('submit', async e => {
    e.preventDefault();
    const nueva = document.getElementById('p-nueva').value;
    if (nueva !== document.getElementById('p-repetir').value) return (document.getElementById('p-error').textContent = 'Las contraseñas nuevas no coinciden');
    try {
      await api('/cuenta/password', { method: 'PUT', body: { actual: document.getElementById('p-actual').value, nueva } });
      cerrarModal();
      avisar('Contraseña actualizada');
    } catch (err) {
      document.getElementById('p-error').textContent = err.message;
    }
  });
}
