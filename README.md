# Catán · Marcador de partida

Aplicación web para llevar los puntajes de una partida de Catán con hasta seis participantes. Permite administrar los contadores desde un dispositivo y mostrar el marcador en otros teléfonos, computadoras o televisores de la misma red.

## Funcionalidades

- Marcador público en `/`, con vistas adaptadas a móviles y pantallas grandes.
- Panel de administración en `/admin`, protegido por un PIN de ocho dígitos.
- Alta, baja y reordenamiento de participantes, con un color único por jugador.
- Edición de poblados, ciudades, caminos, ejércitos y puntos adicionales.
- Cálculo automático de totales y bonificaciones por camino más largo y ejército más grande.
- Actualización del marcador cada dos segundos, con animaciones de puntaje y celebración al alcanzar diez puntos.
- Persistencia de la partida en una base de datos compartida por el administrador y el marcador.
- Herramientas WebMCP para consultar el estado y actualizar contadores desde clientes compatibles, dentro de la sesión de administración.

El alcance actual es una única partida activa, sin historial ni salas simultáneas.

## Tecnologías usadas

| Tecnología | Uso en el proyecto |
| --- | --- |
| TypeScript | Tipado de la interfaz, las rutas y el modelo de la partida. |
| React 19 | Componentes de la interfaz. |
| vinext y Vite | Desarrollo y compilación de la aplicación, con rutas y APIs compatibles con Next.js App Router. |
| Tailwind CSS 4 | Estilos y diseño adaptable. |
| shadcn/ui y Base UI | Componentes de interfaz. |
| Lucide React | Iconos. |
| Motion y canvas-confetti | Animaciones del marcador y celebración de victoria. |
| Cloudflare Workers | Entorno de ejecución del servidor. |
| Cloudflare D1 | Base de datos SQLite. |
| Drizzle ORM y Drizzle Kit | Definición del esquema y generación de migraciones SQL. Las operaciones de la partida usan directamente la API de D1. |
| Wrangler y el plugin de Cloudflare para Vite | Ejecución y persistencia local del entorno de Cloudflare. |
| Oxlint y Oxfmt | Revisión y formato del código. |

Las versiones concretas están en [package.json](package.json); [package-lock.json](package-lock.json) fija las dependencias para una instalación reproducible.

## Ejecución local

### Requisitos

- Node.js **22.13.0 o superior**, según `package.json`.
- npm, incluido con Node.js.

Ejecutar los comandos desde la raíz del proyecto. En PowerShell, si la política de ejecución impide usar `npm` o `npx`, usar `npm.cmd` y `npx.cmd`.

### 1. Instalar dependencias

```sh
npm ci
```

### 2. Configurar el administrador

Copiar [.env.example](.env.example) a `.env`. En PowerShell:

```powershell
Copy-Item .env.example .env
```

Si ya existe `.env`, editarlo directamente. Configurar estas variables:

| Variable | Valor requerido |
| --- | --- |
| `ADMIN_PIN` | Un PIN de exactamente ocho dígitos. |
| `ADMIN_SESSION_SECRET` | Un secreto aleatorio de al menos 32 caracteres para firmar las sesiones. |

Reemplazar los valores de ejemplo. Para generar un secreto, se puede ejecutar:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

El archivo `.env` está excluido de Git. El servidor de desarrollo lee estas variables al iniciar; reiniciarlo después de modificarlas.

### 3. Inicializar la base local

La configuración usa el binding D1 `DB`, definido en `.openai/hosting.json`. Compilar para generar la configuración de Wrangler:

```sh
npm run build
```

En una **base local nueva**, ejecutar los archivos SQL en este orden:

```sh
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_black_edwin_jarvis.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_concerned_triton.sql
npx wrangler d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_foamy_wrecker.sql
```

Estos comandos modifican únicamente la base local. Ejecutar cada archivo una sola vez: si la base ya está inicializada, aplicar solamente los archivos pendientes. `db:generate` genera archivos de migración, pero no los aplica.

Los datos locales se conservan en `.wrangler/state/` entre reinicios.

### 4. Iniciar la aplicación

```sh
npm run dev
```

- Marcador: <http://localhost:3000>.
- Administración: <http://localhost:3000/admin>.

Ingresar el PIN configurado en `.env` para administrar la partida. Para detener el servidor, presionar `Ctrl+C` en la terminal.

### Acceso desde otros dispositivos

```sh
npm run dev:lan
```

Abrir `http://IP-DEL-EQUIPO:3000` desde un dispositivo conectado a la misma red. En Windows, usar `ipconfig` para consultar la dirección IPv4 del equipo y permitir el acceso de Node.js en redes privadas si el firewall lo solicita. El servidor debe permanecer encendido durante la partida.

Ver la [guía de ejecución local](docs/ejecucion-local.md) para más detalles.

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo. |
| `npm run dev:lan` | Inicia el servidor con acceso desde la red local. |
| `npm run build` | Genera la aplicación en `dist/`. |
| `npm start` | Ejecuta la compilación con Wrangler en modo local; requiere `npm run build` previo. |
| `npm run lint` | Revisa el código con Oxlint. |
| `npm run format` | Formatea el código con Oxfmt. |
| `npm run db:generate` | Genera migraciones a partir de `db/schema.ts`. |

La carga de `.env` para el administrador está implementada en el servidor de desarrollo de Vite. Al usar `npm start`, las variables del administrador deben configurarse también en el entorno de Wrangler.

## Puntuación

```text
total = poblados + (ciudades × 2) + puntos adicionales
        + (camino más largo: 2 puntos)
        + (ejército más grande: 2 puntos)
```

El camino más largo se asigna a partir de cinco caminos y el ejército más grande a partir de tres ejércitos. En caso de empate, la aplicación usa el orden en que cada jugador alcanzó la cantidad empatada. La cantidad de caminos representa el valor ingresado por el administrador; la aplicación no analiza la conexión de las piezas del tablero.

Al incrementar ciudades con el botón `+`, también se descuenta un poblado si hay alguno disponible. La edición numérica directa permite corregir los contadores por separado. Los valores se mantienen entre 0 y 99.

## Estructura del proyecto

```text
app/                  Páginas y rutas de la API
components/           Marcador, administración y componentes de interfaz
db/                   Esquema, conexión y operaciones de la partida
drizzle/              Migraciones SQL y metadatos
lib/                  Tipos, colores, autenticación y utilidades
types/                Declaraciones de WebMCP
public/               Archivos estáticos
docs/                 Documentación adicional
vite.config.ts        Configuración de Vite, vinext y Cloudflare
.openai/hosting.json  Configuración del proyecto y bindings de hosting
```

La API interna expone `GET /api/game` para consultar el marcador y `POST /api/game` para modificar la partida. Las modificaciones requieren una sesión de administración válida. El inicio y cierre de sesión usan `/api/admin/session`.

## Documentación adicional

- [Análisis funcional y arquitectura](docs/analisis.md).
- [Ejecución en Windows y acceso por red local](docs/ejecucion-local.md).
