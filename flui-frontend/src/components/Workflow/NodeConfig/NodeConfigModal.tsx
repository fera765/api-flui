/**
 * NodeConfigModal - RECONSTRUÍDO DO ZERO
 * Versão Simples e Funcional - Renderiza TODOS os campos do inputSchema
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, AlertCircle, Info, Link2 } from 'lucide-react';

interface NodeConfigModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  config: Record<string, any>;
  inputSchema: any;
  linkedFields?: Record<string, any>;
  availableOutputs?: any[];
  onSave: (nodeId: string, config: Record<string, any>, linkedFields: Record<string, any>) => void;
}

export function NodeConfigModal({
  open,
  onClose,
  nodeId,
  nodeName,
  config: initialConfig,
  inputSchema,
  linkedFields: initialLinkedFields,
  onSave,
}: NodeConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>(initialConfig || {});
  const [linkedFields, setLinkedFields] = useState<Record<string, any>>(initialLinkedFields || {});

  useEffect(() => {
    if (open) {
      setConfig(initialConfig || {});
      setLinkedFields(initialLinkedFields || {});
    }
  }, [open, initialConfig, initialLinkedFields]);

  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];
  const hasFields = Object.keys(properties).length > 0;

  const handleChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    console.log('💾 Salvando config:', { nodeId, config, linkedFields });
    onSave(nodeId, config, linkedFields);
    onClose();
  };

  const renderField = (key: string, schema: any) => {
    const isRequired = required.includes(key);
    const value = config[key];
    const isLinked = linkedFields[key];

    // Se campo está linkado, mostrar pill
    if (isLinked) {
      return (
        <div key={key} className="space-y-2">
          <Label className="flex items-center gap-2">
            {schema.title || key}
            {isRequired && <Badge variant="destructive" className="text-xs">Obrigatório</Badge>}
          </Label>
          <Card className="p-3 bg-primary/5 border-primary/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Campo Linkado</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setLinkedFields((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                  });
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    // Campo normal (não linkado)
    return (
      <div key={key} className="space-y-2">
        <Label htmlFor={key} className="flex items-center gap-2">
          {schema.title || key}
          {isRequired && <Badge variant="destructive" className="text-xs">*</Badge>}
        </Label>

        {/* Boolean → Switch */}
        {schema.type === 'boolean' && (
          <div className="flex items-center gap-2">
            <Switch
              id={key}
              checked={value || false}
              onCheckedChange={(checked) => handleChange(key, checked)}
            />
            <span className="text-sm text-muted-foreground">
              {value ? 'Ativado' : 'Desativado'}
            </span>
          </div>
        )}

        {/* Enum → Select */}
        {schema.enum && (
          <Select value={value || ''} onValueChange={(v) => handleChange(key, v)}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${schema.title || key}`} />
            </SelectTrigger>
            <SelectContent>
              {schema.enum.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Number → Input type number */}
        {(schema.type === 'number' || schema.type === 'integer') && !schema.enum && (
          <Input
            id={key}
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(key, Number(e.target.value))}
            placeholder={schema.description}
          />
        )}

        {/* String (longo) → Textarea */}
        {schema.type === 'string' && !schema.enum && schema.description?.length > 50 && (
          <Textarea
            id={key}
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={schema.description}
            rows={4}
          />
        )}

        {/* String (curto) → Input */}
        {schema.type === 'string' && !schema.enum && (!schema.description || schema.description.length <= 50) && (
          <Input
            id={key}
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(key, e.target.value)}
            placeholder={schema.description}
            readOnly={schema.readOnly}
          />
        )}

        {/* Object → JSON Input */}
        {schema.type === 'object' && (
          <Textarea
            id={key}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(key, parsed);
              } catch {
                // Ignore JSON parse errors while typing
              }
            }}
            placeholder={`{"key": "value"}`}
            rows={6}
            className="font-mono text-xs"
          />
        )}

        {/* Array → JSON Input */}
        {schema.type === 'array' && (
          <Textarea
            id={key}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(key, parsed);
              } catch {
                // Ignore JSON parse errors while typing
              }
            }}
            placeholder={`["item1", "item2"]`}
            rows={4}
            className="font-mono text-xs"
          />
        )}

        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Save className="w-5 h-5 text-primary" />
            </div>
            Configurar: {nodeName}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros necessários para este node
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {!hasFields ? (
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Este node não possui parâmetros configuráveis
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4 py-2">
              {Object.entries(properties).map(([key, schema]: [string, any]) =>
                renderField(key, schema)
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
