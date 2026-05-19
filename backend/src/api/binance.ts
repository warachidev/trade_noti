const BASE_URL = 'https://api.binance.com/api/v3';

export interface RawKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export async function fetchRawKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<RawKline[]> {
  const params = new URLSearchParams({
    symbol,
    interval,
    limit: limit.toString(),
  });

  const response = await fetch(`${BASE_URL}/klines?${params}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.statusText}`);
  }

  const data: unknown[][] = await response.json();

  return data.map((kline: unknown[]) => ({
    openTime: kline[0] as number,
    open: kline[1] as string,
    high: kline[2] as string,
    low: kline[3] as string,
    close: kline[4] as string,
    volume: kline[5] as string,
    closeTime: kline[6] as number,
  }));
}

export async function fetchKlines(
  symbol: string,
  interval: string,
  limit: number = 100
): Promise<number[]> {
  const klines = await fetchRawKlines(symbol, interval, limit);
  return klines.map((k) => parseFloat(k.close));
}

export async function fetchCurrentPrice(symbol: string): Promise<number> {
  const response = await fetch(`${BASE_URL}/ticker/price?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.statusText}`);
  }

  const data: { price: string } = await response.json();
  return parseFloat(data.price);
}
