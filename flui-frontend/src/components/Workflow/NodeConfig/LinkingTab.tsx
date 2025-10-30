/**
 * LinkingTab - Sistema de Linkagem de Campos
 * Interface para conectar outputs de nodes anteriores com inputs
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link2, Unlink, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AvailableOutput, LinkedField } from '../FieldRenderer';

interface LinkingTabProps {
  properties: Record<string, any>;
  linkedFields: Record<string, LinkedField>;
  availableOutputs: AvailableOutput[];
  onLink: (fieldKey: string, sourceNodeId: string, outputKey: string) => void;
  onUnlink: (fieldKey: string) => void;
}

export function LinkingTab({
  properties,
  linkedFields,
  availableOutputs,
  onLink,
  onUnlink,
}: LinkingTabProps) {
  const hasFields = Object.keys(properties).length > 0;
  const hasOutputs = availableOutputs.length > 0;

  if (!hasFields) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Nenhum campo disponível
          </h3>
          <p className="text-sm text-muted-foreground">
            Este node não possui campos que podem ser linkados
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!hasOutputs) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Link2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Nenhum output disponível
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Adicione nodes anteriores a este para poder linkar seus outputs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Conecte outputs de nodes anteriores aos inputs deste node para passar dados automaticamente entre eles
          </p>
        </CardContent>
      </Card>

      {Object.entries(properties).map(([key, schema]: [string, any]) => {
        const isLinked = !!linkedFields[key];
        const linkedField = linkedFields[key];

        return (
          <Card key={key} className={isLinked ? 'border-primary/50' : ''}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>{schema.title || key}</span>
                {isLinked && (
                  <Badge variant="secondary" className="gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Linkado
                  </Badge>
                )}
              </CardTitle>
              {schema.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {schema.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Fonte de dados:</Label>
                <div className="flex gap-2">
                  <Select
                    value={
                      isLinked
                        ? `${linkedField.sourceNodeId}:${linkedField.outputKey}`
                        : ''
                    }
                    onValueChange={(value) => {
                      if (value === 'unlink') {
                        onUnlink(key);
                      } else {
                        const [sourceNodeId, outputKey] = value.split(':');
                        onLink(key, sourceNodeId, outputKey);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um output para linkar" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLinked && (
                        <SelectItem value="unlink">
                          <div className="flex items-center gap-2">
                            <Unlink className="w-4 h-4" />
                            -- Deslinkar --
                          </div>
                        </SelectItem>
                      )}
                      {availableOutputs.map((node) =>
                        node.outputs.map((output) => (
                          <SelectItem
                            key={`${node.nodeId}:${output.key}`}
                            value={`${node.nodeId}:${output.key}`}
                          >
                            <div className="flex items-center gap-2">
                              <Link2 className="w-3 h-3" />
                              <span className="font-mono text-xs">
                                {node.nodeName}.{output.key}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {output.type}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>

                  {isLinked && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => onUnlink(key)}
                      className="shrink-0"
                    >
                      <Unlink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isLinked && linkedField && (
                <Card className="bg-primary/5 border-primary/30">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Link2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                          {linkedField.sourceNodeName}.{linkedField.outputKey}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {linkedField.outputType}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Summary */}
      {Object.keys(linkedFields).length > 0 && (
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                {Object.keys(linkedFields).length} {Object.keys(linkedFields).length === 1 ? 'campo linkado' : 'campos linkados'}
              </p>
              <p className="text-xs text-muted-foreground">
                Os dados fluirão automaticamente dos nodes anteriores
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
