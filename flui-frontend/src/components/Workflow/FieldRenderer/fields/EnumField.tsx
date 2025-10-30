import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface EnumFieldProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function EnumField({ id, value, options, onChange, disabled, error, schema }: EnumFieldProps) {
  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className={cn(error && 'border-destructive focus:ring-destructive')}
      >
        <SelectValue placeholder={`Selecione ${schema.title || 'opção'}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
