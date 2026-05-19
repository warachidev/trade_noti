import { useQuery } from '@tanstack/react-query'
import { PriceChart } from './components/PriceChart'

interface MarketStatus {
  symbol: string
  price: number | null
  rsi: number | null
  ma50: number | null
  ma200: number | null
  fearGreed: number | null
  isBullish: boolean | null
  lastUpdate: string | null
}

interface Alert {
  id: number
  symbol: string
  type: 'BUY' | 'SELL'
  message: string
  timestamp: string
}

async function fetchMarketStatus(): Promise<MarketStatus> {
  const response = await fetch('/api/market-status')
  if (!response.ok) throw new Error('Failed to fetch market status')
  return response.json()
}

async function fetchAlerts(): Promise<Alert[]> {
  const response = await fetch('/api/alerts')
  if (!response.ok) throw new Error('Failed to fetch alerts')
  return response.json()
}

function getFearGreedLabel(value: number | null): string {
  if (value === null) return 'N/A'
  if (value <= 20) return 'Extreme Fear'
  if (value <= 40) return 'Fear'
  if (value <= 60) return 'Neutral'
  if (value <= 80) return 'Greed'
  return 'Extreme Greed'
}

function getFearGreedColor(value: number | null): string {
  if (value === null) return 'text-gray-500'
  if (value <= 20) return 'text-red-500'
  if (value <= 40) return 'text-orange-500'
  if (value <= 60) return 'text-yellow-500'
  if (value <= 80) return 'text-green-500'
  return 'text-emerald-400'
}

function formatPrice(price: number | null): string {
  if (price === null) return '--'
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Never'
  const date = new Date(timestamp + 'Z')
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return `${Math.floor(diffHours / 24)}d ago`
}

function App() {
  const { data: marketStatus, isLoading: loadingMarket } = useQuery({
    queryKey: ['marketStatus'],
    queryFn: fetchMarketStatus,
    refetchInterval: 1000 * 60 * 5,
  })

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 1000 * 60 * 2,
  })

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-200">
      <header className="border-b border-gray-800 bg-[#161822]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            <span className="text-blue-500">Noti</span>Trade
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {marketStatus?.lastUpdate ? `Updated ${formatTimeAgo(marketStatus.lastUpdate)}` : 'Waiting for data...'}
            </span>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="BTC Price"
            value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.price ?? null)}
            subtitle={marketStatus?.symbol ?? 'BTCUSDT'}
          />
          <StatCard
            title="RSI (14)"
            value={loadingMarket ? 'Loading...' : (marketStatus?.rsi?.toFixed(1) ?? '--')}
            subtitle={
              marketStatus?.rsi !== null && marketStatus?.rsi !== undefined
                ? marketStatus.rsi < 30
                  ? 'Oversold'
                  : marketStatus.rsi > 70
                    ? 'Overbought'
                    : 'Neutral'
                : '--'
            }
          />
          <StatCard
            title="MA50"
            value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.ma50 ?? null)}
            subtitle="Daily"
          />
          <StatCard
            title="MA200"
            value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.ma200 ?? null)}
            subtitle="Daily"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-[#161822] rounded-xl border border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Market Trend</h2>
              {marketStatus?.isBullish !== null && marketStatus?.isBullish !== undefined && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    marketStatus.isBullish
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {marketStatus.isBullish ? 'Bullish' : 'Bearish'}
                </span>
              )}
            </div>
            <PriceChart />
          </div>

          <div className="bg-[#161822] rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Fear & Greed Index</h2>
            <div className="flex flex-col items-center justify-center h-48">
              {loadingMarket ? (
                <span className="text-gray-500">Loading...</span>
              ) : (
                <>
                  <div className="relative w-32 h-32 mb-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#1f2937"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={
                          marketStatus?.fearGreed !== null && marketStatus?.fearGreed !== undefined
                            ? marketStatus.fearGreed <= 40
                              ? '#ef4444'
                              : marketStatus.fearGreed <= 60
                                ? '#eab308'
                                : '#22c55e'
                            : '#6b7280'
                        }
                        strokeWidth="8"
                        strokeDasharray={`${((marketStatus?.fearGreed ?? 0) / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {marketStatus?.fearGreed ?? '--'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-medium ${getFearGreedColor(marketStatus?.fearGreed ?? null)}`}
                  >
                    {getFearGreedLabel(marketStatus?.fearGreed ?? null)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-[#161822] rounded-xl border border-gray-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
          {loadingAlerts ? (
            <div className="text-center py-8 text-gray-500">Loading alerts...</div>
          ) : alerts && alerts.length > 0 ? (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                >
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.type === 'BUY'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {alert.type}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-300">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No alerts yet. The analyzer will send alerts here when conditions are met.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <div className="bg-[#161822] rounded-xl border border-gray-800 p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </div>
  )
}

export default App
