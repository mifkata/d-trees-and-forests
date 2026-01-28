import type { TrainRequest, TrainResponse } from '@/types/api';

export async function trainModel(request: TrainRequest): Promise<TrainResponse> {
  const response = await fetch('/api/train', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return response.json();
}
