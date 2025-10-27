import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputsArrayFieldProps {
  value: Record<string, 'string' | 'number' | 'array' | 'object'> | undefined;
  onChange: (value: Record<string, 'string' | 'number' | 'array' | 'object'>) => void;
  disabled?: boolean;
}

interface InputPair {
  key: string;
  type: 'string' | 'number' | 'array' | 'object';
}

export function InputsArrayField({ value, onChange, disabled }: InputsArrayFieldProps) {
  const [pairs, setPairs] = useState<InputPair[]>([]);

  // Convert object to array on mount/value change
  useEffect(() => {
    if (value && typeof value === 'object' && Object.keys(value).length > 0) {
      const pairsArray = Object.entries(value).map(([key, type]) => ({
        key,
        type: type as 'string' | 'number' | 'array' | 'object',
      }));
      // Only update if different from current pairs
      const currentKeys = pairs.map(p => `${p.key}:${p.type}`).join(',');
      const newKeys = pairsArray.map(p => `${p.key}:${p.type}`).join(',');
      if (currentKeys !== newKeys) {
        setPairs(pairsArray);
      }
    } else if (!value || Object.keys(value).length === 0) {
      // Only clear if we actually have pairs
      if (pairs.length > 0) {
        setPairs([]);
      }
    }
  }, [value]); // Removed pairs from dependency to avoid loop

  const handleAddPair = () => {
    const newPairs = [...pairs, { key: '', type: 'string' as const }];
    setPairs(newPairs);
    // Don't notify change for empty keys - will notify on key input
  };

  const handleRemovePair = (index: number) => {
    const newPairs = pairs.filter((_, i) => i !== index);
    setPairs(newPairs);
    notifyChange(newPairs);
  };

  const handleKeyChange = (index: number, newKey: string) => {
    const newPairs = [...pairs];
    newPairs[index].key = newKey;
    setPairs(newPairs);
    notifyChange(newPairs);
  };

  const handleTypeChange = (index: number, newType: 'string' | 'number' | 'array' | 'object') => {
    const newPairs = [...pairs];
    newPairs[index].type = newType;
    setPairs(newPairs);
    notifyChange(newPairs);
  };

  const notifyChange = (pairsArray: InputPair[]) => {
    // Convert array back to object
    const obj: Record<string, 'string' | 'number' | 'array' | 'object'> = {};
    pairsArray.forEach((pair) => {
      if (pair.key.trim()) {
        // Only include pairs with non-empty keys
        obj[pair.key.trim()] = pair.type;
      }
    });
    onChange(obj);
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        Defina os campos esperados no payload do webhook
      </div>

      {/* Table header */}
      {pairs.length > 0 && (
        <div className="grid grid-cols-[1fr_140px_40px] gap-2 text-sm font-medium text-muted-foreground">
          <div>Nome do Campo</div>
          <div>Tipo</div>
          <div></div>
        </div>
      )}

      {/* Pairs list */}
      <div className="space-y-2">
        {pairs.map((pair, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_140px_40px] gap-2 items-center animate-in slide-in-from-top-2 duration-200"
          >
            {/* Key input */}
            <Input
              value={pair.key}
              onChange={(e) => handleKeyChange(index, e.target.value)}
              placeholder="ex: username, email..."
              disabled={disabled}
              className={cn(
                'font-mono text-sm',
                !pair.key.trim() && 'border-yellow-500'
              )}
            />

            {/* Type select */}
            <Select
              value={pair.type}
              onValueChange={(value) =>
                handleTypeChange(index, value as 'string' | 'number' | 'array' | 'object')
              }
              disabled={disabled}
            >
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">
                  <span className="font-mono text-sm">string</span>
                </SelectItem>
                <SelectItem value="number">
                  <span className="font-mono text-sm">number</span>
                </SelectItem>
                <SelectItem value="array">
                  <span className="font-mono text-sm">array</span>
                </SelectItem>
                <SelectItem value="object">
                  <span className="font-mono text-sm">object</span>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Remove button */}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleRemovePair(index)}
              disabled={disabled}
              className="h-9 w-9 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add button */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleAddPair}
        disabled={disabled}
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Adicionar Campo
      </Button>

      {pairs.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhum campo definido
          <br />
          <span className="text-xs">Clique em "Adicionar Campo" para começar</span>
        </div>
      )}
    </div>
  );
}
