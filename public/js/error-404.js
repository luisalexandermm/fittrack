// ============================================================
//  error-404.js — página 404 de FitTrack
//
//  "Esta página pesa 404 kg": un muñeco de palitos intenta levantar
//  la barra. Tiene 3 intentos y en el tercero se suelta un disco.
//
//  Todo se anima con GSAP (js/vendor/gsap.min.js):
//  - El estado del dibujo vive en el objeto E (posición de cada
//    articulación, cuánto sube y se dobla la barra, cara...).
//  - GSAP anima los números de E y dibujar() los pasa al SVG en cada cuadro.
//  - Con el mouse, la escena se inclina en 3D y el muñeco te mira.
//
//  Si GSAP no carga, la página se queda con el dibujo quieto y sigue funcionando.
// ============================================================

(function () {
  if (!window.gsap) return;

  const $ = id => document.getElementById(id);
  const azar = gsap.utils.random;
  const limitar = gsap.utils.clamp(-1, 1);
  const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const conMouse = matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Movimiento reducido: las animaciones pasan casi al instante y no hay bucles
  if (calma) gsap.globalTimeline.timeScale(40);

  // ---------- Poses del muñeco (coordenadas del SVG) ----------
  // h = cabeza, n = cuello, p = pelvis, e = codo, m = mano, r = rodilla, f = pie
  // i = izquierda, d = derecha (vistas desde la pantalla)
  const PISO = 384;
  const BARRA_Y = 322;
  const POSES = {
    dePie: {
      hx: 260, hy: 118, nx: 260, ny: 144, px: 260, py: 250,
      eix: 226, eiy: 200, mix: 246, miy: 244, edx: 294, edy: 200, mdx: 274, mdy: 244,
      rix: 240, riy: 318, fix: 230, fiy: PISO, rdx: 280, rdy: 318, fdx: 290, fdy: PISO
    },
    agarre: {
      hx: 260, hy: 178, nx: 260, ny: 206, px: 260, py: 300,
      eix: 240, eiy: 266, mix: 238, miy: BARRA_Y, edx: 280, edy: 266, mdx: 282, mdy: BARRA_Y,
      rix: 206, riy: 322, fix: 230, fiy: PISO, rdx: 314, rdy: 322, fdx: 290, fdy: PISO
    },
    sentado: {
      hx: 228, hy: 262, nx: 242, ny: 288, px: 262, py: 368,
      eix: 214, eiy: 332, mix: 206, miy: 378, edx: 290, edy: 334, mdx: 302, mdy: 376,
      rix: 214, riy: 336, fix: 186, fiy: PISO, rdx: 312, rdy: 336, fdx: 338, fdy: PISO
    }
  };

  // Pose de esfuerzo: la de agarre, pero subiendo con la barra (subida es negativa = arriba)
  function esfuerzo(subida) {
    const a = POSES.agarre;
    return {
      ...a,
      hy: a.hy + subida * 1.4, ny: a.ny + subida * 1.4, py: a.py + subida * 1.1,
      eiy: a.eiy + subida, edy: a.edy + subida, miy: a.miy + subida, mdy: a.mdy + subida,
      rix: a.rix + 5, rdx: a.rdx - 5, riy: a.riy - 2, rdy: a.rdy - 2
    };
  }

  // Estado del dibujo
  const E = {
    ...POSES.dePie,
    subida: 0,    // cuánto sube el centro de la barra (negativo = arriba)
    curva: 0,     // cuánto se doblan las puntas de la barra por el peso
    temblor: 0,   // temblor del esfuerzo
    aire: 0,      // respiración en reposo
    salto: 0,     // susto cuando cae la barra
    rojo: 0,      // la cara se pone roja (0 a 1)
    mueca: 0,     // boca apretada (0 a 1)
    mareo: 0,     // ojos en X después de caerse
    parpadeo: 0,
    gx: 0, gy: 0  // hacia dónde mira (-1 a 1)
  };

  // ---------- Dibujar el estado en el SVG ----------
  const el = {
    cabeza: $('cabeza'), torso: $('torso'), boca: $('boca'),
    brazoI: $('brazo-i'), brazoD: $('brazo-d'), piernaI: $('pierna-i'), piernaD: $('pierna-d'),
    manoI: $('mano-i'), manoD: $('mano-d'), ojoI: $('ojo-i'), ojoD: $('ojo-d'),
    ojos: $('ojos'), ojosX: $('ojos-x'), eje: $('eje')
  };
  const seguidores = [...document.querySelectorAll('.sigue')].map(g => ({ g, x: Number(g.dataset.x) }));
  const n1 = v => v.toFixed(1);
  const puntos = lista => lista.map(([x, y]) => n1(x) + ',' + n1(y)).join(' ');
  const atributos = (nodo, valores) => { for (const k in valores) nodo.setAttribute(k, valores[k]); };

  // La barra es una curva: el centro sube y las puntas cuelgan por el peso.
  // Curva cuadrática de x=40 a x=480 con el control en x=260.
  function formaBarra() {
    const centro = BARRA_Y + E.subida;
    const extremo = centro + E.curva;
    return { extremo, control: 2 * centro - extremo };
  }
  function alturaEn(x, b) {
    const t = (x - 40) / 440;
    return (1 - t) * (1 - t) * b.extremo + 2 * t * (1 - t) * b.control + t * t * b.extremo;
  }
  function anguloEn(x, b) {
    const t = (x - 40) / 440;
    return Math.atan(2 * (b.control - b.extremo) * (1 - 2 * t) / 440) * 180 / Math.PI;
  }

  function dibujar() {
    const t = E.temblor;
    const r = E.aire + E.salto;
    const hx = E.hx + t * 1.4, hy = E.hy + r;
    const nx = E.nx + t, ny = E.ny + r * 0.8;

    // Cara: de verde oscuro a rojo según el esfuerzo
    const rojo = E.rojo;
    atributos(el.cabeza, {
      cx: n1(hx), cy: n1(hy),
      fill: `rgb(${Math.round(11 + 105 * rojo)},${Math.round(21 + 9 * rojo)},${Math.round(19 + 11 * rojo)})`
    });
    atributos(el.torso, { x1: n1(nx), y1: n1(ny), x2: n1(E.px + t * 0.4), y2: n1(E.py) });
    el.brazoI.setAttribute('points', puntos([[nx - 16, ny + 8], [E.eix + t * 0.6, E.eiy + r * 0.5], [E.mix, E.miy]]));
    el.brazoD.setAttribute('points', puntos([[nx + 16, ny + 8], [E.edx + t * 0.6, E.edy + r * 0.5], [E.mdx, E.mdy]]));
    el.piernaI.setAttribute('points', puntos([[E.px - 8, E.py], [E.rix, E.riy], [E.fix, E.fiy], [E.fix - 12, E.fiy]]));
    el.piernaD.setAttribute('points', puntos([[E.px + 8, E.py], [E.rdx, E.rdy], [E.fdx, E.fdy], [E.fdx + 12, E.fdy]]));
    atributos(el.manoI, { cx: n1(E.mix), cy: n1(E.miy) });
    atributos(el.manoD, { cx: n1(E.mdx), cy: n1(E.mdy) });

    // Ojos: miran hacia el puntero, parpadean y en el mareo son una X
    const ox = hx + E.gx * 3, oy = hy - 2 + E.gy * 2;
    const alto = Math.max(2.6 * (1 - E.parpadeo), 0.3);
    atributos(el.ojoI, { cx: n1(ox - 7), cy: n1(oy), ry: n1(alto) });
    atributos(el.ojoD, { cx: n1(ox + 7), cy: n1(oy), ry: n1(alto) });
    el.ojos.setAttribute('opacity', n1(1 - E.mareo));
    el.ojosX.setAttribute('opacity', n1(E.mareo));
    if (E.mareo > 0) {
      const x = (cx, cy) => `M${n1(cx - 3)} ${n1(cy - 3)}L${n1(cx + 3)} ${n1(cy + 3)}M${n1(cx + 3)} ${n1(cy - 3)}L${n1(cx - 3)} ${n1(cy + 3)}`;
      el.ojosX.setAttribute('d', x(hx - 7, hy - 2) + x(hx + 7, hy - 2));
    }

    // Boca: recta en reposo, en zigzag cuando aprieta
    const by = hy + 9, a = E.mueca * 3;
    el.boca.setAttribute('d', `M${n1(hx - 7)} ${n1(by)}L${n1(hx - 3.5)} ${n1(by - a)}L${n1(hx)} ${n1(by)}L${n1(hx + 3.5)} ${n1(by - a)}L${n1(hx + 7)} ${n1(by)}`);

    // Barra y lo que cuelga de ella (discos y etiqueta siguen la curva)
    const b = formaBarra();
    el.eje.setAttribute('d', `M40 ${n1(b.extremo)}Q260 ${n1(b.control)} 480 ${n1(b.extremo)}`);
    for (const s of seguidores) {
      s.g.setAttribute('transform', `translate(0 ${n1(alturaEn(s.x, b) - BARRA_Y)}) rotate(${anguloEn(s.x, b).toFixed(2)} ${s.x} ${BARRA_Y})`);
    }
  }
  gsap.ticker.add(dibujar);

  // ---------- Partículas: magnesio, polvo del piso y sudor ----------
  const capa = $('particulas');
  const NS = 'http://www.w3.org/2000/svg';

  function particulas(x, y, cantidad, color, abrir = 28, subir = -34) {
    if (calma) return;
    for (let i = 0; i < cantidad; i++) {
      const c = document.createElementNS(NS, 'circle');
      atributos(c, { cx: x, cy: y, r: n1(azar(1.4, 3.4)), fill: color });
      capa.appendChild(c);
      gsap.to(c, {
        attr: { cx: x + azar(-abrir, abrir), cy: y + azar(subir, subir * 0.2) },
        opacity: 0, duration: azar(0.6, 1.1), ease: 'power2.out',
        onComplete: () => c.remove()
      });
    }
  }
  const magnesio = () => {
    particulas(E.mix, BARRA_Y, 7, 'rgba(255,255,255,.85)');
    particulas(E.mdx, BARRA_Y, 7, 'rgba(255,255,255,.85)');
  };
  const polvoPiso = lista => lista.forEach(x => particulas(x, PISO - 2, 6, 'rgba(184,255,61,.55)', 42, -18));

  function sudor() {
    if (calma) return;
    const lado = Math.random() < 0.5 ? -1 : 1;
    const x = E.hx + lado * 19, y = E.hy - 8;
    const gota = document.createElementNS(NS, 'path');
    atributos(gota, { d: `M${x} ${y - 6}C${x + 3} ${y - 1} ${x + 4} ${y + 2} ${x} ${y + 4}C${x - 4} ${y + 2} ${x - 3} ${y - 1} ${x} ${y - 6}Z`, fill: '#7FD4FF' });
    capa.appendChild(gota);
    gsap.fromTo(gota, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, {
      opacity: 1, scale: 1, duration: 0.15,
      onComplete: () => gsap.to(gota, { x: lado * 10, y: 34, opacity: 0, duration: 0.6, ease: 'power1.in', onComplete: () => gota.remove() })
    });
  }

  // ---------- Golpe de la barra contra el piso ----------
  const escena = $('escena');
  const capa404 = document.querySelector('.capa-404');
  const globo = $('globo');
  gsap.set(capa404, { z: -140, scale: 1.12 });
  gsap.set(globo, { z: 80 });

  function golpe() {
    gsap.fromTo('#etiqueta', { rotation: azar(-20, 20) }, { rotation: 0, transformOrigin: '50% 0%', duration: 1.8, ease: 'elastic.out(1, .25)' });
    if (calma) return;
    gsap.fromTo(escena, { y: 0 }, { y: 4, duration: 0.05, yoyo: true, repeat: 3, ease: 'none' });
    gsap.fromTo(capa404, { scale: 1.17 }, { scale: 1.12, duration: 0.5, ease: 'power2.out' });
  }

  // Susto: el muñeco da un brinco cuando cae la barra
  function susto() {
    gsap.timeline()
      .to(E, { salto: -12, duration: 0.1, ease: 'power2.out' })
      .to(E, { salto: 0, duration: 0.6, ease: 'elastic.out(1, .4)' });
  }

  // ---------- Mensajes del "entrenador" y contador ----------
  const reps = [...document.querySelectorAll('.marcador .rep')];
  const FRASES = [
    'Intento 1: <b>ni se movió</b>. Aprieta el abdomen y otra vez.',
    'Intento 2: subió dos centímetros… <b>y hasta ahí</b>.',
    '¡Se soltó el disco! Esta página <b>no existe</b>. Mejor vuelve al inicio.'
  ];

  // Solo se usan los textos de arriba (fijos), así que innerHTML es seguro aquí
  function decir(html) {
    gsap.timeline()
      .to(globo, { opacity: 0, y: 6, duration: 0.15 })
      .add(() => { globo.innerHTML = html; })
      .to(globo, { opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2)' });
  }

  function resaltarInicio() {
    gsap.fromTo('#btn-inicio', { scale: 1 }, { scale: 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: 'sine.inOut' });
  }

  // ---------- Los intentos ----------
  const boton = $('btn-levantar');
  const botonTexto = boton.querySelector('span');
  boton.hidden = false;

  let intentos = 0;
  let ocupado = false;

  function intentar() {
    if (ocupado) return;
    if (intentos >= 3) return reiniciar();
    ocupado = true;
    intentos++;
    const n = intentos;
    const subida = [-8, -16, -24][n - 1];
    const curva = [7, 11, 15][n - 1];

    const tl = gsap.timeline({ onComplete: () => { ocupado = false; } });
    // 1. Se agacha, agarra la barra y se pone magnesio
    tl.to(E, { ...POSES.agarre, duration: 0.45, ease: 'power2.inOut' })
      .add(magnesio)
      // 2. Jala: la barra sube un poquito y se dobla, la cara se pone roja y tiembla
      .to(E, { ...esfuerzo(subida), subida, curva, rojo: 0.5 + n * 0.17, mueca: 1, duration: 0.55, ease: 'power2.out' })
      .fromTo(E, { temblor: -1.6 }, { temblor: 1.6, duration: 0.05, repeat: 8 + n * 4, yoyo: true, ease: 'none' }, '<0.1')
      .set(E, { temblor: 0 })
      .add(() => reps[n - 1].classList.add('lleno'), '<');
    if (n >= 2) tl.add(sudor, '-=0.5').add(sudor, '-=0.25');

    if (n < 3) {
      // 3. La suelta: cae al piso, polvo y vuelve a pararse
      tl.to(E, { subida: 0, curva: 0, duration: 0.22, ease: 'power3.in' })
        .add(() => { polvoPiso([92, 428]); golpe(); })
        .to(E, { ...POSES.dePie, rojo: 0, mueca: 0, duration: 0.6, ease: 'power2.inOut' }, '+=0.1')
        .add(() => decir(FRASES[n - 1]), '<');
    } else {
      // Tercer intento: el disco derecho se sale, la barra se ladea y el muñeco se cae sentado
      tl.to('#discos-d-desliza', { x: 14, duration: 0.35, ease: 'power1.in' }, '-=0.3')
        .to(E, { subida: 0, curva: 0, duration: 0.2, ease: 'power3.in' })
        .to(E, { ...POSES.sentado, rojo: 0.2, mueca: 0, mareo: 1, duration: 0.5, ease: 'power3.out' }, '<')
        .to('#discos-d', { rotation: 90, transformOrigin: '100% 100%', duration: 0.6, ease: 'bounce.out' }, '<0.05')
        .to('#barra-inclina', { rotation: 8.5, svgOrigin: '92 384', duration: 0.5, ease: 'bounce.out' }, '<0.1')
        .add(() => { polvoPiso([92, 300, 520]); golpe(); }, '<0.2')
        .add(() => decir(FRASES[2]))
        .add(() => { botonTexto.textContent = 'Otra serie'; resaltarInicio(); });
    }
  }

  function reiniciar() {
    ocupado = true;
    intentos = 0;
    gsap.timeline({ onComplete: () => { ocupado = false; } })
      .to('#discos-d', { opacity: 0, duration: 0.2 })
      .to(E, { ...POSES.dePie, rojo: 0, mueca: 0, mareo: 0, duration: 0.6, ease: 'power2.inOut' }, 0)
      .to('#barra-inclina', { rotation: 0, duration: 0.45, ease: 'power2.out' }, 0)
      .set('#discos-d-desliza', { x: 0 })
      .set('#discos-d', { rotation: 0 })
      .to('#discos-d', { opacity: 1, duration: 0.35 })
      .add(() => {
        reps.forEach(r => r.classList.remove('lleno'));
        botonTexto.textContent = 'Intentar levantarla';
        decir('Serie nueva. Spoiler: <b>sigue pesando 404 kg</b>.');
      });
  }

  boton.addEventListener('click', intentar);
  escena.addEventListener('click', intentar);

  // ---------- Entrada: el texto sube y la barra cae del cielo ----------
  const CAIDA = 0.8;
  gsap.timeline({ defaults: { ease: 'power3.out' } })
    .from('.error-codigo', { y: 14, opacity: 0, duration: 0.5 })
    .from('.error-titulo .linea', { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.1 }, '<0.1')
    .from('.error-descripcion, .error-acciones', { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, '<0.3')
    .from(capa404, { opacity: 0, duration: 1 }, 0)
    .from('#muneco, #mano-i, #mano-d', { opacity: 0, duration: 0.4 }, 0.2)
    .from('#barra-caida', { y: -300, duration: CAIDA, ease: 'bounce.out' }, 0.35)
    // bounce.out toca el piso por primera vez al 36% de su duración
    .add(() => { polvoPiso([92, 428, 260]); golpe(); susto(); }, 0.35 + CAIDA * 0.36)
    .from(globo, { opacity: 0, scale: 0.8, transformOrigin: '0% 100%', duration: 0.4, ease: 'back.out(2)' }, '+=0.2')
    .from('.marcador', { opacity: 0, duration: 0.4 }, '<');

  if (calma) return; // sin bucles ni inclinación con movimiento reducido

  // ---------- Vida en reposo: respira y parpadea ----------
  gsap.to(E, { aire: 2.5, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  (function parpadear() {
    gsap.to(E, {
      parpadeo: 1, duration: 0.07, yoyo: true, repeat: 1,
      onComplete: () => gsap.delayedCall(azar(2.2, 5), parpadear)
    });
  })();

  // ---------- 3D: la escena se inclina con el mouse y el muñeco te mira ----------
  if (conMouse) {
    const girarY = gsap.quickTo(escena, 'rotationY', { duration: 0.8, ease: 'power3' });
    const girarX = gsap.quickTo(escena, 'rotationX', { duration: 0.8, ease: 'power3' });
    const mirarX = gsap.quickTo(E, 'gx', { duration: 0.3 });
    const mirarY = gsap.quickTo(E, 'gy', { duration: 0.3 });
    window.addEventListener('pointermove', e => {
      const caja = escena.getBoundingClientRect();
      girarY(limitar((e.clientX - (caja.left + caja.width / 2)) / (innerWidth / 2)) * 12);
      girarX(limitar((e.clientY - (caja.top + caja.height / 2)) / (innerHeight / 2)) * -8);
      const cabeza = el.cabeza.getBoundingClientRect();
      mirarX(limitar((e.clientX - (cabeza.left + cabeza.width / 2)) / 220));
      mirarY(limitar((e.clientY - (cabeza.top + cabeza.height / 2)) / 220));
    });
  } else {
    // En el celular la escena flota sola y el muñeco mira la barra
    gsap.set(E, { gy: 0.7 });
    gsap.to(escena, { rotationY: 7, rotationX: -3, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  }
})();
