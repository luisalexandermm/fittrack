# FitTrack

Rutinas de ejercicio en casa según **objetivo, tiempo y nivel**, con entrenador en pantalla completa, seguimiento de **peso, medidas y fotos**, **plan de comidas** con recetas de Colombia y del Pacífico, y **calendario semanal**.

Full stack: **Node.js + Express + Supabase** (PostgreSQL, Auth y Storage) · frontend en **HTML, CSS y JavaScript puro** (sin build).
Diseño propio: paleta **Carbón y perla** (blanco perlado) con un solo acento **arcilla**, tipografías servidas desde el propio servidor.

---

## Puesta en marcha con Supabase (paso a paso)

Necesitas **Node.js 22 o superior** y una cuenta gratis en [supabase.com](https://supabase.com).

### 1. Crea el proyecto
Supabase → **New project**. Elige una región cercana (por ejemplo *São Paulo* o *East US*) y guarda la contraseña de la base de datos.

### 2. Crea las tablas
Supabase → **SQL Editor** → **New query**:
1. Pega todo el archivo `supabase/esquema.sql` → **Run**.
2. Nueva consulta, pega `supabase/datos.sql` → **Run** (carga 51 ejercicios, 20 recetas y 13 consejos).

Eso crea las tablas, las reglas de seguridad (RLS), el trigger que arma el perfil al registrarse y el bucket **privado** `fotos` en Storage. Puedes ejecutarlos otra vez sin romper nada.

### 3. Configura el inicio de sesión
Supabase → **Authentication → URL Configuration**:
- **Site URL:** `http://localhost:3000` (cuando publiques, tu dominio).
- **Redirect URLs:** agrega `http://localhost:3000/verificar` (y luego `https://tu-dominio.com/verificar`).

Opcional: pon los correos en español con `supabase/plantillas-correo.md`.
Por defecto Supabase pide **confirmar el correo** al registrarse; la app ya maneja ese paso. Si quieres entrar sin confirmar mientras pruebas, desactívalo en **Authentication → Sign In / Providers → Email → Confirm email**.

### 4. Pon las llaves
Supabase → **Project Settings → API** (o **API Keys**):

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

Guarda una foto **PNG con fondo transparente** en `public/img/hero-atleta.png`.
Mientras no exista, el hero muestra un marcador con la forma del espacio.
Detalles en `public/img/LEEME.txt`.

---

## Qué tiene

| Sección | Qué hace |
|---|---|
| **Landing** | Hero oscuro con la palabra FITTRACK, anillo arcilla y tu foto delante; menú a pantalla completa; registro en 4 pasos (cuenta, objetivo, nivel/tiempo, privacidad) y login |
| **Inicio** | Objetivo con % de avance hacia la meta, peso/meta/grasa/cintura, plan de hoy según el calendario, semana y minutos por semana |
| **Rutinas** | Generador (objetivo, nivel, minutos), lista de ejercicios con pictogramas propios, cambiar ejercicios, guardar rutinas, entrenador con temporizador |
| **Progreso** | Pestañas Peso (gráfica con meta, anillo de avance, estadísticas), Medidas (gráfica y tabla) y Fotos (galería privada y comparador antes/después) |
| **Nutrición** | Plan de comidas del día según el objetivo, cambiar opciones, 20 recetas con ingredientes y pasos, consejo del día |
| **Calendario** | Semana planeada según tus días de entreno (rutina, movilidad, descanso activo, descanso), días cumplidos e historial del mes |
| **Perfil** | Datos, objetivos, configuración, privacidad y datos, contraseña, tema claro/oscuro, ayuda por WhatsApp |

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
│   ├── ejercicios.js         → 51 ejercicios sin equipo (fuente de datos.sql)
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
│   ├── sesiones.js           → entrenamientos completados
│   ├── medidas.js            → peso y medidas
│   ├── fotos.js              → fotos en Supabase Storage (privadas)
│   ├── nutricion.js          → plan del día, recetas, consejos
│   ├── resumen.js            → datos del panel de inicio
│   └── utilidades.js         → fechas, números, reglas de contraseña
├── supabase/
│   ├── esquema.sql           → tablas, RLS, trigger y bucket de fotos (ejecutar 1.º)
│   ├── datos.sql             → ejercicios, recetas y consejos (ejecutar 2.º)
│   ├── generar-datos.js      → regenera datos.sql si cambias los catálogos (npm run sql)
│   └── plantillas-correo.md  → correos de Supabase en español
└── public/
    ├── index.html            → landing
    ├── app.html              → la app
    ├── verificar.html        → a donde llegan los enlaces de los correos
    ├── privacidad.html · terminos.html · cookies.html · 404.html
    ├── css/  base.css (colores, botones, formularios) · landing.css · app.css
    ├── img/  iconos.svg (íconos y pictogramas propios) · favicon.svg · hero-atleta.png (tu foto)
    ├── fuentes/              → Big Shoulders, Bricolage Grotesque, Instrument Sans (OFL)
    └── js/
        ├── tema.js           → claro (por defecto) / oscuro
        ├── cookies.js        → aviso de cookies
        ├── api.js            → api(), avisos, fechas, íconos
        ├── landing.js        → hero, menú, registro, login y recuperar contraseña
        ├── verificar.js      → confirma la cuenta o crea la contraseña nueva
        ├── app.js            → navegación, pestañas, ventana modal
        ├── plan-semanal.js   → qué toca cada día
        ├── graficas.js       → barras, línea y anillo en SVG
        ├── inicio.js · rutinas.js · reproductor.js · progreso.js · fotos.js
        └── nutricion.js · calendario.js · perfil.js
```

## Colores (cámbialos en `public/css/base.css`)

| Variable | Claro | Uso |
|---|---|---|
| `--fondo` | `#F2F1ED` blanco perlado | fondo |
| `--tinta` | `#151311` carbón | texto y botones oscuros |
| `--arcilla` | `#9C4A2F` | el único color de acento |
| `--piedra` | `#8B877F` | textos de apoyo |

El modo oscuro está en el bloque `:root[data-tema="oscuro"]` del mismo archivo.

## Cómo se genera una rutina

`rutas/rutinas.js`: el objetivo define trabajo/descanso (grasa 40/20, músculo 45/30, resistencia 50/15, movilidad 45/10), el nivel lo ajusta, se elige un circuito de 4–6 ejercicios de grupos distintos y se calculan las rondas para llenar el tiempo, con calentamiento y enfriamiento. Solo cuenta rondas completas, por eso la duración real puede quedar unos minutos por debajo.

## Antes de publicar

1. En `.env` (o en las variables del hosting): `NODE_ENV=production` y `SITE_URL=https://tu-dominio.com`.
2. En Supabase agrega `https://tu-dominio.com/verificar` a **Redirect URLs** y cambia la **Site URL**.
3. Configura un **SMTP propio** en Supabase (el correo gratuito envía muy pocos mensajes por hora).
4. Sírvela con **HTTPS** (Render, Railway, Fly.io o un VPS). Como las fotos están en Storage, no importa que el hosting borre archivos al reiniciar.
5. Activa las copias de seguridad de Supabase (plan Pro) o exporta la base de vez en cuando.
6. Revisa los textos legales.

---

Hecho por **Luis Alexander Maturana — Maturana Tech** · Quibdó, Chocó
