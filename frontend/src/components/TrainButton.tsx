'use client';

import { Button } from './ui';

interface TrainButtonProps {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}

export function TrainButton({ onClick, loading, disabled }: TrainButtonProps) {
  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={onClick}
      loading={loading}
      disabled={disabled}
    >
      {loading ? 'Training...' : 'Train Model'}
    </Button>
  );
}
