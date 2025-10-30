/**
 * NodeConfigModal - Versão 2.0
 * Sistema padronizado usando Field Renderer universal
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Link2, Save, X, AlertCircle } from 'lucide-react';
import { FieldRenderer, AvailableOutput, LinkedField } from '../FieldRenderer';
import { LinkingTab } from './LinkingTab';

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
  const [activeTab, setActiveTab] = useState<string>('config');

  useEffect(() => {
    if (open) {
      setConfig(initialConfig || {});
      setLinkedFields(initialLinkedFields || {});
      setErrors({});
      setActiveTab('config');
    }
  }, [open, initialConfig, initialLinkedFields]);

  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];
  const hasFields = Object.keys(properties).length > 0;
  const hasLinkedFields = Object.keys(linkedFields).length > 0;
  const canLink = availableOutputs.length > 0;

  const handleFieldChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    // Limpar erro deste campo
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
      setLinkedFields((prev) => ({
        ...prev,
        [key]: {
          sourceNodeId,
          sourceNodeName: sourceNode.nodeName,
          outputKey,
          outputType: output.type,
        },
      }));

      // Remover valor estático quando linkar
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
    setLinkedFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    required.forEach((key: string) => {
      const hasValue = config[key] !== undefined && config[key] !== '';
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
      setActiveTab('config'); // Voltar para tab de config se houver erros
      return;
    }
    onSave(nodeId, config, linkedFields);
    onClose();
  };

  const renderConfigTab = () => {
    if (!hasFields) {
      return (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Settings className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Nenhum parâmetro configurável
            </h3>
            <p className="text-sm text-muted-foreground">
              Este node não possui campos que precisam ser configurados
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
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
              onLink={canLink ? (sourceNodeId, outputKey) => handleLink(key, sourceNodeId, outputKey) : undefined}
              onUnlink={() => handleUnlink(key)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            Configurar: {nodeName}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros e linkagens deste node
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuração
              {Object.keys(errors).length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {Object.keys(errors).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="linking" className="gap-2">
              <Link2 className="w-4 h-4" />
              Linkagem
              {hasLinkedFields && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(linkedFields).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-6">
            {renderConfigTab()}
          </TabsContent>

          <TabsContent value="linking" className="mt-6">
            <LinkingTab
              properties={properties}
              linkedFields={linkedFields}
              availableOutputs={availableOutputs}
              onLink={handleLink}
              onUnlink={handleUnlink}
            />
          </TabsContent>
        </Tabs>

        {/* Avisos */}
        {Object.keys(errors).length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Existem {Object.keys(errors).length} erro(s) de validação
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Corrija os campos obrigatórios antes de salvar
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            disabled={Object.keys(errors).length > 0}
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
