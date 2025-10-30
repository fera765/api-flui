/**
 * NodeConfigModal - v3.0
 * Sistema inline de linkagem SUPERIOR
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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Save, X, AlertCircle, Info } from 'lucide-react';
import { FieldRenderer } from '../FieldRenderer/FieldRenderer';
import { AvailableOutput, LinkedField } from '../FieldRenderer/types';

interface NodeConfigModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  linkedFields: Record<string, LinkedField>;
  availableOutputs: AvailableOutput[];
  onSave: (nodeId: string, config: Record<string, any>, linkedFields: Record<string, LinkedField>) => void;
}

export function NodeConfigModal({
  open,
  onClose,
  nodeId,
  nodeName,
  config: initialConfig,
  inputSchema,
  linkedFields: initialLinkedFields,
  availableOutputs,
  onSave,
}: NodeConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>(initialConfig || {});
  const [linkedFields, setLinkedFields] = useState<Record<string, LinkedField>>(initialLinkedFields || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      console.log('🔧 Opening config modal:', { config: initialConfig, linkedFields: initialLinkedFields });
      setConfig(initialConfig || {});
      setLinkedFields(initialLinkedFields || {});
      setErrors({});
    }
  }, [open, initialConfig, initialLinkedFields]);

  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];
  const hasFields = Object.keys(properties).length > 0;

  const handleFieldChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleLink = (key: string, sourceNodeId: string, outputKey: string) => {
    const sourceNode = availableOutputs.find((n) => n.nodeId === sourceNodeId);
    const output = sourceNode?.outputs.find((o) => o.key === outputKey);

    if (sourceNode && output) {
      console.log('🔗 Linking field:', { key, sourceNodeId, outputKey });

      setLinkedFields((prev) => ({
        ...prev,
        [key]: {
          sourceNodeId,
          sourceNodeName: sourceNode.nodeName,
          outputKey,
          outputType: output.type,
        },
      }));

      // Remover valor estático
      setConfig((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });

      // Limpar erro
      if (errors[key]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }
  };

  const handleUnlink = (key: string) => {
    console.log('🔓 Unlinking field:', key);
    setLinkedFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    required.forEach((key: string) => {
      const hasValue = config[key] !== undefined && config[key] !== '' && config[key] !== null;
      const hasLink = linkedFields[key] !== undefined;

      if (!hasValue && !hasLink) {
        newErrors[key] = 'Campo obrigatório';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    console.log('💾 Saving node config:', { config, linkedFields });
    onSave(nodeId, config, linkedFields);
    onClose();
  };

  const linkedCount = Object.keys(linkedFields).length;
  const configCount = Object.keys(config).length;
  const errorCount = Object.keys(errors).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            Configurar: {nodeName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span>Configure os parâmetros deste node</span>
            {linkedCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                🔗 {linkedCount} linkado(s)
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Content (scrollable) */}
        <div className="flex-1 overflow-y-auto px-1">
          {!hasFields ? (
            <Card className="border-2 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Info className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Nenhum parâmetro configurável</h3>
                <p className="text-sm text-muted-foreground">
                  Este node não possui campos que precisam ser configurados
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 py-2">
              {Object.entries(properties).map(([key, schema]: [string, any]) => {
                const isRequired = required.includes(key);
                const isLinked = !!linkedFields[key];
                const error = errors[key];

                return (
                  <FieldRenderer
                    key={key}
                    fieldKey={key}
                    schema={schema}
                    value={config[key]}
                    isLinked={isLinked}
                    linkedField={linkedFields[key]}
                    isRequired={isRequired}
                    error={error}
                    availableOutputs={availableOutputs}
                    onChange={(value) => handleFieldChange(key, value)}
                    onLink={(sourceNodeId, outputKey) => handleLink(key, sourceNodeId, outputKey)}
                    onUnlink={() => handleUnlink(key)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Avisos */}
        {errorCount > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>{errorCount}</strong> campo(s) obrigatório(s) não preenchido(s)
            </AlertDescription>
          </Alert>
        )}

        {linkedCount > 0 && errorCount === 0 && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="w-4 h-4 text-primary" />
            <AlertDescription>
              ✅ <strong>{linkedCount}</strong> campo(s) linkado(s). Os dados fluirão automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} disabled={errorCount > 0}>
            <Save className="w-4 h-4 mr-2" />
            Salvar ({configCount} config, {linkedCount} links)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
