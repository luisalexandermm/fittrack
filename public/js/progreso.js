// ============================================================
//  progreso.js — pestañas Peso y Medidas + registrar medidas
//  (las fotos están en fotos.js)
// ============================================================

let medidas = [];
let medidaGrafica = 'cintura';

const UNIDADES = { peso: 'kg', cintura: 'cm', cadera: 'cm', pecho: 'cm', brazo: 'cm', muslo: 'cm', grasa: '%' };
const NOMBRES_MEDIDA = { peso: 'Peso', cintura: 'Cintura', cadera: 'Cadera', pecho: 'Pecho', brazo: 'Brazo', muslo: 'Muslo', grasa: '% Grasa' };

function prepararProgreso() {
  prepararPestanas('pestanas-progreso', panel => { if (panel === 'fotos') cargarFotos(); });
  seleccionUnica('selector-medida', valor => { medidaGrafica = valor; pintarGraficaMedida(); });
  document.getElementById('btn-registrar').addEventListener('click', abrirFormularioMedida);

  document.getElementById('tabla-medidas').addEventListener('click', async e => {
    const boton = e.target.closest('[data-borrar]');
    if (!boton || !confirm('¿Borrar este registro?')) return;
    await api('/medidas/' + boton.dataset.borrar, { method: 'DELETE' });
    cargarProgreso();
  });

  document.getElementById('panel-peso').addEventListener('click', e => {
    if (e.target.closest('[data-editar-meta]')) abrirFormularioMeta();
  });
}

async function cargarProgreso() {
  pintarAvisoAutorizacion();
  const [lista, resumen] = await Promise.all([api('/medidas'), api('/resumen')]);
  medidas = lista;
  pintarPanelPeso(resumen);
  pintarGraficaMedida();
  pintarTablaMedidas();
}

// ---------- Aviso si no hay autorización para datos sensibles ----------
function pintarAvisoAutorizacion() {
  const caja = document.getElementById('aviso-autorizacion');
  if (perfil.sensibles_ok) { caja.innerHTML = ''; return; }
  caja.innerHTML = `
    <div class="aviso-caja">
      ${icono('escudo')}
      <div>
        <strong>Tu peso, medidas y fotos son datos sensibles</strong>
        <p>Para guardarlos necesitamos tu autorización expresa. Solo tú los ves y puedes retirarla o borrarlos cuando quieras.</p>
        <button class="btn btn-lima btn-sm" type="button" id="btn-autorizar">Autorizar seguimiento</button>
      </div>
    </div>`;
  document.getElementById('btn-autorizar').addEventListener('click', abrirAutorizacion);
}

function abrirAutorizacion() {
  abrirModal(`
    <form class="form-modal" id="form-autorizar">
      <span class="rotulo">Datos sensibles</span>
      <h2>Autorización</h2>
      <p class="suave">Autorizo a FitTrack a guardar mi peso, medidas corporales y fotos de progreso con la única finalidad de mostrarme mi avance. Sé que son datos sensibles (Ley 1581 de 2012), que no estoy obligado a entregarlos y que puedo retirar esta autorización en Perfil → Privacidad y datos.</p>
      <label class="casilla"><input type="checkbox" id="acepto-sensibles"><span>Sí, autorizo el tratamiento de estos datos. <a href="/privacidad" target="_blank">Leer la política</a></span></label>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Ahora no</button>
        <button type="submit" class="btn btn-lima">Autorizar</button>
      </div>
    </form>`);
  document.getElementById('form-autorizar').addEventListener('submit', async e => {
    e.preventDefault();
    if (!document.getElementById('acepto-sensibles').checked) return avisar('Marca la casilla para autorizar', 'error');
    await api('/cuenta/autorizacion', { method: 'PUT', body: { sensibles: true } });
    await recargarPerfil();
    cerrarModal();
    avisar('Autorización guardada');
    cargarProgreso();
  });
}

// ---------- Pestaña Peso ----------
function pintarPanelPeso(r) {
  const pesos = medidas.filter(m => m.peso !== null).map(m => ({ etiqueta: diaMes(m.fecha), valor: m.peso }));
  const meta = perfil.meta_peso;
  const progreso = r.peso ? r.peso.progreso : null;

  const cambio = r.peso ? r.peso.cambio : null;
  const stat = (ic, valor, unidad, etiqueta) => `
    <div class="caja stat">
      <span class="tile">${icono(ic)}</span>
      <span class="cifra">${valor ?? '—'}${valor != null ? `<small style="font-size:.9rem;color:var(--piedra)"> ${unidad}</small>` : ''}</span>
      <span>${etiqueta}</span>
    </div>`;

  document.getElementById('panel-peso').innerHTML = `
    <div class="rejilla-peso">
      <div class="caja s-8">
        <div class="caja-cabeza"><h2 class="subtitulo">Peso</h2><span class="rotulo">${pesos.length} registros</span></div>
        <div id="grafica-peso"></div>
      </div>
      <div class="caja s-4 anillo-meta">
        <span class="rotulo">Objetivo</span>
        ${anilloPorcentaje(meta && r.peso ? progreso : null)}
        <div>
          <strong>${NOMBRES_OBJETIVO[perfil.objetivo]}</strong>
          <p class="tenue" style="font-size:.9rem">${meta ? `Meta: ${numero(meta, 1)} kg` : 'Sin meta de peso'}</p>
        </div>
        <div class="barra" style="width:100%"><i style="width:${progreso || 0}%"></i></div>
        ${perfil.sensibles_ok ? `<button class="btn btn-linea btn-sm" type="button" data-editar-meta>${icono('editar', 'ic-sm')}${meta ? 'Cambiar meta' : 'Definir meta'}</button>` : ''}
      </div>
      <div class="stats3 s-12">
        ${stat('bascula', cambio != null ? (cambio > 0 ? '+' : '') + numero(cambio, 1) : null, 'kg', 'Desde el inicio')}
        ${stat('gota', r.grasa != null ? numero(r.grasa, 1) : null, '%', 'Grasa corporal')}
        ${stat('regla', r.cintura != null ? numero(r.cintura, 1) : null, 'cm', 'Cintura')}
      </div>
    </div>`;

  graficaLinea('grafica-peso', pesos, 'kg', meta);
}

// ---------- Pestaña Medidas ----------
function pintarGraficaMedida() {
  const puntos = medidas.filter(m => m[medidaGrafica] !== null).map(m => ({ etiqueta: diaMes(m.fecha), valor: m[medidaGrafica] }));
  let titulo = NOMBRES_MEDIDA[medidaGrafica];
  if (puntos.length >= 2) {
    const c = puntos[puntos.length - 1].valor - puntos[0].valor;
    titulo += ` <span class="tenue" style="font-weight:500;font-size:.9rem">${c > 0 ? '+' : ''}${numero(c, 1)} ${UNIDADES[medidaGrafica]}</span>`;
  }
  document.getElementById('titulo-grafica-medida').innerHTML = titulo;
  graficaLinea('grafica-medida', puntos, UNIDADES[medidaGrafica]);
}

function pintarTablaMedidas() {
  const contenedor = document.getElementById('tabla-medidas');
  if (medidas.length === 0) {
    contenedor.innerHTML = `<div class="vacio">${icono('regla')}Registra tu punto de partida. En unas semanas lo vas a agradecer.</div>`;
    return;
  }
  const campos = Object.keys(UNIDADES);
  const filas = medidas.map((m, i) => {
    const anteriores = medidas.slice(0, i).reverse();
    const celdas = campos.map(c => {
      if (m[c] === null) return '<td class="tenue">—</td>';
      const previo = anteriores.find(a => a[c] !== null);
      const d = previo ? m[c] - previo[c] : 0;
      const delta = d ? `<span class="delta">${d > 0 ? '▲' : '▼'}${numero(Math.abs(d), 1)}</span>` : '';
      return `<td>${numero(m[c], 1)}${delta}</td>`;
    }).join('');
    return `<tr><td><strong>${fechaCorta(m.fecha)}</strong></td>${celdas}
      <td><button class="btn btn-icono btn-sm btn-peligro" data-borrar="${m.id}" aria-label="Borrar registro">${icono('basura', 'ic-sm')}</button></td></tr>`;
  }).reverse().join('');

  contenedor.innerHTML = `
    <table class="tabla">
      <thead><tr><th>Fecha</th>${campos.map(c => `<th>${NOMBRES_MEDIDA[c]} (${UNIDADES[c]})</th>`).join('')}<th></th></tr></thead>
      <tbody>${filas}</tbody>
    </table>`;
}

// ---------- Registrar medidas ----------
function abrirFormularioMedida() {
  if (!perfil.sensibles_ok) return abrirAutorizacion();
  const campo = (nombre, etiqueta, unidad) => `
    <div class="campo"><label for="m-${nombre}">${etiqueta}</label><div class="con-unidad" data-u="${unidad}"><input id="m-${nombre}" name="${nombre}" type="number" step="0.1" inputmode="decimal"></div></div>`;

  abrirModal(`
    <form class="form-modal" id="form-medida">
      <span class="rotulo">Registrar</span>
      <h2>Nuevas medidas</h2>
      <p class="tenue" style="font-size:.9rem">Mídete a la misma hora, idealmente en ayunas. Llena solo lo que tengas.</p>
      <div class="fila-2">
        <div class="campo"><label for="m-fecha">Fecha</label><input id="m-fecha" name="fecha" type="date" value="${hoyTexto()}" max="${hoyTexto()}"></div>
        ${campo('peso', 'Peso', 'kg')}
      </div>
      <div class="fila-3">
        ${campo('cintura', 'Cintura', 'cm')}${campo('cadera', 'Cadera', 'cm')}${campo('pecho', 'Pecho', 'cm')}
        ${campo('brazo', 'Brazo', 'cm')}${campo('muslo', 'Muslo', 'cm')}${campo('grasa', '% Grasa', '%')}
      </div>
      <div class="campo"><label for="m-notas">Notas</label><input id="m-notas" name="notas" type="text" maxlength="300"></div>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-lima">Guardar</button>
      </div>
    </form>`);

  document.getElementById('form-medida').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('/medidas', { method: 'POST', body: Object.fromEntries(new FormData(e.target)) });
      cerrarModal();
      avisar('Medidas guardadas');
      if (location.hash === '#progreso') cargarProgreso(); else location.hash = '#progreso';
    } catch (err) {
      avisar(err.message, 'error');
    }
  });
}

function abrirFormularioMeta() {
  abrirModal(`
    <form class="form-modal" id="form-meta">
      <span class="rotulo">Objetivo</span>
      <h2>Meta de peso</h2>
      <div class="campo"><label for="meta-peso">¿A qué peso quieres llegar?</label><div class="con-unidad" data-u="kg"><input id="meta-peso" type="number" step="0.1" inputmode="decimal" value="${perfil.meta_peso || ''}"></div></div>
      <p class="tenue" style="font-size:.85rem">Una meta realista es bajar o subir entre 0,5 y 1 kg por semana. Si tienes dudas, consulta a un profesional.</p>
      <div class="fila-botones">
        <button type="button" class="btn btn-linea" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="btn btn-tinta">Guardar meta</button>
      </div>
    </form>`);
  document.getElementById('form-meta').addEventListener('submit', async e => {
    e.preventDefault();
    await api('/perfil', { method: 'PUT', body: { meta_peso: document.getElementById('meta-peso').value } });
    await recargarPerfil();
    cerrarModal();
    avisar('Meta actualizada');
    cargarProgreso();
  });
}
