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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Link2, Save, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkedFieldData {
  sourceNodeId: string;
  outputKey: string;
}

interface AvailableOutputData {
  nodeId: string;
  nodeName: string;
  outputs: Array<{
    key: string;
    type: string;
    value?: any;
  }>;
}

interface NodeConfigModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
  linkedFields: Record<string, LinkedFieldData>;
  availableOutputs: AvailableOutputData[];
  onSave: (nodeId: string, config: Record<string, any>, linkedFields: Record<string, LinkedFieldData>) => void;
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
  const [config, setConfig] = useState<Record<string, any>>(initialConfig);
  const [linkedFields, setLinkedFields] = useState<Record<string, LinkedFieldData>>(initialLinkedFields);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setConfig(initialConfig);
      setLinkedFields(initialLinkedFields);
      setErrors({});
    }
  }, [open, initialConfig, initialLinkedFields]);

  const properties = inputSchema?.properties || {};
  const required = inputSchema?.required || [];

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleLinkField = (key: string, sourceNodeId: string, outputKey: string) => {
    setLinkedFields((prev) => ({ ...prev, [key]: { sourceNodeId, outputKey } }));
    // Limpar config quando linkar
    setConfig((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUnlinkField = (key: string) => {
    setLinkedFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const isFieldLinked = (key: string) => {
    return !!linkedFields[key];
  };

  const getLinkedSource = (key: string) => {
    const link = linkedFields[key];
    if (!link) return null;

    const sourceNode = availableOutputs.find((n) => n.nodeId === link.sourceNodeId);
    return sourceNode ? `${sourceNode.nodeName}.${link.outputKey}` : 'Unknown';
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    required.forEach((key: string) => {
      if (!config[key] && !linkedFields[key]) {
        newErrors[key] = 'Campo obrigatório';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave(nodeId, config, linkedFields);
    onClose();
  };

  const renderField = (key: string, schema: any) => {
    const isRequired = required.includes(key);
    const isLinked = isFieldLinked(key);
    const linkedSource = getLinkedSource(key);
    const error = errors[key];

    return (
      <div key={key} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={key} className="flex items-center gap-2">
            {schema.title || key}
            {isRequired && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
          </Label>
          
          {availableOutputs.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={() => {
                if (isLinked) {
                  handleUnlinkField(key);
                }
              }}
            >
              <Link2 className={cn('w-3 h-3', isLinked && 'text-primary')} />
              {isLinked ? 'Linkado' : 'Linkar'}
            </Button>
          )}
        </div>

        {isLinked ? (
          <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-mono text-primary">{linkedSource}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={() => handleUnlinkField(key)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {schema.type === 'string' && schema.enum ? (
              <Select
                value={config[key] || ''}
                onValueChange={(value) => handleConfigChange(key, value)}
              >
                <SelectTrigger className={cn(error && 'border-red-500')}>
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
            ) : schema.type === 'boolean' ? (
              <div className="flex items-center space-x-2">
                <Switch
                  id={key}
                  checked={config[key] || false}
                  onCheckedChange={(checked) => handleConfigChange(key, checked)}
                />
                <Label htmlFor={key} className="text-sm text-muted-foreground">
                  {schema.description || 'Ativar/Desativar'}
                </Label>
              </div>
            ) : schema.type === 'number' || schema.type === 'integer' ? (
              <Input
                id={key}
                type="number"
                value={config[key] || ''}
                onChange={(e) => handleConfigChange(key, Number(e.target.value))}
                placeholder={schema.description || `Digite ${schema.title || key}`}
                className={cn(error && 'border-red-500')}
              />
            ) : schema.type === 'object' || schema.type === 'array' ? (
              <Textarea
                id={key}
                value={config[key] ? JSON.stringify(config[key], null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleConfigChange(key, parsed);
                  } catch {
                    // Ignorar erro de parse durante digitação
                  }
                }}
                placeholder={schema.description || `Digite JSON para ${schema.title || key}`}
                rows={4}
                className={cn('font-mono text-sm', error && 'border-red-500')}
              />
            ) : (
              <Textarea
                id={key}
                value={config[key] || ''}
                onChange={(e) => handleConfigChange(key, e.target.value)}
                placeholder={schema.description || `Digite ${schema.title || key}`}
                rows={3}
                className={cn(error && 'border-red-500')}
              />
            )}
          </>
        )}

        {error && (
          <p className="text-sm text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {error}
          </p>
        )}

        {schema.description && !error && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  };

  const renderLinkingTab = () => {
    if (availableOutputs.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="p-4 bg-muted/50 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Link2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum output disponível</h3>
          <p className="text-sm text-muted-foreground">
            Adicione nodes anteriores a este para poder linkar campos
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione um campo de entrada e conecte-o a um output de um node anterior
        </p>

        {Object.entries(properties).map(([key, schema]: [string, any]) => (
          <Card key={key} className="p-4">
            <h4 className="font-semibold mb-3">{schema.title || key}</h4>
            
            <div className="space-y-2">
              <Label>Fonte de dados:</Label>
              <Select
                value={linkedFields[key] ? `${linkedFields[key].sourceNodeId}:${linkedFields[key].outputKey}` : ''}
                onValueChange={(value) => {
                  if (value === 'unlink') {
                    handleUnlinkField(key);
                  } else {
                    const [sourceNodeId, outputKey] = value.split(':');
                    handleLinkField(key, sourceNodeId, outputKey);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma fonte de dados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlink">-- Deslinkar --</SelectItem>
                  {availableOutputs.map((node) =>
                    node.outputs.map((output) => (
                      <SelectItem
                        key={`${node.nodeId}:${output.key}`}
                        value={`${node.nodeId}:${output.key}`}
                      >
                        {node.nodeName}.{output.key} ({output.type})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            Configurar {nodeName}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros e linkagens deste node
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="gap-2">
              <Settings className="w-4 h-4" />
              Configuração
            </TabsTrigger>
            <TabsTrigger value="linking" className="gap-2">
              <Link2 className="w-4 h-4" />
              Linkagem
              {Object.keys(linkedFields).length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Object.keys(linkedFields).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            {Object.keys(properties).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Este node não possui parâmetros configuráveis</p>
              </div>
            ) : (
              Object.entries(properties).map(([key, schema]: [string, any]) => renderField(key, schema))
            )}
          </TabsContent>

          <TabsContent value="linking" className="mt-4">
            {renderLinkingTab()}
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Salvar Configuração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
