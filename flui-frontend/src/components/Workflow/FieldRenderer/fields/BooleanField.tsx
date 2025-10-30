import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface BooleanFieldProps {
  id: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  schema: any;
}

export function BooleanField({ id, value, onChange, disabled, schema }: BooleanFieldProps) {
  return (
    <div className="flex items-center space-x-3 rounded-lg border p-4">
      <Switch
        id={`${id}-switch`}
        checked={value || false}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      <div className="space-y-0.5">
        <Label htmlFor={`${id}-switch`} className="text-sm font-medium cursor-pointer">
          {value ? 'Ativado' : 'Desativado'}
        </Label>
        {schema.description && (
          <p className="text-xs text-muted-foreground">
            {schema.description}
          </p>
        )}
      </div>
    </div>
  );
}
