'use client';

import { Button } from './ui';

interface TrainButtonProps {
  loading: boolean;
  disabled?: boolean;
}

export function TrainButton({ loading, disabled }: TrainButtonProps) {
  return (
    <Button
      type="submit"
      variant="primary"
      size="lg"
      fullWidth
      loading={loading}
      disabled={disabled}
    >
      {loading ? 'Training...' : 'Train Model'}
    </Button>
  );
}
