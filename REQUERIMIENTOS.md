# NotiTrade - Especificación de Requerimientos del Proyecto

## 1. Descripción General

### 1.1 Propósito del Sistema

NotiTrade es un sistema autónomo de monitoreo del mercado de criptomonedas que opera 24/7. Su función principal es analizar indicadores técnicos del mercado, generar señales de compra/venta con puntuación de confianza y enviar alertas en tiempo real a Telegram cuando se detectan oportunidades de trading significativas.

### 1.2 Objetivo del Usuario

Permitir al trader mantenerse informado sobre oportunidades de mercado sin necesidad de monitorear gráficos constantemente. El sistema observa el mercado y notifica cuando surgen condiciones favorables.

### 1.3 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Package Manager | pnpm (monorepo workspaces) | >= 8 |
| Runtime | Node.js | >= 18 |
| Backend | Express + TypeScript | ES2022, NodeNext |
| Frontend | React + Vite + TypeScript | React 19, Vite 8 |
| Base de Datos | sql.js (SQLite WASM) | ^1.12 |
| Indicadores Técnicos | technicalindicators | ^3.1 |
| State Management | TanStack Query | ^5.100 |
| Gráficos | lightweight-charts | ^5.2 |
| Estilos | Tailwind CSS v4 | Utility-first |
| UI Components | Shadcn-style (local) | Sin librería externa |
| Scheduler | node-cron | ^3.0 |
| Telegram | node-telegram-bot-api | ^0.66 |

---

## 2. Requerimientos Funcionales

### 2.1 RF-001: Análisis Técnico del Mercado

**Descripción:** El sistema debe realizar análisis técnico completo del par de trading configurado.

**Criterios de Aceptación:**
- RF-001.1: El sistema debe obtener datos de velas (klines) diarios (210 períodos) y horarios (50 períodos) desde Binance.
- RF-001.2: El sistema debe calcular la Media Móvil Simple de 50 períodos (MA50) sobre precios de cierre diarios.
- RF-001.3: El sistema debe calcular la Media Móvil Simple de 200 períodos (MA200) sobre precios de cierre diarios.
- RF-001.4: El sistema debe calcular el Índice de Fuerza Relativa de 14 períodos (RSI) sobre datos horarios.
- RF-001.5: El sistema debe obtener el índice Fear & Greed de criptomonedas desde Alternative.me.
- RF-001.6: El sistema debe analizar la tendencia del volumen (spike, increasing, decreasing, normal).
- RF-001.7: El sistema debe detectar divergencias alcistas y bajistas entre precio y RSI en las últimas 20 velas horarias.
- RF-001.8: El análisis debe ejecutarse automáticamente cada N minutos según la configuración del usuario.
- RF-001.9: El análisis debe poder ejecutarse manualmente a petición del usuario desde el dashboard.

### 2.2 RF-002: Generación de Señales de Trading

**Descripción:** El sistema debe evaluar las condiciones del mercado y generar señales de trading con puntuación de confianza.

**Criterios de Aceptación:**

#### RF-002.1: Señal LONG (Compra)
- El sistema debe calcular una puntuación de 0 a 100 basada en los siguientes factores:

| Factor | Condición | Puntos |
|--------|-----------|--------|
| Precio vs MA200 | Precio por encima de MA200 | +25 |
| RSI profundo | RSI < 25 | +20 |
| RSI oversold | RSI < umbral configurado | +15 |
| Divergencia alcista | Detectada | +20 |
| Volumen spike | Detectado | +15 |
| Fear & Greed extremo | Valor < 25 | +15 |
| Fear & Greed bajo | Valor < 45 | +5 |

- **STRONG_BUY**: Puntuación >= 70
- **BUY**: Puntuación >= 50

#### RF-002.2: Señal SHORT (Venta)
- El sistema debe calcular una puntuación de 0 a 100 basada en los siguientes factores:

| Factor | Condición | Puntos |
|--------|-----------|--------|
| Precio vs MA200 | Precio por debajo de MA200 | +25 |
| RSI alto | RSI > 70 | +20 |
| RSI overbought | RSI > umbral configurado | +10 |
| Divergencia bajista | Detectada | +20 |
| Volumen decreciente | Detectado | +10 |
| Fear & Greed extremo | Valor > 75 | +15 |
| Fear & Greed alto | Valor > 55 | +5 |
| Anti-short-squeeze | Fear & Greed < 30 | -30 |

- **STRONG_SELL**: Puntuación >= 70
- **SELL**: Puntuación >= 50

#### RF-002.3: Gestión de Riesgo
- Cada señal debe incluir nivel de Stop Loss calculado.
- Cada señal debe incluir nivel de Take Profit calculado.
- Cada señal debe incluir nivel de invalidación.
- Cada señal debe incluir la relación Riesgo:Recompensa (R:R).

### 2.3 RF-003: Alertas por Telegram

**Descripción:** El sistema debe enviar notificaciones a Telegram cuando se detecten señales fuertes.

**Criterios de Aceptación:**
- RF-003.1: El sistema debe enviar alerta cuando se genere una señal STRONG_BUY.
- RF-003.2: El sistema debe enviar alerta cuando se genere una señal STRONG_SELL.
- RF-003.3: El sistema debe enviar un mensaje de inicio al arrancar el servicio con el estado actual del mercado y configuración.
- RF-003.4: Las alertas deben estar habilitadas/deshabilitadas según la configuración del usuario.
- RF-003.5: Si las credenciales de Telegram no están configuradas, el sistema debe registrar las alertas en consola sin fallar.
- RF-003.6: Las alertas deben enviarse en formato HTML legible.

### 2.4 RF-004: Persistencia de Datos

**Descripción:** El sistema debe almacenar históricamente los análisis y alertas generadas.

**Criterios de Aceptación:**
- RF-004.1: Cada análisis debe guardar un snapshot del mercado con: símbolo, precio, RSI, MA50, MA200, Fear & Greed y timestamp.
- RF-004.2: Cada alerta enviada debe registrarse con: símbolo, tipo (BUY/SELL), mensaje y timestamp.
- RF-004.3: La base de datos debe persistirse en disco después de cada escritura.
- RF-004.4: El sistema debe retornar los últimos 50 registros de alertas bajo petición.
- RF-004.5: El sistema debe retornar el último snapshot del mercado bajo petición.

### 2.5 RF-005: Configuración Persistente

**Descripción:** El sistema debe permitir configurar parámetros de análisis que se mantengan entre reinicios.

**Criterios de Aceptación:**
- RF-005.1: El usuario debe poder seleccionar el par de trading a monitorear.
- RF-005.2: El usuario debe poder configurar el intervalo de verificación en minutos (1-120).
- RF-005.3: El usuario debe poder configurar el umbral de RSI oversold (10-45).
- RF-005.4: El usuario debe poder configurar el umbral de RSI overbought (55-90).
- RF-005.5: El usuario debe poder habilitar/deshabilitar las alertas de Telegram.
- RF-005.6: La configuración debe persistirse en un archivo JSON y sobrevivir reinicios del servicio.
- RF-005.7: Al cambiar el intervalo o símbolo, el cron job debe reiniciarse automáticamente con la nueva configuración.

### 2.6 RF-006: Dashboard Visual

**Descripción:** El sistema debe proporcionar una interfaz web para visualizar el estado del mercado y las señales generadas.

**Criterios de Aceptación:**
- RF-006.1: El dashboard debe mostrar tarjetas de estadísticas con: Precio actual, RSI(14), MA50, MA200.
- RF-006.2: El dashboard debe mostrar un gráfico de velas con indicadores MA50 y MA200 superpuestos.
- RF-006.3: El gráfico debe incluir histograma de volumen.
- RF-006.4: El dashboard debe mostrar un medidor circular del índice Fear & Greed con código de color.
- RF-006.5: El dashboard debe mostrar paneles resumen de señales LONG y SHORT con barra de confianza.
- RF-006.6: Cada panel de señal debe mostrar los factores contribuyentes, Stop Loss, Take Profit y relación R:R.

### 2.7 RF-007: Vista Detallada de Señales

**Descripción:** El sistema debe proporcionar una vista con análisis detallado de las señales.

**Criterios de Aceptación:**
- RF-007.1: La vista debe mostrar paneles completos de señal LONG y SHORT con todos los factores.
- RF-007.2: La vista debe mostrar una matriz de confluencia que compare el estado actual de cada indicador vs. lo requerido para setups SHORT y LONG.
- RF-007.3: La matriz de confluencia debe incluir filas para: Precio vs MA200, RSI(14), Fear & Greed, Divergencia, Volumen.
- RF-007.4: La vista debe mostrar una tarjeta de gestión de riesgo con detalles de posición LONG y SHORT lado a lado.

### 2.8 RF-008: Historial de Alertas

**Descripción:** El sistema debe proporcionar una vista con el historial de alertas generadas.

**Criterios de Aceptación:**
- RF-008.1: La vista debe mostrar las últimas 50 alertas almacenadas.
- RF-008.2: Cada alerta debe mostrar badge de tipo (BUY/SELL), mensaje completo y timestamp relativo.
- RF-008.3: La vista debe mostrar un estado vacío cuando no existan alertas.

### 2.9 RF-009: Interfaz de Configuración

**Descripción:** El sistema debe proporcionar un formulario para modificar la configuración del sistema.

**Criterios de Aceptación:**
- RF-009.1: El formulario debe permitir seleccionar el par de trading de una lista predefinida.
- RF-009.2: El formulario debe validar los rangos de cada campo numérico.
- RF-009.3: El formulario debe incluir un toggle para habilitar/deshabilitar alertas.
- RF-009.4: Al guardar, el sistema debe confirmar la actualización y refrescar los datos.

---

## 3. Requerimientos No Funcionales

### 3.1 RNF-001: Rendimiento

- El análisis completo del mercado debe completarse en menos de 10 segundos.
- El dashboard debe cargar en menos de 3 segundos.
- Las consultas a la API deben tener un tiempo de respuesta menor a 2 segundos.
- El refresco automático del dashboard no debe impactar la experiencia del usuario.

### 3.2 RNF-002: Disponibilidad

- El sistema debe operar de forma continua 24/7 sin intervención manual.
- El cron job debe reiniciarse automáticamente ante cambios de configuración.
- El sistema debe realizar un análisis inicial al arrancar.

### 3.3 RNF-003: Confiabilidad

- El sistema debe manejar errores de red con Binance y Alternative.me sin caer.
- Las credenciales de Telegram ausentes no deben causar fallos del sistema.
- La base de datos debe persistirse correctamente después de cada escritura.

### 3.4 RNF-004: Seguridad

- Las credenciales de Telegram deben almacenarse exclusivamente en variables de entorno (`backend/.env`).
- El frontend nunca debe exponer tokens ni secrets.
- No se deben commitear archivos `.env`, `*.sqlite`, ni `settings.json` al repositorio.
- El backend debe usar `helmet` para headers de seguridad HTTP.
- El backend debe configurar CORS para orígenes autorizados.

### 3.5 RNF-005: Mantenibilidad

- Todo el código debe estar escrito en TypeScript estricto (`strict: true`).
- No se permite el uso de tipo `any` en el código.
- Los componentes React deben ser funcionales, nunca basados en clases.
- Los imports del frontend deben usar el alias `@/*`.
- La nomenclatura debe seguir las convenciones establecidas en `AGENTS.md`.

### 3.6 RNF-006: Escalabilidad

- El sistema debe soportar los siguientes pares de trading: BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT.
- El intervalo de verificación debe ser configurable entre 1 y 120 minutos.

---

## 4. Arquitectura del Sistema

### 4.1 Estructura del Proyecto

El proyecto está organizado como un monorepo pnpm con dos paquetes:

```
trade_noti/
├── backend/                    # Servidor Express + análisis + cron
│   ├── src/
│   │   ├── index.ts            # Entry point: Express + Cron + DB + Settings
│   │   ├── api/                # Clientes de APIs externas
│   │   │   ├── binance.ts      # Cliente Binance API
│   │   │   └── feargreed.ts    # Cliente Alternative.me API
│   │   ├── services/           # Lógica de negocio
│   │   │   ├── analyzer.ts     # Motor de análisis técnico
│   │   │   ├── settings.ts     # Configuración persistente
│   │   │   └── telegram.ts     # Servicio de alertas Telegram
│   │   ├── db/
│   │   │   └── database.ts     # SQLite (sql.js) init + queries
│   │   └── types/
│   │       └── index.ts        # Interfaces compartidas
│   └── data/                   # Archivos de runtime (gitignored)
│       ├── notitrade.sqlite    # Base de datos
│       └── settings.json       # Configuración
├── frontend/                   # Dashboard React
│   ├── src/
│   │   ├── main.tsx            # Entry point + QueryClient
│   │   ├── App.tsx             # Dashboard principal (4 tabs)
│   │   ├── components/
│   │   │   ├── PriceChart.tsx  # Wrapper de TradingView charts
│   │   │   └── ui/             # Componentes Shadcn-style
│   │   └── lib/
│   │       └── utils.ts        # Utilidades (cn)
│   └── vite.config.ts          # Config Vite + proxy /api
└── AGENTS.md                   # Guidelines para agentes IA
```

### 4.2 Diagrama de Flujo de Datos

```
[Inicio del Sistema]
       │
       ▼
┌─────────────────────────┐
│  initDatabase()         │  Carga/crea SQLite en memoria
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  loadSettings()         │  Lee data/settings.json
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  analyzeMarket()        │  Análisis inicial al arrancar
└─────────────────────────┘
       │
       ├───► Guarda snapshot en DB
       ├───► Envía mensaje de inicio a Telegram
       │
       ▼
┌─────────────────────────┐
│  startCronJob()         │  Agenda análisis periódico
└─────────────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Express en puerto 3001 │  Sirve API + frontend estático
└─────────────────────────┘

[Ciclo de Análisis Periódico]
       │
       ▼
┌──────────────────────────────────────────┐
│  1. fetchRawKlines() - Binance           │  Datos OHLCV
│  2. fetchFearGreedIndex() - Alternative  │  Sentimiento
│  3. SMA(50), SMA(200), RSI(14)           │  Indicadores
│  4. analyzeVolume()                      │  Tendencia volumen
│  5. detectDivergence()                   │  Divergencias RSI-precio
│  6. evaluateLongSignal() / evaluateShort │  Puntuación señales
│  7. Si STRONG_BUY/STRONG_SELL → Telegram │  Alerta
│  8. Insertar snapshot en DB              │  Persistencia
│  9. saveDatabase()                       │  Exportar a disco
└──────────────────────────────────────────┘

[Frontend - TanStack Query]
       │
       ├─── GET /api/market-status  (cada 30s)
       ├─── GET /api/analysis       (cada 60s)
       ├─── GET /api/alerts         (cada 60s)
       ├─── GET /api/settings       (bajo demanda)
       └─── GET /api/chart-data     (bajo demanda)
```

### 4.3 Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/health` | Health check: `{ status: 'ok', timestamp }` |
| `GET` | `/api/settings` | Retorna configuración actual |
| `PUT` | `/api/settings` | Actualiza configuración parcial |
| `POST` | `/api/analyze` | Ejecuta análisis manual y guarda en DB |
| `GET` | `/api/market-status` | Último snapshot del mercado |
| `GET` | `/api/analysis` | Análisis fresco completo (sin guardar) |
| `GET` | `/api/alerts` | Últimas 50 alertas |
| `GET` | `/api/chart-data` | Datos para gráfico (velas, volumen, MAs) |

### 4.4 Esquema de Base de Datos

#### Tabla: `market_snapshots`

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador único |
| `symbol` | TEXT | NOT NULL | Par de trading (ej: "BTCUSDT") |
| `price` | REAL | NOT NULL | Precio de cierre actual |
| `rsi` | REAL | - | RSI(14) horario |
| `ma50` | REAL | - | Media móvil simple 50 días |
| `ma200` | REAL | - | Media móvil simple 200 días |
| `fear_greed` | INTEGER | - | Índice Fear & Greed (0-100) |
| `timestamp` | TEXT | NOT NULL DEFAULT datetime('now') | Fecha/hora UTC |

#### Tabla: `alerts`

| Columna | Tipo | Restricción | Descripción |
|---------|------|-------------|-------------|
| `id` | INTEGER | PK AUTOINCREMENT | Identificador único |
| `symbol` | TEXT | NOT NULL | Par de trading |
| `type` | TEXT | NOT NULL | "BUY" o "SELL" |
| `message` | TEXT | NOT NULL | Mensaje HTML de la alerta |
| `timestamp` | TEXT | NOT NULL DEFAULT datetime('now') | Fecha/hora UTC |

---

## 5. Interfaces de Usuario

### 5.1 IU-001: Tab Dashboard

**Propósito:** Vista principal con resumen del estado del mercado.

**Componentes:**
- **4 Tarjetas de Estadísticas:** Precio, RSI(14), MA50, MA200 con iconos y subtítulos de estado.
- **Gráfico de Precio:** TradingView Lightweight Charts con velas japonesas, histograma de volumen, línea MA50 (ámbar) y línea MA200 (púrpura).
- **Medidor Fear & Greed:** Gauge circular SVG mostrando valor 0-100 con arco coloreado según sentimiento.
- **Paneles de Señales:** Paneles lado a lado LONG y SHORT con barra de confianza, factores contribuyentes, Stop Loss, Take Profit y ratio R:R.

### 5.2 IU-002: Tab Signals

**Propósito:** Vista detallada del análisis de señales y confluencia de indicadores.

**Componentes:**
- **Panel LONG Completo:** Barra de confianza, todos los factores con puntuación individual, Stop Loss, Take Profit, Nivel de Invalidación, Ratio R:R.
- **Panel SHORT Completo:** Misma estructura que el panel LONG.
- **Matriz de Confluencia:** Tabla comparativa que muestra el estado actual de cada indicador vs. lo requerido para setups SHORT y LONG. Filas: Precio vs MA200, RSI(14), Fear & Greed, Divergencia, Volumen.
- **Tarjeta de Gestión de Riesgo:** Detalles de posición LONG y SHORT lado a lado.

### 5.3 IU-003: Tab Alerts

**Propósito:** Historial de alertas generadas por el sistema.

**Componentes:**
- **Lista de Alertas:** Últimas 50 alertas con badge BUY/SELL, mensaje HTML y timestamp relativo (ej: "hace 5 minutos").
- **Estado Vacío:** Mensaje informativo cuando no existen alertas.

### 5.4 IU-004: Tab Settings

**Propósito:** Configuración del sistema de monitoreo.

**Componentes:**
- **Selector de Par de Trading:** Dropdown con 7 pares disponibles.
- **Intervalo de Verificación:** Input numérico (1-120 minutos).
- **Umbral RSI Oversold:** Input numérico (10-45).
- **Umbral RSI Overbought:** Input numérico (55-90).
- **Toggle Alertas Telegram:** Switch habilitar/deshabilitar.
- **Botón Guardar:** Persiste la configuración y reinicia el cron job si aplica.

---

## 6. Integraciones Externas

### 6.1 Binance API

**Base URL:** `https://api.binance.com/api/v3`

| Endpoint | Uso | Autenticación |
|----------|-----|---------------|
| `/klines` | Obtener datos OHLCV de velas | No requerida (pública) |
| `/ticker/price` | Obtener precio actual del ticker | No requerida (pública) |

**Datos obtenidos:**
- Velas diarias (210 períodos) para cálculo de MA50 y MA200.
- Velas horarias (50 períodos) para cálculo de RSI y detección de divergencias.

### 6.2 Alternative.me - Fear & Greed Index

**Base URL:** `https://api.alternative.me/fng/`

| Endpoint | Uso | Autenticación |
|----------|-----|---------------|
| `/fng/?limit=N` | Obtener índice de miedo y codicia | No requerida (pública) |

**Rango de valores:** 0-100
- 0-24: Miedo Extremo
- 25-44: Miedo
- 45-55: Neutral
- 56-75: Codicia
- 76-100: Codicia Extrema

### 6.3 Telegram Bot API

**Librería:** `node-telegram-bot-api`

| Función | Descripción |
|---------|-------------|
| `sendStartupMessage()` | Notificación de inicio del bot con configuración y estado del mercado |
| `sendAlert()` | Alerta de trading STRONG_BUY o STRONG_SELL |

**Variables de entorno requeridas:**
- `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram.
- `TELEGRAM_CHAT_ID`: ID del chat destino.

**Comportamiento sin credenciales:** Las alertas se registran en consola sin generar error.

---

## 7. Configuración

### 7.1 Variables de Entorno (`backend/.env`)

| Variable | Requerida | Valor por Defecto | Descripción |
|----------|-----------|-------------------|-------------|
| `TELEGRAM_BOT_TOKEN` | No | - | Token del bot de Telegram |
| `TELEGRAM_CHAT_ID` | No | - | ID del chat de Telegram destino |
| `PORT` | No | `3001` | Puerto del servidor Express |
| `FRONTEND_URL` | No | `http://localhost:5173` | Origen permitido para CORS |

### 7.2 Configuración de Aplicación (`data/settings.json`)

| Campo | Tipo | Valor por Defecto | Descripción |
|-------|------|-------------------|-------------|
| `symbol` | string | `BTCUSDT` | Par de trading a monitorear |
| `checkIntervalMinutes` | number | `15` | Intervalo del cron job en minutos |
| `rsiOversold` | number | `30` | Umbral RSI para señales de compra |
| `rsiOverbought` | number | `70` | Umbral RSI para señales de venta |
| `alertsEnabled` | boolean | `true` | Habilitar/deshabilitar alertas Telegram |

### 7.3 Pares de Trading Disponibles

| Símbolo | Nombre |
|---------|--------|
| `BTCUSDT` | Bitcoin / Tether |
| `ETHUSDT` | Ethereum / Tether |
| `SOLUSDT` | Solana / Tether |
| `BNBUSDT` | Binance Coin / Tether |
| `XRPUSDT` | Ripple / Tether |
| `ADAUSDT` | Cardano / Tether |
| `DOGEUSDT` | Dogecoin / Tether |

---

## 8. Comandos de Desarrollo

### 8.1 Desarrollo

```bash
pnpm dev              # Backend + frontend en paralelo
pnpm dev:backend      # Solo backend (tsx watch)
pnpm dev:frontend     # Solo frontend (Vite HMR)
```

### 8.2 Build

```bash
pnpm build            # Ambos proyectos
pnpm build:backend    # Solo backend → dist/
pnpm build:frontend   # Solo frontend → frontend/dist/
pnpm start:backend    # Ejecutar backend compilado
```

### 8.3 Acceso

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health Check | http://localhost:3001/health |

---

## 9. Tipos de Datos Principales

### 9.1 Tipos del Analizador

```typescript
type DivergenceType = 'bullish' | 'bearish' | null
type VolumeTrendType = 'increasing' | 'decreasing' | 'spike' | 'normal' | null
type PriceVsMaType = 'above' | 'below' | null
type SignalType = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL'
```

### 9.2 Interfaces del Analizador

```typescript
interface VolumeAnalysis {
  trend: VolumeTrendType
  currentVolume: number
  averageVolume: number
  isSpike: boolean
  spikeMultiplier: number
}

interface DivergenceAnalysis {
  type: DivergenceType
  strength: number  // 0-100
  description: string
}

interface SignalScore {
  type: SignalType
  confidence: number  // 0-100
  factors: string[]
  invalidationLevel: number
  riskRewardRatio: number
  stopLoss: number
  takeProfit: number
}

interface AnalysisResult {
  symbol: string
  price: number
  ma50: number
  ma200: number
  rsi: number
  fearGreed: number
  isBullish: boolean
  alert: { type: 'BUY' | 'SELL'; message: string } | null
  priceVsMa200: PriceVsMaType
  volume: VolumeAnalysis
  divergence: DivergenceAnalysis
  shortSignal: SignalScore
  longSignal: SignalScore
}
```

### 9.3 Interfaces de Datos Externos

```typescript
interface RawKline {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
}

interface FearGreedIndex {
  value: string
  valueClassification: string
  timestamp: string
}

interface AlertRecord {
  id: number
  symbol: string
  type: 'BUY' | 'SELL'
  message: string
  timestamp: string
}
```

---

## 10. Reglas de Negocio

### 10.1 Evaluación de Señales

- Una señal se considera **fuerte** (STRONG_BUY/STRONG_SELL) cuando la puntuación de confianza alcanza o supera 70 puntos.
- Una señal se considera **moderada** (BUY/SELL) cuando la puntuación alcanza o supera 50 puntos pero no llega a 70.
- Se requiere **confluencia de múltiples indicadores** para generar señales fuertes. Un solo indicador no es suficiente.

### 10.2 Regla Anti-Short-Squeeze

- Cuando el Fear & Greed está por debajo de 30, se penaliza la señal SHORT con -30 puntos.
- Esta regla previene señales de venta en condiciones de miedo extremo donde es probable un rebote (short squeeze).

### 10.3 Detección de Divergencias

- Se analizan las últimas 20 velas horarias.
- **Divergencia alcista:** El precio hace mínimos más bajos pero el RSI hace mínimos más altos.
- **Divergencia bajista:** El precio hace máximos más altos pero el RSI hace máximos más bajos.

### 10.4 Análisis de Volumen

- **Spike:** El volumen actual supera significativamente el promedio (multiplicador > umbral).
- **Increasing:** Tendencia de volumen creciente.
- **Decreasing:** Tendencia de volumen decreciente.
- **Normal:** Volumen dentro del rango esperado.

---

## 11. Convenciones de Código

### 11.1 Nomenclatura

| Elemento | Convención | Ejemplo |
|----------|-----------|---------|
| Componentes React | PascalCase | `PriceChart.tsx` |
| Módulos TypeScript | camelCase | `binance.ts`, `analyzer.ts` |
| Types/Interfaces | PascalCase | `MarketStatus`, `ChartData` |
| Variables/Funciones | camelCase | `fetchKlines`, `analyzeMarket` |
| Constantes | UPPER_SNAKE_CASE | `BASE_URL`, `DB_PATH` |
| Tablas DB | snake_case | `market_snapshots`, `alerts` |

### 11.2 Reglas de Código

- TypeScript estricto habilitado (`strict: true`).
- Prohibido el uso de `any`.
- Componentes React siempre funcionales (nunca clases).
- Imports del frontend usan alias `@/*`.
- Sin comentarios a menos que se solicite explícitamente.
- Sin emojis en código.

---

## 12. Checklist de Verificación Pre-Commit

- [ ] TypeScript compila sin errores (`pnpm build`)
- [ ] No hay `any` en el código
- [ ] No hay variables de entorno expuestas
- [ ] No hay renders innecesarios en componentes React
- [ ] Los imports usan el alias `@/*` correctamente
- [ ] El código sigue las convenciones de nomenclatura
- [ ] Backend compila: `pnpm build:backend`
- [ ] Frontend compila: `pnpm build:frontend`
