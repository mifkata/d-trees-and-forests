'use client';

import { Checkbox } from './Checkbox';

interface ImputeCheckboxProps {
  mask: number;
  impute: boolean;
  onChange: (impute: boolean) => void;
  disabled?: boolean;
}

export function ImputeCheckbox({ mask, impute, onChange, disabled }: ImputeCheckboxProps) {
  const isDisabled = disabled || mask === 0;
  const isChecked = mask > 0 && impute;

  return (
    <Checkbox
      label="Impute"
      checked={isChecked}
      onChange={onChange}
      disabled={isDisabled}
    />
  );
}
