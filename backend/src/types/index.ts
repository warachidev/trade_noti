export interface KlineData {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export interface FearGreedIndex {
  value: number;
  valueClassification: string;
  timestamp: string;
}

export interface AlertRecord {
  id?: number;
  symbol: string;
  type: string;
  message: string;
  timestamp: string;
}
