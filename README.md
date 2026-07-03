# NotiTrade

> Tu analista de criptomonedas personal con alertas automáticas en Telegram y panel de control visual.

## Objetivo

NotiTrade es un sistema autónomo que monitorea el mercado de criptomonedas 24/7 sin que necesites tener una pestaña abierta todo el día. Analiza precios, calcula indicadores técnicos y te envía alertas directamente a tu celular por Telegram cuando detecta oportunidades de compra o venta.

---

## ¿Qué es Criptomonedas?

Las **criptomonedas** son monedas digitales que funcionan sin un banco central ni gobierno. Usan tecnología llamada **blockchain** (cadena de bloques) para registrar transacciones de forma segura y transparente.

- **Bitcoin (BTC)**: La primera y más conocida criptomoneda, creada en 2009.
- **USDT (Tether)**: Una "stablecoin" que vale siempre $1 USD, usada como referencia de precio.
- **BTCUSDT**: El par de trading que indica cuántos USDT necesitas para comprar 1 Bitcoin.

---

## ¿Qué Tipo de Análisis Realiza NotiTrade?

NotiTrade utiliza **análisis técnico**, que es el estudio de gráficos y patrones de precios pasados para intentar predecir movimientos futuros. No predice el futuro, pero identifica condiciones del mercado que históricamente han sido relevantes.

### Indicadores que Calcula

#### RSI (Relative Strength Index - Índice de Fuerza Relativa)

- **Qué es**: Un oscilador que mide la velocidad y magnitud de los movimientos de precio.
- **Rango**: Va de 0 a 100.
- **Cómo leerlo**:
  - **RSI < 30**: El activo está en **sobreventa** (posiblemente cayó demasiado rápido, podría rebotar).
  - **RSI > 70**: El activo está en **sobrecompra** (posiblemente subió demasiado rápido, podría corregir).
  - **RSI entre 30 y 70**: Zona neutral.
- **Período**: NotiTrade usa RSI de 14 períodos (el estándar de la industria).

#### MA50 (Moving Average 50 - Media Móvil de 50 períodos)

- **Qué es**: El precio promedio de los últimos 50 días. Suaviza el ruido del mercado para mostrar la tendencia a mediano plazo.
- **Cómo leerlo**: Si el precio actual está por encima de la MA50, la tendencia a mediano plazo es alcista. Si está por debajo, es bajista.

#### MA200 (Moving Average 200 - Media Móvil de 200 períodos)

- **Qué es**: El precio promedio de los últimos 200 días. Es el indicador de tendencia a largo plazo más respetado por traders institucionales.
- **Cómo leerlo**: Si el precio está por encima de la MA200, el mercado está en tendencia alcista a largo plazo. Si está por debajo, en tendencia bajista.

#### Cruce de Medias (MA50 vs MA200)

- **MA50 > MA200**: Señal alcista. El precio a corto plazo está subiendo más rápido que el promedio largo.
- **MA50 < MA200**: Señal bajista. El precio a corto plazo está cayendo respecto al promedio largo.

#### Fear & Greed Index (Índice de Miedo y Codicia)

- **Qué es**: Un indicador que mide el sentimiento del mercado basándose en volatilidad, volumen, redes sociales y dominancia de Bitcoin.
- **Rango**: 0 a 100.
- **Cómo leerlo**:
  - **0-20 (Miedo Extremo)**: Los inversores tienen mucho miedo. Históricamente puede ser buena zona de compra.
  - **21-40 (Miedo)**: Sentimiento negativo.
  - **41-60 (Neutral)**: Equilibrio entre optimismo y pesimismo.
  - **61-80 (Codicia)**: Los inversores son optimistas.
  - **81-100 (Codicia Extrema)**: Euforia del mercado. Precaución, posibles correcciones.

---

## Cómo Funcionan las Alertas

NotiTrade utiliza un **sistema de puntuación por confluencia** que combina múltiples indicadores para generar señales de compra y venta con niveles de confianza.

### Sistema de Señales (0-100 puntos)

Cada señal (LONG o SHORT) se evalúa independientemente sumando puntos según la confluencia de factores:

#### Señal LONG (Compra) 🟢

| Factor | Puntos | Condición |
|--------|--------|-----------|
| Precio sobre MA200 | +25 | Tendencia alcista macro |
| RSI < 25 | +20 | Sobreventa profunda |
| RSI < umbral | +15 | Sobreventa moderada |
| Divergencia alcista | +20 | Agotamiento de vendedores |
| Volume spike | +15 | Capitulación detectada |
| Fear & Greed < 25 | +15 | Miedo extremo (zona acumulación) |
| Fear & Greed < 45 | +5 | Miedo moderado |

**Clasificación:**
- `STRONG_BUY`: confianza >= 70 → Alerta Telegram
- `BUY`: confianza >= 50
- `NEUTRAL`: confianza < 50

#### Señal SHORT (Venta) 🔴

| Factor | Puntos | Condición |
|--------|--------|-----------|
| Precio bajo MA200 | +25 | Tendencia bajista macro |
| RSI > 70 | +20 | Sobrecompra fuerte |
| RSI > umbral | +10 | Sobrecompra moderada |
| Divergencia bajista | +20 | Fatiga de compradores |
| Volumen decreciente | +10 | Débil interés de compra |
| Fear & Greed > 75 | +15 | Euforia del mercado |
| Fear & Greed > 55 | +5 | Optimismo moderado |
| **Fear & Greed < 30** | **-30** | ⚠️ Riesgo short squeeze |

**Clasificación:**
- `STRONG_SELL`: confianza >= 70 → Alerta Telegram
- `SELL`: confianza >= 50
- `NEUTRAL`: confianza < 50

### Detección de Divergencias

NotiTrade analiza las últimas 20 velas horarias para detectar divergencias entre precio y RSI:

- **Divergencia Alcista**: Precio hace mínimo más bajo pero RSI hace mínimo más alto → señal de agotamiento de vendedores
- **Divergencia Bajista**: Precio hace máximo más alto pero RSI hace máximo más bajo → señal de fatiga de compradores

### Análisis de Volumen

El sistema clasifica el volumen en 4 categorías:

- **Spike**: Volumen actual > 2x el promedio → posible capitulación (señal LONG)
- **Increasing**: Tendencia alcista de volumen
- **Decreasing**: Volumen decreciente en rebote → posible bull trap (señal SHORT)
- **Normal**: Sin desviación significativa

### Gestión de Riesgo

Cada señal incluye automáticamente:

- **Stop Loss**: Nivel de invalidación de la tesis
  - LONG: 1% bajo MA200
  - SHORT: 1% sobre MA50
- **Take Profit**: Objetivo con ratio 2:1 mínimo
- **R:R Ratio**: Relación riesgo/beneficio calculada

> ⚠️ **Regla Anti-Suicidio**: Nunca se recomienda SHORT si el Fear & Greed está bajo 30. El riesgo de short squeeze es extremadamente alto.

---

## Entendiendo el Gráfico

El panel principal muestra un gráfico de velas japonesas con varios elementos:

### Velas Japonesas (Candlesticks)

Cada vela representa un período de tiempo (en NotiTrade, 1 día por defecto) y muestra 4 valores:

- **Apertura (Open)**: Precio al inicio del período.
- **Cierre (Close)**: Precio al final del período.
- **Máximo (High)**: Precio más alto alcanzado.
- **Mínimo (Low)**: Precio más bajo alcanzado.

**Colores**:
- 🟢 **Vela verde**: El precio de cierre fue mayor que el de apertura (subió).
- 🔴 **Vela roja**: El precio de cierre fue menor que el de apertura (bajó).

**Mecha (Wick)**: Las líneas finas arriba y abajo del cuerpo de la vela muestran el máximo y mínimo del período.

### Histograma de Volumen

Las barras en la parte inferior del gráfico muestran cuánto se negoció en cada período:
- **Barras más altas** = más volumen (más actividad de compra/venta).
- **Barras verdes** = volumen en períodos alcistas.
- **Barras rojas** = volumen en períodos bajistas.
- El volumen confirma la fuerza de un movimiento: una subida con alto volumen es más significativa que una con bajo volumen.

### Líneas de Media Móvil (Overlay)

- **Línea ámbar (MA50)**: Media móvil de 50 días. Tendencia a mediano plazo.
- **Línea púrpura (MA200)**: Media móvil de 200 días. Tendencia a largo plazo.
- Cuando la línea ámbar cruza por encima de la púrpura, es una señal alcista.
- Cuando la línea ámbar cruza por debajo de la púrpura, es una señal bajista.

### Gauge de Miedo y Codicia

El círculo en la parte derecha muestra el Fear & Greed Index actual:
- El número central es el valor (0-100).
- El color del arco indica la zona: rojo (miedo), amarillo (neutral), verde (codicia).

---

## Fuentes de Datos

NotiTrade utiliza APIs públicas y gratuitas:

- **Binance**: Precios y datos históricos de velas.
- **Alternative.me**: Índice de Miedo y Codicia.
- **Telegram Bot API**: Envío de alertas a tu celular.

No necesitas pagar por ningún dato ni suscripción.

---

## Interfaz de Usuario

El dashboard está organizado con componentes profesionales (basados en Shadcn UI):

- **Cards**: Tarjetas con bordes sutiles que contienen cada sección del dashboard (estadísticas, gráfico, índice de sentimiento, alertas).
- **Badges**: Etiquetas de color que indican el estado del mercado (verde = Bullish/Compra, rojo = Bearish/Venta).
- **Tabs**: Navegación por pestañas para cambiar entre las vistas del Dashboard, Signals, Alertas y Configuración.
- **Iconos**: Indicadores visuales (flechas de tendencia, actividad, reloj) que complementan la información numérica.
- **Botón de Refresh**: Icono de flechas circulares en el header para actualizar los datos manualmente.

### Tabs del Dashboard

#### Dashboard
Vista principal con estadísticas en tiempo real:
- 4 tarjetas: Precio, RSI(14), MA50, MA200
- Gráfico de velas japonesas con líneas MA50/MA200
- Gauge de Fear & Greed Index
- Paneles resumen de señales LONG y SHORT

#### Signals
Análisis detallado para toma de decisiones:
- **Paneles de señal LONG/SHORT**: Confianza, factores contribuyentes, Stop Loss, Take Profit, R:R ratio
- **Matriz de Confluencia**: Tabla comparativa que muestra qué indica cada indicador vs lo que se necesita para SHORT o LONG
- **Gestión de Riesgo**: Niveles de invalidación, Stop Loss, Take Profit y ratio riesgo/beneficio para ambas posiciones

#### Alerts
Historial de las últimas 50 alertas generadas por el sistema con tipo (BUY/SELL), mensaje y tiempo transcurrido.

#### Settings
Configuración de parámetros del sistema (par de trading, intervalo, umbrales RSI, activación de alertas Telegram).

---

## Panel de Configuración

Desde la pestaña **Settings** puedes ajustar los parámetros del sistema sin tocar código:

- **Trading Pair**: Selecciona qué par analizar (BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT, XRP/USDT, ADA/USDT, DOGE/USDT).
- **Intervalo de Análisis**: Cada cuántos minutos el backend consulta el mercado (1-120 minutos).
- **Umbral RSI Sobreventa**: Valor por debajo del cual se genera una alerta de compra (por defecto 30).
- **Umbral RSI Sobrecompra**: Valor por encima del cual se genera una alerta de venta (por defecto 70).
- **Alertas Telegram**: Interruptor para activar o desactivar el envío de alertas a Telegram.

Los cambios se aplican inmediatamente y el cron job se reinicia con la nueva configuración.

---

## Cómo Leer las Señales

### Interpretación de Confianza

| Rango | Señal | Acción Recomendada |
|-------|-------|-------------------|
| 70-100 | STRONG_BUY / STRONG_SELL | Alta confluencia - considerar entrada |
| 50-69 | BUY / SELL | Confluencia moderada - esperar confirmación |
| 30-49 | NEUTRAL | Sin confluencia clara - no operar |
| 0-29 | NEUTRAL | Condiciones opuestas - evitar operar |

### Matriz de Decisión Rápida

| Indicador | Para SHORT | Para LONG |
|-----------|-----------|-----------|
| Precio vs MA200 | Por debajo | Por encima |
| RSI (14) | > 70 o divergencia bajista | < 30 o divergencia alcista |
| Fear & Greed | > 75 (Codicia Extrema) | < 25 (Miedo Extremo) |
| Volumen | Decreciente en rebote | Spike de capitulación |

### Stop Loss y Take Profit

Cada señal incluye automáticamente niveles de gestión de riesgo:

- **Stop Loss**: Nivel donde tu tesis queda invalidada
- **Take Profit**: Objetivo con ratio mínimo 2:1
- **R:R Ratio**: Cuánto ganas por cada dólar arriesgado

> ⚠️ **Nunca operes sin Stop Loss**. Si el precio rompe tu nivel de invalidación, sal de la posición inmediatamente.

---

## Ejemplo de Alerta Telegram

### Alerta de Compra Fuerte
```
🟢 ALERTA DE COMPRA FUERTE

BTCUSDT muestra confluencia alcista.
Precio: $76,484.49
RSI: 24.3 (Sobreventa)
MA50: $76,772
MA200: $80,556
Miedo/Codicia: 18/100
Confianza: 85%
Stop Loss: $79,750
Take Profit: $78,200
R:R: 2.0:1

⚡ Divergencia Alcista Detectada
Price made lower low but RSI made higher low. Strength: 65%

🔍 Ver en TradingView
```

### Alerta de Venta Fuerte
```
🔴 ALERTA DE VENTA FUERTE

BTCUSDT muestra confluencia bajista.
Precio: $85,200.00
RSI: 78.5 (Sobrecompra)
MA50: $84,100
MA200: $82,300
Miedo/Codicia: 82/100
Confianza: 75%
Stop Loss: $84,941
Take Profit: $83,800
R:R: 2.0:1

⚡ Divergencia Bajista Detectada
Price made higher high but RSI made lower high. Strength: 55%

🔍 Ver en TradingView
```

### Requisitos
- Node.js >= 18
- pnpm >= 8

### Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar y configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env con tus credenciales de Telegram
```

### Ejecutar en desarrollo

```bash
pnpm dev
```

Esto inicia el backend (puerto 3001) y el frontend (puerto 5173) simultáneamente con hot reload.

### Ejecutar en producción

```bash
pnpm build
pnpm start:backend
```

El backend sirve el frontend estático en producción (puerto 3001).

### Acceso
- **Frontend**: http://localhost:5173 (dev) o http://localhost:3001 (prod)
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Exponer públicamente (Opcional)

Para acceder desde fuera de tu red local, puedes usar **ngrok**:

```bash
# Instalar ngrok
winget install ngrok

# Exponer el frontend
ngrok http 5173
```

Te dará una URL pública como `https://abc123.ngrok-free.app`.
