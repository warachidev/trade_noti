import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from 'lightweight-charts'
import type {
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts'

interface ChartData {
  candles: Array<{ time: number; open: number; high: number; low: number; close: number }>
  volume: Array<{ time: number; value: number; color: string }>
  ma50: Array<{ time: number; value: number }>
  ma200: Array<{ time: number; value: number }>
}

interface PriceChartProps {
  symbol?: string
  interval?: string
}

export function PriceChart({ symbol = 'BTCUSDT', interval = '1d' }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)
  const ma50SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const ma200SeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#9ca3af',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(55, 65, 81, 0.3)' },
        horzLines: { color: 'rgba(55, 65, 81, 0.3)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: 'rgba(59, 130, 246, 0.4)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.25,
        },
      },
      timeScale: {
        borderColor: 'rgba(55, 65, 81, 0.5)',
        timeVisible: interval !== '1d',
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    })

    chartRef.current = chart

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    })
    candleSeriesRef.current = candleSeries

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    })
    volumeSeriesRef.current = volumeSeries

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    const ma50Series = chart.addSeries(LineSeries, {
      color: '#f59e0b',
      lineWidth: 2,
      title: 'MA50',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma50SeriesRef.current = ma50Series

    const ma200Series = chart.addSeries(LineSeries, {
      color: '#8b5cf6',
      lineWidth: 2,
      title: 'MA200',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })
    ma200SeriesRef.current = ma200Series

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [])

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/chart-data?symbol=${symbol}&interval=${interval}&limit=200`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch chart data')
        }

        const data: ChartData = await response.json()

        if (candleSeriesRef.current) {
          candleSeriesRef.current.setData(
            data.candles.map((c) => ({
              time: c.time as UTCTimestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
          )
        }

        if (volumeSeriesRef.current) {
          volumeSeriesRef.current.setData(
            data.volume.map((v) => ({
              time: v.time as UTCTimestamp,
              value: v.value,
              color: v.color,
            }))
          )
        }

        if (ma50SeriesRef.current) {
          ma50SeriesRef.current.setData(
            data.ma50.map((m) => ({
              time: m.time as UTCTimestamp,
              value: m.value,
            }))
          )
        }

        if (ma200SeriesRef.current) {
          ma200SeriesRef.current.setData(
            data.ma200.map((m) => ({
              time: m.time as UTCTimestamp,
              value: m.value,
            }))
          )
        }

        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [symbol, interval])

  if (error) {
    return (
      <div className="h-96 flex items-center justify-center text-red-400 bg-gray-900/50 rounded-lg">
        <div className="text-center">
          <p className="font-medium">Error loading chart</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[400px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200" />
          </div>
        </div>
      )}
      <div ref={chartContainerRef} className="w-full h-full rounded-lg" />
    </div>
  )
}
