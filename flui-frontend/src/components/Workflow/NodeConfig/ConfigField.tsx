import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Link as LinkIcon, Unlink, Copy, Eye, EyeOff, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LinkedField, AvailableOutput } from './NodeConfigModal';
import { LinkerModal } from './LinkerModal';
import { InputsArrayField } from './InputsArrayField';
import { useToast } from '@/hooks/use-toast';

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
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkerModalOpen, setLinkerModalOpen] = useState(false);
  const { toast } = useToast();

  const isLinked = !!linkedField;
  const isReadOnly = fieldSchema.readOnly || false;
  const fieldType = fieldSchema.type || 'string';
  const description = fieldSchema.description;
  const isSecret = fieldName === 'token' || fieldName === 'apiKey' || fieldName === 'password';

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(String(value || ''));
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: `${fieldName} copiado para a área de transferência`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar para a área de transferência',
        variant: 'destructive',
      });
    }
  };

  const renderField = () => {
    // Read-only field (with copy button and show/hide for secrets)
    if (isReadOnly) {
      // Ensure we have the actual value, not undefined
      const actualValue = value !== undefined && value !== null && value !== '' ? String(value) : '';
      const displayValue = isSecret && !showSecret && actualValue
        ? '•'.repeat(20) 
        : (actualValue || 'Aguardando...');

      return (
        <div className="flex gap-2">
          <Input
            value={displayValue}
            readOnly
            className="flex-1 bg-muted cursor-not-allowed font-mono text-sm"
          />
          {actualValue && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
              title="Copiar para área de transferência"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
          {isSecret && actualValue && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowSecret(!showSecret)}
              className="shrink-0"
              title={showSecret ? 'Ocultar' : 'Mostrar'}
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          )}
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

    // Special field: inputs (webhook inputs array)
    if (fieldName === 'inputs' && fieldType === 'object') {
      return <InputsArrayField value={value} onChange={onChange} />;
    }

    // Fields with enum (select dropdown)
    if (fieldSchema.enum && Array.isArray(fieldSchema.enum)) {
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Selecione ${fieldName}`} />
          </SelectTrigger>
          <SelectContent>
            {fieldSchema.enum.map((option: string) => (
              <SelectItem key={option} value={option}>
                <span className="font-medium">{option}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <div className="space-y-3">
            {arrayItems.length === 0 ? (
              <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-muted/20">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhum item adicionado
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleArrayAdd}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar {isObjectArray ? 'Par Chave-Valor' : 'Primeiro Item'}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {arrayItems.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex gap-2 p-3 bg-muted/30 rounded-lg border animate-in slide-in-from-top-2 duration-200"
                    >
                      {isObjectArray ? (
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Chave</Label>
                            <Input
                              placeholder="ex: status"
                              value={Object.keys(item)[0] || ''}
                              onChange={(e) => {
                                const key = e.target.value;
                                const val = Object.values(item)[0];
                                handleArrayItemChange(index, { [key]: val });
                              }}
                              className="h-9"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Valor</Label>
                            <Input
                              placeholder="ex: active"
                              value={Object.values(item)[0] || ''}
                              onChange={(e) => {
                                const key = Object.keys(item)[0];
                                handleArrayItemChange(index, { [key]: e.target.value });
                              }}
                              className="h-9"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <Input
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
                            className="h-9"
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleArrayRemove(index)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleArrayAdd}
                  className="w-full gap-2 border-dashed hover:border-solid"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar {isObjectArray ? 'Outro Par' : 'Outro Item'}
                </Button>
              </>
            )}
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

        {!isReadOnly && fieldType !== 'array' && availableOutputs.length > 0 && (
          <Button
            size="sm"
            variant={isLinked ? "default" : "outline"}
            onClick={() => setLinkerModalOpen(true)}
            className="h-7 gap-1.5 text-xs"
          >
            {isLinked ? (
              <>
                <Check className="w-3 h-3" />
                Vinculado
              </>
            ) : (
              <>
                <LinkIcon className="w-3 h-3" />
                Linker
              </>
            )}
          </Button>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {renderField()}

      {/* Linker Modal */}
      <LinkerModal
        open={linkerModalOpen}
        onClose={() => setLinkerModalOpen(false)}
        fieldName={fieldName}
        fieldType={fieldType}
        availableOutputs={availableOutputs}
        currentLink={linkedField}
        onLink={(link) => {
          onLink(link);
          setLinkerModalOpen(false);
        }}
        onUnlink={() => {
          onLink(null);
          setLinkerModalOpen(false);
        }}
      />
    </div>
  );
}
