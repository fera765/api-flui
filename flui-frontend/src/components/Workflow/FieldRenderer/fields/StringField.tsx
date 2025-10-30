import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface StringFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function StringField({ id, value, onChange, disabled, error, schema }: StringFieldProps) {
  return (
    <Textarea
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={schema.description || `Digite ${schema.title || 'valor'}`}
      rows={3}
      className={cn(
        'resize-none',
        error && 'border-destructive focus-visible:ring-destructive'
      )}
      maxLength={schema.maxLength}
    />
  );
}
