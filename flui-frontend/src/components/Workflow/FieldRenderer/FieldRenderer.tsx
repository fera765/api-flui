/**
 * Sistema Universal de Renderização de Campos
 * Renderiza qualquer tipo de campo baseado em JSON Schema
 */

import { FieldRendererProps } from './types';
import { StringField } from './fields/StringField';
import { NumberField } from './fields/NumberField';
import { BooleanField } from './fields/BooleanField';
import { EnumField } from './fields/EnumField';
import { ArraySimpleField } from './fields/ArraySimpleField';
import { ArrayObjectField } from './fields/ArrayObjectField';
import { JsonField } from './fields/JsonField';
import { LinkedFieldDisplay } from './LinkedFieldDisplay';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FieldRenderer(props: FieldRendererProps) {
  const {
    fieldKey,
    schema,
    value,
    isLinked,
    linkedField,
    isRequired,
    error,
    availableOutputs = [],
    onChange,
    onLink,
    onUnlink,
    disabled = false,
  } = props;

  // Se campo está linkado, mostrar display de linkagem
  if (isLinked && linkedField) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            {schema.title || fieldKey}
            {isRequired && (
              <Badge variant="destructive" className="text-xs">
                Obrigatório
              </Badge>
            )}
          </Label>
          {onUnlink && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1"
              onClick={onUnlink}
            >
              <Unlink className="w-3 h-3" />
              Deslinkar
            </Button>
          )}
        </div>
        <LinkedFieldDisplay linkedField={linkedField} />
        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}
      </div>
    );
  }

  // Renderizar campo baseado no tipo
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={fieldKey} className="flex items-center gap-2">
          {schema.title || fieldKey}
          {isRequired && (
            <Badge variant="destructive" className="text-xs">
              Obrigatório
            </Badge>
          )}
        </Label>
        {onLink && availableOutputs.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-primary"
            onClick={() => {
              // Abre modal de linkagem (implementado no componente pai)
            }}
          >
            <Link2 className="w-3 h-3" />
            Linkar
          </Button>
        )}
      </div>

      {renderFieldByType()}

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}

      {!error && schema.description && (
        <p className="text-xs text-muted-foreground">{schema.description}</p>
      )}
    </div>
  );

  function renderFieldByType() {
    const commonProps = {
      id: fieldKey,
      value,
      onChange,
      disabled,
      error: !!error,
      schema,
    };

    // Boolean → Toggle Switch
    if (schema.type === 'boolean') {
      return <BooleanField {...commonProps} />;
    }

    // Enum → Select
    if (schema.enum && schema.enum.length > 0) {
      return <EnumField {...commonProps} options={schema.enum} />;
    }

    // Number/Integer → Number Input
    if (schema.type === 'number' || schema.type === 'integer') {
      return <NumberField {...commonProps} />;
    }

    // Array
    if (schema.type === 'array') {
      // Array de objetos → Inputs chave/valor com botão X
      if (schema.items?.type === 'object') {
        return <ArrayObjectField {...commonProps} itemSchema={schema.items} />;
      }
      // Array simples → Inputs únicos
      return <ArraySimpleField {...commonProps} itemType={schema.items?.type || 'string'} />;
    }

    // Object/JSON → JSON Editor ou Textarea
    if (schema.type === 'object' || schema.type === 'json') {
      return <JsonField {...commonProps} />;
    }

    // String (default) → Textarea
    return <StringField {...commonProps} />;
  }
}
