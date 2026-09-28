# FitTrack

Tu **semana de entrenamiento** armada según **objetivo, nivel, lugar (casa o gimnasio), días y tiempo**, con **cada ejercicio animado**, entrenador en pantalla completa, seguimiento de **peso, medidas y fotos**, **plan de comidas** con recetas de Colombia y del Pacífico, y **calendario semanal**.

Full stack: **Node.js + Express + Supabase** (PostgreSQL, Auth y Storage) · frontend en **HTML, CSS y JavaScript puro** (sin build).
Diseño propio: **blanco perlado, grises y negro con el verde lima como acento** (#F4F5F2 / #050B0A / #B8FF3D), claro por defecto, tipografías servidas desde el propio servidor.

---

## Puesta en marcha con Supabase (paso a paso)

Necesitas **Node.js 22 o superior** y una cuenta gratis en [supabase.com](https://supabase.com).

### 1. Crea el proyecto
Supabase → **New project**. Elige una región cercana (por ejemplo *São Paulo* o *East US*) y guarda la contraseña de la base de datos.

### 2. Crea las tablas
Supabase → **SQL Editor** → **New query**:
1. Pega todo el archivo `supabase/esquema.sql` → **Run**.
2. Nueva consulta, pega `supabase/datos.sql` → **Run** (carga 67 ejercicios —51 de casa y 16 de gimnasio—, 20 recetas y 13 consejos).

Eso crea las tablas, las reglas de seguridad (RLS), el trigger que arma el perfil al registrarse y el bucket **privado** `fotos` en Storage. Puedes ejecutarlos otra vez sin romper nada.

### ¿Tu base ya tenía usuarios? Ejecuta la migración (una sola vez)
Si ya habías ejecutado el `esquema.sql` anterior, **no borres nada**: ejecuta en el SQL Editor, en este orden:
1. `supabase/migracion-onboarding.sql`
2. `supabase/datos.sql`

La migración **solo agrega** cosas y se puede ejecutar varias veces:

| Qué | Para qué |
|---|---|
| `perfiles.lugar` (casa / gimnasio / ambos, por defecto casa) | decide qué ejercicios puede recibir cada usuario |
| `perfiles.dias_entreno` (0 = lunes … 6 = domingo) | los días que eligió; si está vacío se calculan con `meta_semanal` como antes |
| `perfiles.edad` (opcional) | dato básico del onboarding |
| `perfiles.plan_semanal` (jsonb) | la semana generada: qué rutina toca cada día |
| `ejercicios.equipo` y `ejercicios.musculos` | filtrar por lugar y mostrar los músculos en la ficha |
| trigger `crear_perfil` ampliado | guarda lugar, días, edad, altura y medidas iniciales al registrarse |

No cambia ninguna política RLS, no borra columnas ni usuarios, y `datos.sql` agrega los ejercicios nuevos **al final**, así que los ids de siempre no cambian.
Los usuarios antiguos quedan con "casa" y sus días de siempre, y en Inicio ven una tarjeta para completar sus preferencias.
Si subes el código **antes** de ejecutar la migración, la app sigue funcionando: arma la semana sin guardarla y avisa que faltan lugar y días.

### 3. Configura el inicio de sesión
Supabase → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000` (cuando publiques, tu dominio).
- **Redirect URLs:** agrega `http://localhost:3000/verificar` (y luego `https://tu-dominio.com/verificar`).

Opcional: pon los correos en español con `supabase/plantillas-correo.md`.
Por defecto Supabase pide **confirmar el correo** al registrarse; la app ya maneja ese paso. Si quieres entrar sin confirmar mientras pruebas, desactívalo en **Authentication → Sign In / Providers → Email → Confirm email**.

### 4. Pon las llaves
Supabase → **Project Settings → API** (o **API Keys**):

En Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

En macOS o Linux:

```bash
cp .env.example .env
```

| Variable | Dónde la encuentras |
|---|---|
| `SUPABASE_URL` | Project URL (`https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Llave pública: `anon` o `publishable` |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave secreta: `service_role` o `secret`. **Solo en el servidor**, nunca en el frontend ni en GitHub. Se usa para borrar cuentas. |
| `SITE_URL` | `http://localhost:3000` (tu dominio al publicar) |

### 5. Arranca
```bash
npm install
npm start
```

Abre **http://localhost:3000**. Para desarrollo: `npm run dev` (reinicia al guardar).

> ⚠ **No abras `public/index.html` con doble clic ni con Live Server.** La página necesita el servidor de Node para registrar, guardar y leer datos; sin él aparece "Failed to fetch". Si pasa, la app muestra un aviso explicando qué hacer.

### Cómo se conecta todo

```
Navegador ──(cookies httpOnly)──▶ Servidor Express ──(token del usuario)──▶ Supabase
                                        │                                   ├─ Auth (registro, login, correos)
  El navegador nunca ve las llaves      │                                   ├─ PostgreSQL con RLS
  ni habla directo con Supabase.        └─ llave secreta solo para          └─ Storage (bucket privado "fotos")
                                           borrar cuentas
```

Cada consulta se hace **como el usuario conectado**, así que aunque hubiera un error en el código, la base de datos (RLS) no deja ver ni cambiar datos de otra persona.

### Poner tu foto en el hero

La foto del hero está en `public/img/hero-atleta.png`. Cámbiala por otra con el mismo nombre (mejor PNG sin fondo).
El símbolo del logo (`img/logo-simbolo.png`) es el corredor recortado de tu `logo.png`.

---

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Landing** | Hero oscuro con la palabra FITTRACK, anillo lima y tu foto (el diseño original), cómo funciona, **demo con el generador real** (objetivo, lugar, nivel y tiempo, con la animación de cada ejercicio), vitrina de la app, objetivos |
| **Registro (modal)** | Onboarding en 7 pasos dentro de una ventana flotante: cuenta (con confirmar contraseña) → objetivo → lugar → nivel → días → tiempo → datos básicos y privacidad → **FitTrack arma tu semana** y te la muestra |
| **Inicio** | Tu entrenamiento de hoy (con la figura del primer ejercicio y botón Empezar), tu semana (✓ hecho · → próximo · ○ programado · — descanso), tu progreso (peso, cintura, entrenamientos, racha) y lo que está cambiando (gráfica de peso y minutos por semana) |
| **Rutinas** | La rutina de cada día de la semana, ficha de cada ejercicio (animación, músculos, duración, descanso, nivel, equipo e instrucciones), cambiar ejercicios, otra versión del día, rutina libre y rutinas guardadas |
| **Entrenamiento** | Pantalla completa: ejercicio X de N, figura animada, contador, barra de progreso, músculos, siguiente ejercicio, pausa, saltar, anterior y terminar antes (se guarda lo hecho) |
| **Progreso** | Pestañas Peso (gráfica con meta, anillo de avance, estadísticas), Medidas (gráfica y tabla) y Fotos (galería privada y comparador antes/después) |
| **Nutrición** | Plan de comidas del día según el objetivo, cambiar opciones, 20 recetas con ingredientes y pasos, consejo del día |
| **Calendario** | Tu semana con estados y leyenda, días cumplidos e historial del mes |
| **Perfil** | Preferencias de entreno (objetivo, nivel, lugar, días, tiempo; al cambiarlas pregunta si actualizar la semana), datos personales, privacidad y datos, contraseña, tema claro/oscuro |

Funciona en celular, tablet y escritorio: en pantallas de 1024 px o menos el menú lateral se cambia por una barra arriba y otra abajo.

---

## Seguridad

| Medida | Dónde |
|---|---|
| **Supabase Auth**: contraseñas cifradas, confirmación de correo, recuperación por enlace; mínimo 8 caracteres con letras y números | `rutas/auth.js`, `rutas/utilidades.js` |
| **RLS en PostgreSQL**: cada usuario solo lee/cambia sus filas; peso, medidas y fotos solo se guardan con autorización | `supabase/esquema.sql` |
| Tokens de Supabase en **cookies httpOnly + SameSite** (acceso 1 h, se renueva solo), solo HTTPS en producción | `middleware/auth.js` |
| Llave secreta de Supabase **solo en el servidor** y solo para borrar cuentas | `db/supabase.js`, `rutas/cuenta.js` |
| **Cabeceras de seguridad** con helmet: CSP que solo permite recursos del mismo sitio, anti-iframe, nosniff, referrer policy | `middleware/seguridad.js` |
| **Límite de intentos**: 10 logins/registros cada 15 min por IP; 300 peticiones/min en la API | `middleware/seguridad.js` |
| **Verificación de origen** en POST/PUT/DELETE (protección CSRF) | `middleware/seguridad.js` |
| Fotos en **bucket privado de Storage**, cada usuario en su carpeta; se revisa el contenido real del archivo | `rutas/fotos.js`, `supabase/esquema.sql` |
| Los textos se escapan antes de mostrarse (anti-XSS) | `js/api.js` |
| Errores internos nunca se muestran al usuario | `server.js` |
| Sin Google Fonts ni scripts externos: todo se sirve desde tu servidor | `public/fuentes` |

## Privacidad y datos (Ley 1581 de 2012 — Habeas Data)

- El registro exige aceptar **términos y política de datos** (se guarda la fecha).
- Peso, medidas y fotos son **datos sensibles**: se piden con una **autorización aparte y opcional**. Sin ella no se guardan (lo exigen el servidor **y** la base de datos).
- Desde **Perfil → Privacidad y datos** el usuario puede retirar la autorización, **descargar todos sus datos** (JSON) y **borrar su cuenta** (se eliminan también las fotos de Storage).
- Páginas legales: `/privacidad`, `/terminos`, `/cookies`.
- **Aviso de cookies**: solo hay cookies esenciales (la sesión), por eso el aviso es informativo.
- La política explica que Supabase aloja los datos como **encargado del tratamiento** (posible transferencia internacional).

> Los textos legales son una base sólida, pero **revísalos con un abogado** antes de publicar la app con usuarios reales. El responsable que aparece es Maturana Tech (tus datos de contacto); cámbialos en `public/privacidad.html` y `public/terminos.html` si hace falta.

---

## Estructura

```
fittrack/
├── server.js                 → arranca Express, seguridad, rutas y frontend
├── db/
│   ├── supabase.js           → conexión con Supabase y catálogos en memoria
│   ├── ejercicios.js         → 67 ejercicios con equipo y músculos (fuente de datos.sql)
│   ├── recetas.js            → 20 recetas (desayuno, almuerzo, cena, snack)
│   └── consejos.js           → consejos del día
├── middleware/
│   ├── auth.js               → sesión de Supabase en cookies y autorización de datos sensibles
│   └── seguridad.js          → helmet/CSP, límite de intentos, verificación de origen
├── rutas/
│   ├── auth.js               → registro, login, confirmación, recuperar contraseña, logout
│   ├── perfil.js             → ver y editar perfil
│   ├── cuenta.js             → exportar datos, contraseña, autorización, borrar cuenta
│   ├── rutinas.js            → GENERADOR de rutinas + guardadas
│   ├── plan.js               → la SEMANA: usa el generador una vez por día y la guarda en el perfil
│   ├── sesiones.js           → entrenamientos completados
│   ├── medidas.js            → peso y medidas
│   ├── fotos.js              → fotos en Supabase Storage (privadas)
│   ├── nutricion.js          → plan del día, recetas, consejos
│   ├── resumen.js            → datos del panel de inicio
│   └── utilidades.js         → fechas, números, reglas de contraseña
├── supabase/
│   ├── esquema.sql           → tablas, RLS, trigger y bucket de fotos (instalación nueva)
│   ├── migracion-onboarding.sql → solo si tu base ya existía: agrega lo del onboarding
│   ├── datos.sql             → ejercicios, recetas y consejos (ejecutar 2.º)
│   ├── generar-datos.js      → regenera datos.sql si cambias los catálogos (npm run sql)
│   └── plantillas-correo.md  → correos de Supabase en español
└── public/
    ├── index.html            → landing
    ├── app.html              → la app
    ├── verificar.html        → a donde llegan los enlaces de los correos
    ├── privacidad.html · terminos.html · cookies.html · 404.html
    ├── css/  base.css (colores, botones, formularios) · landing.css · app.css
    ├── img/  iconos.svg (íconos y pictogramas) · logo.png · logo-simbolo.png · hero-atleta.png (tu foto)
    ├── fuentes/              → Big Shoulders, Bricolage Grotesque, Instrument Sans (OFL)
    └── js/
        ├── tema.js           → claro (por defecto) / oscuro
        ├── cookies.js        → aviso de cookies
        ├── api.js            → api(), avisos, fechas, íconos
        ├── animaciones.js    → figuras animadas de cada ejercicio (SVG, sin videos)
        ├── landing.js        → hero, demo, modal de registro/onboarding, login y recuperar contraseña
        ├── verificar.js      → confirma la cuenta o crea la contraseña nueva
        ├── app.js            → navegación, pestañas, ventana modal
        ├── plan-semanal.js   → la semana del servidor y el estado de cada día
        ├── graficas.js       → barras, línea y anillo en SVG
        ├── inicio.js · rutinas.js · reproductor.js · progreso.js · fotos.js
        └── nutricion.js · calendario.js · perfil.js
```

## Colores (cámbialos en `public/css/base.css`)

| Variable | Claro | Oscuro | Uso |
|---|---|---|---|
| `--fondo` | `#F4F5F2` blanco perlado | `#050B0A` | fondo |
| `--fondo-2` | `#E8ECEA` gris claro | `#081110` | secciones alternas y footer |
| `--superficie` | `#FFFFFF` | `#0B1513` | tarjetas |
| `--tinta` | `#050B0A` | `#FFFFFF` | texto principal y botones negros |
| `--piedra` | `#5F6A65` | `#9AA39F` | texto secundario |
| `--lima` | `#B8FF3D` | `#B8FF3D` | acento: botones principales, indicadores, barras |
| `--acento` | `#3F7A00` | `#B8FF3D` | texto y líneas de acento (lima oscuro en claro para que se lea) |
| `--lima-suave` | `#DDF7B5` | lima al 12 % | fondos sutiles |

El modo oscuro está en el bloque `:root[data-tema="oscuro"]` del mismo archivo.

## Cómo se genera una rutina

`rutas/rutinas.js`: el objetivo define trabajo/descanso (grasa 40/20, músculo 45/30, resistencia 50/15, movilidad 45/10), el nivel lo ajusta, se elige un circuito de 4–6 ejercicios de grupos distintos y se calculan las rondas para llenar el tiempo, con calentamiento y enfriamiento. Las rondas se redondean al número más cercano sin pasarse más de 3 minutos, así que la duración real queda cerca de lo que elegiste.

- **Lugar**: en casa solo entran ejercicios sin equipo o con muebles (`equipo` = ninguno o casa); en gimnasio y ambos también los de máquinas y pesas (en gimnasio van primero).
- **Enfoque** (opcional): limita los grupos del circuito (tren superior, piernas + core, cardio…).

## Cómo se arma la semana

`rutas/plan.js` reparte un **enfoque** a cada día de entreno según el objetivo (por ejemplo, grasa: Full Body → Cardio intenso → Piernas + Core → Movilidad → Tren superior…; con 1–2 días, siempre Full Body) y llama al generador de arriba una vez por día. Los días libres quedan como *descanso activo* o *descanso*.
La semana se guarda en `perfiles.plan_semanal` y se repite cada lunes. Se vuelve a armar cuando el usuario cambia sus preferencias y dice que sí, o con "Otra versión de este día". Las sesiones hechas están en `sesiones`, así que nunca se pierden.

## Animaciones de los ejercicios

`public/js/animaciones.js` dibuja una figura en SVG (cadera, torso, cabeza, brazos y piernas) y la mueve entre poses clave; cada ejercicio tiene su movimiento (`EJERCICIOS` al final del archivo). Pesa unos pocos KB, no usa videos ni GIF, se pausa cuando no está en pantalla y respeta "reducir movimiento" del sistema.
Para un ejercicio nuevo: agrégalo **al final** de `db/ejercicios.js`, corre `npm run sql`, y en `animaciones.js` asígnale un movimiento existente (o crea uno copiando otro).

## Despliegue en Vercel con GitHub

1. Importa el repositorio desde GitHub en Vercel y deja la **Root Directory** en la carpeta del proyecto. Vercel detecta `server.js` como Express; no hace falta un comando de build.
2. En **Project Settings → Environment Variables**, agrega `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` y `SITE_URL`. Define `SITE_URL` con el dominio de producción, por ejemplo `https://tu-dominio.vercel.app`. Las llaves secretas van solo en Vercel, nunca en GitHub.
3. Despliega y copia el dominio asignado. En Supabase → **Authentication → URL Configuration**, úsalo como **Site URL** y agrega `https://tu-dominio.vercel.app/verificar` a **Redirect URLs**. Si usarás dominios de Preview, agrega también un patrón permitido que cubra únicamente tus previews.
4. Cada push a la rama conectada volverá a desplegar la app. Prueba registro, confirmación de correo, inicio de sesión y subida de fotos.

`vercel.json` habilita URLs limpias como `/app` y `/verificar`. Vercel sirve los archivos de `public/` desde su CDN. Las fotos tienen un límite de **4 MB** para respetar el máximo de 4,5 MB por petición de Vercel Functions.

## Antes de publicar

1. Configura un **SMTP propio** en Supabase (el correo gratuito envía muy pocos mensajes por hora).
2. Activa las copias de seguridad de Supabase (plan Pro) o exporta la base de vez en cuando.
3. Revisa los textos legales.

---

Hecho por **Luis Alexander Maturana — Maturana Tech** · Quibdó, Chocó
