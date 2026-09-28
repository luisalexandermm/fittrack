// ============================================================
//  perfil.js — perfil, preferencias de entreno, datos personales,
//  privacidad y contraseña
// ============================================================

function prepararPerfil() {
  document.querySelector('.menu-perfil').addEventListener('click', e => {
    const boton = e.target.closest('[data-abrir]');
    if (!boton) return;
    ({ preferencias: abrirPreferencias, configuracion: abrirConfiguracion, privacidad: abrirPrivacidad, seguridad: abrirSeguridad })[boton.dataset.abrir]();
  });
  // El botón "Editar" de las preferencias está fuera del menú
  document.querySelector('#vista-perfil .caja-cabeza [data-abrir="preferencias"]').addEventListener('click', abrirPreferencias);
  document.getElementById('btn-salir').addEventListener('click', async () => {
    await api('/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });
}

async function cargarPerfil() {
  const [r] = await Promise.all([api('/resumen'), cargarPlan()]);
  pintarPreferencias();
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

// ---------- Resumen de preferencias ----------
function diasDeEntreno() {
  // Si el perfil todavía no tiene días elegidos, se usan los de la semana actual
  if (Array.isArray(perfil.dias_entreno) && perfil.dias_entreno.length) return perfil.dias_entreno;
  return planSemana.dias.filter(d => d.entrena).map(d => d.dia);
}

function pintarPreferencias() {
  const dias = diasDeEntreno();
  const lugar = perfil.lugar || planSemana.preferencias.lugar || 'casa';
  const fila = (etiqueta, valor) => `<div><dt>${etiqueta}</dt><dd>${valor}</dd></div>`;
  document.getElementById('perfil-preferencias').innerHTML = `
    <dl class="lista-preferencias">
      ${fila('Objetivo', NOMBRES_CORTOS[perfil.objetivo])}
      ${fila('Nivel', NOMBRES_NIVEL[perfil.nivel])}
      ${fila('Lugar', { casa: 'Casa', gimnasio: 'Gimnasio', ambos: 'Casa y gimnasio' }[lugar])}
      ${fila('Días', `<span class="dias-mini">${DIAS_CORTOS.map((d, i) => `<i class="${dias.includes(i) ? 'on' : ''}">${d.charAt(0)}</i>`).join('')}</span>`)}
      ${fila('Tiempo', perfil.minutos + ' min por sesión')}
    </dl>`;
}

// ---------- Preferencias de entreno (lo mismo que el onboarding) ----------
function abrirPreferencias() {
  const opcion = (valor, texto, actual) => `<button type="button" class="opcion ${String(valor) === String(actual) ? 'activo' : ''}" data-valor="${valor}">${texto}</button>`;
  const dias = diasDeEntreno();
  const lugar = perfil.lugar || planSemana.preferencias.lugar || 'casa';
  abrirModal(`
    <form class="form-modal" id="form-preferencias">
      <span class="rotulo">Preferencias de entreno</span>
      <h2>Así entrenas</h2>
      <div class="campo"><span class="rotulo">Objetivo</span>
        <div class="opciones" id="p-objetivo">${opcion('grasa', 'Quemar grasa', perfil.objetivo)}${opcion('musculo', 'Músculo', perfil.objetivo)}${opcion('resistencia', 'Resistencia', perfil.objetivo)}${opcion('movilidad', 'Movilidad', perfil.objetivo)}</div>
      </div>
      <div class="campo"><span class="rotulo">Nivel</span>
        <div class="opciones" id="p-nivel">${opcion(1, 'Principiante', perfil.nivel)}${opcion(2, 'Intermedio', perfil.nivel)}${opcion(3, 'Avanzado', perfil.nivel)}</div>
      </div>
      <div class="campo"><span class="rotulo">Lugar</span>
        <div class="opciones" id="p-lugar">${opcion('casa', 'Casa', lugar)}${opcion('gimnasio', 'Gimnasio', lugar)}${opcion('ambos', 'Ambos', lugar)}</div>
      </div>
      <div class="campo"><span class="rotulo">Días para entrenar</span>
        <div class="dias-elegir" id="p-dias">${DIAS_CORTOS.map((d, i) => `<button type="button" class="${dias.includes(i) ? 'activo' : ''}" data-dia="${i}" aria-pressed="${dias.includes(i)}" aria-label="${DIAS_LARGOS[i]}">${d.charAt(0)}</button>`).join('')}</div>
      </div>
      <div class="campo"><span class="rotulo">Tiempo por sesión</span>
        <div class="opciones" id="p-minutos">${[10, 15, 20, 30, 45, 60].map(m => opcion(m, m === 60 ? '60+ min' : m + ' min', cercano(perfil.minutos))).join('')}</div>
      </div>
      <p class="error-form" id="p-pref-error" role="alert"></p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Guardar</button>
      </div>
    </form>`);

  ['p-objetivo', 'p-nivel', 'p-lugar', 'p-minutos'].forEach(id => seleccionUnica(id));
  document.getElementById('p-dias').addEventListener('click', e => {
    const b = e.target.closest('[data-dia]');
    if (!b) return;
    b.classList.toggle('activo');
    b.setAttribute('aria-pressed', b.classList.contains('activo'));
  });

  document.getElementById('form-preferencias').addEventListener('submit', async e => {
    e.preventDefault();
    const nuevas = {
      objetivo: valorSeleccionado('p-objetivo'),
      nivel: Number(valorSeleccionado('p-nivel')),
      lugar: valorSeleccionado('p-lugar'),
      dias_entreno: [...document.querySelectorAll('#p-dias .activo')].map(b => Number(b.dataset.dia)),
      minutos: Number(valorSeleccionado('p-minutos'))
    };
    if (!nuevas.dias_entreno.length) return (document.getElementById('p-pref-error').textContent = 'Elige al menos un día');

    const antes = { objetivo: perfil.objetivo, nivel: perfil.nivel, lugar, dias_entreno: dias, minutos: perfil.minutos };
    const cambio = JSON.stringify(antes) !== JSON.stringify(nuevas);
    try {
      const respuesta = await api('/perfil', { method: 'PUT', body: nuevas });
      await recargarPerfil();
      configuradorListo = false; // la rutina libre usará los nuevos valores
      if (!respuesta.falta_migracion) planSemana.pendientes = false; // ya no hace falta el aviso de Inicio
      if (respuesta.falta_migracion) avisar('Se guardó objetivo, nivel y tiempo. Lugar y días necesitan la migración de la base de datos.', 'error');
      if (cambio) preguntarReplanificar();
      else { cerrarModal(); avisar('Preferencias guardadas'); }
      pintarPreferencias();
    } catch (err) {
      document.getElementById('p-pref-error').textContent = err.message;
    }
  });
}

// El tiempo guardado puede ser cualquiera entre 10 y 60: se marca la opción más cercana
function cercano(minutos) {
  return [10, 15, 20, 30, 45, 60].reduce((a, b) => (Math.abs(b - minutos) < Math.abs(a - minutos) ? b : a));
}

// Al cambiar preferencias se pregunta si rehacer la semana.
// Las sesiones ya hechas están en el historial y no se tocan.
function preguntarReplanificar() {
  abrirModal(`
    <div class="form-modal">
      <span class="rotulo">Preferencias guardadas</span>
      <h2>¿Actualizamos tu semana?</h2>
      <p class="suave">FitTrack puede rehacer tu semana con lo que acabas de elegir. Tus entrenamientos ya completados y tu progreso no cambian.</p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Ahora no</button>
        <button type="button" class="btn btn-lima" id="btn-replanificar">Sí, actualizar mi semana</button>
      </div>
    </div>`);
  document.getElementById('btn-replanificar').addEventListener('click', async e => {
    e.target.disabled = true;
    try {
      await regenerarPlan();
      cerrarModal();
      avisar('Tu semana se actualizó');
      pintarPreferencias();
    } catch (err) {
      avisar(err.message, 'error');
      e.target.disabled = false;
    }
  });
}

// ---------- Datos personales ----------
function abrirConfiguracion() {
  abrirModal(`
    <form class="form-modal" id="form-config">
      <span class="rotulo">Datos personales</span>
      <h2>Tu perfil</h2>
      <div class="campo"><label for="c-nombre">Nombre</label><input id="c-nombre" type="text" maxlength="60" value="${escapar(perfil.nombre)}"></div>
      <div class="fila-2">
        <div class="campo"><label for="c-edad">Edad</label><div class="con-unidad" data-u="años"><input id="c-edad" type="number" min="14" max="100" inputmode="numeric" value="${perfil.edad || ''}"></div></div>
        <div class="campo"><label for="c-altura">Altura (para el IMC)</label><div class="con-unidad" data-u="cm"><input id="c-altura" type="number" inputmode="numeric" value="${perfil.altura_cm || ''}"></div></div>
      </div>
      <p class="tenue" style="font-size:.86rem">Objetivo, nivel, lugar, días y tiempo están en <b>Preferencias de entreno</b>.</p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Guardar</button>
      </div>
    </form>`);

  document.getElementById('form-config').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const cuerpo = { nombre: document.getElementById('c-nombre').value, altura_cm: document.getElementById('c-altura').value };
      // La edad solo se manda si la base ya tiene esa columna (migración del onboarding)
      if ('edad' in perfil) cuerpo.edad = document.getElementById('c-edad').value;
      await api('/perfil', { method: 'PUT', body: cuerpo });
      await recargarPerfil();
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
