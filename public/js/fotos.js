// ============================================================
//  fotos.js — pestaña Fotos: subir, galería y comparador
// ============================================================

let fotos = [];
let filtroAngulo = 'todas';
let modoComparar = false;
let seleccion = []; // ids de las fotos elegidas para comparar
let urlVistaPrevia = null;

function prepararFotos() {
  const form = document.getElementById('form-foto');
  const zona = document.getElementById('zona-foto');
  const inputArchivo = form.foto;

  // Vista previa al elegir la foto
  inputArchivo.addEventListener('change', () => {
    const archivo = inputArchivo.files[0];
    zona.querySelector('img')?.remove();
    if (urlVistaPrevia) URL.revokeObjectURL(urlVistaPrevia);
    if (!archivo) return;
    if (archivo.size > 4 * 1024 * 1024) { inputArchivo.value = ''; return avisar('La foto pesa más de 4 MB', 'error'); }
    urlVistaPrevia = URL.createObjectURL(archivo);
    const img = document.createElement('img');
    img.src = urlVistaPrevia;
    img.alt = 'Vista previa';
    zona.appendChild(img);
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!perfil.sensibles_ok) return abrirAutorizacion();
    if (!inputArchivo.files[0]) return avisar('Primero elige una foto', 'error');
    const boton = form.querySelector('button[type=submit]');
    boton.disabled = true;
    try {
      await api('/fotos', { method: 'POST', body: new FormData(form) });
      form.reset();
      form.fecha.value = hoyTexto();
      zona.querySelector('img')?.remove();
      avisar('Foto guardada');
      cargarFotos();
    } catch (err) {
      avisar(err.message, 'error');
    } finally {
      boton.disabled = false;
    }
  });

  seleccionUnica('filtro-angulo', valor => { filtroAngulo = valor; pintarGaleria(); });

  document.getElementById('btn-comparar').addEventListener('click', () => {
    modoComparar = !modoComparar;
    seleccion = [];
    document.getElementById('ayuda-comparar').hidden = !modoComparar;
    document.getElementById('btn-comparar').classList.toggle('btn-tinta', modoComparar);
    pintarGaleria();
  });

  document.getElementById('galeria').addEventListener('click', async e => {
    const tarjeta = e.target.closest('.foto');
    if (!tarjeta) return;
    const id = Number(tarjeta.dataset.id);
    if (e.target.closest('.borrar')) {
      if (!confirm('¿Borrar esta foto? No se puede recuperar.')) return;
      await api('/fotos/' + id, { method: 'DELETE' });
      return cargarFotos();
    }
    if (modoComparar) elegirParaComparar(id);
  });

  const modalComparar = document.getElementById('modal-comparar');
  document.getElementById('cerrar-comparar').addEventListener('click', () => modalComparar.classList.remove('abierto'));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modalComparar.classList.remove('abierto'); });
  prepararDeslizador();
}

async function cargarFotos() {
  const form = document.getElementById('form-foto');
  if (!form.fecha.value) form.fecha.value = hoyTexto();
  form.fecha.max = hoyTexto();
  fotos = await api('/fotos');
  pintarGaleria();
}

function pintarGaleria() {
  const galeria = document.getElementById('galeria');
  galeria.classList.toggle('comparando', modoComparar);
  const visibles = filtroAngulo === 'todas' ? fotos : fotos.filter(f => f.angulo === filtroAngulo);

  if (visibles.length === 0) {
    galeria.innerHTML = `<div class="vacio" style="grid-column:1/-1">${icono('camara')}Aún no hay fotos${filtroAngulo !== 'todas' ? ' de ' + filtroAngulo : ''}. Misma luz, misma distancia, misma pose.</div>`;
    return;
  }
  galeria.innerHTML = visibles.map(f => {
    const pos = seleccion.indexOf(f.id);
    return `
      <div class="foto ${pos >= 0 ? 'sel' : ''}" data-id="${f.id}">
        <img src="/api/fotos/${f.id}/imagen" alt="Foto de ${f.angulo} del ${fechaCorta(f.fecha)}" loading="lazy">
        <span class="num-sel">${pos + 1}</span>
        <button class="btn btn-icono borrar" aria-label="Borrar foto">${icono('basura', 'ic-sm')}</button>
        <div class="info"><strong>${fechaCorta(f.fecha)}</strong><span>${f.angulo}${f.nota ? ' · ' + escapar(f.nota) : ''}</span></div>
      </div>`;
  }).join('');
}

function elegirParaComparar(id) {
  seleccion = seleccion.includes(id) ? seleccion.filter(s => s !== id) : [...seleccion, id];
  if (seleccion.length === 2) {
    abrirComparador(seleccion[0], seleccion[1]);
    seleccion = [];
  }
  pintarGaleria();
}

function abrirComparador(idAntes, idDespues) {
  const antes = fotos.find(f => f.id === idAntes);
  const despues = fotos.find(f => f.id === idDespues);
  document.getElementById('img-antes').src = `/api/fotos/${idAntes}/imagen`;
  document.getElementById('img-despues').src = `/api/fotos/${idDespues}/imagen`;
  document.getElementById('etq-antes').textContent = fechaCorta(antes.fecha);
  document.getElementById('etq-despues').textContent = fechaCorta(despues.fecha);
  moverDivisor(0.5);
  document.getElementById('modal-comparar').classList.add('abierto');
}

// Arrastrar el divisor recorta la foto de "después"
function moverDivisor(proporcion) {
  const p = Math.min(Math.max(proporcion, 0), 1) * 100;
  document.getElementById('img-despues').style.clipPath = `inset(0 0 0 ${p}%)`;
  document.getElementById('divisor').style.left = p + '%';
}

function prepararDeslizador() {
  const comparador = document.getElementById('comparador');
  let arrastrando = false;
  const mover = e => {
    if (!arrastrando) return;
    const r = comparador.getBoundingClientRect();
    moverDivisor((e.clientX - r.left) / r.width);
  };
  comparador.addEventListener('pointerdown', e => { arrastrando = true; comparador.setPointerCapture(e.pointerId); mover(e); });
  comparador.addEventListener('pointermove', mover);
  comparador.addEventListener('pointerup', () => { arrastrando = false; });
}
