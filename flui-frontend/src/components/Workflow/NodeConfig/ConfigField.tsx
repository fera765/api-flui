import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Link as LinkIcon, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkedField, AvailableOutput } from './NodeConfigModal';
import { LinkerPopover } from './LinkerPopover';

interface ConfigFieldProps {
  fieldName: string;
  fieldSchema: any;
  value: any;
  isRequired: boolean;
  linkedField?: LinkedField;
  availableOutputs: AvailableOutput[];
  onChange: (value: any) => void;
  onLink: (link: LinkedField | null) => void;
}

export function ConfigField({
  fieldName,
  fieldSchema,
  value,
  isRequired,
  linkedField,
  availableOutputs,
  onChange,
  onLink,
}: ConfigFieldProps) {
  const [arrayItems, setArrayItems] = useState<any[]>(
    Array.isArray(value) ? value : []
  );

  const isLinked = !!linkedField;
  const isReadOnly = fieldSchema.readOnly || false;
  const fieldType = fieldSchema.type || 'string';
  const description = fieldSchema.description;

  const handleArrayAdd = () => {
    const newItems = [...arrayItems, getDefaultValue(fieldSchema.items?.type || 'string')];
    setArrayItems(newItems);
    onChange(newItems);
  };

  const handleArrayRemove = (index: number) => {
    const newItems = arrayItems.filter((_, i) => i !== index);
    setArrayItems(newItems);
    onChange(newItems);
  };

  const handleArrayItemChange = (index: number, newValue: any) => {
    const newItems = [...arrayItems];
    newItems[index] = newValue;
    setArrayItems(newItems);
    onChange(newItems);
  };

  const getDefaultValue = (type: string) => {
    switch (type) {
      case 'number':
      case 'integer':
        return 0;
      case 'boolean':
        return false;
      case 'object':
        return {};
      default:
        return '';
    }
  };

  const renderField = () => {
    // Read-only field
    if (isReadOnly) {
      return (
        <div className="p-2 bg-muted rounded-md text-sm text-muted-foreground">
          {value || 'Gerado automaticamente'}
        </div>
      );
    }

    // Linked field
    if (isLinked && linkedField) {
      return (
        <div className="flex items-center gap-2">
          <div className={cn(
            'flex-1 p-2 rounded-md border-2 transition-all',
            'border-green-500 bg-green-50 dark:bg-green-950/20'
          )}>
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                {linkedField.sourceNodeName} → {linkedField.outputKey}
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLink(null)}
            className="text-green-600 hover:text-green-700"
          >
            <Unlink className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Regular fields
    switch (fieldType) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!value}
              onCheckedChange={onChange}
            />
            <span className="text-sm text-muted-foreground">
              {value ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        );

      case 'number':
      case 'integer':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={`Digite o ${fieldName}`}
          />
        );

      case 'array':
        const itemType = fieldSchema.items?.type || 'string';
        const isObjectArray = itemType === 'object';

        return (
          <div className="space-y-2">
            {arrayItems.map((item, index) => (
              <div key={index} className="flex gap-2">
                {isObjectArray ? (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Chave"
                      value={Object.keys(item)[0] || ''}
                      onChange={(e) => {
                        const key = e.target.value;
                        const val = Object.values(item)[0];
                        handleArrayItemChange(index, { [key]: val });
                      }}
                    />
                    <Input
                      placeholder="Valor"
                      value={Object.values(item)[0] || ''}
                      onChange={(e) => {
                        const key = Object.keys(item)[0];
                        handleArrayItemChange(index, { [key]: e.target.value });
                      }}
                    />
                  </div>
                ) : (
                  <Input
                    className="flex-1"
                    type={itemType === 'number' || itemType === 'integer' ? 'number' : 'text'}
                    value={item || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleArrayItemChange(
                        index,
                        itemType === 'number' || itemType === 'integer' ? Number(val) : val
                      );
                    }}
                    placeholder={`Item ${index + 1}`}
                  />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleArrayRemove(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={handleArrayAdd}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar {isObjectArray ? 'Par Chave-Valor' : 'Item'}
            </Button>
          </div>
        );

      case 'string':
      default:
        const isLongText = fieldSchema.maxLength > 100 || fieldName.toLowerCase().includes('description');
        
        if (isLongText) {
          return (
            <Textarea
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder={`Digite o ${fieldName}`}
              rows={3}
            />
          );
        }
        
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Digite o ${fieldName}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          {fieldName}
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              Obrigatório
            </Badge>
          )}
          {isReadOnly && (
            <Badge variant="secondary" className="text-xs">
              Somente Leitura
            </Badge>
          )}
        </Label>

        {!isReadOnly && !isLinked && fieldType !== 'array' && (
          <LinkerPopover
            fieldName={fieldName}
            fieldType={fieldType}
            availableOutputs={availableOutputs}
            onLink={onLink}
          />
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {renderField()}
    </div>
  );
}
