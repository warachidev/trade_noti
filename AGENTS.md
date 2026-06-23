# NotiTrade - Agent Workflow Guidelines

> Reglas de trabajo para agentes de IA en el proyecto NotiTrade.
> **Lee este archivo completo antes de tocar código.**

---

## Fase 1: Investigación y Análisis Previo (Cero Código)

### Restricciones Técnicas del Proyecto

**Stack actual — NO cambiar sin autorización explícita:**

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | >= 18 |
| Package Manager | pnpm | >= 8 (monorepo workspace) |
| Backend | Express + TypeScript | ES2022, NodeNext modules |
| Frontend | React + Vite + TypeScript | React 19, Vite 8 |
| DB | sql.js (SQLite WASM) | ^1.12 |
| Query | TanStack Query | ^5.100 |
| Charts | lightweight-charts | ^5.2 |
| Styles | Tailwind CSS v4 | Utility-first |
| UI Components | Shadcn-style (local) | Sin librería externa |

**Reglas inmutables:**
- No introducir nuevas dependencias sin consultar primero
- No cambiar la estructura de carpetas sin consultar primero
- No modificar `pnpm-workspace.yaml` ni configs de build sin consultar
- El frontend NO usa `.env` — todo pasa por el proxy de Vite

### Convenciones Obligatorias

**Nomenclatura:**
- Componentes React: `PascalCase` → `PriceChart.tsx`
- Módulos TypeScript: `camelCase` → `binance.ts`, `analyzer.ts`
- Types/Interfaces: `PascalCase` → `MarketStatus`, `ChartData`
- Variables/Funciones: `camelCase` → `fetchKlines`, `analyzeMarket`
- Constantes: `UPPER_SNAKE_CASE` → `BASE_URL`, `DB_PATH`
- Tablas DB: `snake_case` → `market_snapshots`, `alerts`

**Código:**
- TypeScript estricto (`strict: true`) — cero `any`
- Interfaces separadas de la lógica de implementación
- Componentes funcionales — nunca clases
- Sin comentarios a menos que se pida explícitamente
- Sin emojis en código
- Usar `@/*` alias para imports del frontend → `import { cn } from '@/lib/utils'`

**Archivos clave que debes conocer:**
```
backend/src/index.ts          # Entry point: Express + Cron + DB + Settings
backend/src/services/analyzer.ts   # Lógica central de análisis
backend/src/services/settings.ts   # Configuración persistente (data/settings.json)
backend/src/services/telegram.ts   # Alertas Telegram
backend/src/db/database.ts         # SQLite init + queries
backend/src/api/routes.ts          # REST endpoints
backend/src/api/binance.ts         # Binance API client
backend/src/api/feargreed.ts       # Alternative.me API client

frontend/src/App.tsx          # Dashboard principal (tabs: Dashboard, Alerts, Settings)
frontend/src/components/PriceChart.tsx  # TradingView chart wrapper
frontend/src/lib/utils.ts     # cn() utility
frontend/vite.config.ts       # Proxy /api → localhost:3001
```

### Antes de Escribir Código

1. **Lee los archivos relevantes** — nunca asumas cómo funciona algo
2. **Verifica dependencias existentes** — revisa `package.json` antes de sugerir librerías
3. **Consulta al usuario** si la tarea requiere:
   - Nueva dependencia
   - Cambio de arquitectura
   - Modificación de la DB schema
   - Cambio de endpoints API

---

## Fase 2: Planificación Detallada

### Desglose de Tareas

No implementes features completos de una vez. Sigue este orden:

1. **Interfaces primero** — Define los tipos TypeScript antes de la lógica
2. **Firmas de funciones** — Estructura vacía con tipos correctos
3. **Espera validación** — El usuario confirma antes de continuar
4. **Implementa paso a paso** — Una función o componente a la vez

### Ejemplo de Flujo

```
TAREA: Agregar nuevo indicador MACD al análisis

Paso 1 → Definir interfaces:
  - Agregar `macd` a `AnalysisResult`
  - Agregar columna `macd` a `market_snapshots`

Paso 2 → Firmas de funciones:
  - `calculateMACD(prices: number[]): number[]` en analyzer.ts

Paso 3 → Esperar confirmación del usuario

Paso 4 → Implementar lógica + UI + endpoint
```

### Estructura de la DB (No modificar sin autorización)

**`market_snapshots`:**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `symbol` | TEXT NOT NULL | Par de trading |
| `price` | REAL NOT NULL | Precio de cierre |
| `rsi` | REAL | RSI(14) horario |
| `ma50` | REAL | Media móvil 50 días |
| `ma200` | REAL | Media móvil 200 días |
| `fear_greed` | INTEGER | Fear & Greed (0-100) |
| `timestamp` | TEXT NOT NULL | UTC datetime |

**`alerts`:**
| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | INTEGER PK AUTOINCREMENT | |
| `symbol` | TEXT NOT NULL | Par de trading |
| `type` | TEXT NOT NULL | BUY o SELL |
| `message` | TEXT NOT NULL | Mensaje HTML |
| `timestamp` | TEXT NOT NULL | UTC datetime |

---

## Fase 3: Implementación

### Reglas de Implementación

**Backend:**
- Cada servicio en su propio archivo bajo `src/services/`
- Cada API client bajo `src/api/`
- Usar `technicalindicators` para cálculos existentes (SMA, RSI)
- Siempre manejar errores con try/catch y loguear
- La DB se persiste con `saveDatabase()` después de cada write
- El cron job se reinicia automáticamente al cambiar `checkIntervalMinutes` o `symbol`

**Frontend:**
- Componentes en `src/components/`
- UI components en `src/components/ui/` (patrón Shadcn)
- Usar TanStack Query para data fetching — nunca `useEffect` + `fetch` directo
- El proxy de Vite redirige `/api` al backend — no usar URLs absolutas
- Tailwind CSS v4 — usar `@import "tailwindcss"` en index.css
- Usar `cn()` de `@/lib/utils` para className merging

**Seguridad:**
- Nunca commitear `.env`, `data/*.sqlite`, `data/settings.json`
- Las credenciales de Telegram van solo en `backend/.env`
- El frontend nunca debe exponer tokens ni secrets

### Iteración Rápida

Si el agente genera código incorrecto:
1. **No intentes arreglar 200 líneas** — es más eficiente regenerar
2. **Ajusta el prompt** con información específica del error
3. **Pasa el error exacto** de la consola, no solo el código

---

## Fase 4: Revisión, Pruebas y Depuración

### Checklist Pre-Commit

- [ ] TypeScript compila sin errores (`pnpm build`)
- [ ] No hay `any` en el código
- [ ] No hay variables de entorno expuestas
- [ ] No hay renders innecesarios en componentes React
- [ ] Los imports usan el alias `@/*` correctamente
- [ ] El código sigue las convenciones de nomenclatura

### Comandos de Verificación

```bash
# Build completo
pnpm build

# Solo backend
pnpm build:backend

# Solo frontend
pnpm build:frontend

# Dev mode (hot reload)
pnpm dev

# Producción
pnpm start:backend
```

### Depuración

Cuando reportes un error, incluye SIEMPRE:
1. **Código relevante** — el archivo y líneas afectadas
2. **Error exacto** — output de consola
3. **Comportamiento esperado** — qué debería pasar
4. **Comportamiento actual** — qué está pasando

**Logs del backend:**
```bash
# En desarrollo: ver la terminal donde corre pnpm dev:backend
# En producción: revisar logs del servidor
```

### Refactorización

Si el código funciona pero es mejorable:
- Pide refactorización como paso separado
- Especifica el objetivo: "reducir complejidad ciclomática", "mejorar legibilidad", "extraer lógica reutilizable"
- Mantén la misma funcionalidad — no cambies comportamiento durante refactor

---

## Fase 5: Documentación e Informes

### Cuando se Pida Documentación

**JSDoc para funciones complejas:**
```typescript
/**
 * Analiza el mercado y evalúa condiciones de alerta.
 * @param options - Configuración del análisis
 * @returns AnalysisResult con indicadores calculados y alerta si aplica
 */
export async function analyzeMarket(options: AnalyzeMarketOptions): Promise<AnalysisResult>
```

**PR Description template:**
```markdown
## Cambios
- [Descripción breve de lo implementado]

## Módulos Afectados
- `backend/src/...` — [qué cambió]
- `frontend/src/...` — [qué cambió]

## Testing
- [ ] Backend compila: `pnpm build:backend`
- [ ] Frontend compila: `pnpm build:frontend`
- [ ] Telegram alerts funcionan (si aplica)

## Notas
[Cualquier consideración importante]
```

---

## Comandos Útiles de Referencia

### Desarrollo
```bash
pnpm dev              # Backend + frontend en paralelo
pnpm dev:backend      # Solo backend (tsx watch)
pnpm dev:frontend     # Solo frontend (Vite HMR)
```

### Build
```bash
pnpm build            # Ambos proyectos
pnpm build:backend    # Solo backend → dist/
pnpm build:frontend   # Solo frontend → frontend/dist/
pnpm start:backend    # Backend compilado
```

### Acceso
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## Regla de Oro

> **Nunca asumas. Siempre verifica.**
>
> Antes de modificar un archivo, léelo. Antes de agregar una dependencia, verifica que no exista. Antes de cambiar una interfaz, revisa quién la consume.
