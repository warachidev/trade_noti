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

NotiTrade combina indicadores de tendencia (bajo riesgo) con indicadores de timing (alto riesgo) para generar alertas inteligentes:

### Alerta de Compra 🟢

Se activa cuando **AMBAS** condiciones se cumplen:
1. **Tendencia alcista**: MA50 > MA200 (el mercado sube a largo plazo)
2. **Sobreventa**: RSI < umbral configurado (por defecto 30, el precio cayó temporalmente, buena oportunidad de entrada)

### Alerta de Venta 🔴

Se activa cuando **AMBAS** condiciones se cumplen:
1. **Tendencia bajista**: MA50 < MA200 (el mercado baja a largo plazo)
2. **Sobrecompra**: RSI > umbral configurado (por defecto 70, el precio subió temporalmente en un mercado que cae, riesgo de caída)

> **Nota**: Los umbrales de RSI son configurables desde el panel de Settings. También puedes activar o desactivar las alertas según necesites.

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
- **Tabs**: Navegación por pestañas para cambiar entre la vista principal del Dashboard, el historial de Alertas y la Configuración.
- **Iconos**: Indicadores visuales (flechas de tendencia, actividad, reloj) que complementan la información numérica.
- **Botón de Refresh**: Icono de flechas circulares en el header para actualizar los datos manualmente.

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

## Ejecución Local

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
