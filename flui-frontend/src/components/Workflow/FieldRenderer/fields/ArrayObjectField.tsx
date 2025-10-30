import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArrayObjectFieldProps {
  id: string;
  value: Record<string, any>[];
  itemSchema: any;
  onChange: (value: Record<string, any>[]) => void;
  disabled?: boolean;
  error?: boolean;
  schema: any;
}

export function ArrayObjectField({
  id,
  value = [],
  itemSchema,
  onChange,
  disabled,
  error,
  schema,
}: ArrayObjectFieldProps) {
  const items = Array.isArray(value) ? value : [];

  const handleAdd = () => {
    onChange([...items, {}]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleChangeKey = (index: number, oldKey: string, newKey: string) => {
    const updated = [...items];
    const item = { ...updated[index] };
    if (oldKey !== newKey && oldKey in item) {
      delete item[oldKey];
    }
    updated[index] = item;
    onChange(updated);
  };

  const handleChangeValue = (index: number, key: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [key]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <Card className={cn('p-4 text-center border-dashed', error && 'border-destructive')}>
          <p className="text-sm text-muted-foreground mb-3">
            Nenhum objeto adicionado
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
            Adicionar Objeto
          </Button>
        </Card>
      ) : (
        <>
          {items.map((item, index) => (
            <Card key={index} className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Objeto {index + 1}
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  className="h-7 gap-1 text-destructive hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                  Remover
                </Button>
              </div>

              {Object.entries(item).map(([key, val], keyIndex) => (
                <div key={keyIndex} className="grid grid-cols-5 gap-2">
                  <Input
                    placeholder="Chave"
                    value={key}
                    onChange={(e) => handleChangeKey(index, key, e.target.value)}
                    disabled={disabled}
                    className="col-span-2 text-sm"
                  />
                  <Input
                    placeholder="Valor"
                    value={val || ''}
                    onChange={(e) => handleChangeValue(index, key, e.target.value)}
                    disabled={disabled}
                    className="col-span-3 text-sm"
                  />
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleChangeValue(index, '', '')}
                disabled={disabled}
                className="w-full gap-2 text-xs"
              >
                <Plus className="w-3 h-3" />
                Adicionar Campo
              </Button>
            </Card>
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
            Adicionar Objeto
          </Button>
        </>
      )}
    </div>
  );
}
