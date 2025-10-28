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
import { Badge } from '@/components/ui/badge';
import { 
  GitBranch, 
  Plus, 
  X, 
  Link2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LinkerModal } from './LinkerModal';
import type { LinkedField, AvailableOutput } from './NodeConfigModal';

interface ConditionConfig {
  inputField?: string;
  inputSource?: {
    sourceNodeId: string;
    sourceNodeName: string;
    outputKey: string;
  };
  conditions: Array<{
    id: string;
    label: string;
    value: string;
  }>;
}

interface ConditionConfigModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  config: ConditionConfig;
  availableOutputs: AvailableOutput[];
  onSave: (config: ConditionConfig) => Promise<void>;
}

export function ConditionConfigModal({
  open,
  onClose,
  nodeId,
  nodeName,
  config: initialConfig,
  availableOutputs,
  onSave,
}: ConditionConfigModalProps) {
  const [config, setConfig] = useState<ConditionConfig>(initialConfig);
  const [linkerModalOpen, setLinkerModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setConfig(initialConfig);
    }
  }, [open, initialConfig]);

  const handleAddCondition = () => {
    const newCondition = {
      id: `cond_${Date.now()}`,
      label: '',
      value: '',
    };
    setConfig((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  };

  const handleRemoveCondition = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== id),
    }));
  };

  const handleConditionChange = (id: string, field: 'label' | 'value', value: string) => {
    setConfig((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const handleLinkInput = (link: LinkedField) => {
    setConfig((prev) => ({
      ...prev,
      inputField: `${link.sourceNodeName}.${link.outputKey}`,
      inputSource: {
        sourceNodeId: link.sourceNodeId,
        sourceNodeName: link.sourceNodeName,
        outputKey: link.outputKey,
      },
    }));
    setLinkerModalOpen(false);
  };

  const handleUnlinkInput = () => {
    setConfig((prev) => ({
      ...prev,
      inputField: undefined,
      inputSource: undefined,
    }));
  };

  const handleSave = async () => {
    // Validações
    if (!config.inputField) {
      toast({
        title: 'Campo obrigatório',
        description: 'Você deve vincular um input para avaliar as condições',
        variant: 'destructive',
      });
      return;
    }

    if (config.conditions.length === 0) {
      toast({
        title: 'Nenhuma condição',
        description: 'Adicione pelo menos uma condição',
        variant: 'destructive',
      });
      return;
    }

    // Validar se todas as conditions têm valor
    const emptyConditions = config.conditions.filter(
      (c) => !c.value.trim()
    );

    if (emptyConditions.length > 0) {
      toast({
        title: 'Condições incompletas',
        description: 'Todas as condições devem ter um valor definido',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await onSave(config);
      toast({
        title: 'Configuração salva',
        description: 'As condições foram configuradas com sucesso',
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

  const currentLink = config.inputSource
    ? {
        sourceNodeId: config.inputSource.sourceNodeId,
        sourceNodeName: config.inputSource.sourceNodeName,
        outputKey: config.inputSource.outputKey,
      }
    : undefined;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 space-y-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <GitBranch className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              Configurar Condição
            </DialogTitle>
            <DialogDescription>
              Configure o roteamento condicional para <strong>{nodeName}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Input Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span>Campo de Entrada</span>
                  <Badge variant="destructive" className="text-xs">
                    Obrigatório
                  </Badge>
                </Label>
                <Button
                  size="sm"
                  variant={config.inputField ? "default" : "outline"}
                  onClick={() => setLinkerModalOpen(true)}
                  className="h-7 gap-1.5 text-xs"
                  disabled={availableOutputs.length === 0}
                >
                  {config.inputField ? (
                    <>
                      <Link2 className="w-3 h-3" />
                      Vinculado
                    </>
                  ) : (
                    <>
                      <Link2 className="w-3 h-3" />
                      Vincular
                    </>
                  )}
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                O valor deste campo será comparado com as condições abaixo
              </p>

              {config.inputField ? (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <Link2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-300 font-medium flex-1">
                    {config.inputField}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleUnlinkInput}
                    className="h-6 text-xs text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm text-orange-700 dark:text-orange-300">
                    Clique em "Vincular" para selecionar um campo
                  </span>
                </div>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <span>Condições ({config.conditions.length})</span>
                  <Badge variant="destructive" className="text-xs">
                    Mínimo 1
                  </Badge>
                </Label>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAddCondition}
                  className="h-7 gap-1.5 text-xs"
                >
                  <Plus className="w-3 h-3" />
                  ADD CONDITION
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Cada condição criará um ramo de saída. O valor do input será comparado com estas condições.
              </p>

              {config.conditions.length === 0 ? (
                <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg bg-muted/20">
                  <GitBranch className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Nenhuma condição adicionada
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleAddCondition}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Primeira Condição
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {config.conditions.map((condition, index) => (
                    <div
                      key={condition.id}
                      className="flex gap-2 p-3 bg-muted/30 rounded-lg border animate-in slide-in-from-top-2 duration-200"
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Ramo de saída
                          </span>
                        </div>
                        
                        <Input
                          placeholder={`Ex: COMPRAR, VENDER, AJUDA...`}
                          value={condition.value}
                          onChange={(e) =>
                            handleConditionChange(condition.id, 'value', e.target.value)
                          }
                          className="font-mono text-sm"
                        />
                        
                        <Input
                          placeholder="Label (opcional)"
                          value={condition.label}
                          onChange={(e) =>
                            handleConditionChange(condition.id, 'label', e.target.value)
                          }
                          className="text-xs"
                        />
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCondition(condition.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 p-0 self-start"
                        title="Remover"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p className="font-medium">Como funciona:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>O valor do input vinculado será comparado com cada condição</li>
                    <li>Quando houver match, o fluxo segue pelo ramo correspondente</li>
                    <li>Cada condição terá seu próprio conector no nó</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Linker Modal */}
      <LinkerModal
        open={linkerModalOpen}
        onClose={() => setLinkerModalOpen(false)}
        fieldName="input"
        fieldType="string"
        availableOutputs={availableOutputs}
        currentLink={currentLink}
        onLink={handleLinkInput}
        onUnlink={handleUnlinkInput}
      />
    </>
  );
}
