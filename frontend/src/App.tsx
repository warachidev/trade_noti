import { useQuery } from '@tanstack/react-query'
import { PriceChart } from './components/PriceChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, RefreshCw } from 'lucide-react'

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
  const { data: marketStatus, isLoading: loadingMarket, refetch: refetchMarket } = useQuery({
    queryKey: ['marketStatus'],
    queryFn: fetchMarketStatus,
    refetchInterval: 1000 * 30,
  })

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 1000 * 60,
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
            <Button
              variant="ghost"
              size="icon"
              onClick={() => refetchMarket()}
              disabled={loadingMarket}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${loadingMarket ? 'animate-spin' : ''}`} />
            </Button>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="BTC Price"
                value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.price ?? null)}
                subtitle={marketStatus?.symbol ?? 'BTCUSDT'}
                icon={<Activity className="h-4 w-4 text-blue-500" />}
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
                icon={
                  marketStatus?.rsi !== null && marketStatus?.rsi !== undefined
                    ? marketStatus.rsi < 30
                      ? <TrendingUp className="h-4 w-4 text-green-500" />
                      : marketStatus.rsi > 70
                        ? <TrendingDown className="h-4 w-4 text-red-500" />
                        : <Activity className="h-4 w-4 text-yellow-500" />
                    : <Activity className="h-4 w-4 text-gray-500" />
                }
              />
              <StatCard
                title="MA50"
                value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.ma50 ?? null)}
                subtitle="Daily"
                icon={<TrendingUp className="h-4 w-4 text-amber-500" />}
              />
              <StatCard
                title="MA200"
                value={loadingMarket ? 'Loading...' : formatPrice(marketStatus?.ma200 ?? null)}
                subtitle="Daily"
                icon={<TrendingUp className="h-4 w-4 text-purple-500" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Price Chart</CardTitle>
                      <CardDescription>BTC/USDT Daily Candles</CardDescription>
                    </div>
                    {marketStatus?.isBullish !== null && marketStatus?.isBullish !== undefined && (
                      <Badge variant={marketStatus.isBullish ? 'success' : 'destructive'}>
                        {marketStatus.isBullish ? 'Bullish' : 'Bearish'}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <PriceChart />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fear & Greed Index</CardTitle>
                  <CardDescription>Market Sentiment</CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Alert History</CardTitle>
                </div>
                <CardDescription>Recent trading alerts generated by the analyzer</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingAlerts ? (
                  <div className="text-center py-8 text-gray-500">Loading alerts...</div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800"
                      >
                        <Badge variant={alert.type === 'BUY' ? 'success' : 'destructive'}>
                          {alert.type}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300">{alert.message}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimeAgo(alert.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No alerts yet. The analyzer will send alerts here when conditions are met.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

export default App
