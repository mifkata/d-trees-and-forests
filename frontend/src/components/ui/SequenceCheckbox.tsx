'use client';

import { Checkbox } from './Checkbox';

interface SequenceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SequenceCheckbox({ checked, onChange, disabled }: SequenceCheckboxProps) {
  return (
    <Checkbox
      label="Sequence"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
