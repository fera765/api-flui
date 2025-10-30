import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface JsonFieldProps {
  id: string;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function JsonField({ id, value, onChange, disabled, error, schema }: JsonFieldProps) {
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [textValue, setTextValue] = useState(() => {
    try {
      return JSON.stringify(value || {}, null, 2);
    } catch {
      return '{}';
    }
  });

  const handleChange = (newText: string) => {
    setTextValue(newText);
    
    try {
      const parsed = JSON.parse(newText);
      setJsonError(null);
      onChange(parsed);
    } catch (e: any) {
      setJsonError(e.message);
      // Não chama onChange se JSON inválido
    }
  };

  return (
    <div className="space-y-2">
      <Textarea
        id={id}
        value={textValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        placeholder='{\n  "chave": "valor"\n}'
        rows={6}
        className={cn(
          'font-mono text-sm resize-none',
          (error || jsonError) && 'border-destructive focus-visible:ring-destructive'
        )}
      />
      
      {jsonError ? (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            JSON inválido: {jsonError}
          </AlertDescription>
        </Alert>
      ) : value && Object.keys(value).length > 0 && (
        <Alert className="py-2 border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-xs text-green-700 dark:text-green-400">
            JSON válido com {Object.keys(value).length} {Object.keys(value).length === 1 ? 'chave' : 'chaves'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
