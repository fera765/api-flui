import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArraySimpleFieldProps {
  id: string;
  value: any[];
  itemType: string;
  onChange: (value: any[]) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function ArraySimpleField({
  id,
  value = [],
  itemType,
  onChange,
  disabled,
  error,
  schema,
}: ArraySimpleFieldProps) {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    onChange([...items, itemType === 'number' ? 0 : '']);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, newValue: any) => {
    const updated = [...items];
    updated[index] = itemType === 'number' ? Number(newValue) : newValue;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <Card className={cn('p-4 text-center border-dashed', error && 'border-destructive')}>
          <p className="text-sm text-muted-foreground mb-3">
            Nenhum item adicionado
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </Card>
      ) : (
        <>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                type={itemType === 'number' ? 'number' : 'text'}
                value={item ?? ''}
                onChange={(e) => handleChange(index, e.target.value)}
                disabled={disabled}
                placeholder={`Item ${index + 1}`}
                className={cn(error && 'border-destructive')}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            disabled={disabled}
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </Button>
        </>
      )}
    </div>
  );
}
