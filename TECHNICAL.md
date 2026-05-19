# NotiTrade - Technical Documentation

> Documentación técnica para agentes y desarrolladores del proyecto NotiTrade.

---

## Arquitectura del Sistema

```
[ APIs Públicas ] ──────────────────────────────────────────────┐
  Binance (Precios)                                              │
  Alternative.me (Fear & Greed)                                  │
        │                                                        │
        ▼                                                        │
[ Backend (Node.js + Express) ] ◄───────────────────────────────┘
  │                                                              │
  ├── Cron Job (cada 15 min)                                     │
  │     ├── Consulta APIs                                        │
  │     ├── Calcula indicadores (SMA, RSI)                       │
  │     ├── Evalúa condiciones de alerta                         │
  │     ├── Guarda snapshot en SQLite                            │
  │     └── Envía Telegram si hay alerta                         │
  │                                                              │
  ├── REST API                                                   │
  │     ├── GET /api/market-status                               │
  │     ├── GET /api/alerts                                      │
  │     ├── GET /api/chart-data                                  │
  │     └── GET /health                                          │
  │                                                              │
  └── SQLite (sql.js)                                            │
        ├── market_snapshots                                     │
        └── alerts                                               │
        │                                                        │
        ▼                                                        │
[ Frontend (React + Vite) ] ◄───────────────────────────────────┘
  │                                                              │
  ├── TanStack Query (caching + auto-refetch)                    │
  ├── TradingView Lightweight Charts                             │
  ├── Tailwind CSS v4                                            │
  └── Vite Proxy (/api → localhost:3001)                         │
```

---

## Stack Tecnológico

### Backend

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Runtime | Node.js | >= 18 | Entorno de ejecución |
| Lenguaje | TypeScript | ^5.7 | Type safety |
| Framework | Express | ^5.2 | HTTP server + routing |
| Scheduler | node-cron | ^3.0 | Cron jobs |
| Base de datos | sql.js | ^1.12 | SQLite en memoria (WebAssembly) |
| Indicadores | technicalindicators | ^3.1 | SMA, RSI, y más |
| Telegram | node-telegram-bot-api | ^0.66 | Envío de alertas |
| Seguridad | helmet | ^8.1 | HTTP security headers |
| CORS | cors | ^2.8 | Cross-origin requests |
| Config | dotenv | ^16.4 | Variables de entorno |
| Dev runner | tsx | ^4.19 | TypeScript execution sin build |

### Frontend

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| Framework | React | ^19.2 | UI library |
| Build tool | Vite | ^8.0 | Bundler + dev server |
| Lenguaje | TypeScript | ~6.0 | Type safety |
| Query/TanStack Query | @tanstack/react-query | ^5.100 | Data fetching + caching |
| Gráficas | lightweight-charts | ^5.2 | TradingView charting |
| Estilos | Tailwind CSS | ^4.3 | Utility-first CSS |
| Tailwind Vite plugin | @tailwindcss/vite | ^4.3 | Tailwind integration |

### Package Manager

- **pnpm** >= 8.0 - Monorepo workspace management

---

## Estructura del Proyecto

```
noti_trade/
├── package.json                    # Root workspace scripts
├── pnpm-workspace.yaml             # pnpm workspace config
├── .gitignore
├── README.md                       # Documentación para usuarios
├── TECHNICAL.md                    # Documentación técnica (este archivo)
│
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                        # Variables de entorno (NO commitear)
│   ├── .env.example                # Template de variables
│   ├── data/                       # SQLite database (generado en runtime)
│   │   └── notitrade.sqlite
│   └── src/
│       ├── index.ts                # Entry point: Express + Cron + DB init
│       ├── api/
│       │   ├── binance.ts          # Binance API client (klines, precios)
│       │   ├── feargreed.ts        # Alternative.me API client
│       │   └── routes.ts           # Express router (endpoints REST)
│       ├── services/
│       │   ├── analyzer.ts         # Lógica principal de análisis
│       │   └── telegram.ts         # Servicio de alertas Telegram
│       ├── db/
│       │   └── database.ts         # SQLite init, queries, persistencia
│       ├── types/
│       │   ├── index.ts            # Interfaces compartidas
│       │   └── sql-js.d.ts         # Type declarations para sql.js
│       └── utils/                  # (reservado para utilidades)
│
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Vite config + proxy
    ├── tsconfig.json
    ├── .env.example                # Template de variables
    └── src/
        ├── main.tsx                # Entry point + QueryClient provider
        ├── index.css               # Tailwind + base styles
        ├── App.tsx                 # Dashboard principal
        └── components/
            └── PriceChart.tsx      # TradingView Lightweight Charts wrapper
```

---

## Nomenclatura

### Convenciones de Archivos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Components React | PascalCase | `PriceChart.tsx` |
| Módulos TypeScript | camelCase | `binance.ts`, `analyzer.ts` |
| Types/Interfaces | PascalCase | `MarketStatus`, `ChartData` |
| Variables/Funciones | camelCase | `fetchKlines`, `analyzeMarket` |
| Constantes | UPPER_SNAKE_CASE | `BASE_URL`, `DB_PATH` |
| Tablas DB | snake_case | `market_snapshots`, `fear_greed` |

### Convenciones de API

| Endpoint | Método | Query Params | Respuesta |
|----------|--------|-------------|-----------|
| `/api/market-status` | GET | - | `MarketStatus` |
| `/api/alerts` | GET | - | `Alert[]` |
| `/api/chart-data` | GET | `symbol`, `interval`, `limit` | `ChartData` |
| `/health` | GET | - | `{ status, timestamp }` |

---

## Base de Datos (SQLite via sql.js)

### ¿Por qué sql.js?

sql.js es SQLite compilado a WebAssembly. No requiere dependencias nativas ni compilación C++, lo que lo hace portable en cualquier plataforma (Windows, Linux, macOS) y compatible con serverless.

### Tabla: `market_snapshots`

Almacena un snapshot del mercado cada vez que se ejecuta el análisis.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | Identificador único |
| `symbol` | TEXT NOT NULL | Par de trading (ej: "BTCUSDT") |
| `price` | REAL NOT NULL | Precio actual de cierre |
| `rsi` | REAL | Valor RSI(14) horario |
| `ma50` | REAL | Media móvil de 50 días |
| `ma200` | REAL | Media móvil de 200 días |
| `fear_greed` | INTEGER | Índice de Miedo y Codicia (0-100) |
| `timestamp` | TEXT NOT NULL | Timestamp UTC (datetime('now')) |

### Tabla: `alerts`

Almacena las alertas generadas por el sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | Identificador único |
| `symbol` | TEXT NOT NULL | Par de trading |
| `type` | TEXT NOT NULL | Tipo: "BUY" o "SELL" |
| `message` | TEXT NOT NULL | Mensaje completo de la alerta |
| `timestamp` | TEXT NOT NULL | Timestamp UTC (datetime('now')) |

### Persistencia

sql.js opera en memoria. La función `saveDatabase()` exporta la base de datos a un archivo binario en `data/notitrade.sqlite`. Al iniciar, si el archivo existe, se carga desde disco.

### Ubicación

`data/notitrade.sqlite` está en `.gitignore` — no se commitea.

---

## Variables de Entorno

### Backend (`.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `TELEGRAM_BOT_TOKEN` | Sí* | - | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | Sí* | - | ID del chat donde enviar alertas |
| `PORT` | No | `3001` | Puerto del servidor Express |
| `FRONTEND_URL` | No | `http://localhost:5173` | URL del frontend para CORS |
| `CHECK_INTERVAL_MINUTES` | No | `15` | Intervalo del cron job en minutos |

*Si no se configuran, las alertas se loguean en consola en lugar de enviarse por Telegram.

### Frontend

No requiere variables de entorno. Usa el proxy de Vite para redirigir `/api` al backend.

---

## Funciones Principales del Sistema

### `analyzeMarket(symbol: string)` — `backend/src/services/analyzer.ts`

Función central del sistema. Ejecutada por el cron job cada N minutos.

**Flujo:**
1. Obtiene 210 velas diarias de Binance (necesarias para MA200)
2. Obtiene 20 velas horarias de Binance (para RSI)
3. Calcula SMA(50) y SMA(200) sobre datos diarios
4. Calcula RSI(14) sobre datos horarios
5. Obtiene Fear & Greed Index de Alternative.me
6. Determina si el mercado es alcista (MA50 > MA200)
7. Evalúa condiciones de alerta:
   - **BUY**: alcista + RSI < 30
   - **SELL**: bajista + RSI > 70
8. Si hay alerta, envía por Telegram y guarda en DB
9. Guarda snapshot en `market_snapshots`
10. Persiste la base de datos a disco

**Retorna:** `AnalysisResult` con todos los valores calculados.

### `getChartData(symbol, interval, limit)` — `backend/src/services/analyzer.ts`

Prepara datos para el gráfico de TradingView.

**Retorna:**
- `candles`: Array de OHLC para velas japonesas
- `volume`: Array con volumen y color condicional
- `ma50`: Array de puntos para la línea MA50
- `ma200`: Array de puntos para la línea MA200

**Nota:** Los timestamps se convierten a Unix epoch (segundos) como `number`, compatible con `UTCTimestamp` de lightweight-charts.

### `sendAlert(message: string)` — `backend/src/services/telegram.ts`

Envía un mensaje al chat de Telegram configurado.

**Comportamiento:**
- Si `TELEGRAM_BOT_TOKEN` o `TELEGRAM_CHAT_ID` no están configurados, loguea el mensaje en consola en lugar de fallar.
- Usa `parse_mode: 'HTML'` para formato enriquecido.
- Captura errores y los loguea sin interrumpir el flujo.

### `initDatabase()` — `backend/src/db/database.ts`

Inicializa la conexión a SQLite.

**Comportamiento:**
1. Carga `sql.js` (WebAssembly)
2. Si existe `data/notitrade.sqlite`, lo carga desde disco
3. Si no existe, crea una base de datos nueva en memoria
4. Crea las tablas `alerts` y `market_snapshots` si no existen
5. Persiste la estructura inicial a disco

### `createMarketRouter()` — `backend/src/api/routes.ts`

Crea el Express Router con todos los endpoints.

**Endpoints:**
- `GET /api/market-status`: Último snapshot de mercado
- `GET /api/alerts`: Últimas 50 alertas ordenadas por fecha
- `GET /api/chart-data`: Datos para el gráfico (velas, volumen, MAs)

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Corre backend + frontend en paralelo |
| `pnpm dev:backend` | Solo backend con hot reload (tsx watch) |
| `pnpm dev:frontend` | Solo frontend con Vite dev server |
| `pnpm build` | Build de ambos proyectos |
| `pnpm build:backend` | Compila TypeScript a JavaScript |
| `pnpm build:frontend` | Build de producción del frontend |
| `pnpm start:backend` | Corre el backend compilado |

---

## Vite Proxy Configuration

El frontend usa el proxy de Vite para evitar problemas de CORS durante desarrollo:

```ts
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

Esto significa que las peticiones a `/api/*` en el frontend (puerto 5173) se reenvían automáticamente al backend (puerto 3001). No se necesitan variables de entorno en el frontend.

---

## Notas para Agentes

### Al modificar el backend

- El código se ejecuta con `tsx watch`, los cambios se aplican automáticamente.
- La base de datos se guarda en `data/notitrade.sqlite`. Si necesitas resetear, elimina el archivo.
- Las alertas de Telegram requieren `TELEGRAM_BOT_TOKEN` y `TELEGRAM_CHAT_ID` en `.env`.

### Al modificar el frontend

- Vite tiene hot module replacement (HMR), los cambios se reflejan instantáneamente.
- Si cambias `vite.config.ts`, necesitas reiniciar el servidor.
- El proxy de Vite solo funciona en desarrollo. En producción, el backend debe tener CORS configurado correctamente.

### Agregar nuevos indicadores

1. Instalar la librería en `technicalindicators` o crear la función manualmente.
2. Agregar el cálculo en `analyzeMarket()` y `getChartData()`.
3. Agregar la columna en `market_snapshots` si necesitas persistencia.
4. Agregar la serie en `PriceChart.tsx` si es visual.
5. Exponer en el endpoint correspondiente en `routes.ts`.

### Agregar nuevos símbolos

El parámetro `symbol` en `analyzeMarket()` y `getChartData()` acepta cualquier par válido de Binance (ej: `ETHUSDT`, `SOLUSDT`). Para soportar múltiples símbolos simultáneamente, se necesitaría iterar sobre un array de símbolos en el cron job.
