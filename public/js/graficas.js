// ============================================================
//  graficas.js — gráficas en SVG puro (sin librerías)
// ============================================================

// Barras. datos = [{ etiqueta: '3 ago', valor: 60 }, ...]
// La última barra (la semana actual) va en arcilla.
function graficaBarras(idContenedor, datos) {
  const ancho = 600, alto = 200, abajo = 26, arriba = 22;
  const maximo = Math.max(...datos.map(d => d.valor), 30);
  const paso = ancho / datos.length;
  const anchoBarra = paso * 0.5;

  let barras = '';
  datos.forEach((d, i) => {
    const h = d.valor > 0 ? (d.valor / maximo) * (alto - abajo - arriba) : 3;
    const x = i * paso + (paso - anchoBarra) / 2;
    const y = alto - abajo - h;
    const clase = d.valor === 0 ? 'barra-vacia' : i === datos.length - 1 ? 'barra-g ultima' : 'barra-g';
    barras += `<rect class="${clase}" x="${x}" y="${y}" width="${anchoBarra}" height="${h}" rx="2"><title>${d.etiqueta}: ${d.valor} min</title></rect>`;
    if (d.valor > 0) barras += `<text class="valor" x="${x + anchoBarra / 2}" y="${y - 7}" text-anchor="middle">${d.valor}</text>`;
    barras += `<text x="${x + anchoBarra / 2}" y="${alto - 6}" text-anchor="middle">${d.etiqueta}</text>`;
  });

  document.getElementById(idContenedor).innerHTML = `
    <svg class="grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Minutos entrenados por semana">
      <line class="eje" x1="0" y1="${alto - abajo}" x2="${ancho}" y2="${alto - abajo}"/>
      ${barras}
    </svg>`;
}

// Línea. puntos = [{ etiqueta: '1 sep', valor: 78.5 }, ...]
// meta (opcional): dibuja una línea punteada horizontal con la meta.
function graficaLinea(idContenedor, puntos, unidad = '', meta = null) {
  const contenedor = document.getElementById(idContenedor);
  if (puntos.length === 0) {
    contenedor.innerHTML = `<div class="vacio">${icono('progreso')}Aún no hay registros.</div>`;
    return;
  }

  const ancho = 600, alto = 230;
  const m = { izq: 40, der: 14, arriba: 16, abajo: 28 };
  const valores = puntos.map(p => p.valor).concat(meta ? [meta] : []);
  let minimo = Math.min(...valores), maximo = Math.max(...valores);
  const holgura = Math.max((maximo - minimo) * 0.18, 1);
  minimo -= holgura; maximo += holgura;

  const xDe = i => puntos.length === 1 ? ancho / 2 : m.izq + (i / (puntos.length - 1)) * (ancho - m.izq - m.der);
  const yDe = v => m.arriba + (1 - (v - minimo) / (maximo - minimo)) * (alto - m.arriba - m.abajo);

  // Líneas guía con su valor
  let guias = '';
  for (let i = 0; i <= 4; i++) {
    const v = minimo + ((maximo - minimo) * i) / 4;
    guias += `<line class="eje" x1="${m.izq}" y1="${yDe(v)}" x2="${ancho - m.der}" y2="${yDe(v)}"/>
              <text x="${m.izq - 8}" y="${yDe(v) + 4}" text-anchor="end">${numero(v, 0)}</text>`;
  }

  const c = puntos.map((p, i) => [xDe(i), yDe(p.valor)]);
  const trazo = c.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = `${trazo} L ${c[c.length - 1][0]} ${alto - m.abajo} L ${c[0][0]} ${alto - m.abajo} Z`;

  const salto = Math.ceil(puntos.length / 6);
  let etiquetas = '', circulos = '';
  puntos.forEach((p, i) => {
    circulos += `<circle class="punto" cx="${c[i][0]}" cy="${c[i][1]}" r="4.5"><title>${p.etiqueta}: ${numero(p.valor, 1)} ${unidad}</title></circle>`;
    if (i % salto === 0 || i === puntos.length - 1) etiquetas += `<text x="${c[i][0]}" y="${alto - 6}" text-anchor="middle">${p.etiqueta}</text>`;
  });

  const lineaMeta = meta
    ? `<line class="meta" x1="${m.izq}" y1="${yDe(meta)}" x2="${ancho - m.der}" y2="${yDe(meta)}"/>
       <text x="${ancho - m.der}" y="${yDe(meta) - 6}" text-anchor="end">Meta ${numero(meta, 1)}</text>`
    : '';

  contenedor.innerHTML = `
    <svg class="grafica" viewBox="0 0 ${ancho} ${alto}" role="img" aria-label="Evolución">
      ${guias}${lineaMeta}
      <path class="area" d="${area}"/>
      <path class="linea" d="${trazo}"/>
      ${circulos}${etiquetas}
    </svg>`;
}

// Anillo de porcentaje (para la meta)
function anilloPorcentaje(porcentaje) {
  const circ = 2 * Math.PI * 62;
  const offset = circ * (1 - (porcentaje || 0) / 100);
  return `
    <div class="anillo">
      <svg viewBox="0 0 150 150"><circle class="fondo" cx="75" cy="75" r="62"/><circle class="trazo" cx="75" cy="75" r="62" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg>
      <div class="centro"><span class="cifra">${porcentaje ?? '—'}${porcentaje !== null ? '<small style="font-size:1.1rem">%</small>' : ''}</span></div>
    </div>`;
}
