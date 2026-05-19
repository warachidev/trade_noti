# Arquitectura del Sistema (MVP Personal)

Para que la aplicación realmente funcione como un "analista" que te avise en tiempo real sin necesidad de tener una pestaña web abierta las 24 horas, la mejor estructura es un modelo **Backend Cron-Job + Frontend Dashboard**.

```
[ APIs Públicas ] (Binance / Alternative.me)
        │
        ▼
[ Backend (Node.js) ] ──(Si hay alerta)──► [ Telegram Bot API ] ──► (Tu Celular)
        │
  (Sirve los datos calculados)
        │
        ▼
[ Frontend (React) ] ──► (Tu Panel Visual)
```

## El Servidor Autónomo (Backend)

Un script simple en Node.js que se ejecuta en segundo plano (puede ser en tu computadora local o en un servidor gratuito como Render/Railway). Cada cierto tiempo (ej. cada 15 minutos) consulta las APIs, calcula las estrategias y, si encuentra una oportunidad, te envía un mensaje directo a tu celular.

## La Interfaz de Usuario (Frontend)

Una SPA (Single Page Application) en React que abres cuando quieres ver el estado visual de tus indicadores, gráficas y el velocímetro de miedo.

---

# Stack de Tecnologías Recomendadas

## Frontend (El Panel Visual)

- **Framework:** React (vía Vite). Es la opción más ligera, rápida de configurar y con el ecosistema de librerías más grande para gráficos.
- **Estilos y UI:** Tailwind CSS + Shadcn UI. Te permite crear un diseño oscuro estilo "Trading profesional" de forma extremadamente rápida usando componentes ya listos (tarjetas, tablas, botones).
- **Gestión de Estado y Consultas:** TanStack Query (React Query). Crucial para manejar el caching de los datos de las APIs cripto y evitar que bloqueen tu IP por exceso de peticiones (rate limiting).

## Backend (El Analista)

- **Entorno de ejecución:** Node.js con TypeScript. TypeScript te ahorrará muchos dolores de cabeza al manejar las estructuras de datos complejas que devuelven las APIs de criptomonedas.

---

# APIs Necesarias y Endpoints Clave

Para este proyecto no necesitas pagar un solo dólar en datos. Estas son las tres fuentes que utilizaremos:

| Proveedor | Uso Principal | Endpoint Clave (Ejemplo) |
|-----------|---------------|--------------------------|
| Binance Public API | Precios en tiempo real e históricos de velas (Klines) | `GET /api/v3/klines?symbol=BTCUSDT&interval=1d` |
| Alternative.me | Índice de Miedo y Codicia actual e histórico | `GET /fng/?limit=1` |
| Telegram Bot API | Sistema de alertas push gratuitas a tu celular | `POST /bot<token>/sendMessage` |

> 💡 **Tip Pro:** Usar el Bot de Telegram es el mejor "hack" para proyectos personales. Te ahorras el desarrollo de una app móvil, las cuentas de desarrollador de Apple/Google ($99/año) y las configuraciones complejas de notificaciones push.

---

# Lógica de Análisis de Mercado

```typescript
async function analizarMercado() {
  // 1. Obtener datos históricos de Binance
  const preciosDiarios = await obtenerPreciosBinance('BTCUSDT', '1d', 210); // Necesitamos al menos 200 datos
  const preciosHorarios = await obtenerPreciosBinance('BTCUSDT', '1h', 20);

  // 2. Calcular Indicadores de Bajo Riesgo (Tendencia)
  const ma50 = SMA.calculate({ period: 50, values: preciosDiarios });
  const ma200 = SMA.calculate({ period: 200, values: preciosDiarios });
  
  const ultimaMA50 = ma50[ma50.length - 1];
  const ultimaMA200 = ma200[ma200.length - 1];
  const mercadoAlcista = ultimaMA50 > ultimaMA200; // Filtro de seguridad

  // 3. Calcular Indicadores de Alto Riesgo (Timing)
  const rsiValores = RSI.calculate({ period: 14, values: preciosHorarios });
  const ultimoRSI = rsiValores[rsiValores.length - 1];

  // 4. Ejecutar Lógica de Alertas Combinadas
  if (mercadoAlcista && ultimoRSI < 30) {
    await enviarAlertaTelegram("🚨 ¡ALERTA! BTC está en sobreventa (RSI < 30) dentro de una macro tendencia alcista. Excelente oportunidad de compra a corto/mediano plazo.");
  } else if (!mercadoAlcista && ultimoRSI > 70) {
    await enviarAlertaTelegram("⚠️ OJO: BTC está sobrecomprado (RSI > 70) en un mercado bajista. Riesgo de caída inminente.");
  }
}
```
