/**
 * Sistema Universal de Renderização de Campos - v2.0
 * Agora com sistema de linkagem inline SUPERIOR
 */

import { useState } from 'react';
import { FieldRendererProps } from './types';
import { StringField } from './fields/StringField';
import { NumberField } from './fields/NumberField';
import { BooleanField } from './fields/BooleanField';
import { EnumField } from './fields/EnumField';
import { ArraySimpleField } from './fields/ArraySimpleField';
import { ArrayObjectField } from './fields/ArrayObjectField';
import { JsonField } from './fields/JsonField';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LinkButton, LinkedPill, LinkingModal, AvailableOutput } from '../Linking';
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

  const [linkModalOpen, setLinkModalOpen] = useState(false);

  const canLink = onLink && availableOutputs.length > 0;

  const handleOpenLinkModal = () => {
    if (canLink) {
      setLinkModalOpen(true);
    }
  };

  const handleLink = (sourceNodeId: string, outputKey: string) => {
    onLink?.(sourceNodeId, outputKey);
    setLinkModalOpen(false);
  };

  // Se campo está linkado, mostrar pill
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
        </div>

        <LinkedPill
          sourceNodeName={linkedField.sourceNodeName}
          outputKey={linkedField.outputKey}
          outputType={linkedField.outputType}
          onUnlink={() => onUnlink?.()}
          onEdit={canLink ? handleOpenLinkModal : undefined}
        />

        {schema.description && (
          <p className="text-xs text-muted-foreground">{schema.description}</p>
        )}

        {/* Modal de linkagem */}
        {canLink && (
          <LinkingModal
            open={linkModalOpen}
            onClose={() => setLinkModalOpen(false)}
            fieldName={schema.title || fieldKey}
            fieldType={schema.type}
            availableOutputs={availableOutputs.map((ao) => ({
              nodeId: ao.nodeId,
              nodeName: ao.nodeName,
              outputs: ao.outputs,
            }))}
            currentLink={{
              sourceNodeId: linkedField.sourceNodeId,
              outputKey: linkedField.outputKey,
            }}
            onLink={handleLink}
          />
        )}
      </div>
    );
  }

  // Campo normal (não linkado)
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
      </div>

      {/* Input + Link Button */}
      <div className="flex gap-2">
        <div className="flex-1">
          {renderFieldByType()}
        </div>
        {canLink && (
          <LinkButton
            isLinked={false}
            onClick={handleOpenLinkModal}
            disabled={disabled}
          />
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1">
          ⚠️ {error}
        </p>
      )}

      {!error && schema.description && (
        <p className="text-xs text-muted-foreground">{schema.description}</p>
      )}

      {/* Modal de linkagem */}
      {canLink && (
        <LinkingModal
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          fieldName={schema.title || fieldKey}
          fieldType={schema.type}
          availableOutputs={availableOutputs.map((ao) => ({
            nodeId: ao.nodeId,
            nodeName: ao.nodeName,
            outputs: ao.outputs,
          }))}
          onLink={handleLink}
        />
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
      // Array de objetos → Inputs chave/valor
      if (schema.items?.type === 'object') {
        return <ArrayObjectField {...commonProps} itemSchema={schema.items} />;
      }
      // Array simples → Inputs únicos
      return <ArraySimpleField {...commonProps} itemType={schema.items?.type || 'string'} />;
    }

    // Object/JSON → JSON Editor
    if (schema.type === 'object' || schema.type === 'json') {
      return <JsonField {...commonProps} />;
    }

    // String (default) → Textarea
    return <StringField {...commonProps} />;
  }
}
