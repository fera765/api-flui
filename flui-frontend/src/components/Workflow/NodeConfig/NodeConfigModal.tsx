import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save } from 'lucide-react';
import { ConfigField } from './ConfigField';
import { useToast } from '@/hooks/use-toast';

export interface NodeConfigData {
  nodeId: string;
  nodeName: string;
  config: Record<string, any>;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  linkedFields?: Record<string, LinkedField>;
}

export interface LinkedField {
  sourceNodeId: string;
  sourceNodeName: string;
  outputKey: string;
}

export interface AvailableOutput {
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
  nodeData: NodeConfigData | null;
  availableOutputs: AvailableOutput[];
  onSave: (nodeId: string, config: Record<string, any>, linkedFields: Record<string, LinkedField>) => void;
}

export function NodeConfigModal({
  open,
  onClose,
  nodeData,
  availableOutputs,
  onSave,
}: NodeConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [linkedFields, setLinkedFields] = useState<Record<string, LinkedField>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (nodeData) {
      console.log('[NodeConfigModal] nodeData.config:', nodeData.config);
      setConfig(nodeData.config || {});
      setLinkedFields(nodeData.linkedFields || {});
    }
  }, [nodeData]);

  const handleSave = async () => {
    if (!nodeData) return;

    // Validar campos obrigatórios
    const schema = nodeData.inputSchema?.properties || {};
    const required = nodeData.inputSchema?.required || [];
    const missingFields: string[] = [];

    required.forEach((fieldName: string) => {
      const hasValue = config[fieldName] !== undefined && config[fieldName] !== null && config[fieldName] !== '';
      const hasLink = linkedFields[fieldName] !== undefined;
      
      if (!hasValue && !hasLink) {
        missingFields.push(fieldName);
      }
    });

    if (missingFields.length > 0) {
      toast({
        title: 'Campos obrigatórios não preenchidos',
        description: `Preencha ou vincule os seguintes campos: ${missingFields.join(', ')}`,
        variant: 'destructive',
      });
      return; // IMPORTANTE: Não permite salvar sem campos obrigatórios
    }

    setSaving(true);
    try {
      await onSave(nodeData.nodeId, config, linkedFields);
      toast({
        title: 'Configuração salva',
        description: 'As configurações do nó foram salvas com sucesso',
      });
      onClose();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error?.message || 'Ocorreu um erro ao salvar a configuração',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleLink = (fieldName: string, link: LinkedField | null) => {
    if (link) {
      setLinkedFields((prev) => ({
        ...prev,
        [fieldName]: link,
      }));
      // Clear the field value when linked
      setConfig((prev) => ({
        ...prev,
        [fieldName]: undefined,
      }));
    } else {
      // Remove link
      setLinkedFields((prev) => {
        const newLinked = { ...prev };
        delete newLinked[fieldName];
        return newLinked;
      });
    }
  };

  if (!nodeData) return null;

  const schema = nodeData.inputSchema?.properties || {};
  const required = nodeData.inputSchema?.required || [];
  const schemaDescription = (nodeData.inputSchema as any)?.description;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            Configurar: {nodeData.nodeName}
          </DialogTitle>
          <DialogDescription>
            Configure os parâmetros do nó e conecte com outputs de nós anteriores
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] px-6">
          {Object.keys(schema).length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <div className="text-muted-foreground">
                {schemaDescription || 'Este nó não possui campos configuráveis'}
              </div>
              {schemaDescription && (
                <div className="text-xs text-muted-foreground/70">
                  {nodeData.nodeName}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {Object.entries(schema).map(([fieldName, fieldSchema]: [string, any]) => (
                <ConfigField
                  key={fieldName}
                  fieldName={fieldName}
                  fieldSchema={fieldSchema}
                  value={config[fieldName]}
                  isRequired={required.includes(fieldName)}
                  linkedField={linkedFields[fieldName]}
                  availableOutputs={availableOutputs}
                  onChange={(value) => handleFieldChange(fieldName, value)}
                  onLink={(link) => handleLink(fieldName, link)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
