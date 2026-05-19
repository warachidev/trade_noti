import type { FearGreedIndex } from '../types';

const BASE_URL = 'https://api.alternative.me/fng/';

export async function fetchFearGreedIndex(limit: number = 1): Promise<FearGreedIndex[]> {
  const params = new URLSearchParams({ limit: limit.toString() });
  const response = await fetch(`${BASE_URL}?${params}`);

  if (!response.ok) {
    throw new Error(`Alternative.me API error: ${response.statusText}`);
  }

  const data: { data: Array<{ value: string; value_classification: string; timestamp: string }> } =
    await response.json();

  return data.data.map((item) => ({
    value: parseInt(item.value, 10),
    valueClassification: item.value_classification,
    timestamp: item.timestamp,
  }));
}
