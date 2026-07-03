import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PriceChart } from './components/PriceChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/card'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Clock, RefreshCw, AlertCircle, Target, Shield } from 'lucide-react'

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

interface VolumeAnalysis {
  trend: string | null
  currentVolume: number
  averageVolume: number
  isSpike: boolean
  spikeMultiplier: number
}

interface DivergenceAnalysis {
  type: string | null
  strength: number
  description: string
}

interface SignalScore {
  type: string
  confidence: number
  factors: string[]
  invalidationLevel: number | null
  riskRewardRatio: number | null
  stopLoss: number | null
  takeProfit: number | null
}

interface AnalysisResult {
  symbol: string
  price: number
  ma50: number | null
  ma200: number | null
  rsi: number | null
  fearGreed: number | null
  isBullish: boolean | null
  alert: string | null
  priceVsMa200: string | null
  volume: VolumeAnalysis
  divergence: DivergenceAnalysis
  shortSignal: SignalScore
  longSignal: SignalScore
}

interface Alert {
  id: number
  symbol: string
  type: 'BUY' | 'SELL'
  message: string
  timestamp: string
}

interface AppSettings {
  symbol: string
  checkIntervalMinutes: number
  rsiOversold: number
  rsiOverbought: number
  alertsEnabled: boolean
}

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT' },
  { value: 'ETHUSDT', label: 'ETH/USDT' },
  { value: 'SOLUSDT', label: 'SOL/USDT' },
  { value: 'BNBUSDT', label: 'BNB/USDT' },
  { value: 'XRPUSDT', label: 'XRP/USDT' },
  { value: 'ADAUSDT', label: 'ADA/USDT' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT' },
]

async function fetchMarketStatus(): Promise<MarketStatus> {
  const response = await fetch('/api/market-status')
  if (!response.ok) throw new Error('Failed to fetch market status')
  return response.json()
}

async function fetchAnalysis(): Promise<AnalysisResult> {
  const response = await fetch('/api/analysis')
  if (!response.ok) throw new Error('Failed to fetch analysis')
  return response.json()
}

async function fetchAlerts(): Promise<Alert[]> {
  const response = await fetch('/api/alerts')
  if (!response.ok) throw new Error('Failed to fetch alerts')
  return response.json()
}

async function fetchSettings(): Promise<AppSettings> {
  const response = await fetch('/api/settings')
  if (!response.ok) throw new Error('Failed to fetch settings')
  return response.json()
}

async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const response = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!response.ok) throw new Error('Failed to update settings')
  return response.json()
}

async function triggerAnalysis(): Promise<void> {
  const response = await fetch('/api/analyze', { method: 'POST' })
  if (!response.ok) throw new Error('Failed to trigger analysis')
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

function getSignalBadgeVariant(type: string): 'success' | 'warning' | 'destructive' | 'default' {
  switch (type) {
    case 'STRONG_BUY': return 'success'
    case 'BUY': return 'success'
    case 'NEUTRAL': return 'default'
    case 'SELL': return 'destructive'
    case 'STRONG_SELL': return 'destructive'
    default: return 'default'
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 70) return 'text-green-400'
  if (confidence >= 50) return 'text-yellow-400'
  if (confidence >= 30) return 'text-orange-400'
  return 'text-gray-500'
}

function getVolumeTrendLabel(trend: string | null): string {
  switch (trend) {
    case 'increasing': return 'Increasing'
    case 'decreasing': return 'Decreasing'
    case 'spike': return 'Volume Spike'
    case 'normal': return 'Normal'
    default: return 'N/A'
  }
}

function getVolumeTrendColor(trend: string | null): string {
  switch (trend) {
    case 'increasing': return 'text-green-400'
    case 'decreasing': return 'text-red-400'
    case 'spike': return 'text-yellow-400'
    default: return 'text-gray-500'
  }
}

function App() {
  const { data: marketStatus, isLoading: loadingMarket, refetch: refetchMarket } = useQuery({
    queryKey: ['marketStatus'],
    queryFn: fetchMarketStatus,
    refetchInterval: 1000 * 30,
  })

  const { data: analysis, refetch: refetchAnalysis } = useQuery({
    queryKey: ['analysis'],
    queryFn: fetchAnalysis,
    refetchInterval: 1000 * 60,
  })

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 1000 * 60,
  })

  const { data: settings, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  })

  const [activeTab, setActiveTab] = useState('dashboard')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await triggerAnalysis()
      await refetchMarket()
      await refetchAnalysis()
    } catch (error) {
      console.error('Failed to refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const updateSettingsMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      queryClient.invalidateQueries({ queryKey: ['marketStatus'] })
      queryClient.invalidateQueries({ queryKey: ['analysis'] })
      refetchMarket()
      refetchSettings()
      refetchAnalysis()
    },
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
              onClick={handleRefresh}
              disabled={isRefreshing || loadingMarket}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Dashboard</h2>
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="signals">Signals</TabsTrigger>
              <TabsTrigger value="alerts">Alerts</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Price"
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

            {analysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SignalPanel title="LONG Signal" signal={analysis.longSignal} />
                <SignalPanel title="SHORT Signal" signal={analysis.shortSignal} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            {analysis ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SignalPanel title="LONG (Buy) Signal" signal={analysis.longSignal} />
                  <SignalPanel title="SHORT (Sell) Signal" signal={analysis.shortSignal} />
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Confluence Matrix</CardTitle>
                    <CardDescription>Quick decision table based on indicator alignment</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-800">
                            <th className="text-left py-3 px-4 text-gray-400">Indicator</th>
                            <th className="text-center py-3 px-4 text-red-400">SHORT Setup</th>
                            <th className="text-center py-3 px-4 text-green-400">LONG Setup</th>
                            <th className="text-center py-3 px-4 text-gray-400">Current</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-3 px-4 text-gray-300">Price vs MA200</td>
                            <td className="py-3 px-4 text-center text-red-400">Below MA200</td>
                            <td className="py-3 px-4 text-center text-green-400">Above MA200</td>
                            <td className="py-3 px-4 text-center">
                              <Badge variant={analysis.priceVsMa200 === 'above' ? 'success' : 'destructive'}>
                                {analysis.priceVsMa200 === 'above' ? 'Above' : analysis.priceVsMa200 === 'below' ? 'Below' : 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-3 px-4 text-gray-300">RSI (14)</td>
                            <td className="py-3 px-4 text-center text-red-400">&gt; 70</td>
                            <td className="py-3 px-4 text-center text-green-400">&lt; 30</td>
                            <td className="py-3 px-4 text-center">
                              <span className={analysis.rsi !== null ? (analysis.rsi > 70 ? 'text-red-400' : analysis.rsi < 30 ? 'text-green-400' : 'text-yellow-400') : 'text-gray-500'}>
                                {analysis.rsi?.toFixed(1) ?? 'N/A'}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-3 px-4 text-gray-300">Fear & Greed</td>
                            <td className="py-3 px-4 text-center text-red-400">&gt; 75 (Extreme Greed)</td>
                            <td className="py-3 px-4 text-center text-green-400">&lt; 25 (Extreme Fear)</td>
                            <td className="py-3 px-4 text-center">
                              <span className={getFearGreedColor(analysis.fearGreed)}>
                                {analysis.fearGreed ?? 'N/A'} - {getFearGreedLabel(analysis.fearGreed)}
                              </span>
                            </td>
                          </tr>
                          <tr className="border-b border-gray-800/50">
                            <td className="py-3 px-4 text-gray-300">Divergence</td>
                            <td className="py-3 px-4 text-center text-red-400">Bearish</td>
                            <td className="py-3 px-4 text-center text-green-400">Bullish</td>
                            <td className="py-3 px-4 text-center">
                              {analysis.divergence.type === 'bearish' ? (
                                <Badge variant="destructive">Bearish ({analysis.divergence.strength.toFixed(0)}%)</Badge>
                              ) : analysis.divergence.type === 'bullish' ? (
                                <Badge variant="success">Bullish ({analysis.divergence.strength.toFixed(0)}%)</Badge>
                              ) : (
                                <span className="text-gray-500">None</span>
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-gray-300">Volume</td>
                            <td className="py-3 px-4 text-center text-red-400">Decreasing (weak buy)</td>
                            <td className="py-3 px-4 text-center text-green-400">Spike (capitulation)</td>
                            <td className="py-3 px-4 text-center">
                              <span className={getVolumeTrendColor(analysis.volume.trend)}>
                                {getVolumeTrendLabel(analysis.volume.trend)}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Management</CardTitle>
                    <CardDescription>Invalidation levels and risk:reward ratios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                        <h3 className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          LONG Position
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Stop Loss</span>
                            <span className="text-white">{formatPrice(analysis.longSignal.stopLoss)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Take Profit</span>
                            <span className="text-white">{formatPrice(analysis.longSignal.takeProfit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Invalidation Level</span>
                            <span className="text-white">{formatPrice(analysis.longSignal.invalidationLevel)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                            <span className="text-gray-400">Risk:Reward</span>
                            <span className="text-green-400 font-semibold">
                              {analysis.longSignal.riskRewardRatio?.toFixed(1)}:1
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800">
                        <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          SHORT Position
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Stop Loss</span>
                            <span className="text-white">{formatPrice(analysis.shortSignal.stopLoss)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Take Profit</span>
                            <span className="text-white">{formatPrice(analysis.shortSignal.takeProfit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Invalidation Level</span>
                            <span className="text-white">{formatPrice(analysis.shortSignal.invalidationLevel)}</span>
                          </div>
                          <div className="flex justify-between border-t border-gray-800 pt-2 mt-2">
                            <span className="text-gray-400">Risk:Reward</span>
                            <span className="text-red-400 font-semibold">
                              {analysis.shortSignal.riskRewardRatio?.toFixed(1)}:1
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading analysis...</div>
            )}
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

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Adjust analysis parameters and alert thresholds</CardDescription>
              </CardHeader>
              <CardContent>
                {settings ? (
                  <SettingsForm
                    settings={settings}
                    onUpdate={updateSettingsMutation.mutate}
                    isSaving={updateSettingsMutation.isPending}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">Loading settings...</div>
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

function SignalPanel({
  title,
  signal,
}: {
  title: string
  signal: SignalScore
}) {
  const isLong = title.includes('LONG')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={isLong ? 'text-green-400' : 'text-red-400'}>{title}</CardTitle>
          <Badge variant={getSignalBadgeVariant(signal.type)}>{signal.type.replace('_', ' ')}</Badge>
        </div>
        <CardDescription>Confidence: <span className={getConfidenceColor(signal.confidence)}>{signal.confidence}%</span></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                signal.confidence >= 70
                  ? isLong ? 'bg-green-500' : 'bg-red-500'
                  : signal.confidence >= 50
                    ? 'bg-yellow-500'
                    : 'bg-gray-600'
              }`}
              style={{ width: `${signal.confidence}%` }}
            />
          </div>
        </div>

        {signal.factors.length > 0 && (
          <div className="space-y-2 mb-4">
            {signal.factors.map((factor, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{factor}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
          <div>
            <p className="text-xs text-gray-500">Stop Loss</p>
            <p className="text-sm font-medium text-white">{formatPrice(signal.stopLoss)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Take Profit</p>
            <p className="text-sm font-medium text-white">{formatPrice(signal.takeProfit)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">R:R Ratio</p>
            <p className="text-sm font-medium text-white">{signal.riskRewardRatio?.toFixed(1)}:1</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SettingsForm({
  settings,
  onUpdate,
  isSaving,
}: {
  settings: AppSettings
  onUpdate: (data: Partial<AppSettings>) => void
  isSaving: boolean
}) {
  const [form, setForm] = useState<AppSettings>(settings)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Trading Pair</label>
        <select
          value={form.symbol}
          onChange={(e) => setForm({ ...form, symbol: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {SYMBOLS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Check Interval (minutes)
        </label>
        <input
          type="number"
          min={1}
          max={120}
          value={form.checkIntervalMinutes}
          onChange={(e) =>
            setForm({ ...form, checkIntervalMinutes: parseInt(e.target.value) || 15 })
          }
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">How often the analyzer checks the market</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            RSI Oversold Threshold
          </label>
          <input
            type="number"
            min={10}
            max={45}
            value={form.rsiOversold}
            onChange={(e) =>
              setForm({ ...form, rsiOversold: parseInt(e.target.value) || 30 })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Buy signal when RSI below this value</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            RSI Overbought Threshold
          </label>
          <input
            type="number"
            min={55}
            max={90}
            value={form.rsiOverbought}
            onChange={(e) =>
              setForm({ ...form, rsiOverbought: parseInt(e.target.value) || 70 })
            }
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Sell signal when RSI above this value</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={form.alertsEnabled}
          onClick={() => setForm({ ...form, alertsEnabled: !form.alertsEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            form.alertsEnabled ? 'bg-blue-600' : 'bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              form.alertsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-sm text-gray-300">Enable Telegram Alerts</span>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  )
}

export default App
