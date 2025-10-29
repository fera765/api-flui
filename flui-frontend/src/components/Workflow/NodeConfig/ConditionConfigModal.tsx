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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GitBranch, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AvailableOutputData {
  nodeId: string;
  nodeName: string;
  outputs: Array<{
    key: string;
    type: string;
    value?: any;
  }>;
}

interface Condition {
  operator: string;
  value: any;
  path: 'true' | 'false';
}

interface ConditionConfigModalProps {
  open: boolean;
  onClose: () => void;
  nodeId: string;
  nodeName: string;
  config: {
    inputField?: string;
    inputSource?: 'static' | 'linked';
    conditions?: Condition[];
  };
  availableOutputs: AvailableOutputData[];
  onSave: (config: any) => void;
}

const OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'notEquals', label: '≠' },
  { value: 'greaterThan', label: '>' },
  { value: 'lessThan', label: '<' },
  { value: 'greaterOrEqual', label: '≥' },
  { value: 'lessOrEqual', label: '≤' },
  { value: 'contains', label: 'Contém' },
  { value: 'notContains', label: 'Não contém' },
  { value: 'startsWith', label: 'Começa com' },
  { value: 'endsWith', label: 'Termina com' },
  { value: 'isEmpty', label: 'Está vazio' },
  { value: 'isNotEmpty', label: 'Não está vazio' },
];

export function ConditionConfigModal({
  open,
  onClose,
  nodeId,
  nodeName,
  config: initialConfig,
  availableOutputs,
  onSave,
}: ConditionConfigModalProps) {
  const [inputSource, setInputSource] = useState<'static' | 'linked'>(initialConfig.inputSource || 'static');
  const [inputField, setInputField] = useState<string>(initialConfig.inputField || '');
  const [linkedSource, setLinkedSource] = useState<string>('');
  const [conditions, setConditions] = useState<Condition[]>(initialConfig.conditions || []);
  const [errors, setErrors] = useState<{ input?: string; conditions?: string }>({});

  useEffect(() => {
    if (open) {
      setInputSource(initialConfig.inputSource || 'static');
      setInputField(initialConfig.inputField || '');
      setConditions(initialConfig.conditions || []);
      setLinkedSource('');
      setErrors({});
    }
  }, [open, initialConfig]);

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      { operator: 'equals', value: '', path: 'true' },
    ]);
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const handleConditionChange = (index: number, field: keyof Condition, value: any) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setConditions(newConditions);
    if (errors.conditions) {
      setErrors((prev) => ({ ...prev, conditions: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { input?: string; conditions?: string } = {};

    if (!inputField) {
      newErrors.input = 'Campo de entrada é obrigatório';
    }

    if (conditions.length === 0) {
      newErrors.conditions = 'Adicione pelo menos uma condição';
    } else {
      const hasInvalidCondition = conditions.some(
        (c) => !c.operator || (c.operator !== 'isEmpty' && c.operator !== 'isNotEmpty' && !c.value)
      );
      if (hasInvalidCondition) {
        newErrors.conditions = 'Preencha todos os campos das condições';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const config = {
      inputField,
      inputSource,
      conditions,
    };

    onSave(config);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-orange-600" />
            Configurar Condition - {nodeName}
          </DialogTitle>
          <DialogDescription>
            Configure as condições para criar ramificações no workflow
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Input Source Section */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-primary" />
                Campo de Entrada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Entrada</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={inputSource === 'static' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setInputSource('static')}
                  >
                    Valor Estático
                  </Button>
                  <Button
                    type="button"
                    variant={inputSource === 'linked' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setInputSource('linked')}
                    disabled={availableOutputs.length === 0}
                  >
                    Output Linkado
                  </Button>
                </div>
              </div>

              {inputSource === 'static' ? (
                <div className="space-y-2">
                  <Label htmlFor="inputField">Valor</Label>
                  <Input
                    id="inputField"
                    value={inputField}
                    onChange={(e) => {
                      setInputField(e.target.value);
                      if (errors.input) setErrors((prev) => ({ ...prev, input: undefined }));
                    }}
                    placeholder="Digite o valor a ser avaliado"
                    className={cn(errors.input && 'border-red-500')}
                  />
                  {errors.input && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.input}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Selecione Output de Node Anterior</Label>
                  {availableOutputs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum output disponível. Adicione nodes antes deste.
                    </p>
                  ) : (
                    <Select
                      value={linkedSource}
                      onValueChange={(value) => {
                        setLinkedSource(value);
                        setInputField(value);
                        if (errors.input) setErrors((prev) => ({ ...prev, input: undefined }));
                      }}
                    >
                      <SelectTrigger className={cn(errors.input && 'border-red-500')}>
                        <SelectValue placeholder="Selecione um output" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOutputs.map((node) =>
                          node.outputs.map((output) => (
                            <SelectItem
                              key={`${node.nodeId}:${output.key}`}
                              value={`${node.nodeName}.${output.key}`}
                            >
                              {node.nodeName}.{output.key} ({output.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.input && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.input}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conditions Section */}
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <GitBranch className="w-5 h-5 text-orange-600" />
                  Condições ({conditions.length})
                </CardTitle>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCondition}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Condição
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {errors.conditions && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.conditions}
                </p>
              )}

              {conditions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma condição adicionada</p>
                  <p className="text-sm">Clique no botão acima para adicionar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conditions.map((condition, index) => (
                    <Card key={index} className="p-4 bg-muted/30">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">Condição {index + 1}</Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCondition(index)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {/* Operator */}
                          <div className="space-y-1">
                            <Label className="text-xs">Operador</Label>
                            <Select
                              value={condition.operator}
                              onValueChange={(value) =>
                                handleConditionChange(index, 'operator', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {OPERATORS.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label} - {op.value}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value */}
                          {condition.operator !== 'isEmpty' && condition.operator !== 'isNotEmpty' && (
                            <div className="space-y-1">
                              <Label className="text-xs">Valor</Label>
                              <Input
                                value={condition.value}
                                onChange={(e) =>
                                  handleConditionChange(index, 'value', e.target.value)
                                }
                                placeholder="Valor de comparação"
                              />
                            </div>
                          )}

                          {/* Path */}
                          <div className="space-y-1">
                            <Label className="text-xs">Se TRUE, seguir para</Label>
                            <Select
                              value={condition.path}
                              onValueChange={(value: 'true' | 'false') =>
                                handleConditionChange(index, 'path', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    TRUE Path
                                  </div>
                                </SelectItem>
                                <SelectItem value="false">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    FALSE Path
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-2 text-sm">
                <p className="font-semibold">💡 Como funcionam as Conditions:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Avalie o valor de entrada contra múltiplas condições</li>
                  <li>Cada condição direciona para TRUE ou FALSE path</li>
                  <li>Use operators para comparações complexas</li>
                  <li>Conecte diferentes nodes aos outputs TRUE e FALSE</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

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
