import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberFieldProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function NumberField({ id, value, onChange, disabled, error, schema }: NumberFieldProps) {
  return (
    <Input
      id={id}
      type="number"
      value={value ?? ''}
      onChange={(e) => {
        const val = e.target.value === '' ? undefined : Number(e.target.value);
        onChange(val as number);
      }}
      disabled={disabled}
      placeholder={schema.description || `Digite ${schema.title || 'número'}`}
      className={cn(error && 'border-destructive focus-visible:ring-destructive')}
      min={schema.minimum}
      max={schema.maximum}
      step={schema.type === 'integer' ? 1 : 0.01}
    />
  );
}
