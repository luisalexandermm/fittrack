// ============================================================
//  recordatorios.js — activar los recordatorios en este dispositivo
//  (Perfil → Recordatorios). El envío lo hace el servidor a las 7:00 a. m.
// ============================================================

const pushSoportado = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const esIPhone = () => /iPad|iPhone|iPod/.test(navigator.userAgent);
const appInstalada = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// La llave pública llega en base64 "url-safe" y el navegador la pide en bytes
function llaveEnBytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(binario, c => c.charCodeAt(0));
}

async function suscripcionActual() {
  const registro = await navigator.serviceWorker.getRegistration('/');
  return registro ? registro.pushManager.getSubscription() : null;
}

async function abrirRecordatorios() {
  abrirModal(cargandoModal('Revisando este dispositivo…'));
  const contenido = document.getElementById('modal-contenido');

  if (!pushSoportado()) {
    const ayuda = esIPhone() && !appInstalada()
      ? 'En iPhone, primero instala FitTrack: en Safari toca Compartir → "Agregar a inicio" y abre la app desde ese ícono. Ahí sí podrás activarlos.'
      : 'Este navegador no permite notificaciones. Prueba con Chrome, Edge o Firefox actualizados.';
    contenido.innerHTML = errorModal('Recordatorios', ayuda);
    return;
  }

  let clave;
  try {
    const respuesta = await api('/recordatorios/clave');
    if (!respuesta.activo) {
      contenido.innerHTML = errorModal('Recordatorios', 'Los recordatorios todavía no están configurados en el servidor.');
      return;
    }
    clave = respuesta.clave;
  } catch (err) {
    contenido.innerHTML = errorModal('Recordatorios', err.message);
    return;
  }

  const suscrito = Notification.permission === 'granted' && Boolean(await suscripcionActual());
  const bloqueado = Notification.permission === 'denied';
  contenido.innerHTML = `
    <div class="form-modal">
      <span class="rotulo">Recordatorios</span>
      <h2>${suscrito ? 'Activados en este dispositivo' : 'Recordatorios de entreno'}</h2>
      <p class="suave">Te avisamos a las <b>7:00 a. m.</b> los días que te toca entrenar. Si ya entrenaste o es día de descanso, no te escribimos.</p>
      ${bloqueado ? '<p class="error-form">Bloqueaste las notificaciones de FitTrack. Actívalas en los ajustes del navegador (ícono del candado junto a la dirección) y vuelve aquí.</p>' : ''}
      <p class="tenue" style="font-size:.85rem">Se activan por dispositivo: si usas el celular y el computador, actívalos en cada uno.</p>
      <p class="reenviar-estado" id="estado-recordatorio" aria-live="polite"></p>
      <div class="fila-botones">
        ${suscrito
          ? `<button type="button" class="btn btn-linea" id="btn-recordatorio-off">Desactivar</button>
             <button type="button" class="btn btn-lima" id="btn-recordatorio-prueba">${icono('campana')}Enviar una de prueba</button>`
          : `<button type="button" class="btn btn-linea" data-cerrar-modal>Ahora no</button>
             <button type="button" class="btn btn-lima" id="btn-recordatorio-on" ${bloqueado ? 'disabled' : ''}>${icono('campana')}Activar</button>`}
      </div>
    </div>`;

  const estado = document.getElementById('estado-recordatorio');
  const conManejo = (boton, accion) => boton && boton.addEventListener('click', async () => {
    boton.disabled = true;
    estado.textContent = '';
    try {
      await accion();
    } catch (err) {
      estado.textContent = err.message;
      boton.disabled = false;
    }
  });

  conManejo(document.getElementById('btn-recordatorio-on'), async () => {
    const permiso = await Notification.requestPermission();
    if (permiso !== 'granted') throw new Error('Sin tu permiso no podemos mandarte recordatorios.');
    const registro = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    let suscripcion;
    try {
      suscripcion = await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: llaveEnBytes(clave) });
    } catch (e) {
      throw new Error('Tu navegador no pudo activar las notificaciones. Revisa tu conexión e inténtalo de nuevo.');
    }
    await api('/recordatorios', { method: 'POST', body: suscripcion.toJSON() });
    avisar('Recordatorios activados');
    abrirRecordatorios();
  });

  conManejo(document.getElementById('btn-recordatorio-off'), async () => {
    const suscripcion = await suscripcionActual();
    if (suscripcion) {
      await api('/recordatorios', { method: 'DELETE', body: { endpoint: suscripcion.endpoint } });
      await suscripcion.unsubscribe();
    }
    avisar('Recordatorios desactivados');
    abrirRecordatorios();
  });

  conManejo(document.getElementById('btn-recordatorio-prueba'), async () => {
    await api('/recordatorios/prueba', { method: 'POST' });
    estado.textContent = 'Enviada. Debería llegarte en unos segundos.';
    document.getElementById('btn-recordatorio-prueba').disabled = false;
  });
}
